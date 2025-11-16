import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
    const session = await getServerSession(authOptions)

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
    const transaction = await adjustUserCredits({
      userId: purchase.user_id,
      amount: purchase.credits_purchased,
      type: 'purchase',
      description: `${purchase.credits_purchased.toLocaleString()} credit purchase (manual completion)`,
      metadata: {
        checkoutSessionId: sessionId,
        packageId: (purchase.metadata as any)?.packageId ?? null,
        manualCompletion: true,
      },
    })

    // Update purchase status
    await updatePurchaseById(purchase.id, {
      status: 'paid',
      metadata: {
        ...(purchase.metadata ?? {}),
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
  } catch (error: any) {
    console.error('Manual completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete purchase' },
      { status: 500 }
    )
  }
}

