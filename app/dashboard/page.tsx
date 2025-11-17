'use client'

import { useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import {
  FiActivity,
  FiArrowRight,
  FiEdit2,
  FiEye,
  FiLayers,
  FiShoppingCart,
  FiTrash2,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface GeneratedContentItem {
  id: string
  title: string
  content: string
  word_count: number
  credits_used: number
  requested_length: number
  created_at: string
}

type UsageEntry = {
  usage_day: string
  credits_spent?: number
  credits_added?: number
}

interface TransactionRecord {
  id: string
  type: string
  amount: number
  created_at: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return res.json()
}

const countWords = (content: string) =>
  content
    .replace(/[#*_`>\-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

const formatNumber = (value: number) => value.toLocaleString()
const formatCurrency = (value: number) => `$${value.toFixed(2)}`

export default function DashboardPage() {
  const router = useRouter()
  const [selectedContent, setSelectedContent] = useState<GeneratedContentItem | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: balanceData,
    isLoading: balanceLoading,
  } = useSWR('/api/credits/balance', fetcher)
  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useSWR('/api/credits/summary', fetcher)
  const {
    data: usageData,
    isLoading: usageLoading,
  } = useSWR('/api/credits/usage?days=30', fetcher)
  const {
    data: contentsData,
    mutate: mutateContents,
    isLoading: contentsLoading,
  } = useSWR('/api/contents?limit=10', fetcher)
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
  } = useSWR('/api/credits/transactions?limit=5', fetcher)

  const balance = balanceData?.balance ?? 0
  const totalCreditsUsed = summaryData?.totalCreditsUsed ?? 0
  const creditsUsedThisMonth = summaryData?.creditsUsedThisMonth ?? 0
  const totalContentsGenerated = summaryData?.totalContentsGenerated ?? 0
  const contentsGeneratedThisMonth = summaryData?.contentsGeneratedThisMonth ?? 0
  const estimatedMoneySaved = summaryData?.estimatedMoneySaved ?? 0

  // Calculate percentage of balance remaining (balance out of total credits ever acquired)
  // Total credits acquired = current balance + total used
  const totalCreditsAcquired = totalCreditsUsed + balance
  const creditPercentage = totalCreditsAcquired > 0 ? Math.round((balance / totalCreditsAcquired) * 100) : 0

  const usageChartData = useMemo(() => {
    if (!usageData?.usage) return []
    return usageData.usage.map((entry: UsageEntry) => ({
      date: format(parseISO(entry.usage_day), 'MMM d'),
      spent: entry.credits_spent ?? 0,
      added: entry.credits_added ?? 0,
    }))
  }, [usageData])

  const recentContents: GeneratedContentItem[] = contentsData?.contents ?? []
  const transactions: TransactionRecord[] = transactionsData?.transactions ?? []
  const isLoading = balanceLoading || summaryLoading || usageLoading || contentsLoading
  const lowBalance = balance > 0 && balance < 5000

  const openContentModal = (item: GeneratedContentItem) => {
    setSelectedContent(item)
    setEditValue(item.content)
    setIsEditing(false)
  }

  const closeContentModal = () => {
    setSelectedContent(null)
    setEditValue('')
    setIsEditing(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error || 'Failed to delete content')
      }
      toast.success('Content deleted')
      mutateContents()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to delete content'
      toast.error(message)
    }
  }

  const handleSaveChanges = async () => {
    if (!selectedContent) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/contents/${selectedContent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedContent.title,
          content: editValue,
        }),
      })

      if (!res.ok) {
        const payload = await res.json()
        throw new Error(payload.error || 'Failed to update content')
      }

      const updated = await res.json()
      toast.success('Content updated')
      mutateContents()
      setSelectedContent(updated.content)
      setEditValue(updated.content.content)
      setIsEditing(false)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save changes'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 lg:px-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Dashboard</p>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back to ProAI Content Studio</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor credits, review recent generations, and keep momentum on your publishing roadmap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {formatNumber(balance)} credits left
          </span>
          <Link
            href="/buy-credits"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
          >
            <FiShoppingCart /> Buy Credits
          </Link>
        </div>
      </section>

      {lowBalance && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your credit balance is running low. Consider purchasing a top-up to avoid interruptions.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total credits used"
          value={formatNumber(totalCreditsUsed)}
          helpText="Lifetime usage"
          icon={<FiZap className="h-5 w-5" />}
          color="bg-purple-100 text-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Generated this month"
          value={formatNumber(contentsGeneratedThisMonth)}
          helpText={`Total generated: ${formatNumber(totalContentsGenerated)}`}
          icon={<FiLayers className="h-5 w-5" />}
          color="bg-blue-100 text-blue-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Credits used this month"
          value={formatNumber(creditsUsedThisMonth)}
          helpText={`Balance remaining: ${formatNumber(balance)}`}
          icon={<FiTrendingUp className="h-5 w-5" />}
          color="bg-teal-100 text-teal-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Money saved"
          value={formatCurrency(estimatedMoneySaved)}
          helpText="Compared to human copywriting"
          icon={<FiActivity className="h-5 w-5" />}
          color="bg-orange-100 text-orange-600"
          isLoading={isLoading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Credit status</h2>
              <p className="text-sm text-slate-500">{formatNumber(balance)} of {formatNumber(totalCreditsAcquired)} credits remaining</p>
            </div>
            <span className="text-sm font-semibold text-slate-700">{creditPercentage}%</span>
          </div>
          <div className="mt-4 h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${creditPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>Total used: {formatNumber(totalCreditsUsed)}</span>
            <span>Remaining: {formatNumber(balance)}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Usage trend</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Last 30 days</span>
          </div>
          <div className="mt-4 h-52">
            {usageLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
            ) : usageChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageChartData}>
                  <defs>
                    <linearGradient id="creditsSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={formatNumber} width={60} />
                  <RechartsTooltip formatter={(value: number) => formatNumber(value)} />
                  <Area type="monotone" dataKey="spent" stroke="#7c3aed" fill="url(#creditsSpent)" strokeWidth={2} name="Credits spent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p className="font-semibold text-slate-700">Not enough data yet</p>
                <p>Generate content to populate your usage chart.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent generations</h2>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              New content <FiArrowRight />
            </button>
          </div>
          {contentsLoading ? (
            <TableSkeleton rows={3} />
          ) : recentContents.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-700">No generations yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Start a new project and your recent generations will appear here.
              </p>
              <button
                className="mt-4 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                onClick={() => router.push('/')}
              >
                Generate now
              </button>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-0 py-2">Title</th>
                    <th className="px-3 py-2 text-right">Word count</th>
                    <th className="px-3 py-2 text-right">Credits used</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContents.map(item => (
                    <tr key={item.id} className="border-t border-slate-100 text-slate-700">
                      <td className="py-3 pr-3">
                        <p className="line-clamp-1 font-medium">{item.title || 'Untitled generation'}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm">{formatNumber(item.word_count)}</td>
                      <td className="px-3 py-3 text-right font-mono text-sm">{formatNumber(item.credits_used)}</td>
                      <td className="px-3 py-3 text-sm text-slate-500">{format(parseISO(item.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openContentModal(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                          >
                            <FiEye /> View
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Credit activity</h2>
            {transactionsLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">Purchases and generation usage will appear here.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {transactions.map((txn: TransactionRecord) => (
                  <div key={txn.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-800">{txn.type}</p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(txn.created_at), 'MMM d, yyyy – h:mma')}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${txn.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {txn.amount < 0 ? '-' : '+'}
                        {formatNumber(Math.abs(txn.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiZap /> Generate new content
                </span>
              </button>
              <button
                onClick={() => router.push('/buy-credits')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <FiShoppingCart /> Explore credit bundles
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {selectedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedContent.title || 'Generated content'}</p>
                <p className="text-xs text-slate-500">
                  Word count: {formatNumber(isEditing ? countWords(editValue) : selectedContent.word_count)} • Generated{' '}
                  {format(parseISO(selectedContent.created_at), 'MMM d, yyyy • h:mma')}
                </p>
              </div>
              <button
                onClick={closeContentModal}
                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              <textarea
                value={editValue}
                onChange={event => setEditValue(event.target.value)}
                className={`h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                  isEditing ? '' : 'pointer-events-none'
                }`}
                readOnly={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setIsEditing(prev => !prev)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
              >
                <FiEdit2 /> {isEditing ? 'Stop editing' : 'Edit content'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={!isEditing || isSaving}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={closeContentModal}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  helpText?: string
  icon: ReactNode
  color: string
  isLoading?: boolean
}

function StatCard({ label, value, helpText, icon, color, isLoading }: StatCardProps) {
  if (isLoading) {
    return <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>{icon}</span>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
        </div>
      </div>
    </div>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}
