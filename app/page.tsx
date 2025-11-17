'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import ContentGenerator from '@/components/ContentGenerator'
import ContentsManager from '@/components/ContentsManager'
import ProjectsManager from '@/components/ProjectsManager'
import PersonasManager from '@/components/PersonasManager'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

export default function WorkspacePage() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'contents' | 'projects' | 'personas' | 'generator'>('dashboard')
  const [activeContentType, setActiveContentType] = useState<string | null>(null)

  const { data: balanceData } = useSWR('/api/credits/balance', fetcher)
  const { data: summaryData } = useSWR('/api/credits/summary', fetcher)

  const quickStats = useMemo(() => ({
    balance: balanceData?.balance ?? 0,
    totalCreditsUsed: summaryData?.totalCreditsUsed ?? 0,
    totalContentsGenerated: summaryData?.totalContentsGenerated ?? 0,
  }), [balanceData, summaryData])

  const handleContentTypeSelect = (type: string) => {
    setActiveContentType(type)
    setActiveSection('generator')
  }

  const handleBackToDashboard = () => {
    setActiveContentType(null)
    setActiveSection('dashboard')
  }

  const renderMain = () => {
    if (activeSection === 'generator' && activeContentType) {
      return <ContentGenerator contentType={activeContentType} onBack={handleBackToDashboard} />
    }

    if (activeSection === 'contents') {
      return <ContentsManager />
    }

    if (activeSection === 'projects') {
      return <ProjectsManager />
    }

    if (activeSection === 'personas') {
      return <PersonasManager />
    }

    return <Dashboard onContentTypeSelect={handleContentTypeSelect} onSectionChange={setActiveSection} />
  }

  const normalizedSidebarSection = activeSection === 'generator' ? 'dashboard' : activeSection

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="lg:w-72 lg:flex-shrink-0">
          <Sidebar 
            activeSection={normalizedSidebarSection} 
            creditsBalance={quickStats.balance}
            totalCreditsUsed={quickStats.totalCreditsUsed}
            totalContentsGenerated={quickStats.totalContentsGenerated}
            onSectionChange={(section) => {
              if (section === 'dashboard') {
                handleBackToDashboard()
              } else {
                setActiveSection(section as 'contents' | 'projects' | 'personas')
              }
            }} 
          />
        </aside>

        <main className="flex-1 min-w-0 space-y-6">
          {renderMain()}
        </main>
      </div>
    </div>
  )
}
