import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchYouTubeVideo } from '@/lib/serp-analysis'
import { 
  ContentOrchestrator,
  type ContentGenerationRequest,
} from '@/lib/content-agents'
import {
  adjustUserCredits,
  getUserCreditBalance,
  recordGeneratedContent,
  type CreditTransactionRecord,
} from '@/lib/supabase'

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
  title?: string
  topic: string
  keywords: string
  tone: string
  style: string
  length: string
  targetAudience: string
  additionalInstructions: string
  // Advanced options - personaId is now REQUIRED
  personaId: string  // REQUIRED for human-like content
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: AdvancedGenerateRequest = await request.json()

    if (!data.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    // Enforce persona requirement for human-like content
    if (!data.personaId) {
      return NextResponse.json(
        {
          error: 'Persona selection is required',
          message: 'Please select a writing persona to ensure human-like, authentic content that passes AI detection.',
          suggestions: [
            'Choose a persona that matches your content type and audience',
            'Personas help prevent hallucinations and improve content authenticity',
            'Browse available personas in the Personas Manager'
          ]
        },
        { status: 400 }
      )
    }

    // Check user credits
    const currentBalance = await getUserCreditBalance(session.user.id)
    
    // Calculate credits needed (1 base + 0.5 for each advanced feature)
    let creditsNeeded = 1 // Base cost
    if (data.includeFAQ) creditsNeeded += 0.5
    if (data.includeVideo) creditsNeeded += 0.5
    if (data.useSerpAnalysis) creditsNeeded += 0.5
    if (data.includeCompetitorHeaders) creditsNeeded += 0.5

    if (currentBalance < creditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits. Please top up your balance.',
          currentBalance,
          requiredCredits: creditsNeeded,
          message: `You need ${creditsNeeded} credits to generate this content with advanced features.`,
        },
        { status: 402 }
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
      location: data.location || 'us',
      includeFAQ: data.includeFAQ ?? false,
      includeCompetitorHeaders: data.includeCompetitorHeaders ?? false,
      useSerpAnalysis: data.useSerpAnalysis ?? false
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

    // Calculate credits to deduct
    let creditsToDeduct = 1 // Base cost
    if (data.includeFAQ && result.faqHtml) creditsToDeduct += 0.5
    if (data.includeVideo) creditsToDeduct += 0.5
    if (data.useSerpAnalysis) creditsToDeduct += 0.5
    if (data.includeCompetitorHeaders) creditsToDeduct += 0.5

    // Deduct credits and record the transaction
    let transaction: CreditTransactionRecord | null = null
    try {
      transaction = await adjustUserCredits({
        userId: session.user.id,
        amount: -creditsToDeduct,
        type: 'usage',
        description: `Advanced content generation: ${data.topic}`,
        metadata: JSON.parse(JSON.stringify({
          advancedFeatures: {
            faq: Boolean(data.includeFAQ && result.faqHtml),
            video: Boolean(data.includeVideo),
            serpAnalysis: Boolean(data.useSerpAnalysis),
            competitorHeaders: Boolean(data.includeCompetitorHeaders)
          },
          wordCount,
          targetWordCount
        })),
      })

      // Record the generated content
      await recordGeneratedContent({
        userId: session.user.id,
        title: data.topic,
        content: finalContent,
        wordCount,
        creditsUsed: creditsToDeduct,
        requestedLength: targetWordCount,
        settings: JSON.parse(JSON.stringify({
          contentType: data.contentType,
          tone: data.tone,
          style: data.style,
          targetAudience: data.targetAudience,
          additionalInstructions: data.additionalInstructions,
          personaId: data.personaId,
          location: data.location,
          advancedFeatures: {
            includeFAQ: Boolean(data.includeFAQ),
            includeVideo: Boolean(data.includeVideo),
            useSerpAnalysis: Boolean(data.useSerpAnalysis),
            includeCompetitorHeaders: Boolean(data.includeCompetitorHeaders)
          }
        })),
        status: 'completed'
      })

    } catch (error) {
      console.error('Error processing credit deduction:', error)
      // Don't fail the request if credit processing fails
    }

    const remainingCredits = transaction?.balance_after ?? currentBalance

    // Return enhanced response
    return NextResponse.json({
      content: finalContent,
      creditsDeducted: creditsToDeduct,
      remainingCredits,
      metadata: {
        model: process.env.OPENAI_MODEL || 'gpt-4o',
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
        personaUsed: data.personaId,
        personaEnforced: true,
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

