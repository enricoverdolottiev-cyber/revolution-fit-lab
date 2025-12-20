import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Edit2, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  startOfWeek, 
  endOfWeek, 
  format,
  differenceInMinutes
} from 'date-fns'
import { it } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import type { Instructor, ClassSession } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface AdminTeamDashboardProps {
  onMessage?: (type: 'success' | 'error', text: string) => void
}

interface InstructorStats {
  instructor: Instructor
  totalClasses: number
  totalHours: number
  saturationRate: number
  enrolledTotal: number
  capacityTotal: number
}

interface WorkSchedule {
  [key: string]: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

// I 5 istruttori del team
const TEAM_INSTRUCTORS = ['Chiara', 'Anna', 'Emma', 'Antonio', 'Vittorio']

function AdminTeamDashboard({ onMessage }: AdminTeamDashboardProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [enrolledCounts, setEnrolledCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false)
  const [schedule, setSchedule] = useState<WorkSchedule>({})
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const currentWeek = useMemo(() => {
    const now = new Date()
    return {
      start: startOfWeek(now, { locale: it, weekStartsOn: 1 }),
      end: endOfWeek(now, { locale: it, weekStartsOn: 1 })
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

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
        console.error('❌ AdminTeamDashboard: Errore fetch instructors:', {
          error: instructorsError,
          code: instructorsError.code,
          message: instructorsError.message,
          details: instructorsError.details,
          hint: instructorsError.hint
        })
        throw instructorsError
      }

      if (!instructorsData) {
        console.warn('⚠️ AdminTeamDashboard: instructorsData è null o undefined')
        setInstructors([])
      } else {
        console.log(`✅ AdminTeamDashboard: ${instructorsData.length} istruttori recuperati`)
        
        // Filtra solo i 5 istruttori del team
        const teamInstructors = (instructorsData as Instructor[] || []).filter(inst =>
          TEAM_INSTRUCTORS.some(name => inst.full_name.toLowerCase().includes(name.toLowerCase()))
        )
        console.log(`✅ AdminTeamDashboard: ${teamInstructors.length} istruttori del team trovati`)
        setInstructors(teamInstructors)
      }

      await fetchSessions()
    } catch (err: any) {
      console.error('❌ AdminTeamDashboard: Errore durante fetchData:', {
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
      // Crea timestamp ISO per il filtro su start_time
      const startOfWeekISO = format(currentWeek.start, "yyyy-MM-dd'T'00:00:00")
      const endOfWeekISO = format(currentWeek.end, "yyyy-MM-dd'T'23:59:59")

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions' as any)
        .select('*')
        .gte('start_time', startOfWeekISO)
        .lte('start_time', endOfWeekISO)
        .order('start_time', { ascending: true })

      if (sessionsError) {
        console.error('❌ AdminTeamDashboard: Errore fetch sessions:', {
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
      console.log(`✅ AdminTeamDashboard: ${typedSessions.length} sessioni recuperate per il periodo ${startOfWeekISO} - ${endOfWeekISO}`)
      setSessions(typedSessions)

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
          console.log(`✅ AdminTeamDashboard: Enrolled counts calcolati per ${Object.keys(counts).length} sessioni`)
        } catch (err: any) {
          console.warn('⚠️ AdminTeamDashboard: Unable to fetch enrolled counts:', {
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
      console.error('❌ AdminTeamDashboard: Errore durante fetchSessions:', {
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

  // Calcola statistiche per ogni istruttore
  const instructorStats = useMemo<InstructorStats[]>(() => {
    return instructors.map(instructor => {
      const instructorSessions = sessions.filter(s => s.instructor_id === instructor.id)
      
      // Corsi totali
      const totalClasses = instructorSessions.length

      // Ore di lavoro totali
      let totalMinutes = 0
      instructorSessions.forEach(session => {
        const [startHour, startMin] = session.start_time.split(':').map(Number)
        const [endHour, endMin] = session.end_time.split(':').map(Number)
        const start = new Date(2000, 0, 1, startHour, startMin)
        const end = new Date(2000, 0, 1, endHour, endMin)
        totalMinutes += differenceInMinutes(end, start)
      })
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10 // Arrotonda a 1 decimale

      // Saturation rate
      let enrolledTotal = 0
      let capacityTotal = 0
      instructorSessions.forEach(session => {
        const enrolled = enrolledCounts[session.id] || 0
        enrolledTotal += enrolled
        capacityTotal += session.max_capacity
      })
      const saturationRate = capacityTotal > 0 
        ? Math.round((enrolledTotal / capacityTotal) * 100) 
        : 0

      return {
        instructor,
        totalClasses,
        totalHours,
        saturationRate,
        enrolledTotal,
        capacityTotal
      }
    })
  }, [instructors, sessions, enrolledCounts])

  const handleEditSchedule = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    // Carica schedule esistente o inizializza con default
    const existingSchedule = (instructor as any).work_schedule as WorkSchedule | undefined
    if (existingSchedule) {
      setSchedule(existingSchedule)
    } else {
      // Default: tutti i giorni abilitati, 10:00-20:00
      const defaultSchedule: WorkSchedule = {}
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach(day => {
        defaultSchedule[day] = {
          enabled: day !== 'sunday', // Domenica disabilitata di default
          startTime: '10:00',
          endTime: '20:00'
        }
      })
      setSchedule(defaultSchedule)
    }
    setIsScheduleSheetOpen(true)
  }

  const handleSaveSchedule = async () => {
    if (!supabase || !selectedInstructor) return

    setIsSavingSchedule(true)
    try {
      const { error: updateError } = await (supabase as any)
        .from('instructors')
        .update({ 
          work_schedule: schedule,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInstructor.id)

      if (updateError) throw updateError

      // Aggiorna localmente
      setInstructors(prev => prev.map(inst => 
        inst.id === selectedInstructor.id 
          ? { ...inst, work_schedule: schedule as any }
          : inst
      ))

      setIsScheduleSheetOpen(false)
      if (onMessage) onMessage('success', 'Orari aggiornati con successo')
    } catch (err: any) {
      console.error('❌ AdminTeamDashboard: Errore durante saveSchedule:', {
        error: err,
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack,
        instructorId: selectedInstructor.id
      })
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il salvataggio'
      if (onMessage) onMessage('error', errorMessage)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const handleScheduleChange = (day: string, field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  if (error && !instructors.length) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="font-barlow text-2xl font-black text-zinc-100 uppercase">
              Team Dashboard
            </h2>
            <p className="font-inter text-sm text-zinc-400 mt-1">
              Statistiche e monitoraggio staff - Settimana corrente
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {instructorStats.map((stat) => (
          <motion.div
            key={stat.instructor.id}
            variants={fadeInUp}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 group hover:border-red-600/50 transition-colors"
          >
            {/* Instructor Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase mb-1">
                  {stat.instructor.full_name}
                </h3>
                {stat.instructor.role && (
                  <p className="font-inter text-xs text-zinc-400">
                    {stat.instructor.role}
                  </p>
                )}
              </div>
              <motion.button
                onClick={() => handleEditSchedule(stat.instructor)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-600/10 rounded-lg transition-colors"
                title="Modifica orari"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              {/* Corsi Totali */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span className="font-inter text-sm text-zinc-400">Corsi Totali</span>
                </div>
                <span className="font-barlow text-lg font-black text-zinc-100">
                  {stat.totalClasses}
                </span>
              </div>

              {/* Ore di Lavoro */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="font-inter text-sm text-zinc-400">Ore di Lavoro</span>
                </div>
                <span className="font-barlow text-lg font-black text-zinc-100">
                  {stat.totalHours}h
                </span>
              </div>

              {/* Saturation Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span className="font-inter text-sm text-zinc-400">Saturation Rate</span>
                  </div>
                  <span className={`font-barlow text-lg font-black ${
                    stat.saturationRate >= 80 ? 'text-red-500' : 
                    stat.saturationRate >= 60 ? 'text-yellow-500' : 
                    'text-zinc-100'
                  }`}>
                    {stat.saturationRate}%
                  </span>
                </div>
                {/* Bar Chart */}
                <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.saturationRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      stat.saturationRate >= 80 ? 'bg-red-600' : 
                      stat.saturationRate >= 60 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                  />
                </div>
                <p className="font-inter text-xs text-zinc-500 mt-1">
                  {stat.enrolledTotal}/{stat.capacityTotal} posti occupati
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Schedule Editor Sheet */}
      <AnimatePresence>
        {isScheduleSheetOpen && selectedInstructor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase">
                      Orari Lavorativi
                    </h3>
                    <p className="font-inter text-xs text-zinc-400 mt-1">
                      {selectedInstructor.full_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsScheduleSheetOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Schedule Form */}
              <div className="space-y-4">
                {Object.entries(schedule).map(([day, config]) => {
                  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)
                  return (
                    <div
                      key={day}
                      className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-900"
                          />
                          <span className="font-barlow text-sm font-bold text-zinc-300 uppercase">
                            {dayLabel}
                          </span>
                        </label>
                      </div>
                      {config.enabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-inter text-xs text-zinc-400 mb-1 block">
                              Ora Inizio
                            </label>
                            <input
                              type="time"
                              value={config.startTime}
                              onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg font-inter text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="font-inter text-xs text-zinc-400 mb-1 block">
                              Ora Fine
                            </label>
                            <input
                              type="time"
                              value={config.endTime}
                              onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg font-inter text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-800/50">
                <button
                  onClick={() => setIsScheduleSheetOpen(false)}
                  className="px-6 py-2 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 rounded-full font-inter text-sm text-zinc-300 transition-colors"
                >
                  Annulla
                </button>
                <motion.button
                  onClick={handleSaveSchedule}
                  disabled={isSavingSchedule}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-inter text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingSchedule ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvataggio...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Salva Orari</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminTeamDashboard

