import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
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
 * GET - Fetch all projects for the authenticated user
 */
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null
    
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

  } catch (error: unknown) {
    console.error('Projects GET error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while fetching projects'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name = body.name?.trim()

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const slug = body.slug ? createSlug(body.slug) : createSlug(name)

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(
        {
          user_id: session.user.id,
          name,
          slug,
          site_url: body.siteUrl || null,
          persona: body.persona || null,
          status: body.status || 'active',
          brief: body.brief || null,
          metadata: body.metadata || {},
        } as never
      )
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        )
      }

      console.error('Error creating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log usage
    await logUsage(session.user.id, 'project_created', 0)

    return NextResponse.json({ project: data })

  } catch (error: unknown) {
    console.error('Projects POST error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred while creating the project'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

