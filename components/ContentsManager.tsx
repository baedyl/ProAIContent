'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilter, FaSearch, FaTable, FaThLarge, FaEdit, FaTrash, FaFolder, FaTimes, FaSave } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  slug: string | null
  site_url: string | null
  persona: string | null
  status: string | null
  brief: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface ContentItem {
  id: string
  project_id: string
  user_id: string
  title: string
  content: string
  word_count: number
  credits_used: number
  requested_length: number
  settings: {
    contentType?: string
    keywords?: string
    [key: string]: string | undefined
  }
  status: string
  retry_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Articles',
  'product-review': 'Product sheets',
  comparison: 'Comparisons',
  affiliate: 'Affiliate',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  reviewing: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
}

const Tabs = [
  { id: 'all', label: 'All', badge: true },
  { id: 'blog', label: 'Articles', badge: true },
  { id: 'pages', label: 'Pages categories', badge: false },
  { id: 'product-review', label: 'Product sheets', badge: true },
  { id: 'discover', label: 'Discover', badge: false },
]

export default function ContentsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [contents, setContents] = useState<ContentItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [assigningContent, setAssigningContent] = useState<ContentItem | null>(null)
  const [deletingContent, setDeletingContent] = useState<ContentItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        const [projectsRes, contentsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/contents'),
        ])

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(data.projects || [])
        }

        if (contentsRes.ok) {
          const data = await contentsRes.json()
          setContents(data.contents || [])
        }
      } catch (error) {
        console.error('Failed to load contents', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const contentType = item.settings?.contentType || 'blog'
      const keywords = item.settings?.keywords || ''
      const matchesProject = selectedProject === 'all' || item.project_id === selectedProject
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pages' && ['page', 'landing'].includes(contentType)) ||
        contentType === activeTab
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        keywords.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesProject && matchesTab && matchesStatus && matchesSearch
    })
  }, [contents, selectedProject, activeTab, selectedStatus, searchTerm])

  const activeTabCount = filteredContents.length

  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>()
    projects.forEach((project) => map.set(project.id, project))
    return map
  }, [projects])

  const handleEdit = async (content: ContentItem, updates: { title?: string; content?: string }) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/contents/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update content')
      }

      const data = await response.json()
      setContents(prev => prev.map(c => c.id === content.id ? data.content : c))
      setEditingContent(null)
      toast.success('Content updated successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update content'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (content: ContentItem) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/contents/${content.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete content')
      }

      setContents(prev => prev.filter(c => c.id !== content.id))
      setDeletingContent(null)
      toast.success('Content deleted successfully')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete content'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignToProject = async (content: ContentItem, projectId: string | null) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/contents/${content.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign content to project')
      }

      const data = await response.json()
      setContents(prev => prev.map(c => c.id === content.id ? data.content : c))
      setAssigningContent(null)
      toast.success(projectId ? 'Content assigned to project' : 'Content removed from project')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update content'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Contents</h2>
            <p className="text-sm text-slate-500">Browse every article, page, and product sheet across your projects.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <FaTable />
            </button>
            <button
              className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <FaThLarge />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const count =
              tab.id === 'all'
                ? filteredContents.length
                : filteredContents.filter((item) => item.content_type === tab.id).length

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                    }`}
                  >
                    {tab.id === 'all' ? activeTabCount : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Project</span>
            <select
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Search title or keywords"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <FaFilter className="text-slate-300" />
            Advanced filters
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm"
      >
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <div className="loading-dots text-indigo-500">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="text-sm">Loading contents...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-300">
            <FaSearch className="h-10 w-10" />
            <p className="text-base">No content at the moment.</p>
            <p className="text-sm text-slate-400">Adjust filters or generate new articles from the generator.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Project</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Published?</th>
                  <th className="px-6 py-3 font-semibold">Last update</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContents.map((item) => {
                  const project = projectsMap.get(item.project_id)
                  const contentType = item.settings?.contentType || 'blog'
                  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType
                  const statusLabel = STATUS_LABELS[item.status] || item.status

                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/40">
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        <div>{item.title}</div>
                        {item.settings?.keywords && (
                          <div className="mt-1 text-xs text-slate-400">{item.settings.keywords}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{project?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{typeLabel}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'published'
                              ? 'bg-green-100 text-green-600'
                              : item.status === 'reviewing'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.is_published ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(item.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingContent(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit content"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAssigningContent(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Assign to project"
                          >
                            <FaFolder className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingContent(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete content"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredContents.map((item) => {
              const project = projectsMap.get(item.project_id)
              const contentType = item.settings?.contentType || 'blog'
              const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{typeLabel}</span>
                    <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-2">{item.title}</h3>
                  <p className="mt-3 text-sm text-slate-500 line-clamp-3">{item.content}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{project?.name || '—'}</span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'published'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingContent(item)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit content"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAssigningContent(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Assign to project"
                    >
                      <FaFolder className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingContent(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete content"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Edit Content</h3>
                <button
                  onClick={() => setEditingContent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    defaultValue={editingContent.title}
                    id="edit-title"
                    className="input-field"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                  <textarea
                    defaultValue={editingContent.content}
                    id="edit-content"
                    rows={12}
                    className="textarea-field"
                    placeholder="Enter content"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEditingContent(null)}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const title = (document.getElementById('edit-title') as HTMLInputElement)?.value
                      const content = (document.getElementById('edit-content') as HTMLTextAreaElement)?.value
                      handleEdit(editingContent, { title, content })
                    }}
                    className="btn-primary flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <FaSave />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign to Project Modal */}
      <AnimatePresence>
        {assigningContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Assign to Project</h3>
                <button
                  onClick={() => setAssigningContent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Project
                  </label>
                  <select
                    id="assign-project"
                    defaultValue={assigningContent.project_id || ''}
                    className="input-field"
                  >
                    <option value="">No Project (Remove from project)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => setAssigningContent(null)}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const projectId = (document.getElementById('assign-project') as HTMLSelectElement)?.value || null
                      handleAssignToProject(assigningContent, projectId)
                    }}
                    className="btn-primary flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <FaFolder />
                    {isSaving ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Delete Content</h3>
                <button
                  onClick={() => setDeletingContent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete <strong>&quot;{deletingContent.title}&quot;</strong>? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={() => setDeletingContent(null)}
                    className="btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deletingContent)}
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


