'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaMagic, FaCopy, FaDownload, FaSave } from 'react-icons/fa'
import toast from 'react-hot-toast'
import GenerationForm from './GenerationForm'
import ContentPreview from './ContentPreview'

interface ContentGeneratorProps {
  contentType: string
  onBack: () => void
}

export default function ContentGenerator({ contentType, onBack }: ContentGeneratorProps) {
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const contentTypeTitles: Record<string, string> = {
    'blog': 'Blog Post Generator',
    'product-review': 'Product Review Generator',
    'comparison': 'Product Comparison Generator',
    'affiliate': 'Affiliate Content Generator'
  }

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true)
    setShowPreview(false)

    try {
      // Use advanced API if any advanced options are enabled
      const useAdvancedAPI = formData.personaId !== 'default' || 
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
          ...formData
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      setShowPreview(true)
      
      // Show enhanced success message if using advanced features
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
    try {
      // First, try to save to database (if authenticated)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.topic || 'Untitled Project',
          content_type: contentType,
          content: generatedContent,
          keywords: formData.keywords || null,
          metadata: {
            tone: formData.tone,
            style: formData.style,
            length: formData.length,
            personaId: formData.personaId,
          }
        }),
      })

      if (response.ok) {
        toast.success('Content saved to your account!')
        return
      }

      // Fallback to localStorage if not authenticated
      const savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]')
      savedContent.push({
        id: Date.now(),
        type: contentType,
        content: generatedContent,
        date: new Date().toISOString()
      })
      localStorage.setItem('savedContent', JSON.stringify(savedContent))
      toast.success('Content saved locally! Sign in to save to your account.')
    } catch (error) {
      // Fallback to localStorage on error
      const savedContent = JSON.parse(localStorage.getItem('savedContent') || '[]')
      savedContent.push({
        id: Date.now(),
        type: contentType,
        content: generatedContent,
        date: new Date().toISOString()
      })
      localStorage.setItem('savedContent', JSON.stringify(savedContent))
      toast.success('Content saved locally!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-3xl font-bold gradient-text">
              {contentTypeTitles[contentType]}
            </h2>
            <p className="text-gray-600 mt-1">
              Create unique, SEO-optimized content in seconds
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GenerationForm
            contentType={contentType}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </motion.div>

        {/* Content Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 sticky top-24 h-fit max-h-[calc(100vh-7rem)] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Preview</h3>
            {showPreview && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
                  title="Copy to clipboard"
                >
                  <FaCopy className="w-4 h-4 text-gray-600 group-hover:text-primary-600" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
                  title="Download"
                >
                  <FaDownload className="w-4 h-4 text-gray-600 group-hover:text-primary-600" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
                  title="Save to projects"
                >
                  <FaSave className="w-4 h-4 text-gray-600 group-hover:text-primary-600" />
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
                    <FaMagic className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800">Generating your content...</p>
                    <p className="text-sm text-gray-600 mt-2">This may take a few seconds</p>
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
                  className="flex flex-col items-center justify-center h-64 text-gray-400"
                >
                  <FaMagic className="w-12 h-12 mb-4" />
                  <p>Your generated content will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


