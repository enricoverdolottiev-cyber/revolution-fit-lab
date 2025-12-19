import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Flame,
  Trophy
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Booking } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'

// Constants
const HOURS_PER_SESSION = 1 // Costante modificabile per ore per sessione

interface NextSession {
  id: string
  class_type: string
  created_at: string
  date?: Date
}

interface UserStats {
  sessionsThisMonth: number
  streakDays: number
  totalHours: number
}

interface RecentActivity {
  id: string
  class_type: string
  date: string
  icon: typeof Activity
}

// Motivational quotes
const motivationalQuotes = [
  'La trasformazione inizia con un solo movimento.',
  'Ogni sessione ti avvicina al tuo obiettivo.',
  'La forza non viene dal corpo, viene dalla mente.',
  'Oggi è il giorno perfetto per iniziare.',
  'Il progresso, non la perfezione.',
]

function CustomerDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [nextSession, setNextSession] = useState<NextSession | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [stats, setStats] = useState<UserStats>({
    sessionsThisMonth: 0,
    streakDays: 0,
    totalHours: 0,
  })
  const [performanceData, setPerformanceData] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('')

  // Log per debug
  useEffect(() => {
    console.log('📊 CustomerDashboard montato:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      authLoading,
      hasProfile: !!profile 
    })
  }, [user, authLoading, profile])

  // Get user name from profile or email fallback
  const userName = useMemo(() => {
    // Usa profile?.name se disponibile (se Profile ha name in futuro)
    // Per ora Profile non ha name, quindi usiamo il fallback email
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0]
        .split('')
        .map((char, i) => i === 0 ? char.toUpperCase() : char)
        .join('')
    }
    return 'Atleta'
  }, [user, profile])

  // Get random motivational quote
  const motivationalQuote = useMemo(() => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  }, [])

  // Format date in Italian
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  /**
   * Calcola i giorni consecutivi di allenamento (streak)
   * Basato sulle date delle prenotazioni passate
   * Conta giorni consecutivi partendo da ieri (oggi non conta nello streak)
   */
  const calculateStreakDays = (bookings: Booking[]): number => {
    if (bookings.length === 0) return 0

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset alle 00:00 per confronto per giorno

    // Estrai tutte le date uniche (senza ora) dalle prenotazioni passate
    const bookingDatesSet = new Set<string>()
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_at)
      bookingDate.setHours(0, 0, 0, 0)
      // Solo prenotazioni passate (escludiamo oggi e futuro)
      if (bookingDate < now) {
        bookingDatesSet.add(bookingDate.toISOString().split('T')[0])
      }
    })

    if (bookingDatesSet.size === 0) return 0

    // Calcola streak partendo da ieri e andando indietro
    let streak = 0
    let checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() - 1) // Inizia da ieri

    // Continua a controllare giorni precedenti finché troviamo prenotazioni consecutive
    while (true) {
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      if (bookingDatesSet.has(checkDateStr)) {
        // Trovata prenotazione per questo giorno, incrementa streak
        streak++
        checkDate.setDate(checkDate.getDate() - 1) // Vai al giorno precedente
      } else {
        // Nessuna prenotazione per questo giorno, interrompi lo streak
        break
      }
    }

    return streak
  }

  /**
   * Calcola i dati del grafico performance (ultimi 7 giorni)
   * Restituisce un array di 7 valori normalizzati tra 0 e 1
   * Indice 0 = 6 giorni fa, Indice 6 = oggi (ordine da sinistra a destra nel grafico)
   */
  const calculatePerformanceData = (bookings: Booking[]): number[] => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Array per i 7 giorni (indice 0 = 6 giorni fa, indice 6 = oggi)
    const dailyCounts: number[] = new Array(7).fill(0)

    // Conta prenotazioni per ogni giorno degli ultimi 7 giorni
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_at)
      bookingDate.setHours(0, 0, 0, 0)

      // Calcola giorni fa (0 = oggi, 1 = ieri, 6 = 6 giorni fa)
      const daysAgo = Math.floor((now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))

      // Se è negli ultimi 7 giorni, incrementa il contatore
      // Inverti l'indice: giorni fa 6 → indice 0, giorni fa 0 → indice 6
      if (daysAgo >= 0 && daysAgo < 7) {
        dailyCounts[6 - daysAgo]++
      }
    })

    // Normalizza i valori tra 0 e 1 (max = massimo conteggio tra i 7 giorni)
    const maxCount = Math.max(...dailyCounts, 1) // Evita divisione per 0
    return dailyCounts.map(count => count / maxCount)
  }

  // Calculate countdown to next session
  useEffect(() => {
    if (!nextSession?.date) return

    const updateCountdown = () => {
      const now = new Date()
      const target = new Date(nextSession.date!)
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown('In corso')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setCountdown(`${days}g ${hours}h`)
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`)
      } else {
        setCountdown(`${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [nextSession])

  // Fetch user bookings and data
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('🔄 CustomerDashboard: Tentativo fetch dati', { 
        hasSupabase: !!supabase, 
        hasUser: !!user, 
        userEmail: user?.email,
        authLoading 
      })
      
      // Permetti di procedere anche se profile è null ma user è presente
      if (!supabase) {
        console.error('❌ CustomerDashboard: Supabase non disponibile')
        setError('Servizio momentaneamente non disponibile')
        setIsLoading(false)
        return
      }
      
      if (!user) {
        console.error('❌ CustomerDashboard: User non disponibile')
        setError('Utente non autenticato')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      console.log('✅ CustomerDashboard: Inizio fetch dati per', user.email)

      try {
        // Fetch bookings for this user (filtra per email, user_id non disponibile in bookings)
        console.log('📥 CustomerDashboard: Fetch bookings per email:', user.email)
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('email', user.email || '')
          .order('created_at', { ascending: false })

        if (bookingsError) {
          console.error('❌ CustomerDashboard: Errore fetch bookings:', bookingsError)
          throw bookingsError
        }
        
        console.log('✅ CustomerDashboard: Bookings recuperati:', bookingsData?.length || 0)

        const bookings = (bookingsData || []) as Booking[]
        const now = new Date()

        // Find next session (SOLO prenotazioni future)
        const futureBookings = bookings
          .filter(b => {
            const bookingDate = new Date(b.created_at)
            return bookingDate > now
          })
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Ordina per data crescente (più vicina prima)

        if (futureBookings.length > 0) {
          const next = futureBookings[0]
          setNextSession({
            id: next.id,
            class_type: next.class_type,
            created_at: next.created_at,
            date: new Date(next.created_at),
          })
        } else {
          // Nessuna prenotazione futura
          setNextSession(null)
        }

        // Get recent activities (last 3 sessions, solo passate o in corso)
        const pastBookings = bookings
          .filter(b => {
            const bookingDate = new Date(b.created_at)
            return bookingDate <= now
          })
          .slice(0, 3)
          .map(b => ({
            id: b.id,
            class_type: b.class_type,
            date: formatDate(new Date(b.created_at)),
            icon: Activity,
          }))
        setRecentActivities(pastBookings)

        // Calcola statistiche reali
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const sessionsThisMonth = bookings.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= monthStart
        }).length

        // Calcola streak giorni consecutivi
        const streakDays = calculateStreakDays(bookings)

        // Calcola ore totali (usa costante modificabile)
        const totalHours = bookings.length * HOURS_PER_SESSION

        setStats({
          sessionsThisMonth,
          streakDays,
          totalHours,
        })

        // Calcola dati grafico performance (ultimi 7 giorni)
        const performance = calculatePerformanceData(bookings)
        setPerformanceData(performance)
        
        console.log('✅ CustomerDashboard: Dati caricati con successo')
      } catch (err) {
        console.error('❌ CustomerDashboard: Errore nel fetch dati:', err)
        setError('Errore nel caricamento dei dati')
      } finally {
        setIsLoading(false)
        console.log('🏁 CustomerDashboard: Fetch completato, isLoading = false')
      }
    }

    console.log('🔍 CustomerDashboard: Condizioni fetch:', { 
      authLoading, 
      hasUser: !!user,
      shouldFetch: !authLoading && !!user 
    })
    
    if (!authLoading && user) {
      fetchUserData()
    } else {
      console.warn('⚠️ CustomerDashboard: Fetch non eseguito - condizioni non soddisfatte')
      if (authLoading) {
        console.log('⏳ CustomerDashboard: In attesa che authLoading diventi false')
      }
      if (!user) {
        console.log('⏳ CustomerDashboard: In attesa che user sia disponibile')
      }
    }
  }, [user, authLoading])

  const handleBookSession = () => {
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  // Skeleton Loader Component (dimensioni riflettono le card reali per evitare layout shift)
  const SkeletonCard = ({ className = '' }: { className?: string }) => (
    <div className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-zinc-800 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-zinc-800 rounded w-full"></div>
      </div>
    </div>
  )

  if (authLoading || isLoading) {
    console.log('⏳ CustomerDashboard: Mostro skeleton loader', { authLoading, isLoading })
    return (
      <div className="min-h-screen bg-brand-bg pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard className="md:col-span-2" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard className="md:col-span-2" />
          </div>
        </div>
      </div>
    )
  }
  
  console.log('✅ CustomerDashboard: Render completo, dati pronti', { 
    hasUser: !!user,
    hasNextSession: !!nextSession,
    statsCount: stats.sessionsThisMonth
  })

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg pt-20 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400 font-inter mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-red hover:bg-red-600 rounded-lg font-inter text-sm transition-colors"
          >
            Riprova
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Welcome (Span 2 columns) */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 relative overflow-hidden group"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-barlow text-3xl md:text-4xl font-black text-brand-text uppercase mb-2">
                    Ciao, {userName}!
                  </h1>
                  <p className="font-inter text-zinc-400 text-sm">
                    {formatDate(new Date())}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-8 h-8 text-orange-500" />
                </motion.div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full font-inter text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                  Membro Active
                </span>
              </div>

              <p className="font-inter text-zinc-300 italic text-lg">
                "{motivationalQuote}"
              </p>
            </div>
          </motion.div>

          {/* Card 2: Next Session */}
          <motion.div
            variants={fadeInUp}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
            whileHover={{ scale: 1.02, borderColor: 'rgba(249, 115, 22, 0.5)' }}
            transition={{ duration: 0.3 }}
            onClick={handleBookSession}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-6 h-6 text-orange-500" />
                <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
              </div>

              {nextSession ? (
                <>
                  <h3 className="font-barlow text-xl font-black text-brand-text uppercase mb-2">
                    {nextSession.class_type}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-inter text-sm mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{countdown || 'Calcolo...'}</span>
                  </div>
                  <p className="font-inter text-xs text-zinc-500">
                    Prossima sessione
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-barlow text-xl font-black text-brand-text uppercase mb-4">
                    Nessuna Sessione
                  </h3>
                  <motion.button
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-barlow font-bold uppercase tracking-wide rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Prenota Ora
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>

          {/* Card 3: Quick Stats */}
          <motion.div
            variants={fadeInUp}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
          >
            <h3 className="font-barlow text-lg font-black text-brand-text uppercase mb-6">
              Statistiche Rapide
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-inter text-xs text-zinc-500 uppercase">Sessioni Mese</p>
                    <p className="font-barlow text-xl font-black text-brand-text">{stats.sessionsThisMonth}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-inter text-xs text-zinc-500 uppercase">Streak</p>
                    <p className="font-barlow text-xl font-black text-brand-text">{stats.streakDays} giorni</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-inter text-xs text-zinc-500 uppercase">Ore Totali</p>
                    <p className="font-barlow text-xl font-black text-brand-text">{stats.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Performance Chart */}
          <motion.div
            variants={fadeInUp}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h3 className="font-barlow text-lg font-black text-brand-text uppercase">
                  Performance
                </h3>
              </div>
            </div>

            {/* Dynamic Performance Chart (ultimi 7 giorni) */}
            <div className="relative h-48 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-orange-500/10 to-transparent"></div>
              
              {/* Chart bars dinamiche basate sui dati reali */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around gap-2 px-4 pb-4">
                {performanceData.length > 0 ? (
                  performanceData.map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-8 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height * 100, 5)}%` }} // Minimo 5% per visibilità
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  ))
                ) : (
                  // Fallback: mostra barre vuote durante il caricamento
                  Array.from({ length: 7 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-8 bg-gradient-to-t from-orange-500/30 to-orange-400/30 rounded-t"
                      initial={{ height: 0 }}
                      animate={{ height: '5%' }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  ))
                )}
              </div>
            </div>

            <p className="font-inter text-xs text-zinc-500 mt-4 text-center">
              Sessioni ultimi 7 giorni
            </p>
          </motion.div>

          {/* Card 5: Recent Activities */}
          <motion.div
            variants={fadeInUp}
            className="md:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-barlow text-lg font-black text-brand-text uppercase">
                Attività Recenti
              </h3>
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const IconComponent = activity.icon
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                        <IconComponent className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-barlow font-bold text-brand-text uppercase">
                          {activity.class_type}
                        </p>
                        <p className="font-inter text-sm text-zinc-400">
                          {activity.date}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="font-inter text-zinc-400 mb-4">
                  Nessuna attività recente
                </p>
                <motion.button
                  onClick={handleBookSession}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-barlow font-bold uppercase tracking-wide rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Prenota Prima Sessione
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerDashboard

