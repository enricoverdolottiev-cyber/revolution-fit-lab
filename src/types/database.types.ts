/**
 * Database Types for Revolution Fit Lab
 * 
 * Questi tipi riflettono la struttura della tabella 'bookings' su Supabase.
 * Aggiorna questo file se la struttura del database cambia.
 */

export interface Booking {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  class_type: string
  status?: string // default: 'pending'
  user_id?: string // Opzionale: collegamento all'utente loggato
}

export interface Profile {
  id: string
  user_id: string
  role: 'admin' | 'customer'
  created_at: string
  updated_at?: string
}

/**
 * Tipo helper per il database Supabase.
 * Estende i tipi generici di Supabase con le nostre tabelle.
 * La struttura deve corrispondere esattamente a quella attesa da Supabase.
 */
export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id'> & { created_at?: string }
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

