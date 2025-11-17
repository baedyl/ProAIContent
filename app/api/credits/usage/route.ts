import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getCreditUsageTimeline } from '@/lib/supabase'

const querySchema = z.object({
  days: z
    .string()
    .optional()
    .transform(value => (value ? Math.max(1, Math.min(180, parseInt(value, 10))) : 30)),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = await getCreditUsageTimeline(session.user.id, parsed.data.days)

    return NextResponse.json({
      usage: data,
      days: parsed.data.days,
    })
  } catch (error: unknown) {
    console.error('Credits usage error:', error)
    const message = error instanceof Error ? error.message : 'Unable to fetch credit usage chart data'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

