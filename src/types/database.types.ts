/**
 * Database Types for Revolution Fit Lab
 * 
 * Questi tipi riflettono la struttura della tabella 'bookings' su Supabase.
 * Aggiorna questo file se la struttura del database cambia.
 */

export interface Booking {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  class_name: string
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

