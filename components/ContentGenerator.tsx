'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaMagic, FaCopy, FaDownload, FaSave } from 'react-icons/fa'
import toast from 'react-hot-toast'
import GenerationForm from './GenerationForm'
import ContentPreview from './ContentPreview'

interface ContentGeneratorProps {
  contentType: string
  onBack: () => void
}

interface ProjectOption {
  id: string
  name: string
}

export default function ContentGenerator({ contentType, onBack }: ContentGeneratorProps) {
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [currentFormData, setCurrentFormData] = useState<any | null>(null)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isFetchingProjects, setIsFetchingProjects] = useState(true)

  const contentTypeTitles: Record<string, string> = {
    blog: 'Blog Post Generator',
    'product-review': 'Product Review Generator',
    comparison: 'Product Comparison Generator',
    affiliate: 'Affiliate Content Generator',
  }

  useEffect(() => {
    const loadProjects = async () => {
      setIsFetchingProjects(true)
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          const mapped: ProjectOption[] = (data.projects || []).map((project: any) => ({
            id: project.id,
            name: project.name,
          }))
          setProjects(mapped)
          if (mapped.length > 0) {
            setSelectedProjectId(mapped[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load projects', error)
        toast.error('Unable to load projects. Create one from the Projects tab first.')
      } finally {
        setIsFetchingProjects(false)
      }
    }

    loadProjects()
  }, [])

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true)
    setShowPreview(false)
    setCurrentFormData(formData)

    try {
      const useAdvancedAPI =
        formData.personaId !== 'default' ||
        formData.useSerpAnalysis ||
        formData.includeFAQ ||
        formData.includeVideo

      const apiEndpoint = useAdvancedAPI ? '/api/generate-advanced' : '/api/generate'

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      setShowPreview(true)

      if (useAdvancedAPI && data.metadata) {
        let message = 'Content generated successfully!'
        if (data.metadata.serpAnalysis?.analyzed) {
          message += ` (${data.metadata.serpAnalysis.competitorHeadersFound} competitor headers analyzed)`
        }
        if (data.metadata.faqGenerated) {
          message += ' with FAQ'
        }
        if (data.metadata.videoIncluded) {
          message += ' + video'
        }
        toast.success(message)
      } else {
        toast.success('Content generated successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate content')
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    toast.success('Content copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contentType}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Content downloaded!')
  }

  const handleSave = async () => {
    if (!generatedContent) {
      toast.error('Generate content before saving')
      return
    }

    if (!currentFormData) {
      toast.error('Generate content to capture the latest setup before saving')
      return
    }

    if (!selectedProjectId) {
      toast.error('Select a project to store this content')
      return
    }

    try {
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: currentFormData.topic || 'Untitled content',
          contentType,
          content: generatedContent,
          keywords: currentFormData.keywords || null,
          status: 'draft',
          metadata: {
            tone: currentFormData.tone,
            style: currentFormData.style,
            length: currentFormData.length,
            personaId: currentFormData.personaId,
            audience: currentFormData.targetAudience,
            instructions: currentFormData.additionalInstructions,
          },
        }),
      })

      if (response.ok) {
        toast.success('Content saved to your project!')
        return
      }

      const savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]')
      savedContent.push({
        id: Date.now(),
        type: contentType,
        content: generatedContent,
        date: new Date().toISOString(),
      })
      localStorage.setItem('savedContent', JSON.stringify(savedContent))
      toast.success('Content saved locally! Sign in to store it in your account.')
    } catch (error) {
      const savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]')
      savedContent.push({
        id: Date.now(),
        type: contentType,
        content: generatedContent,
        date: new Date().toISOString(),
      })
      localStorage.setItem('savedContent', JSON.stringify(savedContent))
      toast.success('Content saved locally!')
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-full border border-slate-200 p-3 text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold">
              Creation flow
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">
              {contentTypeTitles[contentType]}
            </h2>
            <p className="text-slate-500 mt-1">
              Guide ProAI Writer with your brief while we orchestrate SERP research, tone, and conversion structure.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <FaMagic className="h-3 w-3 text-indigo-500" />
            <span>Semantic optimizer engaged</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Select project</span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={isFetchingProjects || projects.length === 0}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {projects.length === 0 ? (
                <option value="">
                  {isFetchingProjects ? 'Loading projects...' : 'No projects available'}
                </option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </motion.div>

      {!isFetchingProjects && projects.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
          Create a project from the Projects tab to save generated content in a dedicated workspace.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GenerationForm contentType={contentType} onGenerate={handleGenerate} isGenerating={isGenerating} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sticky top-24 h-fit max-h-[calc(100vh-7rem)] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Live preview</h3>
            {showPreview && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                  title="Copy to clipboard"
                >
                  <FaCopy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                  title="Download"
                >
                  <FaDownload className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                  title="Save to project"
                >
                  <FaSave className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-500 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-200/60">
                    <FaMagic className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">Generating your content...</p>
                    <p className="text-sm text-slate-500 mt-2">ProAI Writer is orchestrating SERP insights, tone, and structure.</p>
                  </div>
                  <div className="loading-dots text-primary-600">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              ) : showPreview ? (
                <ContentPreview content={generatedContent} />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-slate-300"
                >
                  <FaMagic className="w-12 h-12 mb-4" />
                  <p>Preview will appear after generation.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


