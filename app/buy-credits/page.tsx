'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { FiCheckCircle, FiShoppingCart } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to load data')
  }
  return res.json()
}

interface CreditPackage {
  id: string
  name: string
  description: string
  amountCents: number
  credits: number
}

interface PurchaseRecord {
  id: string
  status: 'paid' | 'failed' | string
  created_at: string
  amount_cents: number
  credits_purchased: number
  metadata?: {
    packageName?: string
  }
}

export default function BuyCreditsPage() {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const { data: packagesData, isLoading: packagesLoading } = useSWR('/api/credits/packages', fetcher)
  const { data: balanceData } = useSWR('/api/credits/balance', fetcher)
  const { data: purchasesData, isLoading: purchasesLoading } = useSWR('/api/purchases?limit=10', fetcher)

  const packages: CreditPackage[] = packagesData?.packages ?? []
  const balance = balanceData?.balance ?? 0
  const purchases: PurchaseRecord[] = purchasesData?.purchases ?? []

  const handleCheckout = async (packageId: string) => {
    setIsProcessing(packageId)
    try {
      const res = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error || 'Unable to start checkout')
      }

      const payload = await res.json()
      if (payload.url) {
        window.location.href = payload.url
      } else {
        toast.error('Stripe session did not return a redirect URL')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout'
      toast.error(message)
    } finally {
      setIsProcessing(null)
    }
  }

  return (
    <div className="px-4 py-6 lg:px-8 relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900">Processing Payment</h3>
                <p className="text-sm text-slate-500 mt-2">Redirecting you to secure checkout...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Billing</p>
          <h1 className="text-3xl font-semibold text-slate-900">Scale with flexible credit bundles</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Choose the package that fits your publishing cadence. Credits never expire and apply instantly after purchase.
          </p>
        </section>

        <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current balance</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{balance.toLocaleString()} credits</p>
          <p className="mt-1 text-sm text-slate-500">Top up at any time to keep your automations flowing.</p>
        </section>

        <section>
          {packagesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-64 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {packages.map(pkg => (
                <PackageCard
                  key={pkg.id}
                  name={pkg.name}
                  description={pkg.description}
                  credits={pkg.credits}
                  amountCents={pkg.amountCents}
                  onSelect={() => handleCheckout(pkg.id)}
                  isProcessing={isProcessing === pkg.id}
                  isPopular={pkg.id === 'pro'}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Recent purchases</h2>
          {purchasesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-slate-500">No purchases yet. Your history will appear here after checkout.</p>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(purchase => (
                    <tr key={purchase.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {purchase.metadata?.packageName || 'Credit purchase'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {purchase.credits_purchased.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        ${(purchase.amount_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            purchase.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : purchase.status === 'failed'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {format(parseISO(purchase.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

interface PackageCardProps {
  name: string
  description: string
  credits: number
  amountCents: number
  onSelect: () => void
  isProcessing: boolean
  isPopular?: boolean
}

function PackageCard({ name, description, credits, amountCents, onSelect, isProcessing, isPopular }: PackageCardProps) {
  return (
    <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-md hover:ring-indigo-100">
      {isPopular && (
        <span className="absolute right-4 top-4 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          Most popular
        </span>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-indigo-500" /> {credits.toLocaleString()} credits
        </div>
        <div className="flex items-center gap-2">
          <FiCheckCircle className="text-indigo-500" /> Instant top-up after payment
        </div>
      </div>
      <div className="mt-auto space-y-3 pt-6">
        <p className="text-3xl font-semibold text-slate-900">${(amountCents / 100).toFixed(2)}</p>
        <button
          onClick={onSelect}
          disabled={isProcessing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiShoppingCart />
          {isProcessing ? 'Redirecting…' : 'Buy credits'}
        </button>
      </div>
    </div>
  )
}
