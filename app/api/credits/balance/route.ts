import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserProfile, getUserCreditBalance } from '@/lib/supabase'

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profile, balance] = await Promise.all([
      getUserProfile(session.user.id),
      getUserCreditBalance(session.user.id),
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

