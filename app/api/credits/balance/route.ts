import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, getUserCreditBalance } from '@/lib/supabase'

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Access user ID from session
    const userId = session.user.id

    if (!userId) {
      console.error('No user ID in session:', session.user)
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 })
    }

    const [profile, balance] = await Promise.all([
      getUserProfile(userId),
      getUserCreditBalance(userId),
    ])

    return NextResponse.json({
      balance,
      trialCreditsGiven: profile?.trial_credits_given ?? false,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
    })
  } catch (error: unknown) {
    console.error('Credits balance error:', error)
    const message = error instanceof Error ? error.message : 'Unable to fetch credit balance'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

