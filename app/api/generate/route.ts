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

// Content humanization techniques
const humanizationPrompts = `
CRITICAL HUMANIZATION REQUIREMENTS:
1. Use natural, varied sentence structures (mix short, medium, and long sentences)
2. Include occasional informal transitions and conversational elements
3. Add personal insights and relatable examples
4. Use active voice predominantly but mix with passive when natural
5. Include rhetorical questions to engage readers
6. Add subtle imperfections like varied paragraph lengths
7. Use contractions naturally (don't, it's, you're)
8. Include emotional language and personal perspective
9. Vary vocabulary - avoid repetitive word choices
10. Use analogies and metaphors for complex concepts
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

FORMATTING GUIDELINES:
- Use markdown formatting (# for H1, ## for H2, ### for H3)
- Use ** for bold emphasis on important points
- Use bullet points (-) and numbered lists where appropriate
- Keep paragraphs concise (2-4 sentences)
- Add line breaks for readability

QUALITY REQUIREMENTS:
✓ 100% unique and original content
✓ Passes AI detection tests (highly humanized)
✓ SEO optimized with natural keyword integration
✓ Engaging and valuable to readers
✓ Grammatically perfect but conversational
✓ Action-oriented with clear takeaways

Now create the content following ALL requirements above. Make it exceptional, unique, and indistinguishable from human writing.
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

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer who creates unique, SEO-optimized, and highly humanized content that passes AI detection tests. Your writing is indistinguishable from human writing, engaging, and valuable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher temperature for more creative, human-like output
      max_tokens: 4000,
      presence_penalty: 0.6, // Encourage diverse vocabulary
      frequency_penalty: 0.3, // Reduce repetition
    })

    const generatedContent = completion.choices[0]?.message?.content || ''

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

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


