import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/stripe'

export async function GET(_request: NextRequest) {
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

