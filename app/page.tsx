'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Dashboard from '@/components/Dashboard'
import ContentGenerator from '@/components/ContentGenerator'
import ProjectsManager from '@/components/ProjectsManager'
import Sidebar from '@/components/Sidebar'
import UserMenu from '@/components/UserMenu'

export default function Home() {
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type)
    setShowGenerator(true)
    setActiveTab('dashboard')
  }

  const handleBackToDashboard = () => {
    setShowGenerator(false)
    setSelectedContentType(null)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setShowGenerator(false)
    setSelectedContentType(null)
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass-effect sticky top-0 z-50 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">ProAIContent</h1>
                <p className="text-xs text-gray-500">Advanced AI Content Generation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-4 sticky top-24">
              <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4">
            {activeTab === 'dashboard' && !showGenerator && (
              <Dashboard onContentTypeSelect={handleContentTypeSelect} />
            )}
            {activeTab === 'dashboard' && showGenerator && (
              <ContentGenerator 
                contentType={selectedContentType!}
                onBack={handleBackToDashboard}
              />
            )}
            {activeTab === 'projects' && (
              <ProjectsManager />
            )}
            {activeTab === 'analytics' && (
              <div className="glass-effect rounded-2xl p-8 text-center">
                <h2 className="text-3xl font-bold gradient-text mb-4">Analytics</h2>
                <p className="text-gray-600">Coming soon! Track your content performance and insights.</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="glass-effect rounded-2xl p-8 text-center">
                <h2 className="text-3xl font-bold gradient-text mb-4">Settings</h2>
                <p className="text-gray-600">Coming soon! Customize your experience.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2025 ProAIContent. Create unique, SEO-optimized, and humanized content with advanced AI.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

