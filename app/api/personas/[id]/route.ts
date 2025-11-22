import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const updatePersonaSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  avatar: z.string().trim().optional(),
  style: z.string().trim().min(10).optional(),
  description: z.string().trim().optional(),
  is_default: z.boolean().optional(),
})

/**
 * GET - Fetch a single persona
 */

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching persona:', error)
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    return NextResponse.json({ persona: data })
  } catch (error: unknown) {
    console.error('Persona GET error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the persona' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a persona
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updatePersonaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updates = parsed.data

    // If this is set as default, unset all other defaults first
    if (updates.is_default) {
      await supabaseAdmin
        .from('personas')
        .update({ is_default: false } as never)
        .eq('user_id', session.user.id)
        .neq('id', params.id)
    }

    const { data, error } = await supabaseAdmin
      .from('personas')
      .update(
        {
          ...updates,
          updated_at: new Date().toISOString(),
        } as never
      )
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating persona:', error)
      throw error
    }

    return NextResponse.json({ persona: data })
  } catch (error: unknown) {
    console.error('Persona PATCH error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating the persona' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Soft delete a persona
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('personas')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting persona:', error)
      throw error
    }

    return NextResponse.json({ message: 'Persona deleted successfully' })
  } catch (error: unknown) {
    console.error('Persona DELETE error:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting the persona' },
      { status: 500 }
    )
  }
}

