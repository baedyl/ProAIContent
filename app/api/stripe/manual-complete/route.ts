import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  adjustUserCredits,
  getPurchaseByStripeSessionId,
  updatePurchaseById,
} from '@/lib/supabase'

/**
 * Manual Purchase Completion Endpoint
 * FOR DEVELOPMENT ONLY - Manually completes pending purchases
 * 
 * This endpoint is useful when testing locally without Stripe CLI,
 * as webhooks won't reach localhost automatically.
 * 
 * In production, this should be removed or heavily restricted.
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Find the purchase
    const purchase = await getPurchaseByStripeSessionId(sessionId)

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify the purchase belongs to the current user
    if (purchase.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Purchase belongs to another user' },
        { status: 403 }
      )
    }

    // Check if already completed
    if (purchase.status === 'paid') {
      return NextResponse.json({
        message: 'Purchase already completed',
        purchase,
      })
    }

    // Add credits to user account
  const metadata = purchase.metadata as Record<string, unknown> | undefined
  const packageId = metadata?.packageId
  const transaction = await adjustUserCredits({
      userId: purchase.user_id,
      amount: purchase.credits_purchased,
      type: 'purchase',
      description: `${purchase.credits_purchased.toLocaleString()} credit purchase (manual completion)`,
      metadata: {
        checkoutSessionId: sessionId,
        packageId: typeof packageId === 'string' ? packageId : null,
        manualCompletion: true,
      },
    })

    // Update purchase status
    const existingMetadata = (purchase.metadata && typeof purchase.metadata === 'object' && !Array.isArray(purchase.metadata))
      ? purchase.metadata as Record<string, unknown>
      : {}
    await updatePurchaseById(purchase.id, {
      status: 'paid',
      metadata: {
        ...existingMetadata,
        transactionId: transaction.id,
        manualCompletion: true,
        completedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      message: 'Purchase completed successfully',
      creditsAdded: purchase.credits_purchased,
      transactionId: transaction.id,
      purchase: {
        id: purchase.id,
        status: 'paid',
        credits: purchase.credits_purchased,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to complete purchase'
    console.error('Manual completion error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

