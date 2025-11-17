import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import OpenAI from 'openai'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const enrichStyleSchema = z.object({
  style: z.string().trim().min(10),
})

/**
 * POST - Enrich a writing style description to make it more detailed and unique
 */
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const parsed = enrichStyleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { style } = parsed.data

    const prompt = `You are a writing style expert. Take the following writing style description and enrich it to make it more detailed, specific, and unique. Add concrete details about:
- Sentence structure and length patterns
- Vocabulary choices and word preferences
- Tone and emotional quality
- Specific literary techniques or devices
- Unique characteristics that distinguish this style

Original style description:
${style}

Generate an enriched version that is 2-3x more detailed and specific. Focus on making it actionable for someone trying to mimic this style. Output only the enriched description without any meta-commentary.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in literary analysis and writing styles. You can identify and articulate the nuances of any writing style.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const enrichedStyle = completion.choices[0]?.message?.content?.trim() || ''

    if (!enrichedStyle) {
      return NextResponse.json(
        { error: 'Failed to enrich style description' },
        { status: 500 }
      )
    }

    return NextResponse.json({ enrichedStyle })
  } catch (error: unknown) {
    console.error('Enrich style error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while enriching the style'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

