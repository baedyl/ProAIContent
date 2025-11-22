import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const monthStart = getMonthStart(now)

    const [
      totalUsageResponse,
      monthlyUsageResponse,
      totalContentResponse,
      monthlyContentResponse,
    ] = await Promise.all([
      supabaseAdmin
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'usage'),
      supabaseAdmin
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'usage')
        .gte('created_at', monthStart),
      supabaseAdmin
        .from('generated_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null),
      supabaseAdmin
        .from('generated_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('created_at', monthStart),
    ])

    // Sum up all usage transactions (they are negative, so we take absolute value)
    const totalUsageRecords = (totalUsageResponse.data || []) as Array<{ amount?: number }>
    const monthlyUsageRecords = (monthlyUsageResponse.data || []) as Array<{ amount?: number }>

    const totalUsage = Math.abs(
      totalUsageRecords.reduce((sum, txn) => sum + (txn.amount || 0), 0)
    )
    const usageThisMonth = Math.abs(
      monthlyUsageRecords.reduce((sum, txn) => sum + (txn.amount || 0), 0)
    )
    const totalContents = totalContentResponse.count ?? 0
    const contentsThisMonth = monthlyContentResponse.count ?? 0

    const assumedHumanWriterRate = 0.08 // $0.08 per word baseline
    const moneySaved = totalUsage * assumedHumanWriterRate

    return NextResponse.json({
      totalCreditsUsed: totalUsage,
      creditsUsedThisMonth: usageThisMonth,
      totalContentsGenerated: totalContents,
      contentsGeneratedThisMonth: contentsThisMonth,
      estimatedMoneySaved: moneySaved,
      assumptions: {
        humanWriterRatePerWord: assumedHumanWriterRate,
      },
    })
  } catch (error: unknown) {
    console.error('Credits summary error:', error)
    const message = error instanceof Error ? error.message : 'Unable to fetch credits summary'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

