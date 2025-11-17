import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getCreditTransactions } from '@/lib/supabase'

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(value => (value ? Math.max(1, Math.min(50, parseInt(value, 10))) : 20)),
  cursor: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

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

    const { limit, cursor } = parsed.data

    const result = await getCreditTransactions(session.user.id, {
      limit,
      cursor,
    })

    return NextResponse.json({
      transactions: result.items,
      nextCursor: result.nextCursor,
      limit,
    })
  } catch (error: unknown) {
    console.error('Credits transactions error:', error)
    const message = error instanceof Error ? error.message : 'Unable to fetch credit transactions'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

