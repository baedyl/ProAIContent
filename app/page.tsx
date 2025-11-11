'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Dashboard from '@/components/Dashboard'
import ContentGenerator from '@/components/ContentGenerator'
import ProjectsManager from '@/components/ProjectsManager'
import ContentsManager from '@/components/ContentsManager'
import Sidebar from '@/components/Sidebar'
import UserMenu from '@/components/UserMenu'

export default function Home() {
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type)
    setShowGenerator(true)
    setActiveSection('dashboard')
  }

  const handleBackToDashboard = () => {
    setShowGenerator(false)
    setSelectedContentType(null)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setShowGenerator(false)
    setSelectedContentType(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                  src="/proai-writer.svg"
                  alt="ProAI Writer logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-indigo-50/80 px-4 py-2 text-indigo-600 border border-indigo-100">
                <span className="text-xs font-semibold uppercase tracking-wider">Beta</span>
                <span className="text-sm">500 magic credits</span>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
          </motion.aside>

          {/* Main Content Area */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-8"
          >
            {activeSection === 'dashboard' && !showGenerator && (
              <Dashboard onContentTypeSelect={handleContentTypeSelect} />
            )}

            {activeSection === 'dashboard' && showGenerator && selectedContentType && (
              <ContentGenerator contentType={selectedContentType} onBack={handleBackToDashboard} />
            )}

            {activeSection === 'contents' && <ContentsManager />}

            {activeSection === 'projects' && <ProjectsManager />}

            {activeSection === 'analytics' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 7.941 7.106 3.75 12.227 3.75c5.12 0 9.223 4.191 9.223 9.375 0 5.184-4.103 9.375-9.223 9.375-1.487 0-2.896-.343-4.139-.952L3.75 21l.997-3.502A9.212 9.212 0 0 1 3 13.125Z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-semibold text-slate-900">Performance insights coming soon</h2>
                <p className="mt-3 text-slate-500">
                  We&apos;re building a rich analytics workspace so you can track keyword wins, engagement, and conversion metrics—all in real time.
                </p>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <h2 className="text-3xl font-semibold text-slate-900">Workspace settings</h2>
                <p className="mt-3 text-slate-500">
                  Configure brand voices, publishing destinations, and collaboration rules. Enhanced customization options arrive later this quarter.
                </p>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-2 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} ProAI Writer. Craft intelligent, human-first stories with AI precision.</p>
            <p className="text-xs text-indigo-500">Designed for content leaders and growth operators.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

