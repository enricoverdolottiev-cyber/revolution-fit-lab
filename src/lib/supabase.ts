import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Typed Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>

let supabase: TypedSupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ ATTENZIONE: Supabase keys missing, backend disabled.')
  console.warn('⚠️ Controlla il file .env e assicurati che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano impostati.')
  console.warn('⚠️ L\'app funzionerà in modalità provvisoria senza autenticazione.')
} else {
  try {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client inizializzato correttamente')
  } catch (err) {
    console.error('❌ Errore nell\'inizializzazione Supabase:', err)
    supabase = null
  }
}

export { supabase }
