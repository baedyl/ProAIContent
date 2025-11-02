'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTrash, FaEdit, FaDownload, FaCopy, FaSearch, FaFilter } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface SavedContent {
  id: number
  type: string
  content: string
  date: string
  title?: string
  keywords?: string
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<SavedContent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedProject, setSelectedProject] = useState<SavedContent | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    const saved = localStorage.getItem('savedContent')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProjects(parsed)
    }
  }

  const deleteProject = (id: number) => {
    const updated = projects.filter(p => p.id !== id)
    setProjects(updated)
    localStorage.setItem('savedContent', JSON.stringify(updated))
    toast.success('Project deleted')
    if (selectedProject?.id === id) {
      setSelectedProject(null)
    }
  }

  const downloadProject = (project: SavedContent) => {
    const blob = new Blob([project.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.type}-${project.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  const copyProject = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || project.type === filterType
    return matchesSearch && matchesFilter
  })

  const contentTypeLabels: Record<string, string> = {
    'blog': 'Blog Post',
    'product-review': 'Product Review',
    'comparison': 'Product Comparison',
    'affiliate': 'Affiliate Content'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Projects List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-effect rounded-2xl p-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            My Projects ({projects.length})
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects..."
              className="input-field pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field text-sm"
            >
              <option value="all">All Types</option>
              <option value="blog">Blog Posts</option>
              <option value="product-review">Product Reviews</option>
              <option value="comparison">Comparisons</option>
              <option value="affiliate">Affiliate Content</option>
            </select>
          </div>

          {/* Projects List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No projects found</p>
                <p className="text-sm mt-2">Generate content to get started</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-600 uppercase">
                      {contentTypeLabels[project.type]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(project.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {project.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyProject(project.content)
                      }}
                      className="p-1 hover:bg-primary-200 rounded transition-colors"
                      title="Copy"
                    >
                      <FaCopy className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadProject(project)
                      }}
                      className="p-1 hover:bg-primary-200 rounded transition-colors"
                      title="Download"
                    >
                      <FaDownload className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      }}
                      className="p-1 hover:bg-red-200 rounded transition-colors"
                      title="Delete"
                    >
                      <FaTrash className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Project Preview */}
      <div className="lg:col-span-2">
        <div className="glass-effect rounded-2xl p-6 min-h-[600px]">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {contentTypeLabels[selectedProject.type]}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created {format(new Date(selectedProject.date), 'MMMM dd, yyyy \'at\' HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyProject(selectedProject.content)}
                      className="btn-secondary text-sm"
                    >
                      <FaCopy className="inline mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={() => downloadProject(selectedProject)}
                      className="btn-primary text-sm"
                    >
                      <FaDownload className="inline mr-2" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-6 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                    {selectedProject.content}
                  </pre>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {selectedProject.content.split(/\s+/).length}
                    </div>
                    <div className="text-xs text-gray-500">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent-600">
                      {selectedProject.content.length}
                    </div>
                    <div className="text-xs text-gray-500">Characters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.ceil(selectedProject.content.split(/\s+/).length / 200)}
                    </div>
                    <div className="text-xs text-gray-500">Min Read</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-gray-400"
              >
                <FaEdit className="w-16 h-16 mb-4" />
                <p className="text-lg">Select a project to view</p>
                <p className="text-sm mt-2">Choose from your saved projects on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}


