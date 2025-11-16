'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-indigo-100 bg-white/95 p-8 w-full max-w-md shadow-xl shadow-indigo-200/60 text-center"
        >
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <FaEnvelope className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">
            Check your email
          </h1>
          <p className="text-slate-500 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-slate-400 mb-6">
            The link will expire in 1 hour. If you don't see the email, check your spam folder.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Login
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-indigo-100 bg-white/95 p-8 w-full max-w-md shadow-xl shadow-indigo-200/60"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 h-16 w-full flex-shrink-0">
            <Image 
              src="/proai-writer.svg" 
              alt="ProAI Writer logo" 
              fill
              className="object-contain drop-shadow-lg" 
              priority 
            />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-12"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <FaArrowLeft className="h-3 w-3" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

