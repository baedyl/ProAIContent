import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, createDefaultUserSettings } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    console.log('Signup attempt for:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if service role key is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
      return NextResponse.json(
        { error: 'Server configuration error - missing service role key' },
        { status: 500 }
      )
    }

    console.log('Creating user in Supabase...')

    // Create user in Supabase
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for POC
      user_metadata: {
        name: name || email.split('@')[0],
      }
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('User created successfully:', data.user.id)

    if (data.user) {
      // Create default user settings
      await createDefaultUserSettings(data.user.id)
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during signup' },
      { status: 500 }
    )
  }
}

