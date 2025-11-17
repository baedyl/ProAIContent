'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface Persona {
  id: string
  user_id: string
  name: string
  avatar: string
  style: string
  description?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

const AVATAR_OPTIONS = [
  { id: 'avatar-1', image: '/Personas/person(4).png' },
  { id: 'avatar-2', image: '/Personas/man.png' },
  { id: 'avatar-3', image: '/Personas/person.png' },
  { id: 'avatar-4', image: '/Personas/person(1).png' },
  { id: 'avatar-5', image: '/Personas/person(2).png' },
  { id: 'avatar-6', image: '/Personas/person(3).png' },
  { id: 'avatar-7', image: '/Personas/beared.png' },
  { id: 'avatar-8', image: '/Personas/person(5).png' },
  { id: 'avatar-9', image: '/Personas/person(6).png' },
  { id: 'avatar-10', image: '/Personas/man(1).png' },
]

const PERSONA_TEMPLATES = [
  {
    name: 'Ernest Hemingway',
    style: 'Hemingway\'s style is characterized by short, declarative sentences and minimal use of adjectives. He employs the "iceberg theory" where the deeper meaning is implied rather than stated. His prose is direct, unadorned, and focuses on concrete details and actions rather than abstract concepts.',
    description: 'Minimalist American novelist known for concise, powerful prose'
  },
  {
    name: 'Jane Austen',
    style: 'Austen\'s writing combines elegant prose with sharp social observation and ironic wit. She uses free indirect discourse to reveal characters\' thoughts while maintaining narrative distance. Her sentences are balanced and rhythmic, often containing subtle humor and social critique beneath seemingly simple observations.',
    description: 'English novelist known for witty social commentary'
  },
  {
    name: 'Malcolm Gladwell',
    style: 'Gladwell\'s style blends storytelling with research, using anecdotes and case studies to illustrate complex ideas. He writes in an accessible, conversational tone while maintaining intellectual rigor. His narratives build suspense and curiosity, often challenging conventional wisdom with unexpected insights.',
    description: 'Contemporary journalist and author of popular non-fiction'
  },
  {
    name: 'Seth Godin',
    style: 'Godin writes in short, punchy paragraphs with a direct, conversational tone. He uses metaphors and analogies to make complex marketing concepts accessible. His style is provocative and actionable, often challenging readers to think differently and take immediate action.',
    description: 'Marketing expert known for concise, actionable insights'
  },
  {
    name: 'Neil Gaiman',
    style: 'Gaiman\'s prose is lyrical and imaginative, blending the mythic with the mundane. He uses vivid sensory details and unexpected metaphors to create atmospheric, dreamlike narratives. His voice is warm and conversational, inviting readers into fantastical worlds with accessible language.',
    description: 'Fantasy author known for mythic, atmospheric storytelling'
  },
]

export default function PersonasManager() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [deletingPersona, setDeletingPersona] = useState<Persona | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [testingStyle, setTestingStyle] = useState(false)
  const [testResult, setTestResult] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    avatar: 'avatar-1',
    style: '',
    description: '',
    is_default: false,
  })

  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/personas')
      if (!response.ok) throw new Error('Failed to fetch personas')
      const data = await response.json()
      setPersonas(data.personas || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load personas'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPersona(null)
    setFormData({
      name: '',
      avatar: 'avatar-1',
      style: '',
      description: '',
      is_default: false,
    })
    setTestResult('')
    setIsModalOpen(true)
  }

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona)
    setFormData({
      name: persona.name,
      avatar: persona.avatar,
      style: persona.style,
      description: persona.description || '',
      is_default: persona.is_default,
    })
    setTestResult('')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.style.trim()) {
      toast.error('Name and style are required')
      return
    }

    setIsSaving(true)
    try {
      const url = editingPersona ? `/api/personas/${editingPersona.id}` : '/api/personas'
      const method = editingPersona ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save persona')
      }

      toast.success(editingPersona ? 'Persona updated' : 'Persona created')
      setIsModalOpen(false)
      fetchPersonas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save persona'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (persona: Persona) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete persona')
      }

      toast.success('Persona deleted')
      setDeletingPersona(null)
      fetchPersonas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete persona'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestStyle = async () => {
    if (!formData.style.trim()) {
      toast.error('Please enter a style description first')
      return
    }

    setTestingStyle(true)
    setTestResult('')

    try {
      const response = await fetch('/api/personas/test-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: formData.style,
          name: formData.name || 'this persona',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to test style')
      }

      const data = await response.json()
      setTestResult(data.sample)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to test style'
      toast.error(message)
    } finally {
      setTestingStyle(false)
    }
  }

  const handleGenerateRandom = () => {
    const randomTemplate = PERSONA_TEMPLATES[Math.floor(Math.random() * PERSONA_TEMPLATES.length)]
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
    
    setFormData(prev => ({
      ...prev,
      name: randomTemplate.name,
      avatar: randomAvatar.id,
      style: randomTemplate.style,
      description: randomTemplate.description,
    }))
    
    toast.success(`Generated ${randomTemplate.name} persona!`)
  }

  const handleEnrichStyle = async () => {
    const currentStyle = formData.style.trim()
    
    if (!currentStyle) {
      // Generate from scratch
      const randomTemplate = PERSONA_TEMPLATES[Math.floor(Math.random() * PERSONA_TEMPLATES.length)]
      setFormData(prev => ({
        ...prev,
        style: randomTemplate.style,
      }))
      toast.success('Generated example writing style!')
      return
    }

    // Enrich existing style
    setIsSaving(true)
    try {
      const response = await fetch('/api/personas/enrich-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: currentStyle }),
      })

      if (!response.ok) {
        throw new Error('Failed to enrich style')
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        style: data.enrichedStyle,
      }))
      toast.success('Writing style enriched!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to enrich style'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Personas</h1>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage writing personas to give your content unique voices and styles
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          Create Persona
        </button>
      </div>

      {/* Personas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <FaPlus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No personas yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Create your first persona to add unique writing styles to your content generation
          </p>
          <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
            <FaPlus />
            Create Your First Persona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => {
            const avatarOption = AVATAR_OPTIONS.find(a => a.id === persona.avatar) || AVATAR_OPTIONS[0]
            return (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden border border-slate-200">
                      <Image
                        src={avatarOption.image}
                        alt={persona.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{persona.name}</h3>
                      {persona.is_default && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <FaCheck className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(persona)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPersona(persona)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
                <p className="text-sm text-slate-600 line-clamp-3">{persona.style}</p>
                {persona.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{persona.description}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {editingPersona ? 'Edit Persona' : 'Create Persona'}
                  </h2>
                  {!editingPersona && (
                    <button
                      onClick={handleGenerateRandom}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      🎲 Generate Random Persona
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  {/* Avatar Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Avatar
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.id }))}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white border-2 overflow-hidden ${
                            formData.avatar === avatar.id
                              ? 'ring-4 ring-indigo-500 scale-110 border-indigo-500'
                              : 'border-slate-200 opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <Image
                            src={avatar.image}
                            alt={`Avatar ${avatar.id}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Ernest Hemingway"
                      className="input-field"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Style */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Writing Style *
                      </label>
                      <button
                        type="button"
                        onClick={handleEnrichStyle}
                        disabled={isSaving}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        ✨ Pre-fill from example
                      </button>
                    </div>
                    <textarea
                      value={formData.style}
                      onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                      rows={8}
                      placeholder="Describe the writing style characteristics, tone, sentence structure, vocabulary, and unique techniques..."
                      className="textarea-field"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Description (optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Additional notes about this persona..."
                      className="textarea-field"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Default checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      disabled={isSaving}
                    />
                    <span className="text-sm text-slate-700">
                      Set as default persona
                    </span>
                  </label>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Writing Sample Preview
                    </label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 min-h-[300px] max-h-[400px] overflow-y-auto">
                      {testResult ? (
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{testResult}</div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          Click &quot;Test Writing Style&quot; to generate 2-3 sample paragraphs showing how this persona would write
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleTestStyle}
                    disabled={testingStyle || !formData.style.trim()}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    {testingStyle ? (
                      <>
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        Generating sample...
                      </>
                    ) : (
                      <>
                        ✏️ Test Writing Style
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                  disabled={isSaving || !formData.name.trim() || !formData.style.trim()}
                >
                  <FaSave />
                  {isSaving ? 'Saving...' : 'Save Persona'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPersona && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Delete Persona</h3>
                <button
                  onClick={() => setDeletingPersona(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete <strong>&quot;{deletingPersona.name}&quot;</strong>? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => setDeletingPersona(null)}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deletingPersona)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <FaTrash />
                    {isSaving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

