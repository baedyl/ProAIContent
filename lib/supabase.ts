/**
 * Supabase Client Configuration
 * Handles database connections and authentication
 */

import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Client-side Supabase client
 * Use this in browser/client components
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Server-side Supabase admin client
 * Use this in API routes and server components
 * Has elevated privileges
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Create a Supabase client for use in Client Components
 */
export function createSupabaseClient() {
  return createClientComponentClient()
}

/**
 * Database Types
 */
export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          default_tone: string
          default_style: string
          default_length: string
          preferred_persona: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          default_tone?: string
          default_style?: string
          default_length?: string
          preferred_persona?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          default_tone?: string
          default_style?: string
          default_length?: string
          preferred_persona?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string | null
          site_url: string | null
          persona: string | null
          status: string | null
          brief: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug?: string | null
          site_url?: string | null
          persona?: string | null
          status?: string | null
          brief?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string | null
          site_url?: string | null
          persona?: string | null
          status?: string | null
          brief?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      project_contents: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          content_type: string
          status: string
          is_published: boolean
          published_at: string | null
          content: string
          keywords: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          content_type: string
          status?: string
          is_published?: boolean
          published_at?: string | null
          content: string
          keywords?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string
          content_type?: string
          status?: string
          is_published?: boolean
          published_at?: string | null
          content?: string
          keywords?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          credits_used?: number
          created_at?: string
        }
      }
    }
  }
}

/**
 * Helper functions for common database operations
 */

// Get user settings
export async function getUserSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user settings:', error)
    return null
  }

  return data
}

// Create default user settings
export async function createDefaultUserSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      user_id: userId,
      theme: 'light',
      default_tone: 'professional',
      default_style: 'informative',
      default_length: 'medium',
      preferred_persona: 'default'
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error creating user settings:', error)
    return null
  }

  return data
}

// Update user settings
export async function updateUserSettings(userId: string, settings: any) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user settings:', error)
    return null
  }

  return data
}

// Get user projects
export async function getUserProjects(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

export async function getProjectContents(userId: string, projectId?: string) {
  let query = supabaseAdmin
    .from('project_contents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching project contents:', error)
    return []
  }

  return data || []
}

export async function logUsage(userId: string, action: string, creditsUsed: number = 0) {
  const { error } = await supabaseAdmin
    .from('usage_logs')
    .insert({
      user_id: userId,
      action,
      credits_used: creditsUsed
    })

  if (error) {
    console.error('Error logging usage:', error)
  }
}

