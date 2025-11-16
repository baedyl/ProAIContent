import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import OpenAI from 'openai'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import {
  adjustUserCredits,
  getUserCreditBalance,
  recordGeneratedContent,
  getPersonaById,
  type CreditTransactionRecord,
} from '@/lib/supabase'
import { consumeRateLimit } from '@/lib/rate-limit'
import {
  MIN_WORD_COUNT,
  MAX_WORD_COUNT,
  calculateBounds,
  calculateMaxTokens,
  isWithinTolerance,
  countWords,
} from '@/lib/content-constraints'
import { getPersona, buildPersonaPrompt } from '@/lib/personas'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowMs: 60_000,
}

const MAX_RETRIES = 3  // Increased from 2 to 3 for better success rate
const generateSchema = z.object({
  contentType: z.string().trim().min(2).default('blog'),
  title: z.string().trim().optional(),
  topic: z.string().trim().min(3),
  keywords: z.string().trim().optional(),
  tone: z.string().trim().min(3),
  style: z.string().trim().min(3),
  // Support both single wordCount and minWords/maxWords range
  wordCount: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  minWords: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  maxWords: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  targetAudience: z.string().trim().optional(),
  additionalInstructions: z.string().trim().optional(),
  personaId: z.string().trim().optional(),
  includeFAQ: z.boolean().optional(),
  includeVideo: z.boolean().optional(),
  includeCompetitorHeaders: z.boolean().optional(),
  useSerpAnalysis: z.boolean().optional(),
  location: z.string().trim().optional(),
  settings: z.record(z.any()).optional(),
}).refine(
  (data) => {
    // Either wordCount OR (minWords AND maxWords) must be provided
    const hasWordCount = data.wordCount !== undefined
    const hasRange = data.minWords !== undefined && data.maxWords !== undefined
    return hasWordCount || hasRange
  },
  { message: 'Either wordCount or both minWords and maxWords must be provided' }
).refine(
  (data) => {
    // If range is provided, minWords must be less than maxWords
    if (data.minWords !== undefined && data.maxWords !== undefined) {
      return data.minWords < data.maxWords
    }
    return true
  },
  { message: 'minWords must be less than maxWords' }
)

type GeneratePayload = z.infer<typeof generateSchema>

const humanizationPrompts = `
CRITICAL HUMANIZATION REQUIREMENTS - MUST FOLLOW TO PASS AI DETECTION:

SENTENCE STRUCTURE (HIGHEST PRIORITY):
1. Vary sentence length dramatically: 5-word sentences. Then 25-word complex sentences with multiple clauses. Mix constantly.
2. Start sentences differently: avoid repetitive patterns like "The X is..." or "This allows..."
3. Use incomplete sentences occasionally for emphasis. Like this one.
4. Include run-on thoughts connected with em-dashes—just like humans naturally write—to create flow
5. Break grammar rules subtly: start with "And" or "But", use fragments for impact

CONVERSATIONAL TONE (ESSENTIAL):
6. Use contractions HEAVILY: don't, it's, you're, we'll, can't, won't, they're (aim for 15-20% of sentences)
7. Address reader directly with "you" and "your" frequently
8. Include personal pronouns: "I think", "we've found", "you'll notice"
9. Add casual transitions: "Look", "Here's the thing", "Now", "So", "Anyway"
10. Use colloquial expressions: "pretty much", "kind of", "a bit", "really", "actually"

HUMAN IMPERFECTIONS (CRITICAL):
11. Vary paragraph lengths: 1-sentence paragraphs, then 5-sentence ones
12. Add occasional redundancy (humans repeat for emphasis)
13. Include hedging language: "might", "could", "perhaps", "seems like", "arguably"
14. Use parenthetical asides (like this) to add personality
15. Include rhetorical questions? Of course you should!

EMOTIONAL & PERSONAL ELEMENTS:
16. Add subjective opinions: "I believe", "in my experience", "personally"
17. Use emotional words: amazing, frustrating, exciting, disappointing, love, hate
18. Share anecdotes or hypothetical scenarios
19. Express uncertainty or nuance: "it depends", "not always", "sometimes"
20. Add emphasis with italics or bold sparingly

VOCABULARY & STYLE:
21. Mix sophisticated and simple words in same paragraph
22. Use idioms and metaphors naturally
23. Avoid corporate jargon and overly formal language
24. Include specific numbers and details (not just round numbers)
25. Use sensory language: how things look, feel, sound

ENGAGEMENT TECHNIQUES:
26. Ask questions throughout (not just rhetorical)
27. Use "we" to create connection with reader
28. Add calls-to-action that feel natural, not salesy
29. Include counterarguments or alternative viewpoints
30. End sections with hooks that lead to next section
`

const seoPrompts = `
CRITICAL SEO OPTIMIZATION REQUIREMENTS:
1. Naturally incorporate target keywords throughout (2-3% density)
2. Use LSI (Latent Semantic Indexing) keywords related to main topic
3. Include keyword variations and long-tail keywords
4. Create compelling, keyword-rich headings (H1, H2, H3)
5. Write meta-description-worthy introduction (155-160 chars summary)
6. Use semantic markup with clear content hierarchy
7. Include internal linking opportunities (mention related topics)
8. Add FAQ-style content for featured snippets
9. Use schema-friendly language for rich snippets
10. Optimize for user intent and SERP features
`

const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  blog: `
  Create an engaging blog post with:
  - A compelling headline tied to the core promise
  - Hook introduction that grabs attention immediately
  - Well-structured body with descriptive, keyword-rich subheadings
  - Practical examples, stories, or frameworks that feel lived-in
  - Clear conclusion with an action-oriented takeaway
  `,
  'product-review': `
  Create a comprehensive product review with:
  - Product overview, positioning, and standout features
  - Detailed pros and cons grounded in hands-on insight
  - Real-world use cases and comparisons to alternatives
  - Pricing, value assessment, and who the product fits best
  - Final verdict with an explicit recommendation
  `,
  comparison: `
  Create a detailed comparison article with:
  - Context for the products/services being compared
  - Feature-by-feature analysis in narrative and tabular form
  - Honest strengths, trade-offs, and ideal scenarios for each
  - Pricing/value breakdown and decision criteria
  - Clear winner recommendations by use case
  `,
  affiliate: `
  Create persuasive affiliate content with:
  - Problem-solution framing tied to reader pain points
  - Benefit-driven storytelling with social proof
  - Objection handling woven into body copy
  - Value stacking and soft urgency without sounding pushy
  - Strong but natural call-to-action that motivates clicks
  `,
}

async function getPersonaInstructions(userId: string, personaId: string | undefined): Promise<string> {
  if (!personaId) return ''
  
  // Check if it's a user persona (prefixed with "user-")
  if (personaId.startsWith('user-')) {
    const actualId = personaId.replace('user-', '')
    try {
      const userPersona = await getPersonaById(userId, actualId)
      if (userPersona && !userPersona.deleted_at) {
        return `\n\nWRITING PERSONA - ${userPersona.name.toUpperCase()}:\n${userPersona.style}\n${userPersona.description ? `\nPersona Description: ${userPersona.description}` : ''}\n\nYou MUST write in this exact style and voice throughout the entire content.\n`
      }
    } catch (error) {
      console.error('Error fetching user persona:', error)
    }
  }
  
  // Otherwise, use system persona
  const systemPersona = getPersona(personaId)
  return `\n\n${buildPersonaPrompt(systemPersona)}\n`
}

async function buildAdvancedInstructions(userId: string, data: GeneratePayload): Promise<string> {
  const instructions: string[] = []

  if (data.includeFAQ) {
    instructions.push('Add an FAQ section with 3-5 concise Q&A pairs that mirror People Also Ask queries.')
  }
  if (data.includeCompetitorHeaders) {
    instructions.push('Reference dominant competitor outlines and offer a fresher angle that fills SERP gaps.')
  }
  if (data.includeVideo) {
    instructions.push('Recommend an embedded YouTube video with a one-sentence rationale for relevance.')
  }
  if (data.useSerpAnalysis) {
    instructions.push('Leverage SERP observations to highlight differentiation and outperform existing snippets.')
  }
  if (data.targetAudience) {
    instructions.push(`Write with ${data.targetAudience} in mind, explicitly addressing their motivations and objections.`)
  }
  if (data.location) {
    instructions.push(`Localise references and examples for ${data.location}.`)
  }
  if (data.additionalInstructions) {
    instructions.push(`Honor these extra directions: ${data.additionalInstructions}`)
  }

  let result = ''
  if (instructions.length > 0) {
    result = `\nADVANCED REQUIREMENTS:\n${instructions.map(item => `- ${item}`).join('\n')}\n`
  }
  
  // Add persona instructions
  const personaInstructions = await getPersonaInstructions(userId, data.personaId)
  result += personaInstructions
  
  return result
}

async function buildPrompt(userId: string, data: GeneratePayload, lowerBound: number, upperBound: number, targetWordCount: number, adjustments: string[]): Promise<string> {
  const contentTypeInstructions = CONTENT_TYPE_INSTRUCTIONS[data.contentType] || CONTENT_TYPE_INSTRUCTIONS.blog

  const keywordsSection = data.keywords ? `TARGET KEYWORDS: ${data.keywords}` : ''
  const titleDirective = data.title
    ? `Use the provided title as the primary H1 heading: "${data.title}".`
    : 'Craft a compelling H1 headline that naturally includes the primary keyword.'

  const adjustmentSection = adjustments.length
    ? `\nWORD COUNT CORRECTION NOTES:\n${adjustments.map(item => `- ${item}`).join('\n')}\n`
    : ''

  const advancedInstructions = await buildAdvancedInstructions(userId, data)

  return `
You are an expert content strategist crafting UNIQUE, SEO-optimized, and deeply human content that easily passes AI detection.

${humanizationPrompts}

${seoPrompts}

CONTENT TYPE: ${data.contentType.toUpperCase()}
${contentTypeInstructions}

PRIMARY TOPIC: ${data.topic}
${keywordsSection}
${titleDirective}

STRICT WORD COUNT REQUIREMENT:
- Target word count: ${targetWordCount} words
- Acceptable range: ${lowerBound} to ${upperBound} words
- This is CRITICAL: Your response MUST be within this word count range
- Count your words carefully and adjust before submitting
- Do NOT mention the word count inside the article
- Aim for the middle of the range for best results

STYLE GUARDRAILS:
- Tone: ${data.tone}
- Writing style: ${data.style}
- Maintain the chosen tone and style consistently throughout the piece.

${advancedInstructions}

FORMATTING GUIDELINES (MANDATORY):
- Use Markdown exclusively.
- # for the main headline (once), ## for primary sections, ### for subsections.
- Keep paragraphs to 2-4 sentences for readability.
- Use bullet and numbered lists where they strengthen clarity.
- Avoid HTML tags or inline CSS.

QUALITY STANDARDS:
✓ Narrative that feels lived-in, opinionated, and trustworthy.
✓ SEO-friendly structure without keyword stuffing.
✓ Evidence-backed claims with concrete details.
✓ Conversational flow with natural transitions.

${adjustmentSection}

Deliver the final article now, fully edited and ready for publishing.
`.trim()
}

function humanizeContent(content: string): string {
  let humanized = content

  humanized = humanized.replace(/^(#{1,6})\s*\*\*(.*?)\*\*\s*$/gm, '$1 $2')
  humanized = humanized.replace(/^\*\*(.*?)\*\*$/gm, '$1')
  humanized = humanized.replace(/^(#{1,6}\s+)(.+)$/gm, (match, hashes, text) => {
    const cleanText = text.replace(/\*\*/g, '')
    return `${hashes}${cleanText}`
  })

  const contractionPairs = [
    { formal: ' do not ', casual: " don't " },
    { formal: ' does not ', casual: " doesn't " },
    { formal: ' did not ', casual: " didn't " },
    { formal: ' is not ', casual: " isn't " },
    { formal: ' are not ', casual: " aren't " },
    { formal: ' was not ', casual: " wasn't " },
    { formal: ' were not ', casual: " weren't " },
    { formal: ' have not ', casual: " haven't " },
    { formal: ' has not ', casual: " hasn't " },
    { formal: ' had not ', casual: " hadn't " },
    { formal: ' will not ', casual: " won't " },
    { formal: ' would not ', casual: " wouldn't " },
    { formal: ' could not ', casual: " couldn't " },
    { formal: ' should not ', casual: " shouldn't " },
    { formal: ' cannot ', casual: " can't " },
    { formal: ' it is ', casual: " it's " },
    { formal: ' that is ', casual: " that's " },
    { formal: ' there is ', casual: " there's " },
    { formal: ' you are ', casual: " you're " },
    { formal: ' we are ', casual: " we're " },
    { formal: ' they are ', casual: " they're " },
    { formal: ' I am ', casual: " I'm " },
    { formal: ' you will ', casual: " you'll " },
    { formal: ' we will ', casual: " we'll " },
    { formal: ' they will ', casual: " they'll " },
  ]

  contractionPairs.forEach(pair => {
    const regex = new RegExp(pair.formal, 'gi')
    humanized = humanized.replace(regex, match => (Math.random() > 0.4 ? pair.casual : match))
  })

  return humanized
}

const SYSTEM_MESSAGE = `You are a senior human copywriter. You obsess over nuance, authenticity, and clarity.`

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables')
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured on the server.',
          suggestions: [
            'Add OPENAI_API_KEY to your .env.local file',
            'Restart your development server after adding the key',
            'Check that the key starts with "sk-"',
          ]
        },
        { status: 500 }
      )
    }
    
    // Validate API key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('OPENAI_API_KEY appears to be invalid (should start with sk-)')
      return NextResponse.json(
        { 
          error: 'OpenAI API key appears to be invalid.',
          suggestions: [
            'Check that your API key starts with "sk-"',
            'Get a new key from https://platform.openai.com/api-keys',
            'Make sure you copied the entire key',
          ]
        },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateResult = consumeRateLimit(`generate:${session.user.id}`, RATE_LIMIT_CONFIG)

    if (!rateResult.success) {
      const retrySeconds = Math.ceil((rateResult.retryAfter ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before generating more content.' },
        {
          status: 429,
          headers: {
            'Retry-After': `${Math.max(retrySeconds, 1)}`,
          },
        }
      )
    }

    const payload = await request.json()
    const parsed = generateSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const userId = session.user.id as string
    
    // Determine word count range
    let lower: number
    let upper: number
    let targetWordCount: number
    
    if (data.minWords !== undefined && data.maxWords !== undefined) {
      // User provided a range
      lower = data.minWords
      upper = data.maxWords
      targetWordCount = Math.floor((lower + upper) / 2) // Use midpoint for display
    } else if (data.wordCount !== undefined) {
      // User provided a single value, apply tolerance
      const bounds = calculateBounds(data.wordCount)
      lower = bounds.lower
      upper = bounds.upper
      targetWordCount = data.wordCount
    } else {
      // This shouldn't happen due to schema validation, but handle it
      return NextResponse.json(
        { error: 'Either wordCount or word range (minWords/maxWords) must be provided' },
        { status: 400 }
      )
    }

    const currentBalance = await getUserCreditBalance(userId)
    const maximumPotentialCost = upper

    if (currentBalance < maximumPotentialCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits. Please purchase more credits to continue.',
          currentBalance,
          requiredCredits: maximumPotentialCost,
        },
        { status: 402 }
      )
    }

    let generatedContent = ''
    let wordCount = 0
    let tokensUsed = 0
    let modelUsed = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    let attemptCount = 0
    let success = false
    let lastError: unknown = null
    const adjustments: string[] = []

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      attemptCount = attempt + 1
      const prompt = await buildPrompt(session.user.id, data, lower, upper, targetWordCount, adjustments)

      try {
        const modelName = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
        const maxTokens = calculateMaxTokens(upper, modelName)
        
        console.log(`Attempt ${attemptCount}: Using model ${modelName} with max_tokens=${maxTokens} for ${upper} words`)
        
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_MESSAGE },
            { role: 'user', content: prompt },
          ],
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: maxTokens,
          presence_penalty: 0.8,
          frequency_penalty: 0.5,
        })

        console.log('OpenAI Response:', {
          model: completion.model,
          finishReason: completion.choices[0]?.finish_reason,
          hasContent: !!completion.choices[0]?.message?.content,
          contentLength: completion.choices[0]?.message?.content?.length || 0,
        })

        const rawContent = completion.choices[0]?.message?.content?.trim() || ''

        if (!rawContent) {
          const finishReason = completion.choices[0]?.finish_reason
          console.error(`Empty content returned. Finish reason: ${finishReason}`)
          
          if (finishReason === 'content_filter') {
            return NextResponse.json(
              { error: 'Content was filtered by OpenAI. Please try a different topic or adjust your keywords.' },
              { status: 400 }
            )
          }
          
          if (finishReason === 'length') {
            adjustments.push('Previous attempt hit token limit. Generate more concise content within the word count range.')
          } else {
            adjustments.push('Previous attempt returned empty content. Regenerate with complete sections.')
          }
          continue
        }

        const humanizedContent = humanizeContent(rawContent)
        generatedContent = humanizedContent
        wordCount = countWords(humanizedContent)
        tokensUsed = completion.usage?.total_tokens ?? tokensUsed
        modelUsed = completion.model

        console.log(`Attempt ${attemptCount}: Generated ${wordCount} words (target: ${targetWordCount}, range: ${lower}-${upper})`)

        if (isWithinTolerance(wordCount, lower, upper)) {
          success = true
          console.log(`✓ Success on attempt ${attemptCount}: ${wordCount} words within range`)
          break
        }

        const difference = wordCount < lower ? lower - wordCount : wordCount - upper
        const percentOff = Math.round((difference / targetWordCount) * 100)
        
        adjustments.push(
          `Attempt ${attemptCount} produced ${wordCount} words (${percentOff}% off target). You MUST generate between ${lower} and ${upper} words. ${wordCount < lower ? `Add approximately ${difference} more words to reach the minimum.` : `Remove approximately ${difference} words to stay within the maximum.`}`
        )
      } catch (error: any) {
        lastError = error

        if (error?.status === 429) {
          return NextResponse.json(
            { error: 'OpenAI rate limit exceeded. Please try again shortly.' },
            { status: 429 }
          )
        }

        if (error?.status === 401) {
          return NextResponse.json(
            { error: 'OpenAI authentication failed. Please verify API credentials.' },
            { status: 500 }
          )
        }

        adjustments.push('A previous attempt failed unexpectedly. Regenerate a complete response that meets every requirement.')
      }
    }

    if (!success || !generatedContent) {
      console.error(`Failed to generate within tolerance after ${attemptCount} attempts:`, {
        lastWordCount: wordCount,
        targetRange: `${lower}-${upper}`,
        lastError
      })
      
      // If we have content but it's close to the range, accept it anyway (within 30% of bounds)
      if (generatedContent && wordCount > 0) {
        const rangeSize = upper - lower
        const flexibleLower = Math.max(MIN_WORD_COUNT, lower - Math.floor(rangeSize * 0.3))
        const flexibleUpper = Math.min(MAX_WORD_COUNT, upper + Math.ceil(rangeSize * 0.3))
        
        if (wordCount >= flexibleLower && wordCount <= flexibleUpper) {
          console.log(`⚠ Accepting content with flexible tolerance: ${wordCount} words (flexible range: ${flexibleLower}-${flexibleUpper})`)
          success = true
        }
      }
      
      if (!success) {
        // Provide more helpful error message based on the situation
        let errorMessage = 'Unable to generate content that matches the requested word count.'
        let suggestions: string[] = []
        
        if (wordCount === 0) {
          errorMessage = 'OpenAI returned empty content. This might be due to:'
          suggestions = [
            'Content filtering (topic may be sensitive)',
            'API rate limits or quota issues',
            'Model availability issues',
            'Try a different topic or simpler prompt',
          ]
        } else if (wordCount < lower * 0.5) {
          errorMessage = 'Generated content is significantly shorter than requested.'
          suggestions = [
            'Try a smaller word count range',
            'Simplify your topic or requirements',
            'Remove advanced options that might be conflicting',
          ]
        } else if (wordCount > upper * 1.5) {
          errorMessage = 'Generated content is significantly longer than requested.'
          suggestions = [
            'Try a larger word count range',
            'Be more specific in your topic',
            'Add constraints in additional instructions',
          ]
        } else {
          suggestions = [
            'Try using a wider word count range (e.g., 500-1500)',
            'Adjust your topic to be more specific or general',
            'Try again - AI generation has some randomness',
          ]
        }
        
        return NextResponse.json(
          {
            error: errorMessage,
            suggestions,
            details: {
              attempts: attemptCount,
              lastWordCount: wordCount,
              targetRange: `${lower}-${upper}`,
              lastError: lastError instanceof Error ? lastError.message : String(lastError),
            }
          },
          { status: 422 }
        )
      }
    }

    const creditsToDeduct = wordCount
    let transaction: CreditTransactionRecord | null = null

    try {
      transaction = await adjustUserCredits({
        userId,
        amount: -creditsToDeduct,
        type: 'usage',
        description: `Content generation: ${data.title || data.topic}`,
        metadata: {
          requestedWordCount: targetWordCount,
          wordCountRange: { min: lower, max: upper },
          actualWordCount: wordCount,
          attemptCount,
          contentType: data.contentType,
        },
      })

      const settingsPayload = {
        tone: data.tone,
        style: data.style,
        keywords: data.keywords,
        targetAudience: data.targetAudience,
        includeFAQ: data.includeFAQ,
        includeVideo: data.includeVideo,
        includeCompetitorHeaders: data.includeCompetitorHeaders,
        useSerpAnalysis: data.useSerpAnalysis,
        personaId: data.personaId,
        location: data.location,
        additionalInstructions: data.additionalInstructions,
        contentType: data.contentType,
        customSettings: data.settings ?? {},
      }

      const savedContent = await recordGeneratedContent({
        userId,
        title: data.title || data.topic,
        content: generatedContent,
        wordCount,
        creditsUsed: creditsToDeduct,
        requestedLength: targetWordCount,
        settings: settingsPayload,
        retryCount: attemptCount - 1,
        status: 'completed',
      })

      const response = NextResponse.json({
        content: generatedContent,
        requestedWordCount: targetWordCount,
        wordCountRange: { min: lower, max: upper },
        actualWordCount: wordCount,
        attemptCount,
        creditsDeducted: creditsToDeduct,
        remainingCredits: transaction.balance_after ?? currentBalance - creditsToDeduct,
        metadata: {
          model: modelUsed,
          tokensUsed,
          transactionId: transaction.id,
          contentId: savedContent.id,
          rateLimit: {
            remaining: rateResult.remaining,
            reset: rateResult.reset,
          },
        },
      })

      response.headers.set('X-RateLimit-Remaining', `${Math.max(rateResult.remaining, 0)}`)
      response.headers.set('X-RateLimit-Reset', `${rateResult.reset}`)

      return response
    } catch (error) {
      console.error('Error persisting generated content:', error)

      if (transaction) {
        try {
          await adjustUserCredits({
            userId,
            amount: creditsToDeduct,
            type: 'adjustment',
            description: 'Refund: failed to persist generated content',
            metadata: { originalTransactionId: transaction.id },
          })
        } catch (refundError) {
          console.error('Failed to refund credits after persistence error:', refundError)
        }
      }

      return NextResponse.json(
        { error: 'Content generation succeeded but we could not save it. Credits have been refunded.' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Generation error:', error)

    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while generating content.' },
      { status: 500 }
    )
  }
}


