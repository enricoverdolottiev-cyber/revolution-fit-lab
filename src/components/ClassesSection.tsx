import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  CheckCircle,
  Clock4,
  Plus,
  Activity,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Booking } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'
import AccessPass from './AccessPass'

interface ClassesSectionProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

type BookingStatus = 'confirmed' | 'pending' | 'completed'

interface ClassCard {
  id: string
  class_type: string
  date: Date
  status: BookingStatus
  created_at: string
}

function ClassesSection({ showToast }: ClassesSectionProps) {
  const { user } = useAuth()
  const [upcomingClasses, setUpcomingClasses] = useState<ClassCard[]>([])
  const [pastClasses, setPastClasses] = useState<ClassCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Fetch bookings filtered by user_id or email
        // Try user_id first, then fallback to email if no results
        let bookingsData: any[] | null = null
        let error: any = null

        // Try filtering by user_id first
        const { data: userBookings, error: userError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (userError) {
          console.warn('Error fetching by user_id, trying email:', userError)
        }

        // If we have bookings by user_id, use them. Otherwise, try email
        if (userBookings && userBookings.length > 0) {
          bookingsData = userBookings
        } else if (user.email) {
          const { data: emailBookings, error: emailError } = await supabase
            .from('bookings')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false })

          if (emailError) {
            error = emailError
          } else {
            bookingsData = emailBookings
          }
        } else {
          bookingsData = []
        }

        if (error) {
          console.error('Error fetching bookings:', error)
          throw error
        }

        const bookings = (bookingsData || []) as Booking[]
        const now = new Date()

        const upcoming: ClassCard[] = []
        const past: ClassCard[] = []

        bookings.forEach((booking) => {
          const bookingDate = new Date(booking.created_at)
          const status: BookingStatus =
            (booking.status as BookingStatus) || 'pending'

          const classCard: ClassCard = {
            id: booking.id,
            class_type: booking.class_type,
            date: bookingDate,
            status,
            created_at: booking.created_at,
          }

          if (bookingDate > now) {
            upcoming.push(classCard)
          } else {
            past.push(classCard)
          }
        })

        // Sort upcoming by date (ascending - closest first)
        upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
        // Sort past by date (descending - most recent first)
        past.sort((a, b) => b.date.getTime() - a.date.getTime())

        setUpcomingClasses(upcoming)
        setPastClasses(past)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        showToast('Errore nel caricamento delle classi', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user, showToast])

  const handleBookSession = () => {
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getStatusBadge = (status: BookingStatus) => {
    const badges = {
      confirmed: {
        icon: CheckCircle,
        text: 'Confermata',
        className:
          'bg-red-600/20 border-red-600/50 text-red-400',
      },
      pending: {
        icon: Clock4,
        text: 'In attesa',
        className: 'bg-red-600/20 border-red-600/50 text-red-400',
      },
      completed: {
        icon: CheckCircle,
        text: 'Completata',
        className: 'bg-zinc-500/20 border-zinc-500/50 text-zinc-400',
      },
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span
        className={`
          ${badge.className}
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full
          border text-xs font-barlow font-bold uppercase tracking-wide
        `}
      >
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    )
  }

  const ClassCardSkeleton = () => (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/3 mb-3"></div>
      <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/2"></div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <ClassCardSkeleton />
            <ClassCardSkeleton />
          </div>
        </div>
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
          <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <ClassCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Bento Grid: AccessPass + Book Now CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AccessPass - Prioritaria, occupa 2 colonne su desktop */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <AccessPass showToast={showToast} />
        </motion.div>
        
        {/* Book Now CTA - 1 colonna su desktop */}
        <motion.div variants={fadeInUp} className="lg:col-span-1">
          <motion.button
            onClick={handleBookSession}
            className="w-full h-full min-h-[200px] bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-red-500/20 transition-shadow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Plus className="w-8 h-8" />
            <span className="text-lg">Prenota Ora</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Upcoming Classes */}
      <motion.div
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-barlow text-2xl font-black text-brand-text uppercase">
              Prossime Classi
            </h2>
          </div>
        </div>

        {upcomingClasses.length > 0 ? (
          <div className="space-y-4">
            {upcomingClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <motion.div
                  className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 hover:border-red-600/50 transition-all duration-300 cursor-pointer relative"
                  whileHover={{
                    scale: 1.02,
                    rotateY: 2,
                    rotateX: 1,
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-barlow text-lg font-black text-brand-text uppercase">
                          {classItem.class_type}
                        </h3>
                        {getStatusBadge(classItem.status)}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 font-inter text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(classItem.date)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="font-inter text-zinc-400 mb-4">
              Nessuna classe prenotata
            </p>
            <motion.button
              onClick={handleBookSession}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-2xl shadow-lg hover:shadow-red-500/20 transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <span>Prenota la Prima Classe</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Past Classes */}
      <motion.div
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-zinc-400" />
            </div>
            <h2 className="font-barlow text-2xl font-black text-brand-text uppercase">
              Storico Classi
            </h2>
          </div>
        </div>

        {pastClasses.length > 0 ? (
          <div className="space-y-4">
            {pastClasses.slice(0, 10).map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <motion.div
                  className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 hover:border-zinc-600 transition-all duration-300"
                  whileHover={{
                    scale: 1.01,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-barlow text-lg font-black text-brand-text uppercase">
                          {classItem.class_type}
                        </h3>
                        {getStatusBadge('completed')}
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 font-inter text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(classItem.date)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="font-inter text-zinc-400">
              Nessuna classe completata
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ClassesSection

