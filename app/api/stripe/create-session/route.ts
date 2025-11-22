import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import {
  createPurchaseRecord,
  setStripeCustomerId,
  ensureUserProfile,
} from '@/lib/supabase'
import { CREDIT_PACKAGES, findCreditPackage, stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

const createSessionSchema = z.object({
  packageId: z.string().trim(),
})

// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const selectedPackage = findCreditPackage(parsed.data.packageId)

    if (!selectedPackage) {
      return NextResponse.json({ error: 'Unknown credit package' }, { status: 404 })
    }

    // Ensure user profile exists
    const profile = await ensureUserProfile(
      session.user.id,
      session.user.email || session.user.name || session.user.id
    )
    
    let stripeCustomerId = profile?.stripe_customer_id || undefined

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          userId: session.user.id,
        },
      })

      stripeCustomerId = customer.id
      await setStripeCustomerId(session.user.id, stripeCustomerId)
    }

    const purchaseId = randomUUID()

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: selectedPackage.amountCents,
            product_data: {
              name: `${selectedPackage.name} Credits`,
              description: `${selectedPackage.credits.toLocaleString()} AI credits`,
            },
          },
        },
      ],
      success_url: `${APP_URL}/buy-credits?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/buy-credits?checkout=cancel`,
      metadata: {
        userId: session.user.id,
        packageId: selectedPackage.id,
        purchaseId,
      },
      payment_intent_data: {
        metadata: {
          purchaseId,
        },
      },
    })

    await createPurchaseRecord({
      id: purchaseId,
      userId: session.user.id,
      stripeSessionId: checkoutSession.id,
      amountCents: selectedPackage.amountCents,
      creditsPurchased: selectedPackage.credits,
      metadata: {
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
      },
    })

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      packages: CREDIT_PACKAGES,
    })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to create Stripe checkout session'
      console.error('Stripe create-session error:', message)
      return NextResponse.json(
        { error: message },
        { status: 500 }
      )
  }
}

