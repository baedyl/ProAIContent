import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, logUsage } from '@/lib/supabase'

/**
 * GET - Fetch all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ projects: data || [] })

  } catch (error: any) {
    console.error('Projects GET error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching projects' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content_type, content, keywords, metadata } = await request.json()

    if (!title || !content_type || !content) {
      return NextResponse.json(
        { error: 'Title, content type, and content are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: session.user.id,
        title,
        content_type,
        content,
        keywords: keywords || null,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log usage
    await logUsage(session.user.id, 'project_created', 0)

    return NextResponse.json({ project: data })

  } catch (error: any) {
    console.error('Projects POST error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the project' },
      { status: 500 }
    )
  }
}

