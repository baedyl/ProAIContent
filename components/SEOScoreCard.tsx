'use client'

import { motion } from 'framer-motion'
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaChartLine } from 'react-icons/fa'

interface SEOScoreBreakdown {
  score: number
  max: number
  feedback: string
}

interface SEOScoreData {
  score: number
  breakdown: Record<string, SEOScoreBreakdown>
  suggestions: string[]
}

interface SEOScoreCardProps {
  seoScore: SEOScoreData
}

export default function SEOScoreCard({ seoScore }: SEOScoreCardProps) {
  const { score, breakdown, suggestions } = seoScore

  // Determine score color and status
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50'
    if (score >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-200'
    if (score >= 60) return 'border-yellow-200'
    return 'border-red-200'
  }

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs Improvement'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <FaCheckCircle className="w-6 h-6 text-green-600" />
    if (score >= 60) return <FaExclamationTriangle className="w-6 h-6 text-yellow-600" />
    return <FaTimesCircle className="w-6 h-6 text-red-600" />
  }

  const getItemScoreColor = (itemScore: number, maxScore: number) => {
    const percentage = (itemScore / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <FaChartLine className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">SEO Score</h3>
          <p className="text-sm text-slate-500">Content optimization analysis</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`rounded-2xl border-2 ${getScoreBorderColor(score)} ${getScoreBgColor(score)} p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getScoreIcon(score)}
            <div>
              <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
                {score}
                <span className="text-2xl">/100</span>
              </div>
              <div className={`text-lg font-semibold ${getScoreColor(score)} mt-1`}>
                {getScoreStatus(score)}
              </div>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="hidden sm:block">
            <div className="w-32 h-32 relative">
              <svg className="transform -rotate-90" width="128" height="128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                  className={getScoreColor(score)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4 mb-6">
        <h4 className="text-lg font-semibold text-slate-900">Score Breakdown</h4>
        {Object.entries(breakdown).map(([category, data]) => {
          const percentage = (data.score / data.max) * 100
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{category}</span>
                <span className={`text-sm font-bold ${getItemScoreColor(data.score, data.max)}`}>
                  {data.score}/{data.max}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    percentage >= 80
                      ? 'bg-green-500'
                      : percentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
              
              {/* Feedback */}
              {data.feedback && (
                <p className="text-xs text-slate-600 italic">{data.feedback}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t-2 border-slate-200 pt-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
            Improvement Suggestions
          </h4>
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span>{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Legend */}
      <div className="mt-6 pt-6 border-t-2 border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <FaCheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-green-600">80-100</span>
            </div>
            <span className="text-slate-600">Excellent</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <FaExclamationTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-600">60-79</span>
            </div>
            <span className="text-slate-600">Good</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <FaTimesCircle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-600">0-59</span>
            </div>
            <span className="text-slate-600">Needs Work</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

