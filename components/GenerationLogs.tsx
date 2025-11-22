'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaTerminal,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCopy,
} from 'react-icons/fa'
import toast from 'react-hot-toast'

export interface GenerationLog {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error' | 'processing'
  message: string
  details?: string
}

interface GenerationLogsProps {
  logs: GenerationLog[]
  isGenerating: boolean
  onMinimize?: () => void
  isMinimized?: boolean
}

export default function GenerationLogs({
  logs,
  isGenerating,
  onMinimize,
  isMinimized = false,
}: GenerationLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight
    setAutoScroll(isAtBottom)
  }

  const getLevelIcon = (level: GenerationLog['level']) => {
    switch (level) {
      case 'success':
        return <FaCheck className="text-green-500" />
      case 'error':
        return <FaTimes className="text-red-500" />
      case 'warning':
        return <span className="text-yellow-500">⚠</span>
      case 'processing':
        return <FaSpinner className="text-blue-500 animate-spin" />
      default:
        return <span className="text-slate-400">•</span>
    }
  }

  const getLevelColor = (level: GenerationLog['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      case 'processing':
        return 'text-blue-400'
      default:
        return 'text-slate-300'
    }
  }

  const handleCopyLogs = () => {
    const logsText = logs
      .map(
        (log) =>
          `[${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}${
            log.details ? `\n  ${log.details}` : ''
          }`
      )
      .join('\n')
    navigator.clipboard.writeText(logsText)
    toast.success('Logs copied to clipboard!')
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onMinimize}
          className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white shadow-lg hover:bg-slate-700 transition-all"
        >
          <FaTerminal className="text-green-400" />
          <span className="font-mono text-sm">
            Generation Logs {isGenerating && <FaSpinner className="inline ml-2 animate-spin" />}
          </span>
          <FaChevronUp />
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white">
            <FaTerminal className="text-green-400" />
            <span className="font-mono text-sm font-semibold">Generation Logs</span>
            {isGenerating && (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <FaSpinner className="animate-spin" />
                Processing...
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="Copy logs"
          >
            <FaCopy className="h-4 w-4" />
          </button>
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              title="Minimize"
            >
              <FaChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div
        className="h-96 overflow-y-auto bg-slate-950 p-4 font-mono text-sm"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #0f172a',
        }}
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            <p>Waiting for generation to start...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 pt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-500 text-xs">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                      <span className={`${getLevelColor(log.level)} break-words`}>
                        {log.message}
                      </span>
                    </div>
                    {log.details && (
                      <div className="mt-1 pl-4 text-slate-400 text-xs border-l-2 border-slate-700">
                        {log.details}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        )}

        {/* Auto-scroll indicator */}
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true)
              logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="fixed bottom-24 right-8 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 transition-all"
          >
            ↓ Scroll to bottom
          </button>
        )}
      </div>

      {/* Footer Status */}
      <div className="border-t border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-400">
        <span>{logs.length} log entries</span>
        {isGenerating && <span className="ml-4">• Generation in progress</span>}
      </div>
    </motion.div>
  )
}

