import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import OpenAI from 'openai'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const testStyleSchema = z.object({
  style: z.string().trim().min(10),
  name: z.string().trim().default('this persona'),
})

/**
 * POST - Test a persona's writing style by generating sample text
 */

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'
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
    const parsed = testStyleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { style, name } = parsed.data

    const prompt = `You are a writing style expert. Based on the following writing style description, generate 2-3 sample paragraphs (about 150-200 words total) that demonstrate this exact writing style.

Writing Style Description:
${style}

Generate sample text that clearly demonstrates ${name}'s unique writing characteristics. The content should be about "the importance of creativity in modern life" but written entirely in the style described above.

Important: Only output the sample paragraphs. Do not include any meta-commentary, explanations, or labels.`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a master of literary styles and can write in any author\'s voice perfectly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const sample = completion.choices[0]?.message?.content?.trim() || ''

    if (!sample) {
      return NextResponse.json(
        { error: 'Failed to generate sample text' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sample })
  } catch (error: unknown) {
    console.error('Test style error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while testing the style'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

