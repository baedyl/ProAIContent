'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSpinner } from 'react-icons/fa'

type RouterWithPending = ReturnType<typeof useRouter> & { isPending?: boolean }

export default function GlobalLoadingOverlay() {
  const router = useRouter() as RouterWithPending
  const isLoading = router.isPending ?? false

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="global-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-6 py-8 shadow-2xl">
            <FaSpinner className="animate-spin text-indigo-600" size={32} />
            <p className="text-center text-sm font-semibold text-slate-900">
              Loading page content…
            </p>
            <p className="text-center text-xs text-slate-500">
              This happens whenever you use the sidebar or navigate between pages.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

