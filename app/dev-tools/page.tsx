'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaCheckCircle, FaExclamationTriangle, FaSync } from 'react-icons/fa'

interface Purchase {
  id: string
  user_id: string
  stripe_session_id: string
  stripe_payment_id: string | null
  amount_cents: number
  credits_purchased: number
  status: string
  created_at: string
  metadata?: Record<string, unknown>
}

export default function DevToolsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState<string | null>(null)

  // Only allow in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      loadPurchases()
    }
  }, [session])

  const loadPurchases = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
      }
    } catch (error: unknown) {
      console.error('Failed to load purchases:', error)
      toast.error('Failed to load purchases')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualComplete = async (sessionId: string) => {
    setIsCompleting(sessionId)
    try {
      const response = await fetch('/api/stripe/manual-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete purchase')
      }

      toast.success(`✅ ${data.creditsAdded.toLocaleString()} credits added!`)
      await loadPurchases()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to complete purchase'
      toast.error(message)
    } finally {
      setIsCompleting(null)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="loading-dots text-indigo-500">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  const pendingPurchases = purchases.filter(p => p.status === 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Development Tools</h1>
          </div>
          <p className="text-slate-500">
            Manual purchase completion for local development (webhooks don&apos;t work on localhost)
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Development Only</h3>
              <p className="text-sm text-yellow-700">
                This page is only available in development mode. In production, Stripe webhooks
                automatically complete purchases. For local testing, use this page or set up the Stripe CLI.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Pending Purchases</h2>
              <p className="text-sm text-slate-500">
                {pendingPurchases.length} purchase{pendingPurchases.length !== 1 ? 's' : ''} waiting for completion
              </p>
            </div>
            <button
              onClick={loadPurchases}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <FaSync className={`inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {pendingPurchases.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-500">No pending purchases</p>
              <p className="text-sm text-slate-400 mt-1">
                All your purchases have been completed!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          Pending
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(purchase.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Credits:</span>{' '}
                          <span className="font-semibold text-slate-900">
                            {purchase.credits_purchased.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Amount:</span>{' '}
                          <span className="font-semibold text-slate-900">
                            ${(purchase.amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500">Session ID:</span>{' '}
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {purchase.stripe_session_id}
                          </code>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleManualComplete(purchase.stripe_session_id)}
                      disabled={isCompleting === purchase.stripe_session_id}
                      className="btn-primary ml-4"
                    >
                      {isCompleting === purchase.stripe_session_id ? (
                        <span className="flex items-center gap-2">
                          <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                          Completing...
                        </span>
                      ) : (
                        'Complete Purchase'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Alternative: Stripe CLI (Recommended)
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>For a more realistic testing experience, use the Stripe CLI to forward webhooks:</p>
            <div className="rounded-xl bg-slate-50 p-4 font-mono text-xs space-y-2">
              <div># Install Stripe CLI</div>
              <div>brew install stripe/stripe-cli/stripe</div>
              <div className="mt-3"># Login to Stripe</div>
              <div>stripe login</div>
              <div className="mt-3"># Forward webhooks to localhost</div>
              <div>stripe listen --forward-to localhost:3000/api/stripe/webhook</div>
              <div className="mt-3"># Copy the webhook signing secret and add to .env.local</div>
              <div>STRIPE_WEBHOOK_SECRET=whsec_...</div>
            </div>
            <p className="text-slate-500 mt-3">
              With Stripe CLI running, purchases will be automatically completed just like in production.
            </p>
          </div>
        </div>
    </div>
  )
}

