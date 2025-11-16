import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getPurchaseHistory } from '@/lib/supabase'

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(value => (value ? Math.max(1, Math.min(50, parseInt(value, 10))) : 20)),
  cursor: z.string().optional(),
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

    const { limit, cursor } = parsed.data
    const result = await getPurchaseHistory(session.user.id, { limit, cursor })

    return NextResponse.json({
      purchases: result.items,
      nextCursor: result.nextCursor,
      limit,
    })
  } catch (error: any) {
    console.error('Purchases history error:', error)
    return NextResponse.json(
      { error: error?.message || 'Unable to fetch purchase history' },
      { status: 500 }
    )
  }
}

