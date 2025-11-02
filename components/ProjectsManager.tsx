'use client'

import { useEffect, useMemo, useState, FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FaExternalLinkAlt, FaPlus, FaTrash, FaCopy, FaDownload } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  slug: string | null
  site_url: string | null
  persona: string | null
  status: string | null
  brief: string | null
  metadata: any
  created_at: string
  updated_at: string
}

interface ContentItem {
  id: string
  project_id: string
  user_id: string
  title: string
  content_type: string
  status: string
  is_published: boolean
  published_at: string | null
  content: string
  keywords: string | null
  metadata: any
  created_at: string
  updated_at: string
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  reviewing: 'bg-amber-100 text-amber-600',
  scheduled: 'bg-blue-100 text-blue-600',
  published: 'bg-emerald-100 text-emerald-600',
}

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { name: string; siteUrl: string; persona: string; brief: string }) => Promise<void>
  isSubmitting: boolean
}

function ProjectModal({ open, onClose, onSubmit, isSubmitting }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [persona, setPersona] = useState('')
  const [brief, setBrief] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setSiteUrl('')
      setPersona('')
      setBrief('')
    }
  }, [open])

  if (!open) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.error('Project name is required')
      return
    }

    await onSubmit({
      name: name.trim(),
      siteUrl: siteUrl.trim(),
      persona: persona.trim(),
      brief: brief.trim(),
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      >
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xl space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
        >
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">Create a new project</h3>
            <p className="text-sm text-slate-500">Define a workspace for a site, funnel, or client.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Project name *</label>
              <input
                className="input-field"
                placeholder="e.g., Investir Mexique"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Site URL</label>
                <input
                  className="input-field"
                  placeholder="https://example.com"
                  value={siteUrl}
                  onChange={(event) => setSiteUrl(event.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Default persona</label>
                <input
                  className="input-field"
                  placeholder="Choose a persona"
                  value={persona}
                  onChange={(event) => setPersona(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Brief instructions</label>
              <textarea
                className="textarea-field"
                placeholder="These instructions will be applied to every content generated for this project"
                rows={4}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2 px-5"
              disabled={isSubmitting}
            >
              <FaPlus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Creating...' : 'Register'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  )
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog: 'Article',
  'product-review': 'Product sheet',
  comparison: 'Comparison',
  affiliate: 'Affiliate',
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [allContents, setAllContents] = useState<ContentItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)

  const loadData = async () => {
    setIsLoading(true)

    try {
      const [projectsRes, contentsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/contents'),
      ])

      if (projectsRes.ok) {
        const payload = await projectsRes.json()
        setProjects(payload.projects || [])
        if ((!selectedProjectId || !payload.projects?.some((project: Project) => project.id === selectedProjectId)) && payload.projects?.length) {
          setSelectedProjectId(payload.projects[0].id)
        }
      }

      if (contentsRes.ok) {
        const payload = await contentsRes.json()
        setAllContents(payload.contents || [])
      }
    } catch (error) {
      console.error('Failed to load projects', error)
      toast.error('Unable to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  )

  const projectContents = useMemo(
    () => allContents.filter((item) => item.project_id === selectedProjectId),
    [allContents, selectedProjectId]
  )

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects
    return projects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [projects, searchTerm])

  const contentCounts = useMemo(() => {
    return allContents.reduce<Record<string, number>>((acc, item) => {
      acc[item.project_id] = (acc[item.project_id] || 0) + 1
      return acc
    }, {})
  }, [allContents])

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  const handleCreateProject = async (payload: {
    name: string
    siteUrl: string
    persona: string
    brief: string
  }) => {
    try {
      setIsSubmittingModal(true)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          siteUrl: payload.siteUrl,
          persona: payload.persona,
          brief: payload.brief,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      const newProject: Project = data.project
      setProjects((prev) => [newProject, ...prev])
      setSelectedProjectId(newProject.id)
      toast.success('Project created')
      setIsModalOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = confirm('Delete this project and all associated content?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }

      setProjects((prev) => {
        const next = prev.filter((project) => project.id !== projectId)
        if (selectedProjectId === projectId) {
          setSelectedProjectId(next.length ? next[0].id : null)
        }
        return next
      })

      setAllContents((prev) => prev.filter((item) => item.project_id !== projectId))

      toast.success('Project deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project')
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Content copied to clipboard')
  }

  const handleDownloadContent = (item: ContentItem) => {
    const blob = new Blob([item.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${item.title || 'content'}-${item.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Content downloaded')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Projects</h2>
            <p className="text-xs text-slate-500">Organize content by brand, site, or client.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
              disabled={isLoading}
            >
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <FaPlus className="h-3.5 w-3.5" />
              New project
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            className="input-field pl-4 text-sm"
            placeholder="Search projects"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <div className="loading-dots text-indigo-500">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-slate-300">
              <p className="text-sm">No projects yet.</p>
              <p className="text-xs text-slate-400">Create your first project to start organizing content.</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isActive = selectedProjectId === project.id
              const count = contentCounts[project.id] || 0

              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-50/70 text-slate-900 shadow-sm'
                      : 'border-transparent bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{project.name}</div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {count} content{count === 1 ? '' : 's'}
                    </span>
                  </div>
                  {project.site_url && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-indigo-500">
                      <FaExternalLinkAlt className="h-3 w-3" />
                      <span className="truncate">{project.site_url}</span>
                    </div>
                  )}
                  {project.persona && (
                    <div className="mt-1 text-xs text-slate-400">Persona: {project.persona}</div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        {selectedProject ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedProject.name}</h3>
                <div className="mt-1 text-sm text-slate-500">
                  {selectedProject.brief ? selectedProject.brief : 'No global brief defined for this project yet.'}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {selectedProject.site_url && (
                    <a
                      href={selectedProject.site_url.startsWith('http') ? selectedProject.site_url : `https://${selectedProject.site_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-indigo-500 hover:border-indigo-300 hover:text-indigo-600"
                    >
                      <FaExternalLinkAlt className="h-3 w-3" />
                      Visit site
                    </a>
                  )}
                  {selectedProject.persona && (
                    <span className="rounded-full border border-slate-200 px-3 py-1">Persona: {selectedProject.persona}</span>
                  )}
                  <span className="rounded-full border border-slate-200 px-3 py-1">
                    Created {new Date(selectedProject.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <FaTrash className="mr-2 inline h-3 w-3" />
                Delete project
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Project summary</h4>
                <span className="text-xs text-slate-400">Last update {new Date(selectedProject.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-400">Contents</div>
                  <div className="text-2xl font-semibold text-slate-900">{projectContents.length}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-400">Published</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {projectContents.filter((item) => item.is_published).length}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-400">Drafts</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {projectContents.filter((item) => item.status === 'draft').length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Content library</h4>
                  <p className="text-xs text-slate-400">All assets generated inside this project.</p>
                </div>
                <div className="text-xs text-slate-400">{projectContents.length} item{projectContents.length === 1 ? '' : 's'}</div>
              </div>

              {projectContents.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-slate-300">
                  <p className="text-sm">No content generated yet.</p>
                  <p className="text-xs text-slate-400">Use the generator to produce the first article for this project.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Title</th>
                        <th className="px-6 py-3 text-left font-semibold">Type</th>
                        <th className="px-6 py-3 text-left font-semibold">Status</th>
                        <th className="px-6 py-3 text-left font-semibold">Updated</th>
                        <th className="px-6 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectContents.map((item) => (
                        <tr key={item.id} className="hover:bg-indigo-50/40">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{item.title}</div>
                            {item.keywords && (
                              <div className="text-xs text-slate-400">{item.keywords}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                STATUS_BADGE[item.status] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(item.updated_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleCopyContent(item.content)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                                title="Copy"
                              >
                                <FaCopy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadContent(item)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                                title="Download"
                              >
                                <FaDownload className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-300">
            <p className="text-base">Select a project to see its content library.</p>
            <p className="text-sm text-slate-400">Projects help you group AI content by site, brand, or client.</p>
          </div>
        )}
      </div>

      <ProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmittingModal}
      />
    </div>
  )
}


