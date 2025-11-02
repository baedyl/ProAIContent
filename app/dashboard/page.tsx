'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaFolder, FaPlus, FaCog, FaChartLine, FaRocket } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  content_type: string
  content: string
  keywords: string | null
  metadata: any
  created_at: string
  updated_at: string
}

interface UserSettings {
  theme: string
  default_tone: string
  default_style: string
  default_length: string
  preferred_persona: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch('/api/projects')
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }

      // Fetch settings
      const settingsRes = await fetch('/api/settings')
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Project deleted')
        setProjects(projects.filter(p => p.id !== id))
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="loading-dots text-primary-600 text-2xl mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const contentTypeLabels: Record<string, string> = {
    'blog': 'Blog Post',
    'product-review': 'Product Review',
    'comparison': 'Product Comparison',
    'affiliate': 'Affiliate Content'
  }

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: FaFolder,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'This Month',
      value: projects.filter(p => {
        const created = new Date(p.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length,
      icon: FaChartLine,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Preferred Persona',
      value: settings?.preferred_persona || 'default',
      icon: FaRocket,
      color: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Welcome back, {session?.user?.name || session?.user?.email}!
          </h1>
          <p className="text-gray-600">
            Manage your AI-generated content and settings
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div key={index} className="glass-effect rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/" className="glass-effect rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
                  <FaPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Create New Content</h3>
                  <p className="text-sm text-gray-600">Generate AI-powered content</p>
                </div>
              </div>
            </Link>
            <Link href="/settings" className="glass-effect rounded-xl p-6 hover:shadow-lg transition-shadow card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                  <FaCog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Settings</h3>
                  <p className="text-sm text-gray-600">Customize your preferences</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="glass-effect rounded-2xl p-12 text-center">
              <FaFolder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-6">Start creating amazing content with AI</p>
              <Link href="/" className="btn-primary inline-flex items-center gap-2">
                <FaPlus />
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="glass-effect rounded-xl p-6 card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold text-primary-600 uppercase">
                      {contentTypeLabels[project.content_type]}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    <span>{project.content.split(/\s+/).length} words</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projects.length > 6 && (
            <div className="text-center mt-6">
              <Link href="/" className="btn-secondary">
                View All Projects
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

