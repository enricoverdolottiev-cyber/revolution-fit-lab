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

export interface AddressObject {
  street?: string
  city?: string
  zip?: string
  country?: string
}

export interface Profile {
  id: string // Colonna primaria (corrisponde all'id dell'utente auth)
  role: 'admin' | 'customer'
  full_name?: string | null // Nome completo
  created_at: string
  updated_at?: string
  address?: AddressObject | null // Indirizzo di spedizione (jsonb)
}

export interface TechSpecsObject {
  [key: string]: string // Es. { "Materiale": "Silicone", "Tessuto": "4-way stretch" }
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[] | string // Array di URL immagini o stringa singola
  materials: string
  tech_specs: string | TechSpecsObject // Può essere stringa o oggetto JSONB
  sizes: string[] | string // Array di taglie o stringa singola
  colors: string[] | string // Array di colori o stringa singola
  created_at: string
  updated_at?: string
}

export interface Order {
  id: string
  user_id: string
  product_id: string
  quantity: number
  size: string
  color: string
  total_price: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  shipping_address: string // Indirizzo completo di spedizione
  created_at: string
  updated_at?: string
}

export interface WorkSchedule {
  [key: string]: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

export interface Instructor {
  id: string
  full_name: string
  role?: string
  bio?: string
  image?: string
  instagram?: string
  linkedin?: string
  work_schedule?: WorkSchedule
  created_at: string
  updated_at?: string
}

export interface ClassType {
  id: string
  name: string
  description?: string
  duration_minutes?: number
  max_capacity?: number
  price?: number
  created_at: string
  updated_at?: string
}

export interface ClassSession {
  id: string
  class_type_id: string
  instructor_id: string
  start_time: string // ISO datetime string (yyyy-MM-ddTHH:mm:ss)
  end_time: string // ISO datetime string (yyyy-MM-ddTHH:mm:ss)
  max_capacity: number
  enrolled_count?: number // Calcolato da bookings
  created_at: string
  updated_at?: string
}

export interface UserSubscription {
  id: string
  user_id: string
  type: 'drop-in' | 'pack-10' | 'membership' | string
  status: 'active' | 'expired' | 'cancelled'
  expiry_date: string // ISO datetime string
  created_at: string
  updated_at?: string
}

export interface CheckIn {
  id: string
  user_id: string
  status: 'granted' | 'denied'
  reason?: string | null // Motivo del diniego (es. "Abbonamento scaduto", "Utente non trovato")
  admin_id?: string | null // ID dell'admin che ha scansionato (opzionale)
  created_at: string
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
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>> & { updated_at?: string }
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Order, 'id' | 'user_id' | 'created_at'>> & { updated_at?: string }
      }
      instructors: {
        Row: Instructor
        Insert: Omit<Instructor, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<Instructor, 'id' | 'created_at'>> & { updated_at?: string }
      }
      class_types: {
        Row: ClassType
        Insert: Omit<ClassType, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<ClassType, 'id' | 'created_at'>> & { updated_at?: string }
      }
      class_sessions: {
        Row: ClassSession
        Insert: Omit<ClassSession, 'id' | 'created_at' | 'updated_at' | 'enrolled_count'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<ClassSession, 'id' | 'created_at'>> & { updated_at?: string }
      }
      user_subscriptions: {
        Row: UserSubscription
        Insert: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Omit<UserSubscription, 'id' | 'user_id' | 'created_at'>> & { updated_at?: string }
      }
      check_ins: {
        Row: CheckIn
        Insert: Omit<CheckIn, 'id' | 'created_at'> & { created_at?: string }
        Update: Partial<Omit<CheckIn, 'id' | 'user_id' | 'created_at'>>
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

