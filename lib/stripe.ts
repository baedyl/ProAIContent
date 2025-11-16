import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
})

export interface CreditPackage {
  id: string
  name: string
  description: string
  amountCents: number
  credits: number
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for testing ideas and small campaigns',
    amountCents: 999,
    credits: 50_000,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal for growing teams with consistent content needs',
    amountCents: 2499,
    credits: 150_000,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'High volume bundle engineered for agencies and batch workflows',
    amountCents: 4999,
    credits: 350_000,
  },
]

export function findCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

