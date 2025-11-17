import { NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/stripe'

export async function GET() {
  return NextResponse.json({
    packages: CREDIT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      amountCents: pkg.amountCents,
      credits: pkg.credits,
    })),
  })
}

