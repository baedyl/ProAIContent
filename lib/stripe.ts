import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
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
    amountCents: 1000, // $10.00 (20 credits × $0.50)
    credits: 20, // 20 credits (20 articles)
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal for growing teams with consistent content needs',
    amountCents: 2500, // $25.00 (50 credits × $0.50)
    credits: 50, // 50 credits (50 articles)
  },
  {
    id: 'business',
    name: 'Business',
    description: 'High volume bundle engineered for agencies and batch workflows',
    amountCents: 5000, // $50.00 (100 credits × $0.50)
    credits: 100, // 100 credits (100 articles)
  },
]

export function findCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
}

