import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, logUsage } from '@/lib/supabase'

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

    const { data, error } = await supabaseAdmin
      .from('project_contents')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ content: data })
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

    const updates = await request.json()

    delete updates.id
    delete updates.user_id
    delete updates.project_id
    delete updates.created_at

    if (updates.is_published && !updates.published_at) {
      updates.published_at = new Date().toISOString()
    }

    if (updates.is_published === false) {
      updates.published_at = null
    }

    const { data, error } = await supabaseAdmin
      .from('project_contents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ content: data })
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

    const { error } = await supabaseAdmin
      .from('project_contents')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logUsage(session.user.id, 'content_deleted', 0)

    return NextResponse.json({ message: 'Content deleted successfully' })
  } catch (error: any) {
    console.error('Content DELETE error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the content item' },
      { status: 500 }
    )
  }
}


