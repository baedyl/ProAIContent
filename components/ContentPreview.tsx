'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ContentPreviewProps {
  content: string
}

export default function ContentPreview({ content }: ContentPreviewProps) {
  const [showFormatted, setShowFormatted] = useState(true)

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-semibold text-slate-900 mt-6 mb-4">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold text-slate-900 mt-5 mb-3">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-slate-900 mt-4 mb-2">{line.slice(4)}</h3>
        }
        
        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={index} className="text-slate-600 ml-6 mb-1">{line.slice(2)}</li>
        }
        if (/^\d+\.\s/.test(line)) {
          return <li key={index} className="text-slate-600 ml-6 mb-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
        }
        
        // Bold text
        let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        
        // Regular paragraphs
        return (
          <p 
            key={index} 
            className="text-slate-600 mb-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        )
      })
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


