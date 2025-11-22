import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import {
  adjustUserCredits,
  getPurchaseByStripeSessionId,
  setStripeCustomerId,
  updatePurchaseById,
} from '@/lib/supabase'

const confirmSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
})

function safeMetadata(metadata: unknown) {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }
  return {}
}

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (await getServerSession(authOptions as any)) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = confirmSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { sessionId } = parsed.data

    const purchase = await getPurchaseByStripeSessionId(sessionId)

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found for this session' },
        { status: 404 }
      )
    }

    if (purchase.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'This purchase belongs to another user' },
        { status: 403 }
      )
    }

    if (purchase.status === 'paid') {
      return NextResponse.json({
        message: 'Purchase already completed',
        creditsAdded: purchase.credits_purchased,
        purchaseId: purchase.id,
      })
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    })

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment is not complete yet' },
        { status: 409 }
      )
    }

    const paymentIntentId =
      typeof checkoutSession.payment_intent === 'string'
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id ?? null

    if (typeof checkoutSession.customer === 'string') {
      await setStripeCustomerId(session.user.id, checkoutSession.customer)
    }

    const metadata = safeMetadata(purchase.metadata)
    const packageId =
      typeof checkoutSession.metadata?.packageId === 'string'
        ? checkoutSession.metadata?.packageId
        : (metadata.packageId as string | undefined) ?? null

    const transaction = await adjustUserCredits({
      userId: session.user.id,
      amount: purchase.credits_purchased,
      type: 'purchase',
      description: `${purchase.credits_purchased.toLocaleString()} credit purchase`,
      stripePaymentId: paymentIntentId ?? undefined,
      metadata: {
        checkoutSessionId: sessionId,
        packageId,
        confirmedBy: 'client',
      },
    })

    await updatePurchaseById(purchase.id, {
      status: 'paid',
      stripe_payment_id: paymentIntentId ?? null,
      metadata: {
        ...metadata,
        transactionId: transaction.id,
        checkoutSessionId: sessionId,
        packageId,
        confirmedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      message: 'Credits added successfully',
      creditsAdded: purchase.credits_purchased,
      balanceTransactionId: transaction.id,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to confirm purchase'
    console.error('Stripe confirmation error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}


