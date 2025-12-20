import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fadeInUp } from '../utils/animations'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sessionType: ''
  })
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Pre-compila email se l'utente è loggato quando il modal si apre
  useEffect(() => {
    if (isOpen && user?.email) {
      setFormData(prev => {
        // Pre-compila solo se l'email è vuota (non sovrascrive input utente)
        if (!prev.email) {
          return {
            ...prev,
            email: user.email || ''
          }
        }
        return prev
      })
    }
  }, [isOpen, user?.email])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', email: '', phone: '', sessionType: '' })
      setState('idle')
      setErrorMessage(null)
    }
  }, [isOpen])

  // Auto-close after success message
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onClose()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (state === 'error') {
      setState('idle')
      setErrorMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Guard clause: check if Supabase is configured
    if (!supabase) {
      setState('error')
      setErrorMessage('Servizio prenotazioni momentaneamente non disponibile. Contattaci su Instagram.')
      return
    }

    // Variabile per tracciare l'utente corrente (da useAuth o recuperato direttamente)
    let currentUser = user

    // Se user è null, prova a recuperare la sessione direttamente da Supabase come ultima spiaggia
    if (!currentUser?.id && supabase) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Errore nel recupero sessione:', sessionError)
        } else if (session?.user) {
          currentUser = { id: session.user.id, email: session.user.email ?? undefined }
        } else {
          console.warn('⚠️ Nessuna sessione attiva trovata')
        }
      } catch (sessionErr) {
        console.error('❌ Errore critico nel recupero sessione:', sessionErr)
      }
    }

    // Se dopo il tentativo l'utente è ancora mancante, mostra errore specifico
    if (!currentUser?.id) {
      setState('error')
      setErrorMessage('Sessione scaduta o utente non riconosciuto. Prova a ricaricare la pagina.')
      return
    }

    setState('loading')
    setErrorMessage(null)

    try {
      // Map form data to database column names
      // Note: user_id è opzionale ma raccomandato per collegare la prenotazione all'utente
      // Se la colonna user_id non esiste nel database, verrà semplicemente ignorata
      // created_at viene generato automaticamente da Supabase, non lo inviamo manualmente
      // status ha default 'pending' nel database, non lo inviamo manualmente
      const payload: {
        name: string
        email: string
        phone: string
        class_type: string
        user_id?: string // Opzionale: aggiunto se il database supporta questo campo
      } = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        class_type: formData.sessionType,
        // Aggiungi user_id solo se disponibile (raccomandato per dashboard)
        ...(currentUser.id && { user_id: currentUser.id })
      }

      // Insert booking into Supabase
      // Type assertion: dopo il null check, supabase è garantito essere TypedSupabaseClient
      // Usiamo 'as any' perché user_id potrebbe non essere nel tipo Booking ma esistere nel DB
      const { error: dbError } = await supabase
        .from('bookings')
        .insert([payload] as any)

      if (dbError) {
        throw dbError
      }

      // Success
      setState('success')
    } catch (err) {
      console.error('❌ Errore durante l\'inserimento della prenotazione:', err)
      
      setState('error')
      
      // Messaggio di errore più specifico basato sul tipo di errore
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as { message?: string; code?: string }).message
        const errorCode = (err as { code?: string }).code
        
        // Gestione errori specifici
        if (errorMessage?.includes('user_id') || errorMessage?.includes('foreign key') || errorCode === '23503') {
          // Errore foreign key constraint - la colonna user_id potrebbe non esistere o non essere configurata correttamente
          console.warn('⚠️ Errore user_id: La colonna user_id potrebbe non esistere nella tabella bookings')
          setErrorMessage('Errore di collegamento utente. La prenotazione potrebbe essere stata creata senza collegamento al profilo. Verifica nella dashboard.')
        } else if (errorMessage?.includes('column') && errorMessage?.includes('does not exist')) {
          // Colonna non esistente
          setErrorMessage('Errore di configurazione database. Contatta il supporto tecnico.')
        } else if (errorMessage?.includes('required') || errorCode === '23502') {
          setErrorMessage('Campi obbligatori mancanti. Compila tutti i campi del form.')
        } else {
          setErrorMessage(errorMessage || 'Qualcosa è andato storto. Riprova o scrivici su WhatsApp.')
        }
      } else {
        setErrorMessage('Qualcosa è andato storto. Riprova o scrivici su WhatsApp.')
      }
    }
  }

  if (!isOpen) return null

  const isLoading = state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        className="bg-brand-surface border border-zinc-700 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {!isSuccess ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-700">
              <h2 className="font-barlow text-2xl font-bold text-brand-text uppercase tracking-tight">
                JOIN THE REVOLUTION
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-brand-text transition-colors p-1"
                aria-label="Close modal"
                disabled={isLoading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message - Animated */}
              <AnimatePresence>
                {isError && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-950/50 border border-red-800 rounded p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="font-inter text-sm text-red-300">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nome */}
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome"
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b border-zinc-600 text-brand-text placeholder-zinc-500 focus:outline-none focus:border-brand-red transition-colors py-2 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  disabled={isLoading || !!user?.email} // Disabilita se pre-compilato da user loggato
                  className="w-full bg-transparent border-0 border-b border-zinc-600 text-brand-text placeholder-zinc-500 focus:outline-none focus:border-brand-red transition-colors py-2 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {user?.email && (
                  <p className="font-inter text-xs text-zinc-500 mt-1">
                    Email pre-compilata dal tuo account
                  </p>
                )}
              </div>

              {/* Telefono */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Telefono"
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b border-zinc-600 text-brand-text placeholder-zinc-500 focus:outline-none focus:border-brand-red transition-colors py-2 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Select Tipo di Sessione */}
              <div>
                <select
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b border-zinc-600 text-brand-text focus:outline-none focus:border-brand-red transition-colors py-2 font-inter appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled className="bg-brand-surface">
                    Tipo di Sessione
                  </option>
                  <option value="drop-in" className="bg-brand-surface">
                    Drop-in
                  </option>
                  <option value="pack" className="bg-brand-surface">
                    Pack
                  </option>
                  <option value="membership" className="bg-brand-surface">
                    Membership
                  </option>
                </select>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading || !user}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 font-barlow font-bold uppercase tracking-wide rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20 transition-shadow"
                whileHover={{ scale: isLoading || !user ? 1 : 1.05 }}
                whileTap={{ scale: isLoading || !user ? 1 : 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Prenotazione in corso...</span>
                  </>
                ) : !user ? (
                  'LOGIN RICHIESTO'
                ) : (
                  'CONFERMA'
                )}
              </motion.button>
              {!user && (
                <p className="font-inter text-xs text-zinc-500 text-center mt-2">
                  Effettua il login per prenotare una sessione
                </p>
              )}
            </form>
          </>
        ) : (
          /* Success Message - Animated */
          <motion.div
            className="p-12 text-center"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle size={48} className="text-white" strokeWidth={2} />
              </motion.div>
            </div>
            <h3 className="font-barlow text-4xl font-bold text-brand-text uppercase tracking-tight mb-4">
              SEI DENTRO!
            </h3>
            <p className="font-inter text-zinc-400">
              Ti abbiamo inviato una mail di conferma
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default BookingModal
