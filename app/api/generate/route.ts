import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import {
  adjustUserCredits,
  getUserCreditBalance,
  recordGeneratedContent,
  type CreditTransactionRecord,
} from '@/lib/supabase'
import { consumeRateLimit } from '@/lib/rate-limit'
import {
  MIN_WORD_COUNT,
  MAX_WORD_COUNT,
  calculateBounds,
  isWithinTolerance,
  countWords,
} from '@/lib/content-constraints'
import { searchYouTubeVideo } from '@/lib/serp-analysis'
import { sanitizeContent, validateContent } from '@/lib/content-sanitizer'

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for content generation
import {
  ContentOrchestrator,
  type ContentGenerationRequest,
} from '@/lib/content-agents'

const RATE_LIMIT_CONFIG = {
  limit: 10,
  windowMs: 60_000,
}

const orchestrator = new ContentOrchestrator()

const generateSchema = z.object({
  contentType: z.string().trim().min(2).default('blog'),
  title: z.string().trim().optional(),
  topic: z.string().trim().min(3),
  keywords: z.string().trim().optional(),
  tone: z.string().trim().min(3),
  style: z.string().trim().min(3),
  wordCount: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  minWords: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  maxWords: z.coerce.number().int().min(MIN_WORD_COUNT).max(MAX_WORD_COUNT).optional(),
  targetAudience: z.string().trim().optional(),
  additionalInstructions: z.string().trim().optional(),
  personaId: z.string().trim().min(1, 'Persona is required for human-like content generation'),
  includeFAQ: z.boolean().optional(),
  includeVideo: z.boolean().optional(),
  includeCompetitorHeaders: z.boolean().optional(),
  useSerpAnalysis: z.boolean().optional(),
  location: z.string().trim().optional(),
  settings: z.record(z.any()).optional(),
}).refine(
  (data) => {
    const hasWordCount = data.wordCount !== undefined
    const hasRange = data.minWords !== undefined && data.maxWords !== undefined
    return hasWordCount || hasRange
  },
  { message: 'Either wordCount or both minWords and maxWords must be provided' }
).refine(
  (data) => {
    if (data.minWords !== undefined && data.maxWords !== undefined) {
      return data.minWords < data.maxWords
    }
    return true
  },
  { message: 'minWords must be less than maxWords' }
)

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured.')
      return NextResponse.json(
        {
          error: 'OpenAI API key is missing.',
          suggestions: [
            'Add OPENAI_API_KEY to your .env.local file',
            'Restart the dev server after adding the key',
          ],
        },
        { status: 500 }
      )
    }

    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('OPENAI_API_KEY appears invalid.')
      return NextResponse.json(
        {
          error: 'OpenAI API key appears invalid.',
          suggestions: [
            'Ensure the key starts with "sk-"',
            'Paste the full key from https://platform.openai.com/api-keys',
          ],
        },
        { status: 500 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateResult = consumeRateLimit(`generate:${session.user.id}`, RATE_LIMIT_CONFIG)
    if (!rateResult.success) {
      const retrySeconds = Math.ceil((rateResult.retryAfter ?? 0) / 1000)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        {
          status: 429,
          headers: {
            'Retry-After': `${Math.max(retrySeconds, 1)}`,
          },
        }
      )
    }

    const payload = await request.json()
    
    // Enforce persona requirement
    if (!payload.personaId) {
      return NextResponse.json(
        {
          error: 'Persona selection is required',
          message: 'Please select a writing persona to ensure human-like, authentic content that passes AI detection.',
          suggestions: [
            'Choose a persona that matches your content type',
            'Personas help prevent hallucinations and improve content quality',
            'Default personas are available if you\'re unsure'
          ]
        },
        { status: 400 }
      )
    }
    
    const parsed = generateSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const userId = session.user.id as string

    if (data.useSerpAnalysis && !process.env.SERPAPI_KEY) {
      return NextResponse.json(
        {
          error: 'SERP analysis requested but SERPAPI_KEY is not configured.',
          suggestions: ['Set SERPAPI_KEY in the environment when requesting SERP analysis.'],
        },
        { status: 500 }
      )
    }

    let lower: number
    let upper: number
    let targetWordCount: number

    if (data.minWords !== undefined && data.maxWords !== undefined) {
      lower = data.minWords
      upper = data.maxWords
      targetWordCount = Math.floor((lower + upper) / 2)
    } else if (data.wordCount !== undefined) {
      const bounds = calculateBounds(data.wordCount)
      lower = bounds.lower
      upper = bounds.upper
      targetWordCount = data.wordCount
    } else {
      return NextResponse.json(
        { error: 'Word count or range is required.' },
        { status: 400 }
      )
    }

    const currentBalance = await getUserCreditBalance(userId)
    const maximumPotentialCost = upper
    if (currentBalance < maximumPotentialCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits. Please top up your balance.',
          currentBalance,
          requiredCredits: maximumPotentialCost,
        },
        { status: 402 }
      )
    }

    const contentRequest: ContentGenerationRequest = {
      topic: data.topic,
      keywords: data.keywords ?? '',
      contentType: data.contentType,
      tone: data.tone,
      style: data.style,
      targetWordCount,
      targetAudience: data.targetAudience ?? '',
      additionalInstructions: data.additionalInstructions,
      personaId: data.personaId,
      location: data.location || 'us',
      includeFAQ: data.includeFAQ ?? false,
      includeCompetitorHeaders: data.includeCompetitorHeaders ?? false,
      useSerpAnalysis: data.useSerpAnalysis ?? false,
    }

    let orchestratorResult
    try {
      orchestratorResult = await orchestrator.generateContent(contentRequest)
    } catch (error: unknown) {
      console.error('Orchestrator error:', error)
      const details = error instanceof Error ? error.message : 'No additional details available'
      return NextResponse.json(
        {
          error: 'Content generation failed. Please try again.',
          details,
        },
        { status: 500 }
      )
    }

    let finalContent = orchestratorResult.content

    if (data.includeVideo) {
      try {
        const video = await searchYouTubeVideo(data.topic)
        if (video) {
          const embed = `
<div class="video-container">
${video}
</div>
`
          const h2Matches = Array.from(finalContent.matchAll(/## /g))
          if (h2Matches.length >= 3) {
            const insertIndex = h2Matches[2].index || 0
            finalContent = finalContent.slice(0, insertIndex) + embed + finalContent.slice(insertIndex)
          } else {
            finalContent += `\n\n${embed}`
          }
        }
      } catch (error) {
        console.error('Video search error:', error)
      }
    }

    if (data.includeFAQ && orchestratorResult.faqHtml) {
      finalContent += '\n\n' + orchestratorResult.faqHtml
    }

    // Sanitize content to remove unwanted LLM artifacts, HTML/CSS, and refusal messages
    const sanitizationResult = sanitizeContent(finalContent)
    finalContent = sanitizationResult.content

    // Log sanitization issues if any
    if (sanitizationResult.wasModified) {
      console.warn('Content sanitization issues detected:', sanitizationResult.issues)
    }

    // Check if content is severely corrupted
    if (sanitizationResult.isSeverelyCorrupted) {
      console.error('Content is severely corrupted after sanitization:', {
        issues: sanitizationResult.issues,
        originalLength: orchestratorResult.content.length,
        cleanedLength: finalContent.length,
      })
      return NextResponse.json(
        {
          error: 'Generated content contains too many errors or unwanted elements.',
          suggestions: [
            'The AI returned corrupted content (refusal messages, code blocks, etc.)',
            'Try rephrasing your topic or reducing constraints',
            'Check if your topic might violate content policies',
          ],
          details: {
            issues: sanitizationResult.issues,
            contentLength: finalContent.length,
          },
        },
        { status: 422 }
      )
    }

    // Validate content quality
    const contentValidation = validateContent(finalContent)
    if (!contentValidation.isValid) {
      console.error('Content validation failed:', contentValidation.reason)
      return NextResponse.json(
        {
          error: 'Generated content failed quality validation.',
          suggestions: [
            contentValidation.reason || 'Content does not meet quality standards',
            'Try a different topic or adjust your generation parameters',
          ],
        },
        { status: 422 }
      )
    }

    const actualWordCount = countWords(finalContent)
    const attemptCount = 1

    // Strict validation: enforce user-specified word count range
    if (actualWordCount === 0) {
      return NextResponse.json(
        {
          error: 'OpenAI returned empty content.',
          suggestions: [
            'Try a more permissive topic or reduce advanced constraints',
            'Ensure your API key has sufficient quota',
            'Check if your topic violates OpenAI content policy'
          ],
          details: {
            attempts: attemptCount,
            lastWordCount: actualWordCount,
            requestedRange: `${lower}-${upper}`,
          },
        },
        { status: 422 }
      )
    }

    // Check if content is outside user's word count range
    const isOutOfRange = !isWithinTolerance(actualWordCount, lower, upper)
    let creditsToDeduct = 0
    let transaction: CreditTransactionRecord | null = null

    if (isOutOfRange) {
      console.warn(`Content word count (${actualWordCount}) outside user-requested range ${lower}-${upper}`)
      
      // Don't deduct credits for out-of-range content, but still provide it to the user
      creditsToDeduct = 0
    } else {
      // Normal flow: deduct credits for content within range
      creditsToDeduct = actualWordCount
    }

    try {
      // Only deduct credits if content is within the requested range
      if (creditsToDeduct > 0) {
        transaction = await adjustUserCredits({
          userId,
          amount: -creditsToDeduct,
          type: 'usage',
          description: `Content generation: ${data.title || data.topic}`,
          metadata: {
            requestedWordCount: targetWordCount,
            requestedRange: { min: lower, max: upper },
            actualWordCount,
          },
        })
      }

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
        content: finalContent,
        wordCount: actualWordCount,
        creditsUsed: creditsToDeduct,
        requestedLength: targetWordCount,
        settings: JSON.parse(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(settingsPayload).filter(([, v]) => v !== undefined)
            )
          )
        ),
        retryCount: attemptCount - 1,
        status: 'completed',
      })

      const remainingCredits = transaction?.balance_after ?? currentBalance

      const response = NextResponse.json({
        content: finalContent,
        requestedWordCount: targetWordCount,
        requestedRange: { min: lower, max: upper },
        actualWordCount,
        attemptCount,
        creditsDeducted: creditsToDeduct,
        remainingCredits,
        warning: isOutOfRange ? `Content (${actualWordCount} words) is outside your requested range (${lower}-${upper} words). No credits were deducted.` : undefined,
        metadata: {
          model: orchestratorResult.model,
          tokensUsed: orchestratorResult.tokensUsed,
          transactionId: transaction?.id || null,
          contentId: savedContent.id,
          personaUsed: data.personaId,
          rateLimit: {
            remaining: rateResult.remaining,
            reset: rateResult.reset,
          },
          serpAnalysis: orchestratorResult.serpData
            ? {
                analyzed: true,
                topResults: orchestratorResult.serpData.topResults.length,
                peopleAlsoAsk: orchestratorResult.serpData.peopleAlsoAsk.length,
                relatedSearches: orchestratorResult.serpData.relatedSearches.length,
                avgCompetitorWordCount: orchestratorResult.serpData.avgWordCount,
                recommendations: orchestratorResult.serpData.recommendations,
              }
            : null,
          faqGenerated: Boolean(orchestratorResult.faqHtml),
          videoIncluded: Boolean(data.includeVideo),
          analytics: orchestratorResult.analytics,
          progressLog: orchestratorResult.progressLog,
          sanitization: sanitizationResult.wasModified
            ? {
                wasModified: true,
                issuesFound: sanitizationResult.issues,
              }
            : null,
        },
      })

      response.headers.set('X-RateLimit-Remaining', `${Math.max(rateResult.remaining, 0)}`)
      response.headers.set('X-RateLimit-Reset', `${rateResult.reset}`)

      return response
    } catch (error) {
      console.error('Error persisting generated content:', error)

      // Only refund if we actually deducted credits
      if (transaction && creditsToDeduct > 0) {
        try {
          await adjustUserCredits({
            userId,
            amount: creditsToDeduct,
            type: 'adjustment',
            description: 'Refund: failed to persist generated content',
            metadata: { originalTransactionId: transaction.id },
          })
        } catch (refundError) {
          console.error('Refund failed:', refundError)
        }
      }

      return NextResponse.json(
        { error: 'Content generated but could not be saved.' },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Generation error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while generating content.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

