import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getGeneratedContentById,
  updateGeneratedContentRecord,
  softDeleteGeneratedContent,
} from '@/lib/supabase'

const MIN_WORD_COUNT = 50

function countWords(content: string): number {
  return content
    .replace(/[#*_`>\\-]/g, ' ')
    .trim()
    .split(/\\s+/)
    .filter(Boolean).length
}

/**
 * GET - Fetch a single content item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content = await getGeneratedContentById(session.user.id, params.id)

    if (!content || content.deleted_at) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Content GET error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the content item' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a content item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const payload: Record<string, any> = {}

    if (typeof body.title === 'string') {
      payload.title = body.title.trim()
    }

    if (typeof body.content === 'string') {
      payload.content = body.content
      payload.word_count = countWords(body.content)
    }

    if (typeof body.requested_length === 'number') {
      payload.requested_length = Math.max(body.requested_length, MIN_WORD_COUNT)
    }

    if (body.settings) {
      payload.settings = body.settings
    }

    // Support assigning/removing from project
    if (body.project_id !== undefined) {
      // null or empty string removes from project, otherwise assigns to project
      payload.project_id = body.project_id || null
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    const updated = await updateGeneratedContentRecord(session.user.id, params.id, payload)

    return NextResponse.json({ content: updated })
  } catch (error: any) {
    console.error('Content PATCH error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the content item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a content item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await softDeleteGeneratedContent(session.user.id, params.id)

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (error: any) {
    console.error('Content DELETE error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the content item' },
      { status: 500 }
    )
  }
}


