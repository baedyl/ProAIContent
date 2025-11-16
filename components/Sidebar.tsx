'use client'

import { ComponentType } from 'react'
import Link from 'next/link'
import {
  FaClipboardList,
  FaCogs,
  FaFolderOpen,
  FaHome,
  FaLink,
  FaCoins,
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
  creditsBalance?: number
  totalCreditsUsed?: number
  totalContentsGenerated?: number
}

interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  description?: string
  disabled?: boolean
}

export default function Sidebar({ 
  activeSection, 
  onSectionChange, 
  creditsBalance = 0,
  totalCreditsUsed = 0,
  totalContentsGenerated = 0
}: SidebarProps) {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Project',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: FaHome },
        { id: 'contents', label: 'Contents', icon: FaRegFileAlt },
        { id: 'projects', label: 'Projects', icon: FaFolderOpen },
        { id: 'personas', label: 'Personas', icon: FaUsers },
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

  const getCreditColor = () => {
    if (creditsBalance === 0) return 'from-red-50 to-red-100 border-red-200'
    if (creditsBalance < 1000) return 'from-yellow-50 to-yellow-100 border-yellow-200'
    return 'from-green-50 to-green-100 border-green-200'
  }

  const getCreditTextColor = () => {
    if (creditsBalance === 0) return 'text-red-700'
    if (creditsBalance < 1000) return 'text-yellow-700'
    return 'text-green-700'
  }

  return (
    <nav className="space-y-6">
      <div className={`rounded-2xl border bg-gradient-to-br p-6 shadow-sm ${getCreditColor()}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Credits available</p>
          <p className={`mt-1 text-2xl font-semibold ${getCreditTextColor()}`}>
            {creditsBalance.toLocaleString()}
          </p>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Used total</span>
            <span className="font-medium">{totalCreditsUsed.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Contents generated</span>
            <span className="font-medium">{totalContentsGenerated.toLocaleString()}</span>
          </div>
        </div>
        <Link
          href="/buy-credits"
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-500 transition-colors"
        >
          Buy credits
        </Link>
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


