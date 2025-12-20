import { parseISO, getDay, format } from 'date-fns'
import type { ClassType } from '../types/database.types'

// Tipi di classe
export type ClassCategory = 'pilates' | 'personal-training'

// Regole Staff Pilates
export const PILATES_INSTRUCTORS = ['Chiara', 'Anna', 'Emma']
export const PILATES_SCHEDULE = {
  'Chiara': {
    days: [3, 4, 5, 6, 0], // Mer-Dom (3=mercoledì, 0=domenica)
    startTime: '10:00',
    endTime: '20:00'
  },
  'Anna': {
    days: [3, 4, 5, 6, 0], // Mer-Dom
    startTime: '10:00',
    endTime: '20:00'
  },
  'Emma': {
    days: [1, 2, 3, 4, 5], // Lun-Ven (1=lunedì, 5=venerdì)
    startTime: '10:00',
    endTime: '20:00'
  }
}

// Regole Personal Training
export const PT_INSTRUCTORS = ['Antonio', 'Vittorio']
export const PT_MAX_CAPACITY = 3

/**
 * Determina se una classe è Pilates o Personal Training basandosi sul nome del class_type
 */
export function getClassCategory(classType: ClassType | null | undefined): ClassCategory {
  if (!classType) return 'pilates' // Default
  
  const name = classType.name.toLowerCase()
  if (name.includes('personal') || name.includes('training') || name.includes('pt')) {
    return 'personal-training'
  }
  return 'pilates'
}

/**
 * Verifica se un istruttore è disponibile in un determinato giorno e orario
 */
export function isInstructorAvailable(
  instructorName: string,
  date: string,
  startTime: string,
  category: ClassCategory
): { available: boolean; reason?: string } {
  // Normalizza il nome (case-insensitive)
  const normalizedName = instructorName.toLowerCase()
  
  if (category === 'pilates') {
    // Verifica se è un istruttore Pilates
    const isPilatesInstructor = PILATES_INSTRUCTORS.some(name => 
      normalizedName.includes(name.toLowerCase())
    )
    
    if (!isPilatesInstructor) {
      return {
        available: false,
        reason: `${instructorName} non è un istruttore Pilates. Istruttori Pilates: ${PILATES_INSTRUCTORS.join(', ')}`
      }
    }
    
    // Verifica orari per Pilates
    const schedule = PILATES_SCHEDULE[instructorName as keyof typeof PILATES_SCHEDULE]
    if (!schedule) {
      return {
        available: false,
        reason: `Orari non configurati per ${instructorName}`
      }
    }
    
    // Verifica giorno della settimana (0=domenica, 1=lunedì, ..., 6=sabato)
    const dateObj = parseISO(date)
    const dayOfWeek = getDay(dateObj)
    
    if (!schedule.days.includes(dayOfWeek)) {
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
      const availableDays = schedule.days.map(d => dayNames[d]).join(', ')
      return {
        available: false,
        reason: `${instructorName} non è disponibile il ${dayNames[dayOfWeek]}. Giorni disponibili: ${availableDays}`
      }
    }
    
    // Verifica orario
    if (startTime < schedule.startTime || startTime > schedule.endTime) {
      return {
        available: false,
        reason: `${instructorName} è disponibile solo dalle ${schedule.startTime} alle ${schedule.endTime}`
      }
    }
    
    return { available: true }
  } else {
    // Personal Training
    const isPTInstructor = PT_INSTRUCTORS.some(name => 
      normalizedName.includes(name.toLowerCase())
    )
    
    if (!isPTInstructor) {
      return {
        available: false,
        reason: `${instructorName} non è un istruttore Personal Training. Istruttori PT: ${PT_INSTRUCTORS.join(', ')}`
      }
    }
    
    // Per PT, gli istruttori sono sempre disponibili (si alternano)
    return { available: true }
  }
}

/**
 * Determina quale istruttore PT deve essere assegnato in base all'alternanza
 * Alternanza basata sul giorno della settimana: giorni pari = Antonio, giorni dispari = Vittorio
 */
export function getAlternatingPTInstructor(date: string): 'Antonio' | 'Vittorio' {
  const dateObj = parseISO(date)
  const dayOfWeek = getDay(dateObj) // 0=domenica, 1=lunedì, ...
  
  // Alternanza: giorni pari (0,2,4,6) = Antonio, giorni dispari (1,3,5) = Vittorio
  return dayOfWeek % 2 === 0 ? 'Antonio' : 'Vittorio'
}

/**
 * Verifica se il limite di 3 persone per Personal Training è già raggiunto
 */
export function isPTLimitReached(
  date: string,
  startTime: string,
  existingSessions: Array<{ start_time: string; max_capacity: number; enrolled_count?: number }>,
  currentSessionId?: string
): { reached: boolean; reason?: string } {
  // Combina date e startTime per confrontare con start_time (formato ISO)
  const targetStartTime = `${date}T${startTime}:00`
  
  // Filtra sessioni PT nello stesso giorno e orario
  const conflictingSessions = existingSessions.filter(session => {
    // Escludi la sessione corrente se stiamo modificando
    if (currentSessionId && (session as any).id === currentSessionId) {
      return false
    }
    
    // Estrai data e ora da start_time (formato ISO: yyyy-MM-ddTHH:mm:ss)
    const sessionStartTime = parseISO(session.start_time)
    const sessionDateStr = format(sessionStartTime, 'yyyy-MM-dd')
    const sessionTimeStr = format(sessionStartTime, 'HH:mm')
    const sessionStartTimeFormatted = `${sessionDateStr}T${sessionTimeStr}:00`
    
    return sessionStartTimeFormatted === targetStartTime
  })
  
  // Calcola totale persone già prenotate
  const totalEnrolled = conflictingSessions.reduce((sum, session) => {
    return sum + (session.enrolled_count || 0)
  }, 0)
  
  if (totalEnrolled >= PT_MAX_CAPACITY) {
    return {
      reached: true,
      reason: `Limite di ${PT_MAX_CAPACITY} persone per Personal Training già raggiunto in questo orario`
    }
  }
  
  return { reached: false }
}

/**
 * Ottiene il colore della card in base alla categoria
 */
export function getCardColorScheme(category: ClassCategory) {
  if (category === 'pilates') {
    return {
      bg: 'bg-red-900/40',
      border: 'border-red-600',
      text: 'text-zinc-100'
    }
  } else {
    return {
      bg: 'bg-zinc-800/40',
      border: 'border-zinc-500',
      text: 'text-zinc-100'
    }
  }
}

