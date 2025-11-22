'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaCog, FaSignOutAlt, FaChartLine, FaFolder } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading') {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-secondary text-sm px-4 py-2">
          Sign In
        </Link>
        <Link href="/register" className="btn-primary text-sm px-4 py-2">
          Sign Up
        </Link>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold flex items-center justify-center hover:shadow-lg transition-shadow"
      >
        {userInitial.toUpperCase()}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 glass-effect rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold flex items-center justify-center text-lg">
                  {userInitial.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaChartLine className="text-gray-600" />
                <span className="text-gray-800">Dashboard</span>
              </Link>

              <Link
                href="/workspace"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaFolder className="text-gray-600" />
                <span className="text-gray-800">My Projects</span>
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <FaCog className="text-gray-600" />
                <span className="text-gray-800">Settings</span>
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
              >
                <FaSignOutAlt className="text-red-600" />
                <span className="text-red-600 font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

