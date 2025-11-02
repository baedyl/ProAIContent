'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaSave, FaUser, FaCog } from 'react-icons/fa'
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
    } catch (error) {
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
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-gray-600">Customize your content generation preferences</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-8 space-y-8"
        >
          {/* Account Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaUser className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-800">Account</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Default Preferences Section */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <FaCog className="text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-800">Default Preferences</h2>
            </div>
            <div className="space-y-4">
              {/* Preferred Persona */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
          <div className="pt-6 border-t border-gray-200">
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
      </div>
    </div>
  )
}

