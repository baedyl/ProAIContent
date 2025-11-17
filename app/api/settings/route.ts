import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserSettings, createDefaultUserSettings, updateUserSettings } from '@/lib/supabase'

/**
 * GET - Fetch user settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await getUserSettings(session.user.id)

    // Create default settings if they don't exist
    if (!settings) {
      settings = await createDefaultUserSettings(session.user.id)
    }

    return NextResponse.json({ settings })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred while fetching settings'
    console.error('Settings GET error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = (await request.json()) as Record<string, unknown>

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.user_id
    delete updates.created_at

    const settings = await updateUserSettings(session.user.id, updates)

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred while updating settings'
    console.error('Settings PATCH error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

