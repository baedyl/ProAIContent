import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  listGeneratedContent,
  recordGeneratedContent,
} from '@/lib/supabase'

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'

function countWords(content: string): number {
  return content
    .replace(/[#*_`>\\-]/g, ' ')
    .trim()
    .split(/\\s+/)
    .filter(Boolean).length
}

/**
 * GET - Fetch content items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const cursor = searchParams.get('cursor') || undefined

    const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10))) : 10

    const { items, nextCursor } = await listGeneratedContent(session.user.id, {
      limit,
      cursor,
      search: searchTerm || undefined,
    })

    return NextResponse.json({
      contents: items,
      nextCursor,
      limit,
    })
  } catch (error: unknown) {
    console.error('Contents GET error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching content items' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new content item for a project
 */
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const content = typeof body.content === 'string' ? body.content : ''

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const wordCount = countWords(content)

    const saved = await recordGeneratedContent({
      userId: session.user.id,
      title,
      content,
      wordCount,
      creditsUsed: body.creditsUsed ?? 0,
      requestedLength: body.requestedLength ?? wordCount,
      settings: body.settings ?? {},
      status: body.status ?? 'draft',
      retryCount: body.retryCount ?? 0,
    })

    return NextResponse.json({ content: saved })
  } catch (error: unknown) {
    console.error('Contents POST error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the content item' },
      { status: 500 }
    )
  }
}


