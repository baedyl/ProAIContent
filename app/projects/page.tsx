'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Sidebar from '@/components/Sidebar'
import ProjectsManager from '@/components/ProjectsManager'
import GlobalLoadingOverlay from '@/components/GlobalLoadingOverlay'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

export default function ProjectsPage() {
  const router = useRouter()

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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {isBootstrapping && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <GlobalLoadingOverlay />
        </div>
      )}
      <div className="mx-auto flex flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="lg:w-72 lg:flex-shrink-0">
          <Sidebar
            activeSection="projects"
            creditsBalance={quickStats.balance}
            totalCreditsUsed={quickStats.totalCreditsUsed}
            totalContentsGenerated={quickStats.totalContentsGenerated}
            onSectionChange={(section) => {
              if (section === 'dashboard') {
                router.push('/')
              } else if (section === 'projects') {
                // Already on projects page
              } else if (section === 'contents') {
                router.push('/contents')
              } else if (section === 'personas') {
                router.push('/personas')
              }
            }}
          />
        </aside>

        <main className="flex-1 min-w-0 space-y-6">
          <ProjectsManager />
        </main>
      </div>
    </div>
  )
}
