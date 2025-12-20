import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Users,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react'
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameDay,
  addWeeks,
  subWeeks,
  parseISO,
  isToday,
  setHours,
  setMinutes
} from 'date-fns'
import { it } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import type { ClassSession, Instructor, ClassType } from '../types/database.types'
import { fadeInUp } from '../utils/animations'
import { getClassCategory, getCardColorScheme } from '../utils/schedulingRules'
import ClassModal from './ClassModal'

interface AdminCalendarProps {
  onMessage?: (type: 'success' | 'error', text: string) => void
}

interface SessionWithDetails extends ClassSession {
  class_type_name?: string
  instructor_name?: string
  enrolled_count?: number
  class_type?: ClassType | null
}

// Genera slot orari dalle 08:00 alle 22:00 (ogni ora)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    slots.push(setHours(setMinutes(new Date(), 0), hour))
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function AdminCalendar({ onMessage }: AdminCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null)
  const [enrolledCounts, setEnrolledCounts] = useState<Record<string, number>>({})

  // Calcola i giorni della settimana corrente
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { locale: it, weekStartsOn: 1 }) // Lunedì
    const end = endOfWeek(currentWeek, { locale: it, weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentWeek])

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Fetch sessions when week changes
  useEffect(() => {
    fetchSessions()
  }, [currentWeek])

  const fetchData = async () => {
    if (!supabase) {
      setError('Database non configurato')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors' as any)
        .select('*')
        .order('full_name', { ascending: true })

      if (instructorsError) {
        console.error('❌ AdminCalendar: Errore fetch instructors:', {
          error: instructorsError,
          code: instructorsError.code,
          message: instructorsError.message,
          details: instructorsError.details,
          hint: instructorsError.hint
        })
        throw instructorsError
      }

      if (!instructorsData) {
        console.warn('⚠️ AdminCalendar: instructorsData è null o undefined')
        setInstructors([])
      } else {
        console.log(`✅ AdminCalendar: ${instructorsData.length} istruttori recuperati`)
        setInstructors((instructorsData as Instructor[]) || [])
      }

      // Fetch class types
      const { data: classTypesData, error: classTypesError } = await supabase
        .from('class_types' as any)
        .select('*')
        .order('name', { ascending: true })

      if (classTypesError) {
        console.error('❌ AdminCalendar: Errore fetch class_types:', {
          error: classTypesError,
          code: classTypesError.code,
          message: classTypesError.message,
          details: classTypesError.details,
          hint: classTypesError.hint
        })
        throw classTypesError
      }

      if (!classTypesData) {
        console.warn('⚠️ AdminCalendar: classTypesData è null o undefined')
        setClassTypes([])
      } else {
        console.log(`✅ AdminCalendar: ${classTypesData.length} tipi di classe recuperati`)
        setClassTypes((classTypesData as ClassType[]) || [])
      }

      await fetchSessions()
    } catch (err: any) {
      console.error('❌ AdminCalendar: Errore durante fetchData:', {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
      })
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento dati'
      setError(errorMessage)
      if (onMessage) onMessage('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessions = async () => {
    if (!supabase) return

    try {
      const startOfWeekDate = startOfWeek(currentWeek, { locale: it, weekStartsOn: 1 })
      const endOfWeekDate = endOfWeek(currentWeek, { locale: it, weekStartsOn: 1 })
      
      // Crea timestamp ISO per il filtro su start_time
      const startOfWeekISO = format(startOfWeekDate, "yyyy-MM-dd'T'00:00:00")
      const endOfWeekISO = format(endOfWeekDate, "yyyy-MM-dd'T'23:59:59")

      // Fetch sessions usando start_time invece di date
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions' as any)
        .select('*')
        .gte('start_time', startOfWeekISO)
        .lte('start_time', endOfWeekISO)
        .order('start_time', { ascending: true })

      if (sessionsError) {
        console.error('❌ AdminCalendar: Errore fetch sessions:', {
          error: sessionsError,
          code: sessionsError.code,
          message: sessionsError.message,
          details: sessionsError.details,
          hint: sessionsError.hint,
          dateRange: { startOfWeekISO, endOfWeekISO }
        })
        throw sessionsError
      }

      const typedSessions = (sessionsData as ClassSession[]) || []
      console.log(`✅ AdminCalendar: ${typedSessions.length} sessioni recuperate per il periodo ${startOfWeekISO} - ${endOfWeekISO}`)

      // Arricchisci con nomi da class_types e instructors
      const enrichedSessions: SessionWithDetails[] = typedSessions.map(session => {
        const classType = classTypes.find(ct => ct.id === session.class_type_id)
        const instructor = instructors.find(i => i.id === session.instructor_id)
        return {
          ...session,
          class_type_name: classType?.name || 'N/A',
          instructor_name: instructor?.full_name || 'N/A',
          class_type: classType || null // Aggiungi per determinare categoria
        } as SessionWithDetails
      })

      setSessions(enrichedSessions)

      // Fetch enrolled counts
      if (typedSessions.length > 0) {
        try {
          const sessionIds = typedSessions.map(s => s.id)
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('class_session_id')

          const counts: Record<string, number> = {}
          sessionIds.forEach(id => {
            counts[id] = bookingsData?.filter((b: any) => 
              b.class_session_id === id
            ).length || 0
          })
          setEnrolledCounts(counts)
          console.log(`✅ AdminCalendar: Enrolled counts calcolati per ${Object.keys(counts).length} sessioni`)
        } catch (err: any) {
          console.warn('⚠️ AdminCalendar: Unable to fetch enrolled counts:', {
            error: err,
            message: err?.message,
            code: err?.code
          })
          const counts: Record<string, number> = {}
          typedSessions.forEach(s => {
            counts[s.id] = 0
          })
          setEnrolledCounts(counts)
        }
      }
    } catch (err: any) {
      console.error('❌ AdminCalendar: Errore durante fetchSessions:', {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
      })
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento sessioni'
      setError(errorMessage)
      if (onMessage) onMessage('error', errorMessage)
    }
  }

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  const handleToday = () => {
    setCurrentWeek(new Date())
  }

  const handleAddClass = () => {
    setSelectedSession(null)
    setIsModalOpen(true)
  }

  const handleEditClass = (session: ClassSession) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }

  const handleDeleteClass = async (sessionId: string) => {
    if (!supabase) return
    if (!confirm('Sei sicuro di voler eliminare questa classe?')) return

    try {
      const { error: deleteError } = await supabase
        .from('class_sessions' as any)
        .delete()
        .eq('id', sessionId)

      if (deleteError) throw deleteError

      setSessions(sessions.filter(s => s.id !== sessionId))
      if (onMessage) onMessage('success', 'Classe eliminata con successo')
      await fetchSessions()
    } catch (err) {
      console.error('Error deleting session:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'eliminazione'
      if (onMessage) onMessage('error', errorMessage)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSession(null)
    fetchSessions()
  }

  // Calcola posizione e altezza della card in base all'orario
  const getCardStyle = (session: SessionWithDetails) => {
    const [startHour, startMin] = session.start_time.split(':').map(Number)
    const [endHour, endMin] = session.end_time.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const duration = endMinutes - startMinutes

    // Calcola top: ogni ora = 60px, ogni minuto = 1px
    // Offset: 08:00 = 0px, quindi sottrai 8*60 = 480
    const top = (startMinutes - 480) * 1 // 1px per minuto
    const height = duration * 1 // 1px per minuto

    return {
      top: `${top}px`,
      height: `${height}px`
    }
  }

  // Filtra sessioni per giorno (estrae la data da start_time)
  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      // Estrai la data da start_time (formato ISO: yyyy-MM-ddTHH:mm:ss)
      const sessionStartTime = parseISO(session.start_time)
      return isSameDay(sessionStartTime, day)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  // Gestione errori e dati vuoti
  if (error && !sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 font-inter mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm transition-colors"
        >
          Riprova
        </button>
      </div>
    )
  }

  // Messaggio quando non ci sono classi (ma non c'è errore)
  if (!isLoading && !error && sessions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="font-barlow text-2xl font-black text-zinc-100 uppercase">
                  Gestione Classi
                </h2>
                <p className="font-inter text-sm text-zinc-400 mt-1">
                  {format(startOfWeek(currentWeek, { locale: it, weekStartsOn: 1 }), 'd MMMM', { locale: it })} - {format(endOfWeek(currentWeek, { locale: it, weekStartsOn: 1 }), 'd MMMM yyyy', { locale: it })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg font-inter text-sm text-zinc-300 transition-colors"
                >
                  Oggi
                </button>
                <button
                  onClick={handleNextWeek}
                  className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Add Class Button */}
              <motion.button
                onClick={handleAddClass}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Classe</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid (Always Visible) */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-zinc-800/50 bg-zinc-950/50">
            {/* Time column header */}
            <div className="p-4 border-r border-zinc-800/50">
              <p className="font-barlow text-xs font-bold text-zinc-400 uppercase">Orario</p>
            </div>
            {/* Day headers */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-4 border-r border-zinc-800/50 last:border-r-0 ${
                  isToday(day) ? 'bg-red-600/10' : ''
                }`}
              >
                <p className="font-barlow text-xs font-bold text-zinc-400 uppercase mb-1">
                  {format(day, 'EEE', { locale: it })}
                </p>
                <p className={`font-barlow text-lg font-black ${
                  isToday(day) ? 'text-red-500' : 'text-zinc-100'
                }`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Calendar Body with Scroll */}
          <div 
            className="relative overflow-y-auto max-h-[calc(100vh-300px)]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#dc2626 #18181b'
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #18181b;
              }
              div::-webkit-scrollbar-thumb {
                background: #dc2626;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #b91c1c;
              }
            `}</style>

            {/* Time Slots Grid */}
            <div className="grid grid-cols-8 min-h-[840px]">
              {/* Time Column */}
              <div className="border-r border-zinc-800/50">
                {TIME_SLOTS.map((slot, index) => (
                  <div
                    key={index}
                    className="h-[60px] border-b border-zinc-800/30 flex items-start justify-end pr-3 pt-1"
                  >
                    <p className="font-inter text-xs text-zinc-500">
                      {format(slot, 'HH:mm')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="relative border-r border-zinc-800/50 last:border-r-0"
                >
                  {/* Time slot lines */}
                  {TIME_SLOTS.map((_, index) => (
                    <div
                      key={index}
                      className="h-[60px] border-b border-zinc-800/30"
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Empty State Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 text-center pointer-events-auto"
              >
                <CalendarIcon className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="font-barlow text-lg font-black text-zinc-100 uppercase mb-2">
                  Nessuna lezione programmata
                </h3>
                <p className="font-inter text-sm text-zinc-400 mb-4">
                  Non ci sono lezioni programmate per questa settimana.
                </p>
                <motion.button
                  onClick={handleAddClass}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi la prima lezione</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Class Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <ClassModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              session={selectedSession}
              instructors={instructors}
              classTypes={classTypes}
              existingSessions={sessions}
              onSuccess={(message) => {
                if (onMessage) onMessage('success', message)
                handleModalClose()
              }}
              onError={(message) => {
                if (onMessage) onMessage('error', message)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-barlow text-2xl font-black text-zinc-100 uppercase">
                Gestione Classi
              </h2>
              <p className="font-inter text-sm text-zinc-400 mt-1">
                {format(startOfWeek(currentWeek, { locale: it, weekStartsOn: 1 }), 'd MMMM', { locale: it })} - {format(endOfWeek(currentWeek, { locale: it, weekStartsOn: 1 }), 'd MMMM yyyy', { locale: it })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg font-inter text-sm text-zinc-300 transition-colors"
              >
                Oggi
              </button>
              <button
                onClick={handleNextWeek}
                className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Add Class Button */}
            <motion.button
              onClick={handleAddClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuova Classe</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-zinc-800/50 bg-zinc-950/50">
          {/* Time column header */}
          <div className="p-4 border-r border-zinc-800/50">
            <p className="font-barlow text-xs font-bold text-zinc-400 uppercase">Orario</p>
          </div>
          {/* Day headers */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-4 border-r border-zinc-800/50 last:border-r-0 ${
                isToday(day) ? 'bg-red-600/10' : ''
              }`}
            >
              <p className="font-barlow text-xs font-bold text-zinc-400 uppercase mb-1">
                {format(day, 'EEE', { locale: it })}
              </p>
              <p className={`font-barlow text-lg font-black ${
                isToday(day) ? 'text-red-500' : 'text-zinc-100'
              }`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Calendar Body with Scroll */}
        <div 
          className="relative overflow-y-auto max-h-[calc(100vh-300px)]"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#dc2626 #18181b'
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: #18181b;
            }
            div::-webkit-scrollbar-thumb {
              background: #dc2626;
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #b91c1c;
            }
          `}</style>

          {/* Time Slots Grid */}
          <div className="grid grid-cols-8 min-h-[840px]"> {/* 14 ore * 60px = 840px */}
            {/* Time Column */}
            <div className="border-r border-zinc-800/50">
              {TIME_SLOTS.map((slot, index) => (
                <div
                  key={index}
                  className="h-[60px] border-b border-zinc-800/30 flex items-start justify-end pr-3 pt-1"
                >
                  <p className="font-inter text-xs text-zinc-500">
                    {format(slot, 'HH:mm')}
                  </p>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const daySessions = getSessionsForDay(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className="relative border-r border-zinc-800/50 last:border-r-0"
                >
                  {/* Time slot lines */}
                  {TIME_SLOTS.map((_, index) => (
                    <div
                      key={index}
                      className="h-[60px] border-b border-zinc-800/30"
                    />
                  ))}

                  {/* Session Cards */}
                  {daySessions.map((session) => {
                    const enrolled = enrolledCounts[session.id] || 0
                    const isFull = enrolled >= session.max_capacity
                    const style = getCardStyle(session)
                    
                    // Determina categoria e colori
                    const category = getClassCategory(session.class_type || null)
                    const colors = getCardColorScheme(category)

                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02, zIndex: 10 }}
                        className={`absolute left-0 right-0 mx-1 ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-lg p-2 cursor-pointer group shadow-lg`}
                        style={style}
                        onClick={() => handleEditClass(session)}
                      >
                        {/* Class Name */}
                        <p className="font-barlow text-xs font-black text-zinc-100 uppercase mb-1 line-clamp-1">
                          {session.class_type_name}
                        </p>
                        
                        {/* Instructor Name */}
                        <p className="font-inter text-xs text-zinc-400 mb-2 line-clamp-1">
                          {session.instructor_name}
                        </p>

                        {/* Time */}
                        <div className="flex items-center gap-1 mb-2">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <p className="font-inter text-xs text-zinc-500">
                            {session.start_time} - {session.end_time}
                          </p>
                        </div>

                        {/* Badge Posti */}
                        <div className="flex items-center justify-end">
                          <div className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${
                            isFull
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-800/50 text-zinc-300'
                          }`}>
                            <Users className="w-3 h-3 inline mr-1" />
                            {enrolled}/{session.max_capacity}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClass(session)
                            }}
                            className="p-1 bg-zinc-800/80 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClass(session.id)
                            }}
                            className="p-1 bg-zinc-800/80 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Class Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ClassModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            session={selectedSession}
            instructors={instructors}
            classTypes={classTypes}
            existingSessions={sessions}
            onSuccess={(message) => {
              if (onMessage) onMessage('success', message)
              handleModalClose()
            }}
            onError={(message) => {
              if (onMessage) onMessage('error', message)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminCalendar

