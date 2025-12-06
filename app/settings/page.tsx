'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSave, FaUser, FaCog, FaTrash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { getAllPersonas } from '@/lib/personas'

interface UserSettings {
  theme: string
  default_tone: string
  default_style: string
  default_length: string
  preferred_persona: string
}

const tones = ['professional', 'casual', 'friendly', 'authoritative', 'conversational', 'persuasive']
const styles = ['informative', 'storytelling', 'listicle', 'how-to', 'analytical', 'entertaining']
const lengths = ['short', 'medium', 'long', 'extra-long']

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    default_tone: 'professional',
    default_style: 'informative',
    default_length: 'medium',
    preferred_persona: 'default'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const personas = getAllPersonas()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error: unknown) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error: unknown) {
      console.error('Settings save error:', error)
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        // Sign out the user and redirect to login
        await signOut({ callbackUrl: '/login' })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete account')
      }
    } catch (error: unknown) {
      console.error('Account deletion error:', error)
      toast.error('An error occurred while deleting account')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="loading-dots text-primary-600 text-2xl">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-semibold text-slate-900 mb-2">Workspace settings</h1>
          <p className="text-slate-500">Refine tone, personas, and automation defaults for your ProAI Writer studio.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-200 bg-white/95 p-8 space-y-8 shadow-sm"
        >
          {/* Account Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaUser className="text-primary-600" />
              <h2 className="text-2xl font-semibold text-slate-900">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>
              
              {/* Delete Account Section */}
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger flex items-center gap-2"
                >
                  <FaTrash />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Default Preferences Section */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <FaCog className="text-primary-600" />
              <h2 className="text-2xl font-semibold text-slate-900">Default preferences</h2>
            </div>
            <div className="space-y-4">
              {/* Preferred Persona */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Preferred Writer Persona
                </label>
                <select
                  value={settings.preferred_persona}
                  onChange={(e) => setSettings(prev => ({ ...prev, preferred_persona: e.target.value }))}
                  className="input-field"
                >
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Tone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Default Tone
                </label>
                <select
                  value={settings.default_tone}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_tone: e.target.value }))}
                  className="input-field capitalize"
                >
                  {tones.map(tone => (
                    <option key={tone} value={tone} className="capitalize">
                      {tone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Style */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Default Writing Style
                </label>
                <select
                  value={settings.default_style}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_style: e.target.value }))}
                  className="input-field capitalize"
                >
                  {styles.map(style => (
                    <option key={style} value={style} className="capitalize">
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Length */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Default Content Length
                </label>
                <select
                  value={settings.default_length}
                  onChange={(e) => setSettings(prev => ({ ...prev, default_length: e.target.value }))}
                  className="input-field capitalize"
                >
                  {lengths.map(length => (
                    <option key={length} value={length} className="capitalize">
                      {length}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              <FaSave />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </motion.div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="input-field w-full"
                    placeholder="Type DELETE to confirm"
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="btn-secondary flex-1"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  )
}

