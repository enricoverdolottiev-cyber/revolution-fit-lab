import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Trash2, Users, Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Booking } from '../types/database.types'
import { fadeInUp, staggerContainer } from '../utils/animations'

function AdminDashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch bookings
  useEffect(() => {
    fetchBookings()
  }, [])

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

  const handleLogout = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
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
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors font-inter text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
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
                          {booking.full_name}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.email}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.phone}
                        </td>
                        <td className="px-6 py-4 font-inter text-sm text-zinc-300">
                          {booking.class_name}
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
    </div>
  )
}

export default AdminDashboard

