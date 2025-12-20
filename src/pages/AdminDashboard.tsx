import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Trash2, Users, Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Booking } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'
import AdminCalendar from '../components/AdminCalendar'
import AdminTeamDashboard from '../components/AdminTeamDashboard'
import RevenueProjectionWidget from '../components/RevenueProjectionWidget'
import type { ClassSession } from '../types/database.types'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ToastContainer, type ToastType } from '../components/ui/Toast'

function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [weeklySessions, setWeeklySessions] = useState<ClassSession[]>([])
  const [weeklyEnrolledCounts, setWeeklyEnrolledCounts] = useState<Record<string, number>>({})
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])

  // Fetch bookings and weekly sessions
  useEffect(() => {
    fetchBookings()
    fetchWeeklySessions()
  }, [])

  const fetchWeeklySessions = async () => {
    if (!supabase) return

    try {
      const now = new Date()
      const weekStart = startOfWeek(now, { locale: it, weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { locale: it, weekStartsOn: 1 })
      // Crea timestamp ISO per il filtro su start_time
      const startOfWeekISO = format(weekStart, "yyyy-MM-dd'T'00:00:00")
      const endOfWeekISO = format(weekEnd, "yyyy-MM-dd'T'23:59:59")

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('class_sessions' as any)
        .select('*')
        .gte('start_time', startOfWeekISO)
        .lte('start_time', endOfWeekISO)

      if (sessionsError) throw sessionsError

      const typedSessions = (sessionsData as ClassSession[]) || []
      setWeeklySessions(typedSessions)

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
          setWeeklyEnrolledCounts(counts)
        } catch (err) {
          console.warn('Unable to fetch enrolled counts for revenue widget')
          const counts: Record<string, number> = {}
          typedSessions.forEach(s => {
            counts[s.id] = 0
          })
          setWeeklyEnrolledCounts(counts)
        }
      }
    } catch (err) {
      console.error('Error fetching weekly sessions:', err)
    }
  }

  const fetchBookings = async () => {
    if (!supabase) {
      setError('Database non configurato')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle prenotazioni'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Funzione per mostrare toast
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const handleLogout = async () => {
    if (!supabase) {
      console.error('❌ Supabase non disponibile per il logout')
      showToast('Errore: servizio non disponibile', 'error')
      return
    }

    // Feedback visivo: mostra stato di logout
    setIsLoggingOut(true)
    console.log('🚪 Avvio logout...')

    try {
      // 1. Esecuzione Logout Supabase con try/catch
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Errore durante logout:', error)
        setIsLoggingOut(false)
        showToast('Errore durante la disconnessione', 'error')
        return
      }

      console.log('✅ Logout Supabase completato con successo')
      
      // 2. Pulizia Totale (Hard Reset)
      // Svuota localStorage e sessionStorage per rimuovere ogni traccia di token JWT
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Storage pulito completamente')
      } catch (storageError) {
        console.warn('⚠️ Errore durante pulizia storage:', storageError)
        // Continua comunque con il logout
      }
      
      // 3. UX Luxury: Mostra toast di successo
      showToast('Sessione chiusa correttamente', 'success')
      
      // Attendi un breve momento per mostrare il toast, poi forza ricaricamento completo
      setTimeout(() => {
        // Usa window.location.href invece di navigate per forzare ricaricamento completo
        // Questo assicura che tutti gli stati di React vengano resettati da zero
        window.location.href = '/'
      }, 500) // Breve delay per mostrare il toast
      
    } catch (err) {
      console.error('❌ Errore critico durante logout:', err)
      setIsLoggingOut(false)
      showToast('Errore critico durante la disconnessione', 'error')
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    if (!supabase || !deleteId) return

    try {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', deleteId)

      if (deleteError) {
        throw deleteError
      }

      // Remove from local state
      setBookings(bookings.filter(b => b.id !== deleteId))
      setShowConfirmDelete(false)
      setDeleteId(null)
      setMessage({ type: 'success', text: 'Prenotazione eliminata con successo' })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Delete error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'eliminazione'
      setMessage({ type: 'error', text: errorMessage })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDelete(false)
    setDeleteId(null)
  }

  // Calculate statistics with useMemo for performance
  const statistics = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const total = bookings.length
    const today = bookings.filter(b => {
      const bookingDate = new Date(b.created_at)
      return bookingDate >= todayStart
    }).length
    const thisWeek = bookings.filter(b => {
      const bookingDate = new Date(b.created_at)
      return bookingDate >= weekAgo
    }).length

    return { total, today, thisWeek }
  }, [bookings])

  // Format date to Italian format
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

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <header className="bg-brand-surface border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-barlow text-2xl font-black uppercase">Admin Dashboard</h1>
            <p className="text-zinc-400 font-inter text-sm mt-1">Revolution Fit Lab</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full transition-colors font-inter text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{isLoggingOut ? 'Chiusura sessione...' : 'Logout'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-900/20 border border-green-500/50'
                  : 'bg-red-900/20 border border-red-500/50'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm font-inter ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revenue Projection Widget */}
        {weeklySessions.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-8"
          >
            <RevenueProjectionWidget
              sessions={weeklySessions}
              enrolledCounts={weeklyEnrolledCounts}
            />
          </motion.div>
        )}

        {/* Statistics Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div
            variants={fadeInUp}
            className="bg-brand-surface border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 font-inter text-sm uppercase">Totale Prenotazioni</p>
                <p className="text-3xl font-barlow font-black mt-2">{statistics.total}</p>
              </div>
              <Users className="w-10 h-10 text-brand-red" />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="bg-brand-surface border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 font-inter text-sm uppercase">Oggi</p>
                <p className="text-3xl font-barlow font-black mt-2">{statistics.today}</p>
              </div>
              <Calendar className="w-10 h-10 text-brand-red" />
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="bg-brand-surface border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 font-inter text-sm uppercase">Questa Settimana</p>
                <p className="text-3xl font-barlow font-black mt-2">{statistics.thisWeek}</p>
              </div>
              <Calendar className="w-10 h-10 text-brand-red" />
            </div>
          </motion.div>
        </motion.div>

        {/* Admin Calendar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <AdminCalendar
            onMessage={(type, text) => {
              setMessage({ type, text })
              setTimeout(() => setMessage(null), 3000)
            }}
          />
        </motion.div>

        {/* Admin Team Dashboard */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <AdminTeamDashboard
            onMessage={(type, text) => {
              setMessage({ type, text })
              setTimeout(() => setMessage(null), 3000)
            }}
          />
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-brand-surface border border-zinc-800 rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-barlow text-xl font-black uppercase">Prenotazioni</h2>
            <button
              onClick={fetchBookings}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors font-inter text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Aggiorna dati"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-400 font-inter">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-4 px-4 py-2 bg-brand-red hover:bg-red-600 rounded-lg font-inter text-sm transition-colors"
              >
                Riprova
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-inter">Nessuna prenotazione trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-bg border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left font-barlow uppercase text-sm text-zinc-400">Data</th>
                    <th className="px-6 py-4 text-left font-barlow uppercase text-sm text-zinc-400">Cliente</th>
                    <th className="px-6 py-4 text-left font-barlow uppercase text-sm text-zinc-400">Email</th>
                    <th className="px-6 py-4 text-left font-barlow uppercase text-sm text-zinc-400">Telefono</th>
                    <th className="px-6 py-4 text-left font-barlow uppercase text-sm text-zinc-400">Classe</th>
                    <th className="px-6 py-4 text-right font-barlow uppercase text-sm text-zinc-400">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <AnimatePresence>
                    {bookings.map((booking, index) => (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-zinc-950/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {formatDate(booking.created_at)}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-white font-medium">
                          {booking.name}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.email}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.phone}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.class_type}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteClick(booking.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Elimina prenotazione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-surface border border-zinc-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="font-barlow text-xl font-black uppercase mb-4">
                Conferma Eliminazione
              </h3>
              <p className="text-zinc-300 font-inter mb-6">
                Sei sicuro di voler eliminare questa prenotazione? Questa azione non può essere annullata.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg font-inter text-sm transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-inter text-sm transition-colors"
                >
                  Elimina
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

export default AdminDashboard

