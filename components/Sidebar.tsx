'use client'

import { ComponentType } from 'react'
import {
  FaClipboardList,
  FaCogs,
  FaFolderOpen,
  FaHome,
  FaLink,
  FaMagic,
  FaRegFileAlt,
  FaRocket,
  FaRss,
  FaShoppingBag,
  FaShoppingCart,
  FaUsers,
} from 'react-icons/fa'

interface SidebarProps {
  activeSection: string
  onSectionChange: (tab: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  description?: string
  disabled?: boolean
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Project',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: FaHome },
        { id: 'contents', label: 'Contents', icon: FaRegFileAlt },
        { id: 'projects', label: 'Projects', icon: FaFolderOpen },
        { id: 'personas', label: 'Personas', icon: FaUsers, disabled: true },
      ],
    },
    {
      title: 'Our fashions',
      items: [
        { id: 'articles-mode', label: 'Article', icon: FaRocket, disabled: true },
        { id: 'affiliation-mode', label: 'Affiliation', icon: FaShoppingCart, disabled: true },
        { id: 'ecommerce-mode', label: 'E-commerce', icon: FaShoppingBag, disabled: true },
        { id: 'discover-mode', label: 'Discover', icon: FaMagic, disabled: true },
      ],
    },
    {
      title: 'Triggers',
      items: [{ id: 'rss-trigger', label: 'RSS feed', icon: FaRss, disabled: true }],
    },
    {
      title: 'My account',
      items: [
        { id: 'connections', label: 'Connections', icon: FaLink, disabled: true },
        { id: 'account', label: 'Account', icon: FaClipboardList, disabled: true },
        { id: 'affiliation', label: 'Affiliation', icon: FaShoppingCart, disabled: true },
        { id: 'api', label: 'API', icon: FaCogs, disabled: true },
      ],
    },
  ]

  return (
    <nav className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50">
            <FaMagic className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Magic Studio</p>
            <h2 className="text-lg font-bold text-slate-900">Guided creation</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Navigate your workspace, launch new projects, and monitor performance in one intuitive hub.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                const disabledClasses = item.disabled ? 'cursor-not-allowed opacity-50' : ''

                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && onSectionChange(item.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 shadow-md shadow-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-white'
                    } ${disabledClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isActive && !item.disabled ? (
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Active</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}


