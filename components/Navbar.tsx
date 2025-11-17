'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBars,
  FaTimes,
  FaHome,
  FaMagic,
  FaShoppingCart,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaCoins,
} from 'react-icons/fa'
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

interface NavLink {
  id: string
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navLinks: NavLink[] = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: FaHome },
  { id: 'generate', href: '/', label: 'Generate Content', icon: FaMagic },
  { id: 'buy-credits', href: '/buy-credits', label: 'Buy Credits', icon: FaShoppingCart },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const { data: balanceData } = useSWR(
    session ? '/api/credits/balance' : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  const credits = balanceData?.balance ?? 0

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [pathname])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu') && !target.closest('.user-menu-button')) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCreditColor = () => {
    if (credits === 0) return 'bg-red-100 text-red-700 border-red-200'
    if (credits < 1000) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (!session) return null

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200'
            : 'bg-white border-b border-slate-200'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative h-10 w-32">
                <Image
                  src="/proai-writer.svg"
                  alt="ProAI Writer"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Right Side: Credits + User Menu */}
            <div className="flex items-center gap-3">
              {/* Credits Badge */}
              <Link
                href="/buy-credits"
                className={`hidden sm:flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:scale-105 ${getCreditColor()}`}
              >
                <FaCoins className="h-4 w-4" />
                <span>{credits.toLocaleString()}</span>
              </Link>

              {/* Desktop User Menu */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="user-menu-button flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                    <FaUser className="h-4 w-4" />
                  </div>
                  <span className="max-w-[120px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="user-menu absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FaCog className="h-4 w-4" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FaSignOutAlt className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="h-5 w-5" />
                ) : (
                  <FaBars className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white"
            >
              <div className="space-y-1 px-4 py-4">
                {/* Mobile Credits Badge */}
                <Link
                  href="/buy-credits"
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${getCreditColor()}`}
                >
                  <span className="flex items-center gap-2">
                    <FaCoins className="h-4 w-4" />
                    Credits
                  </span>
                  <span>{credits.toLocaleString()}</span>
                </Link>

                {/* Mobile Nav Links */}
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}

                {/* Mobile User Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="mb-3 px-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {session.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FaCog className="h-5 w-5" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}

