/**
 * NextAuth Configuration
 * Handles authentication with Supabase
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import {
  supabaseAdmin,
  createDefaultUserSettings,
  awardTrialCreditsIfNeeded,
  getUserCreditBalance,
} from './supabase'
import { checkRateLimit, resetRateLimit } from './auth-rate-limit'

type SessionUserWithCredits = Session['user'] & {
  creditsBalance?: number | null
}

export const authOptions = {
  providers: [
    // Email & Password Authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Rate limiting: 5 attempts per 15 minutes
        const rateLimitResult = checkRateLimit(credentials.email, {
          maxAttempts: 5,
          windowMs: 15 * 60 * 1000, // 15 minutes
        })

        if (!rateLimitResult.success) {
          throw new Error(rateLimitResult.error || 'Too many login attempts')
        }

        try {
          // Sign in with Supabase
          const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            throw new Error('Invalid credentials')
          }

          // Reset rate limit on successful login
          resetRateLimit(credentials.email)

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Authentication failed'
          console.error('Auth error:', message)
          throw new Error(message)
        }
      },
    }),

    // Google OAuth (optional - requires setup)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      try {
        if (user) {
          let supabaseUserId = user.id as string | undefined

          if (account?.provider === 'google' && user.email) {
            const { data: existingUsers, error } = await supabaseAdmin.auth.admin.listUsers()
            if (error) {
              console.error('Error fetching Supabase user for Google sign-in:', error)
            }
            const existingUser = existingUsers?.users?.find((u) => u.email === user.email)
            if (existingUser) {
              supabaseUserId = existingUser.id
              token.email = existingUser.email
            }
          }

          if (!supabaseUserId && user.email) {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users?.find((u) => u.email === user.email)
            if (existingUser) {
              supabaseUserId = existingUser.id
            }
          }

          if (supabaseUserId) {
            token.id = supabaseUserId
            token.email = user.email
            token.name = user.name

            try {
              const profile = await awardTrialCreditsIfNeeded(supabaseUserId, user.email || user.name || supabaseUserId)
              await createDefaultUserSettings(supabaseUserId)
              token.creditsBalance = profile.credits_balance
            } catch (initializationError) {
              console.error('Error initializing user profile:', initializationError)
            }
          }
        }

        if (token.id) {
          try {
            token.creditsBalance = await getUserCreditBalance(token.id as string)
          } catch (balanceError) {
            console.error('Error fetching credit balance:', balanceError)
          }
        }
      } catch (error) {
        console.error('JWT callback error:', error)
      }

      return token
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        const sessionUser = session.user as SessionUserWithCredits

        // Ensure we always set the id from token
        sessionUser.id = (token.id || token.sub) as string
        sessionUser.email = (token.email || session.user.email) as string
        sessionUser.name = (token.name || session.user.name) as string
        sessionUser.creditsBalance = token.creditsBalance ?? null

        // Debug logging for production issues
        if (!sessionUser.id) {
          console.error('Session callback: No user ID available', { token, session })
        }
      }

      return session
    },

    async signIn({ user, account }: { user: any; account: any }) {
      // Handle OAuth sign-ins (Google, etc.)
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in Supabase - use listUsers since getUserByEmail doesn't exist
          const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = allUsers?.users?.find((u: any) => u.email === user.email)
          
          if (!existingUser) {
            // Create user in Supabase if doesn't exist
            const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              email_confirm: true,
              user_metadata: {
                name: user.name,
                avatar: user.image,
              }
            })

            if (error) {
              console.error('Error creating user:', error)
              return false
            }

            if (newUser.user) {
              await createDefaultUserSettings(newUser.user.id)
            }
          }
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
      }
      return true
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours (1 day)
  },

  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
}

