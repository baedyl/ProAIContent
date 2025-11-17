import { NextRequest, NextResponse } from 'next/server'
import { searchYouTubeVideo } from '@/lib/serp-analysis'
import { 
  ContentOrchestrator,
  type ContentGenerationRequest,
} from '@/lib/content-agents'

function hasStatusCode(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  )
}

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

    // Convert length string to target word count
    const lengthToWordCount: Record<string, number> = {
      'short': 700,
      'medium': 1200,
      'long': 2000,
      'extra-long': 3000
    }
    const targetWordCount = lengthToWordCount[data.length] || 1200

    console.log(`\n🚀 Starting Agent-Based Content Generation`)
    console.log(`   Topic: "${data.topic}"`)
    console.log(`   Target: ${targetWordCount} words`)
    console.log(`   Type: ${data.contentType}`)
    
    // Build content generation request
    const contentRequest: ContentGenerationRequest = {
      topic: data.topic,
      keywords: data.keywords,
      contentType: data.contentType,
      tone: data.tone,
      style: data.style,
      targetWordCount,
      targetAudience: data.targetAudience,
      additionalInstructions: data.additionalInstructions,
      personaId: data.personaId,
      location: data.location || 'us'
    }

    // Initialize orchestrator and generate content
    const orchestrator = new ContentOrchestrator()
    const result = await orchestrator.generateContent(contentRequest)

    // Add video if requested
    let videoEmbed = ''
    if (data.includeVideo) {
      try {
        console.log('\n🎥 Searching for YouTube video...')
        const video = await searchYouTubeVideo(data.topic)
        if (video) {
          videoEmbed = `\n\n<div class="video-container">\n${video}\n</div>\n\n`
        }
      } catch (error) {
        console.error('Video search error:', error)
        // Continue without video
      }
    }

    // Combine content
    let finalContent = result.content

    // Insert video after 3rd H2 if available
    if (videoEmbed && finalContent.includes('## ')) {
      const h2Matches = Array.from(finalContent.matchAll(/## /g))
      if (h2Matches.length >= 3) {
        const insertIndex = h2Matches[2].index || 0
        finalContent = finalContent.slice(0, insertIndex) + videoEmbed + finalContent.slice(insertIndex)
      } else {
        finalContent += videoEmbed
      }
    }

    // Append FAQ at the end
    if (result.faqHtml) {
      finalContent += '\n\n' + result.faqHtml
    }

    // Calculate word count
    const wordCount = finalContent.split(/\s+/).length

    console.log(`\n✅ Content Generation Complete!`)
    console.log(`   Final word count: ${wordCount}`)
    console.log(`   Target achieved: ${Math.abs(wordCount - targetWordCount) <= targetWordCount * 0.1 ? '✓' : '✗'}`)

    // Return enhanced response
    return NextResponse.json({
      content: finalContent,
      metadata: {
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        timestamp: new Date().toISOString(),
        wordCount,
        targetWordCount,
        serpAnalysis: result.serpData ? {
          analyzed: true,
          topResults: result.serpData.topResults.length,
          peopleAlsoAsk: result.serpData.peopleAlsoAsk.length,
          relatedSearches: result.serpData.relatedSearches.length,
          avgCompetitorWordCount: result.serpData.avgWordCount,
          recommendations: result.serpData.recommendations
        } : null,
        faqGenerated: result.faqHtml.length > 0,
        videoIncluded: videoEmbed.length > 0,
        personaUsed: data.personaId || null,
        analytics: result.analytics
      }
    })

  } catch (error: unknown) {
    console.error('Generation error:', error)
    
    if (hasStatusCode(error) && error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your configuration.' },
        { status: 401 }
      )
    }
    
    if (hasStatusCode(error) && error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const message = error instanceof Error ? error.message : 'An error occurred while generating content'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

