import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Typed Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>

let supabase: TypedSupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase keys missing, backend disabled. Check your .env file.')
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export { supabase }
