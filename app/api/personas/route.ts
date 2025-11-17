import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const createPersonaSchema = z.object({
  name: z.string().trim().min(2).max(100),
  avatar: z.string().trim().default('avatar-1'),
  style: z.string().trim().min(10),
  description: z.string().trim().optional(),
  is_default: z.boolean().default(false),
})

/**
 * GET - Fetch all personas for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching personas:', error)
      throw error
    }

    return NextResponse.json({ personas: data || [] })
  } catch (error: unknown) {
    console.error('Personas GET error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching personas' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new persona
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createPersonaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // If this is set as default, unset all other defaults first
    if (data.is_default) {
      await supabaseAdmin
        .from('personas')
        .update({ is_default: false } as never)
        .eq('user_id', session.user.id)
    }

    const { data: persona, error } = await supabaseAdmin
      .from('personas')
      .insert(
        {
          user_id: session.user.id,
          name: data.name,
          avatar: data.avatar,
          style: data.style,
          description: data.description,
          is_default: data.is_default,
        } as never
      )
      .select()
      .single()

    if (error) {
      console.error('Error creating persona:', error)
      throw error
    }

    return NextResponse.json({ persona }, { status: 201 })
  } catch (error: unknown) {
    console.error('Personas POST error:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating the persona' },
      { status: 500 }
    )
  }
}

