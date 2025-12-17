import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Calendar, User, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fadeInUp } from '../utils/animations'
import type { Booking } from '../types/database.types'

function Dashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const loadUserData = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        // Ottieni l'utente corrente
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          navigate('/login', { replace: true })
          return
        }

        setUserEmail(session.user.email || '')

        // Carica le prenotazioni dell'utente
        const userEmail = session.user.email
        if (!userEmail) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading bookings:', error)
        } else {
          setBookings(data || [])
        }
      } catch (err) {
        console.error('Error loading user data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [navigate])

  const handleLogout = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="bg-brand-surface border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-barlow text-2xl font-black uppercase">Area Personale</h1>
            <p className="text-zinc-400 font-inter text-sm mt-1">
              {userEmail}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors font-inter text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-brand-surface border border-zinc-800 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-inter text-sm uppercase">Le Mie Prenotazioni</p>
              <p className="text-3xl font-barlow font-black mt-2">{bookings.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-brand-red" />
          </div>
        </motion.div>

        {/* Bookings List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-brand-surface border border-zinc-800 rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800">
            <h2 className="font-barlow text-xl font-black uppercase">Prenotazioni</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-inter">Nessuna prenotazione trovata</p>
              <a
                href="/"
                className="mt-4 px-4 py-2 bg-brand-red hover:bg-red-600 rounded-lg font-inter text-sm transition-colors inline-block"
              >
                Prenota una classe
              </a>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-zinc-950/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-brand-red" />
                        <h3 className="font-barlow text-lg font-bold uppercase">
                          {booking.full_name}
                        </h3>
                      </div>
                      <p className="text-zinc-400 font-inter text-sm mb-1">
                        <span className="text-zinc-500">Classe:</span> {booking.class_name}
                      </p>
                      <p className="text-zinc-400 font-inter text-sm">
                        <span className="text-zinc-500">Data:</span> {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default Dashboard

