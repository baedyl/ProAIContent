/**
 * NextAuth Configuration
 * Handles authentication with Supabase
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin, createDefaultUserSettings } from './supabase'

export const authOptions: NextAuthOptions = {
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

        try {
          // Sign in with Supabase
          const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            throw new Error('Invalid credentials')
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
          }
        } catch (error: any) {
          console.error('Auth error:', error)
          throw new Error(error.message || 'Authentication failed')
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        
        // Create default settings for new users
        try {
          await createDefaultUserSettings(user.id)
        } catch (error) {
          console.error('Error creating default settings:', error)
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins (Google, etc.)
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(user.email)
          
          if (!existingUser.user) {
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}

