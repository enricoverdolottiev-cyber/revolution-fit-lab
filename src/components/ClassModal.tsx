import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Calendar, Clock, Users, User, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ClassSession, Instructor, ClassType } from '../types/database.types'
import { format, parseISO } from 'date-fns'
import {
  getClassCategory,
  isInstructorAvailable,
  isPTLimitReached,
  getAlternatingPTInstructor,
  PT_MAX_CAPACITY
} from '../utils/schedulingRules'

interface ClassModalProps {
  isOpen: boolean
  onClose: () => void
  session?: ClassSession | null
  instructors: Instructor[]
  classTypes: ClassType[]
  existingSessions?: ClassSession[] // Per validazione limite PT
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function ClassModal({
  isOpen,
  onClose,
  session,
  instructors,
  classTypes,
  existingSessions = [],
  onSuccess,
  onError
}: ClassModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    class_type_id: '',
    instructor_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_capacity: 3
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (session) {
      // Edit mode: populate form with session data
      // Estrai data e ora da start_time (formato ISO: yyyy-MM-ddTHH:mm:ss)
      const startDateTime = parseISO(session.start_time)
      const dateStr = format(startDateTime, 'yyyy-MM-dd')
      const timeStr = format(startDateTime, 'HH:mm')
      
      // Estrai anche end_time
      const endDateTime = parseISO(session.end_time)
      const endTimeStr = format(endDateTime, 'HH:mm')
      
      setFormData({
        class_type_id: session.class_type_id,
        instructor_id: session.instructor_id,
        date: dateStr,
        start_time: timeStr,
        end_time: endTimeStr,
        max_capacity: session.max_capacity
      })
    } else {
      // Add mode: reset form
      const today = format(new Date(), 'yyyy-MM-dd')
      setFormData({
        class_type_id: '',
        instructor_id: '',
        date: today,
        start_time: '',
        end_time: '',
        max_capacity: 3
      })
    }
    setErrors({})
  }, [session, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.class_type_id) {
      newErrors.class_type_id = 'Seleziona un tipo di classe'
    }
    if (!formData.instructor_id) {
      newErrors.instructor_id = 'Seleziona un istruttore'
    }
    if (!formData.date) {
      newErrors.date = 'Seleziona una data'
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Inserisci l\'ora di inizio'
    }
    if (!formData.end_time) {
      newErrors.end_time = 'Inserisci l\'ora di fine'
    }
    if (formData.max_capacity < 1) {
      newErrors.max_capacity = 'La capacità massima deve essere almeno 1'
    }

    // Validate time range
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'L\'ora di fine deve essere successiva all\'ora di inizio'
      }
    }

    // Validazione regole scheduling
    if (formData.class_type_id && formData.instructor_id && formData.date && formData.start_time) {
        const selectedClassType = classTypes.find(ct => ct.id === formData.class_type_id)
        const selectedInstructor = instructors.find(i => i.id === formData.instructor_id)
        
        if (selectedClassType && selectedInstructor) {
          const category = getClassCategory(selectedClassType)
          
          // Verifica disponibilità istruttore
          const availability = isInstructorAvailable(
            selectedInstructor.full_name,
            formData.date,
            formData.start_time,
            category
          )
          
          if (!availability.available) {
            newErrors.instructor_id = availability.reason || 'Istruttore non disponibile'
          }
          
          // Per Personal Training: verifica limite 3 persone
          if (category === 'personal-training') {
            // Forza max_capacity a 3 per PT
            if (formData.max_capacity !== PT_MAX_CAPACITY) {
              newErrors.max_capacity = `Personal Training ha un limite invalicabile di ${PT_MAX_CAPACITY} persone`
            }
            
            // Verifica se il limite è già raggiunto
            const limitCheck = isPTLimitReached(
              formData.date,
              formData.start_time,
              existingSessions,
              session?.id
            )
            
            if (limitCheck.reached) {
              newErrors.start_time = limitCheck.reason || 'Limite PT raggiunto'
            }
            
            // Suggerisci istruttore alternato
            const suggestedInstructor = getAlternatingPTInstructor(formData.date)
            if (selectedInstructor.full_name !== suggestedInstructor) {
              // Non è un errore bloccante, ma un warning
              console.warn(`Suggerimento: per ${formData.date}, l'istruttore alternato è ${suggestedInstructor}`)
            }
          }
        }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!supabase) {
      onError('Database non configurato')
      return
    }

    setIsLoading(true)

    try {
      // Combina date e start_time in un unico campo start_time (formato ISO)
      const startDateTime = `${formData.date}T${formData.start_time}:00`
      const endDateTime = `${formData.date}T${formData.end_time}:00`
      
      const payload = {
        class_type_id: formData.class_type_id,
        instructor_id: formData.instructor_id,
        start_time: startDateTime,
        end_time: endDateTime,
        max_capacity: formData.max_capacity
      }

      if (session) {
        // Update existing session
        const { error: updateError } = await (supabase as any)
          .from('class_sessions')
          .update(payload)
          .eq('id', session.id)

        if (updateError) throw updateError
        onSuccess('Classe modificata con successo')
      } else {
        // Create new session
        const { error: insertError } = await (supabase as any)
          .from('class_sessions')
          .insert([payload])

        if (insertError) throw insertError
        onSuccess('Classe creata con successo')
      }

      onClose()
    } catch (err) {
      console.error('Error saving session:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il salvataggio'
      onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'max_capacity' ? parseInt(value) || 0 : value
      }
      
      // Auto-suggerisci istruttore PT alternato quando si seleziona data
      if (name === 'date' && value) {
        const selectedClassType = classTypes.find(ct => ct.id === prev.class_type_id)
        if (selectedClassType && getClassCategory(selectedClassType) === 'personal-training') {
          const suggestedInstructor = getAlternatingPTInstructor(value)
          const ptInstructor = instructors.find(i => 
            i.full_name.toLowerCase().includes(suggestedInstructor.toLowerCase())
          )
          if (ptInstructor) {
            updated.instructor_id = ptInstructor.id
          }
        }
      }
      
      // Forza max_capacity a 3 per Personal Training
      if (name === 'class_type_id') {
        const selectedClassType = classTypes.find(ct => ct.id === value)
        if (selectedClassType && getClassCategory(selectedClassType) === 'personal-training') {
          updated.max_capacity = PT_MAX_CAPACITY
        }
      }
      
      return updated
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase">
                  {session ? 'Modifica Classe' : 'Aggiungi Classe'}
                </h3>
                <p className="font-inter text-xs text-zinc-400 mt-1">
                  {session ? 'Modifica i dettagli della classe' : 'Crea una nuova classe'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Class Type */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                  Tipo di Classe
                </span>
              </label>
              <select
                name="class_type_id"
                value={formData.class_type_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                  errors.class_type_id ? 'border-red-500' : 'border-zinc-700/50'
                }`}
              >
                <option value="">Seleziona tipo di classe</option>
                {classTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.class_type_id && (
                <p className="mt-1 text-xs text-red-500 font-inter">{errors.class_type_id}</p>
              )}
            </div>

            {/* Instructor */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                  Istruttore
                </span>
              </label>
              <select
                name="instructor_id"
                value={formData.instructor_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                  errors.instructor_id ? 'border-red-500' : 'border-zinc-700/50'
                }`}
              >
                <option value="">Seleziona istruttore</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.full_name}
                  </option>
                ))}
              </select>
              {errors.instructor_id && (
                <p className="mt-1 text-xs text-red-500 font-inter">{errors.instructor_id}</p>
              )}
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                    Data
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                    errors.date ? 'border-red-500' : 'border-zinc-700/50'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.date}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                    Ora Inizio
                  </span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                    errors.start_time ? 'border-red-500' : 'border-zinc-700/50'
                  }`}
                />
                {errors.start_time && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.start_time}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                    Ora Fine
                  </span>
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                    errors.end_time ? 'border-red-500' : 'border-zinc-700/50'
                  }`}
                />
                {errors.end_time && (
                  <p className="mt-1 text-xs text-red-500 font-inter">{errors.end_time}</p>
                )}
              </div>
            </div>

            {/* Max Capacity */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                  Capacità Massima
                </span>
              </label>
              <input
                type="number"
                name="max_capacity"
                value={formData.max_capacity}
                onChange={handleChange}
                min="1"
                max={(() => {
                  // Se è Personal Training, forza max 3
                  const selectedClassType = classTypes.find(ct => ct.id === formData.class_type_id)
                  if (selectedClassType && getClassCategory(selectedClassType) === 'personal-training') {
                    return PT_MAX_CAPACITY
                  }
                  return undefined
                })()}
                className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg font-inter text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors ${
                  errors.max_capacity ? 'border-red-500' : 'border-zinc-700/50'
                }`}
              />
              {(() => {
                const selectedClassType = classTypes.find(ct => ct.id === formData.class_type_id)
                if (selectedClassType && getClassCategory(selectedClassType) === 'personal-training') {
                  return (
                    <p className="mt-1 text-xs text-zinc-500 font-inter">
                      Limite invalicabile: {PT_MAX_CAPACITY} persone per Personal Training
                    </p>
                  )
                }
                return null
              })()}
              {errors.max_capacity && (
                <p className="mt-1 text-xs text-red-500 font-inter">{errors.max_capacity}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 rounded-full font-inter text-sm text-zinc-300 transition-colors"
              >
                Annulla
              </button>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <span>{session ? 'Salva Modifiche' : 'Crea Classe'}</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ClassModal

