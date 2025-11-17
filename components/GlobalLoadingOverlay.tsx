'use client'

import { motion } from 'framer-motion'

export default function GlobalLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-6 py-8 shadow-2xl"
      >
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-center text-sm font-semibold text-slate-900">
          Preparing your dashboard…
        </p>
        <p className="text-center text-xs text-slate-500">
          Loading your content and insights. This will only take a moment.
        </p>
      </motion.div>
    </div>
  )
}


