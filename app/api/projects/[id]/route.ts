import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, logUsage } from '@/lib/supabase'

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * GET - Fetch a single project
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
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      if (error.code === '23505') {
        return NextResponse.json({ error: 'A project with this name already exists' }, { status: 409 })
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project: data })

  } catch (error: unknown) {
    console.error('Project GET error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while fetching the project'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a project
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

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.user_id
    delete updates.created_at
    delete updates.project_id

    if (updates.name) {
      updates.slug = createSlug(updates.slug || updates.name)
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ project: data })

  } catch (error: unknown) {
    console.error('Project PATCH error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while updating the project'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a project
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
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log usage
    await logUsage(session.user.id, 'project_deleted', 0)

    return NextResponse.json({ message: 'Project deleted successfully' })

  } catch (error: unknown) {
    console.error('Project DELETE error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while deleting the project'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

