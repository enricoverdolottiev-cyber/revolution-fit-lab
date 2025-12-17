import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Target,
  Award,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  Flame,
  Trophy
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Booking } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface NextSession {
  id: string
  class_name: string
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
  class_name: string
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
  const navigate = useNavigate()
  const { user, profile, isLoading: authLoading } = useAuth()
  const [nextSession, setNextSession] = useState<NextSession | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [stats, setStats] = useState<UserStats>({
    sessionsThisMonth: 0,
    streakDays: 0,
    totalHours: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('')

  // Get user name from email or profile
  const userName = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0]
        .split('')
        .map((char, i) => i === 0 ? char.toUpperCase() : char)
        .join('')
    }
    return 'Atleta'
  }, [user])

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
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Fetch bookings for this user
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('email', user.email || '')
          .order('created_at', { ascending: false })

        if (bookingsError) {
          throw bookingsError
        }

        const bookings = (bookingsData || []) as Booking[]

        // Find next session (most recent future booking or most recent)
        const now = new Date()
        const futureBookings = bookings.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate > now
        })

        if (futureBookings.length > 0) {
          const next = futureBookings[0]
          setNextSession({
            id: next.id,
            class_name: next.class_name,
            created_at: next.created_at,
            date: new Date(next.created_at),
          })
        } else if (bookings.length > 0) {
          // Use most recent as next session
          const mostRecent = bookings[0]
          setNextSession({
            id: mostRecent.id,
            class_name: mostRecent.class_name,
            created_at: mostRecent.created_at,
            date: new Date(mostRecent.created_at),
          })
        }

        // Get recent activities (last 3 sessions)
        const recent = bookings.slice(0, 3).map(b => ({
          id: b.id,
          class_name: b.class_name,
          date: formatDate(new Date(b.created_at)),
          icon: Activity,
        }))
        setRecentActivities(recent)

        // Calculate stats (mock data for now, but structured for future DB integration)
        const thisMonth = bookings.filter(b => {
          const bookingDate = new Date(b.created_at)
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return bookingDate >= monthStart
        }).length

        setStats({
          sessionsThisMonth: thisMonth,
          streakDays: Math.min(thisMonth * 2, 14), // Mock streak
          totalHours: bookings.length * 1.5, // Mock hours (1.5h per session)
        })
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Errore nel caricamento dei dati')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchUserData()
    }
  }, [user, authLoading])

  const handleBookSession = () => {
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  // Skeleton Loader Component
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
                    {nextSession.class_name}
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

            {/* Chart Placeholder */}
            <div className="relative h-48 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-orange-500/10 to-transparent"></div>
              
              {/* Simulated chart bars */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around gap-2 px-4 pb-4">
                {[0.3, 0.5, 0.7, 0.6, 0.9, 0.8, 0.95].map((height, i) => (
                  <motion.div
                    key={i}
                    className="w-8 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${height * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  />
                ))}
              </div>
            </div>

            <p className="font-inter text-xs text-zinc-500 mt-4 text-center">
              Crescita settimanale
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
                          {activity.class_name}
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

