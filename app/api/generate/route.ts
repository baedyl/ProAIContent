import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface GenerateRequest {
  contentType: string
  topic: string
  keywords: string
  tone: string
  style: string
  length: string
  targetAudience: string
  additionalInstructions: string
}

// Enhanced humanization techniques to bypass AI detection
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

// SEO optimization techniques
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

const lengthGuides: Record<string, string> = {
  'short': '500-800 words',
  'medium': '800-1500 words',
  'long': '1500-2500 words',
  'extra-long': '2500-3500 words'
}

/**
 * Post-process content to add human-like variations and reduce AI detection
 */
function humanizeContent(content: string): string {
  let humanized = content
  
  // Fix markdown formatting issues: Remove ** from headings
  humanized = humanized.replace(/^(#{1,6})\s*\*\*(.*?)\*\*\s*$/gm, '$1 $2')
  
  // Fix bold markers at start/end of lines (likely heading mistakes)
  humanized = humanized.replace(/^\*\*(.*?)\*\*$/gm, '$1')
  
  // Clean up excessive bold usage in headings
  humanized = humanized.replace(/^(#{1,6}\s+)(.+)$/gm, (match, hashes, text) => {
    // Remove all ** from heading text
    const cleanText = text.replace(/\*\*/g, '')
    return `${hashes}${cleanText}`
  })
  
  // Add occasional spacing variations (humans sometimes add extra line breaks)
  humanized = humanized.replace(/\n\n(#{2,3}\s)/g, (match, heading) => {
    return Math.random() > 0.7 ? `\n\n\n${heading}` : match
  })
  
  // Ensure contractions are present (if missing, add some)
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
  
  // Apply contractions randomly (60% of the time) to maintain natural feel
  contractionPairs.forEach(pair => {
    const regex = new RegExp(pair.formal, 'gi')
    humanized = humanized.replace(regex, (match) => {
      return Math.random() > 0.4 ? pair.casual : match
    })
  })
  
  return humanized
}

function buildPrompt(data: GenerateRequest): string {
  const lengthGuide = lengthGuides[data.length] || '800-1500 words'
  
  let contentTypeInstructions = ''
  
  switch (data.contentType) {
    case 'blog':
      contentTypeInstructions = `
      Create an engaging blog post with:
      - Compelling headline
      - Hook introduction that grabs attention
      - Well-structured body with subheadings
      - Practical examples and insights
      - Engaging conclusion with call-to-action
      `
      break
    case 'product-review':
      contentTypeInstructions = `
      Create a comprehensive product review with:
      - Product overview and key features
      - Detailed pros and cons analysis
      - Real-world use cases and experiences
      - Comparison with alternatives
      - Final verdict and recommendation
      - Who should buy this product
      `
      break
    case 'comparison':
      contentTypeInstructions = `
      Create a detailed product comparison with:
      - Introduction to products being compared
      - Feature-by-feature comparison table
      - Detailed analysis of each product
      - Price and value comparison
      - Use case scenarios for each
      - Clear winner recommendation with reasoning
      `
      break
    case 'affiliate':
      contentTypeInstructions = `
      Create persuasive affiliate content with:
      - Problem-solution approach
      - Detailed product benefits and features
      - Social proof and credibility elements
      - Urgency and scarcity elements (subtle)
      - Clear value proposition
      - Strong call-to-action for conversions
      `
      break
  }

  const keywordsSection = data.keywords 
    ? `TARGET KEYWORDS TO NATURALLY INCORPORATE: ${data.keywords}` 
    : ''
  
  const audienceSection = data.targetAudience 
    ? `TARGET AUDIENCE: ${data.targetAudience}` 
    : ''
  
  const additionalSection = data.additionalInstructions 
    ? `ADDITIONAL REQUIREMENTS: ${data.additionalInstructions}` 
    : ''

  return `
You are an expert content writer creating UNIQUE, SEO-OPTIMIZED, and HUMANIZED content that passes AI detection tests.

${humanizationPrompts}

${seoPrompts}

CONTENT TYPE: ${data.contentType.toUpperCase()}
${contentTypeInstructions}

TOPIC: ${data.topic}

${keywordsSection}

WRITING SPECIFICATIONS:
- Tone: ${data.tone}
- Style: ${data.style}
- Length: ${lengthGuide}
${audienceSection}
${additionalSection}

FORMATTING GUIDELINES (CRITICAL - MUST FOLLOW EXACTLY):
- Use markdown formatting ONLY for structure:
  * # for main title (use once at the beginning)
  * ## for major section headings
  * ### for subsection headings
  * #### for minor headings if needed
- DO NOT use ** around headings (headings should be: ## Title, NOT ## **Title**)
- Use ** ONLY for bold emphasis within paragraph text (e.g., "This is **important** text")
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) where appropriate
- Keep paragraphs concise (2-4 sentences)
- Add blank lines between sections for readability
- NO HTML tags or inline styles

TONE & STYLE ENFORCEMENT (MUST MATCH USER SELECTION):
- Tone selected: ${data.tone}
- Style selected: ${data.style}
- STRICTLY adhere to the selected tone throughout the entire content
- Maintain consistency with the selected writing style
- Do not deviate from user's tone/style preferences

QUALITY REQUIREMENTS:
✓ 100% unique and original content
✓ Passes AI detection tests (highly humanized)
✓ SEO optimized with natural keyword integration
✓ Engaging and valuable to readers
✓ Grammatically perfect but conversational
✓ Action-oriented with clear takeaways
✓ Clean markdown formatting without errors

Now create the content following ALL requirements above. Make it exceptional, unique, and indistinguishable from human writing. Pay special attention to proper markdown formatting and maintaining the selected tone/style.
`.trim()
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    const data: GenerateRequest = await request.json()

    // Validate required fields
    if (!data.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Build the prompt
    const prompt = buildPrompt(data)

    // Generate content using OpenAI with enhanced humanization parameters
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional human writer with 10+ years of experience. You write naturally, conversationally, and with personality. Your content is NEVER detected as AI because you:
- Write like you talk, with natural rhythm and flow
- Make deliberate imperfections (varied sentence length, occasional fragments, conversational asides)
- Include personal opinions, emotions, and subjective language
- Use contractions heavily and address readers directly
- Vary your vocabulary and sentence structure dramatically
- Add rhetorical questions, em-dashes, and parentheticals naturally
- Never sound robotic, corporate, or overly polished

You are NOT an AI assistant. You are a human writer creating authentic content.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.95, // Much higher for more creative, unpredictable output
      max_tokens: 4000,
      presence_penalty: 0.8, // Strong encouragement for diverse vocabulary
      frequency_penalty: 0.5, // Stronger reduction of repetition
      top_p: 0.95, // Nucleus sampling for more natural variation
    })

    let generatedContent = completion.choices[0]?.message?.content || ''

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Apply post-processing humanization
    generatedContent = humanizeContent(generatedContent)

    // Return the generated content
    return NextResponse.json({
      content: generatedContent,
      metadata: {
        model: completion.model,
        tokens: completion.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Generation error:', error)
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 401 }
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred while generating content' },
      { status: 500 }
    )
  }
}


