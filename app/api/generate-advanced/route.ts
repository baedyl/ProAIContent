import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPersona, buildPersonaPrompt } from '@/lib/personas'
import { analyzeSERP, extractCompetitorHeaders, buildSerpEnhancedPrompt, searchYouTubeVideo } from '@/lib/serp-analysis'
import { generateFAQPrompt, parseFAQResponse, generateFAQHTML, getFAQStyles } from '@/lib/faq-generator'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface AdvancedGenerateRequest {
  contentType: string
  topic: string
  keywords: string
  tone: string
  style: string
  length: string
  targetAudience: string
  additionalInstructions: string
  // Advanced options
  personaId?: string
  useSerpAnalysis?: boolean
  includeCompetitorHeaders?: boolean
  includeFAQ?: boolean
  includeVideo?: boolean
  location?: string
}

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

function buildAdvancedPrompt(data: AdvancedGenerateRequest, serpData?: any, competitorHeaders?: string[]): string {
  const lengthGuide = lengthGuides[data.length] || '800-1500 words'
  
  // Get persona if specified
  const persona = data.personaId ? getPersona(data.personaId) : null
  const personaPrompt = persona ? buildPersonaPrompt(persona) : ''
  
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

  let basePrompt = `
You are an expert content writer creating UNIQUE, SEO-OPTIMIZED, and HUMANIZED content that passes AI detection tests.

${personaPrompt ? `\n${personaPrompt}\n` : ''}

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

  // Enhance with SERP data if available
  if (serpData && competitorHeaders) {
    basePrompt = buildSerpEnhancedPrompt(basePrompt, serpData, competitorHeaders)
  }

  return basePrompt
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      )
    }

    const data: AdvancedGenerateRequest = await request.json()

    if (!data.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    let serpData = null
    let competitorHeaders: string[] = []
    let faqHTML = ''
    let videoEmbed = ''

    // SERP Analysis if requested
    if (data.useSerpAnalysis && process.env.SERPAPI_KEY) {
      try {
        console.log('Performing SERP analysis...')
        serpData = await analyzeSERP(data.topic, data.location || 'us')
        
        // Extract competitor headers if requested
        if (data.includeCompetitorHeaders && serpData.topResults.length > 0) {
          console.log('Extracting competitor headers...')
          const urls = serpData.topResults.map(r => r.link)
          competitorHeaders = await extractCompetitorHeaders(urls, 5)
        }
      } catch (error) {
        console.error('SERP analysis error:', error)
        // Continue without SERP data
      }
    }

    // Build the main content prompt
    const prompt = buildAdvancedPrompt(data, serpData, competitorHeaders)

    // Generate main content
    console.log('Generating main content...')
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
      temperature: 0.8,
      max_tokens: 4000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    })

    let generatedContent = completion.choices[0]?.message?.content || ''

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Generate FAQ if requested and we have PAA questions
    if (data.includeFAQ && serpData && serpData.peopleAlsoAsk.length > 0) {
      try {
        console.log('Generating FAQ...')
        const faqPrompt = generateFAQPrompt(serpData.peopleAlsoAsk, data.topic)
        
        const faqCompletion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at answering questions clearly and concisely.'
            },
            {
              role: 'user',
              content: faqPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })

        const faqResponse = faqCompletion.choices[0]?.message?.content || ''
        const faqs = parseFAQResponse(faqResponse)
        
        if (faqs.length > 0) {
          const faqData = generateFAQHTML(faqs)
          faqHTML = getFAQStyles() + '\n' + faqData.html
        }
      } catch (error) {
        console.error('FAQ generation error:', error)
        // Continue without FAQ
      }
    }

    // Search for YouTube video if requested
    if (data.includeVideo) {
      try {
        console.log('Searching for YouTube video...')
        const video = await searchYouTubeVideo(data.topic)
        if (video) {
          videoEmbed = `\n\n<div class="video-container">\n${video}\n</div>\n\n`
        }
      } catch (error) {
        console.error('Video search error:', error)
        // Continue without video
      }
    }

    // Combine all content
    let finalContent = generatedContent

    // Insert video after 3rd H2 if available
    if (videoEmbed && finalContent.includes('## ')) {
      const h2Matches = [...finalContent.matchAll(/## /g)]
      if (h2Matches.length >= 3) {
        const insertIndex = h2Matches[2].index || 0
        finalContent = finalContent.slice(0, insertIndex) + videoEmbed + finalContent.slice(insertIndex)
      } else {
        // Append at the end if not enough H2s
        finalContent += videoEmbed
      }
    }

    // Append FAQ at the end
    if (faqHTML) {
      finalContent += '\n\n' + faqHTML
    }

    // Return enhanced response
    return NextResponse.json({
      content: finalContent,
      metadata: {
        model: completion.model,
        tokens: completion.usage?.total_tokens || 0,
        timestamp: new Date().toISOString(),
        serpAnalysis: serpData ? {
          analyzed: true,
          totalResults: serpData.totalResults,
          competitorHeadersFound: competitorHeaders.length,
          relatedQuestionsFound: serpData.peopleAlsoAsk.length
        } : null,
        faqGenerated: faqHTML.length > 0,
        videoIncluded: videoEmbed.length > 0,
        personaUsed: data.personaId || null
      }
    })

  } catch (error: any) {
    console.error('Generation error:', error)
    
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

