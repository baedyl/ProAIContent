import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import {
  adjustUserCredits,
  getPurchaseById,
  getPurchaseByStripePaymentId,
  getPurchaseByStripeSessionId,
  updatePurchaseById,
  setStripeCustomerId,
} from '@/lib/supabase'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.id) {
    return
  }

  const purchase = await getPurchaseByStripeSessionId(session.id)

  if (!purchase) {
    console.error('Checkout session completed for unknown purchase', session.id)
    return
  }

  if (purchase.status === 'paid') {
    return
  }

  const userId = purchase.user_id
  const creditsPurchased = purchase.credits_purchased
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  if (typeof session.customer === 'string') {
    await setStripeCustomerId(userId, session.customer)
  }

  const transaction = await adjustUserCredits({
    userId,
    amount: creditsPurchased,
    type: 'purchase',
    description: `${creditsPurchased.toLocaleString()} credit purchase`,
    stripePaymentId: paymentIntentId ?? undefined,
    metadata: {
      checkoutSessionId: session.id,
      packageId: session.metadata?.packageId ?? (purchase.metadata as any)?.packageId ?? null,
    },
  })

  await updatePurchaseById(purchase.id, {
    status: 'paid',
    stripe_payment_id: paymentIntentId ?? null,
    metadata: {
      ...(purchase.metadata ?? {}),
      transactionId: transaction.id,
      checkoutSessionId: session.id,
      packageId: session.metadata?.packageId ?? (purchase.metadata as any)?.packageId ?? null,
    },
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id

  let purchase = null

  const purchaseIdFromMetadata = paymentIntent.metadata?.purchaseId

  if (purchaseIdFromMetadata) {
    purchase = await getPurchaseById(purchaseIdFromMetadata)
  }

  if (!purchase) {
    purchase = await getPurchaseByStripePaymentId(paymentIntentId)
  }

  if (!purchase) {
    return
  }

  await updatePurchaseById(purchase.id, {
    status: 'failed',
    metadata: {
      ...(purchase.metadata ?? {}),
      failureReason: paymentIntent.last_payment_error?.message ?? 'unknown_error',
    },
  })
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature header' }, { status: 400 })
  }

  const payload = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        break
    }
  } catch (error) {
    console.error('Stripe webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

