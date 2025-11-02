'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaMagic, FaInfoCircle, FaStar, FaRobot, FaSearch, FaQuestionCircle, FaYoutube } from 'react-icons/fa'
import { getAllPersonas } from '@/lib/personas'

interface GenerationFormProps {
  contentType: string
  onGenerate: (formData: any) => void
  isGenerating: boolean
}

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'persuasive', label: 'Persuasive' }
]

const styles = [
  { value: 'informative', label: 'Informative' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'listicle', label: 'Listicle' },
  { value: 'how-to', label: 'How-To Guide' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'entertaining', label: 'Entertaining' }
]

const lengths = [
  { value: 'short', label: 'Short (500-800 words)' },
  { value: 'medium', label: 'Medium (800-1500 words)' },
  { value: 'long', label: 'Long (1500-2500 words)' },
  { value: 'extra-long', label: 'Extra Long (2500+ words)' }
]

export default function GenerationForm({ contentType, onGenerate, isGenerating }: GenerationFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    keywords: '',
    tone: 'professional',
    style: 'informative',
    length: 'medium',
    targetAudience: '',
    additionalInstructions: '',
    // Advanced options
    personaId: 'default',
    useSerpAnalysis: false,
    includeCompetitorHeaders: false,
    includeFAQ: false,
    includeVideo: false,
    location: 'us'
  })

  const personas = getAllPersonas()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.checked
    }))
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm space-y-6"
    >
      <div className="space-y-4">
        {/* Topic */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Topic / Subject *
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="e.g., Best wireless headphones for 2025"
            className="input-field"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Enter the main topic or subject of your content
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Target Keywords (SEO)
          </label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="e.g., wireless headphones, bluetooth, noise cancelling"
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">
            Comma-separated keywords for SEO optimization
          </p>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tone
          </label>
          <select
            name="tone"
            value={formData.tone}
            onChange={handleChange}
            className="input-field"
          >
            {tones.map(tone => (
              <option key={tone.value} value={tone.value}>
                {tone.label}
              </option>
            ))}
          </select>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Writing Style
          </label>
          <select
            name="style"
            value={formData.style}
            onChange={handleChange}
            className="input-field"
          >
            {styles.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Length */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Content Length
          </label>
          <select
            name="length"
            value={formData.length}
            onChange={handleChange}
            className="input-field"
          >
            {lengths.map(length => (
              <option key={length.value} value={length.value}>
                {length.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleChange}
            placeholder="e.g., Tech enthusiasts, age 25-40"
            className="input-field"
          />
          <p className="text-xs text-slate-500 mt-1">
            Who is this content for?
          </p>
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Additional Instructions
          </label>
          <textarea
            name="additionalInstructions"
            value={formData.additionalInstructions}
            onChange={handleChange}
            placeholder="Any specific requirements, points to include, or style preferences..."
            className="textarea-field"
            rows={4}
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            <FaStar className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4"
          >
            {/* Persona Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FaRobot className="text-primary-600" />
                Writer Persona
              </label>
              <select
                name="personaId"
                value={formData.personaId}
                onChange={handleChange}
                className="input-field"
              >
                {personas.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} - {persona.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Choose a pre-configured writing personality and style
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Target Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field"
              >
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="fr">France</option>
                <option value="de">Germany</option>
                <option value="br">Brazil</option>
              </select>
            </div>

            {/* Advanced Features Checkboxes */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span role="img" aria-label="sparkles">✨</span>
                Advanced SEO & content features
              </p>

              {/* SERP Analysis */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="useSerpAnalysis"
                  checked={formData.useSerpAnalysis}
                  onChange={handleCheckboxChange}
                  className="mt-1 w-4 h-4 text-primary-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FaSearch className="text-primary-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                      SERP Analysis
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Analyze top-ranking Google results for competitive insights
                  </p>
                </div>
              </label>

              {/* Competitor Headers */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="includeCompetitorHeaders"
                  checked={formData.includeCompetitorHeaders}
                  onChange={handleCheckboxChange}
                  disabled={!formData.useSerpAnalysis}
                  className="mt-1 w-4 h-4 text-primary-600 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FaInfoCircle className="text-accent-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                      Extract Competitor Headers
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Analyze header structures from top-ranking pages (requires SERP Analysis)
                  </p>
                </div>
              </label>

              {/* Auto-FAQ */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="includeFAQ"
                  checked={formData.includeFAQ}
                  onChange={handleCheckboxChange}
                  disabled={!formData.useSerpAnalysis}
                  className="mt-1 w-4 h-4 text-primary-600 rounded disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FaQuestionCircle className="text-green-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                      Auto-Generate FAQ
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Create FAQ from "People Also Ask" with schema markup (requires SERP Analysis)
                  </p>
                </div>
              </label>

              {/* YouTube Video */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="includeVideo"
                  checked={formData.includeVideo}
                  onChange={handleCheckboxChange}
                  className="mt-1 w-4 h-4 text-primary-600 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FaYoutube className="text-red-600" />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                      Embed YouTube Video
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Automatically find and embed a relevant YouTube video
                  </p>
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </div>

      {/* SEO & Humanization Info */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <FaInfoCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-700 space-y-1">
            <p className="font-semibold">Automatic optimization</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
              <li>SEO semantic optimization for SERP ranking</li>
              <li>Content humanization to bypass AI detection</li>
              <li>Natural language patterns and varied sentence structures</li>
              <li>Unique content with zero plagiarism</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        disabled={isGenerating || !formData.topic}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <FaMagic className={isGenerating ? 'animate-spin' : ''} />
        <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
      </button>

      {/* Credits Info */}
      <p className="text-center text-xs text-slate-500">
        This will use approximately 5-10 credits depending on length
      </p>
    </motion.form>
  )
}


