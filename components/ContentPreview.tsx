'use client'

import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface ContentPreviewProps {
  content: string
}

export default function ContentPreview({ content }: ContentPreviewProps) {
  const [showFormatted, setShowFormatted] = useState(true)

  const sanitizeContent = (text: string) => {
    let sanitized = text
    
    // Remove style and script tags with their content
    sanitized = sanitized.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    
    // Remove all HTML tags (opening and closing) but keep the content
    // This regex matches any HTML tag including those with attributes
    sanitized = sanitized.replace(/<[^>]+>/g, '')
    
    // Decode common HTML entities
    sanitized = sanitized
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
    
    return sanitized
  }

  const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
    const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)

    return segments.filter(Boolean).map((segment, idx) => {
      const key = `${keyPrefix}-${idx}`

      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={`${key}-strong`} className="font-semibold">{segment.slice(2, -2)}</strong>
      }

      if (segment.startsWith('*') && segment.endsWith('*')) {
        return <em key={`${key}-em`} className="italic">{segment.slice(1, -1)}</em>
      }

      if (segment.startsWith('`') && segment.endsWith('`')) {
        return (
          <code
            key={`${key}-code`}
            className="rounded bg-slate-100 px-1 py-0.5 text-xs font-medium text-slate-600"
          >
            {segment.slice(1, -1)}
          </code>
        )
      }

      const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        return (
          <a
            key={`${key}-link`}
            href={linkMatch[2]}
            className="text-indigo-600 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        )
      }

      return <span key={`${key}-text`}>{segment}</span>
    })
  }

  const formatContent = (text: string) => {
    const sanitized = sanitizeContent(text)
    const lines = sanitized.split('\n')

    const elements: ReactNode[] = []
    let unorderedBuffer: ReactNode[] = []
    let orderedBuffer: ReactNode[] = []
    let keyCounter = 0

    const nextKey = (prefix: string) => `${prefix}-${keyCounter++}`

    const flushUnordered = () => {
      if (unorderedBuffer.length) {
        elements.push(
          <ul
            key={nextKey('ul')}
            className="ml-6 list-disc space-y-1 text-slate-600 marker:text-slate-400"
          >
            {unorderedBuffer}
          </ul>
        )
        unorderedBuffer = []
      }
    }

    const flushOrdered = () => {
      if (orderedBuffer.length) {
        elements.push(
          <ol
            key={nextKey('ol')}
            className="ml-6 list-decimal space-y-1 text-slate-600 marker:text-slate-400"
          >
            {orderedBuffer}
          </ol>
        )
        orderedBuffer = []
      }
    }

    const flushLists = () => {
      flushUnordered()
      flushOrdered()
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      const baseKey = nextKey(`line-${index}`)

      if (!trimmed) {
        flushLists()
        elements.push(<br key={`${baseKey}-break`} />)
        return
      }

      if (trimmed.startsWith('# ')) {
        flushLists()
        elements.push(
          <h1 key={`${baseKey}-h1`} className="mt-6 mb-4 text-3xl font-semibold text-slate-900">
            {trimmed.slice(2).trim()}
          </h1>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        flushLists()
        elements.push(
          <h2 key={`${baseKey}-h2`} className="mt-5 mb-3 text-2xl font-semibold text-slate-900">
            {trimmed.slice(3).trim()}
          </h2>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        flushLists()
        elements.push(
          <h3 key={`${baseKey}-h3`} className="mt-4 mb-2 text-xl font-semibold text-slate-900">
            {trimmed.slice(4).trim()}
          </h3>
        )
        return
      }

      if (trimmed.startsWith('#### ')) {
        flushLists()
        elements.push(
          <h4 key={`${baseKey}-h4`} className="mt-3 mb-2 text-lg font-semibold text-slate-800">
            {trimmed.slice(5).trim()}
          </h4>
        )
        return
      }

      if (trimmed.startsWith('##### ')) {
        flushLists()
        elements.push(
          <h5 key={`${baseKey}-h5`} className="mt-2 mb-1 text-base font-semibold text-slate-800">
            {trimmed.slice(6).trim()}
          </h5>
        )
        return
      }

      if (trimmed.startsWith('###### ')) {
        flushLists()
        elements.push(
          <h6 key={`${baseKey}-h6`} className="mt-2 mb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
            {trimmed.slice(7).trim()}
          </h6>
        )
        return
      }

      if (/^(-|\*)\s+/.test(trimmed)) {
        flushOrdered()
        unorderedBuffer.push(
          <li key={`${baseKey}-li`}>{renderInline(trimmed.replace(/^(-|\*)\s+/, ''), `${baseKey}-li`)}</li>
        )
        return
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        flushUnordered()
        orderedBuffer.push(
          <li key={`${baseKey}-oli`}>{renderInline(trimmed.replace(/^\d+\.\s+/, ''), `${baseKey}-oli`)}</li>
        )
        return
      }

      if (/^>{1}\s?/.test(trimmed)) {
        flushLists()
        elements.push(
          <blockquote
            key={`${baseKey}-quote`}
            className="border-l-4 border-slate-200 pl-4 italic text-slate-600"
          >
            {renderInline(trimmed.replace(/^>\s?/, ''), `${baseKey}-quote`)}
          </blockquote>
        )
        return
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushLists()
        elements.push(
          <hr key={`${baseKey}-rule`} className="my-6 border-t border-slate-200" />
        )
        return
      }

      flushLists()
      elements.push(
        <p key={`${baseKey}-p`} className="mb-3 leading-relaxed text-slate-600">
          {renderInline(trimmed, `${baseKey}-p`)}
        </p>
      )
    })

    flushLists()

    return elements
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Toggle View */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => setShowFormatted(true)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            showFormatted 
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200/60' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Formatted
        </button>
        <button
          onClick={() => setShowFormatted(false)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            !showFormatted 
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200/60' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Raw
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        {showFormatted ? (
          <div className="space-y-2">
            {formatContent(content)}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-600 font-mono bg-slate-50 border border-slate-200 p-4 rounded-xl">
            {content}
          </pre>
        )}
      </div>

      {/* Content Stats */}
      <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-indigo-600">
            {content.split(/\s+/).filter(w => w.length > 0).length}
          </div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-purple-500">
            {content.length}
          </div>
          <div className="text-xs text-slate-500">Characters</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-emerald-500">
            {Math.ceil(content.split(/\s+/).filter(w => w.length > 0).length / 200)}
          </div>
          <div className="text-xs text-slate-500">Min Read</div>
        </div>
      </div>
    </motion.div>
  )
}


