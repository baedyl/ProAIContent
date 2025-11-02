import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, logUsage } from '@/lib/supabase'

/**
 * GET - Fetch content items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || searchParams.get('project_id')
    const status = searchParams.get('status')
    const contentType = searchParams.get('contentType')
    const searchTerm = searchParams.get('search')

    let query = supabaseAdmin
      .from('project_contents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType)
    }

    if (searchTerm) {
      const wildcard = `%${searchTerm}%`
      query = query.or(`title.ilike.${wildcard},keywords.ilike.${wildcard}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching project contents:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contents: data || [] })
  } catch (error: any) {
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
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      projectId,
      title,
      contentType,
      content,
      status = 'draft',
      isPublished = false,
      keywords,
      metadata,
    } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const payload = {
      project_id: projectId,
      user_id: session.user.id,
      title,
      content_type: contentType || 'article',
      status,
      is_published: Boolean(isPublished),
      published_at: isPublished ? new Date().toISOString() : null,
      content,
      keywords: keywords || null,
      metadata: metadata || {},
    }

    const { data, error } = await supabaseAdmin
      .from('project_contents')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating project content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logUsage(session.user.id, 'content_created', 0)

    return NextResponse.json({ content: data })
  } catch (error: any) {
    console.error('Contents POST error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the content item' },
      { status: 500 }
    )
  }
}


