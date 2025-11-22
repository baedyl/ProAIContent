'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { FaSave, FaArrowLeft, FaSpinner } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Sidebar from '@/components/Sidebar'
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

interface ContentItem {
  id: string
  project_id: string
  user_id: string
  title: string
  content: string
  word_count: number
  credits_used: number
  requested_length: number
  settings: {
    contentType?: string
    keywords?: string
    [key: string]: string | undefined
  }
  status: string
  retry_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string

  const [content, setContent] = useState<ContentItem | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const { data: balanceData, isLoading: balanceLoading } = useSWR('/api/credits/balance', fetcher)
  const { data: summaryData, isLoading: summaryLoading } = useSWR('/api/credits/summary', fetcher)

  const quickStats = useMemo(
    () => ({
      balance: balanceData?.balance ?? 0,
      totalCreditsUsed: summaryData?.totalCreditsUsed ?? 0,
      totalContentsGenerated: summaryData?.totalContentsGenerated ?? 0,
    }),
    [balanceData, summaryData]
  )

  const isBootstrapping = balanceLoading || summaryLoading

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/contents/${contentId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }

        const data = await response.json()
        setContent(data.content)
        setTitle(data.content.title)
        setBody(data.content.content)
      } catch (error) {
        console.error('Failed to load content:', error)
        toast.error('Failed to load content')
        router.push('/contents')
      } finally {
        setIsLoading(false)
      }
    }

    if (contentId) {
      fetchContent()
    }
  }, [contentId, router])

  useEffect(() => {
    if (content) {
      const hasChanges = title !== content.title || body !== content.content
      setHasUnsavedChanges(hasChanges)
    }
  }, [title, body, content])

  const handleSave = async () => {
    if (!content) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/contents/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: body }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update content')
      }

      const data = await response.json()
      setContent(data.content)
      setHasUnsavedChanges(false)
      toast.success('Content saved successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save content'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/contents')
      }
    } else {
      router.push('/contents')
    }
  }

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {(isBootstrapping || isLoading) && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <GlobalLoadingOverlay />
        </div>
      )}
      <div className="mx-auto flex flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="lg:w-72 lg:flex-shrink-0">
          <Sidebar 
            activeSection="contents"
            creditsBalance={quickStats.balance}
            totalCreditsUsed={quickStats.totalCreditsUsed}
            totalContentsGenerated={quickStats.totalContentsGenerated}
            onSectionChange={(section) => {
              if (hasUnsavedChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  if (section === 'dashboard') {
                    router.push('/')
                  } else if (section === 'contents') {
                    router.push('/contents')
                  } else if (section === 'projects' || section === 'personas') {
                    router.push(`/?section=${section}`)
                  }
                }
              } else {
                if (section === 'dashboard') {
                  router.push('/')
                } else if (section === 'contents') {
                  router.push('/contents')
                } else if (section === 'projects' || section === 'personas') {
                  router.push(`/?section=${section}`)
                }
              }
            }} 
          />
        </aside>

        <main className="flex-1 min-w-0 space-y-6">
          {!content ? (
            <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-slate-400">
              <FaSpinner className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm">Loading content...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
          {/* Header */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <FaArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Edit Content</h1>
                <p className="text-sm text-slate-500">Make changes to your content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter content title"
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    Content
                  </label>
                  <span className="text-sm text-slate-400">
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={20}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono text-sm leading-relaxed"
                  placeholder="Enter your content here..."
                />
              </div>

              {/* Metadata */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <span className="ml-2 font-medium text-slate-900">{content.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {content.settings?.contentType || 'blog'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Credits Used:</span>
                    <span className="ml-2 font-medium text-slate-900">{content.credits_used}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Updated:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {new Date(content.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {content.settings?.keywords && (
                  <div className="mt-3">
                    <span className="text-slate-500">Keywords:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {content.settings.keywords}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

