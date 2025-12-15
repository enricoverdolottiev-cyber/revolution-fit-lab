import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { fadeInUp } from '../utils/animations'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    sessionType: ''
  })
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

    setState('loading')
    setErrorMessage(null)

    try {
      // Map form data to database column names
      const payload: {
        full_name: string
        email: string
        phone: string
        class_name: string
        created_at: string
      } = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        class_name: formData.sessionType,
        created_at: new Date().toISOString()
      }

      // Insert booking into Supabase
      // Type assertion: after null check, supabase is guaranteed to be TypedSupabaseClient
      const { error: dbError } = await supabase
        .from('bookings')
        .insert([payload] as any)

      if (dbError) {
        throw dbError
      }

      // Success
      setState('success')
    } catch (err) {
      setState('error')
      setErrorMessage('Qualcosa è andato storto. Riprova o scrivici su WhatsApp.')
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
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b border-zinc-600 text-brand-text placeholder-zinc-500 focus:outline-none focus:border-brand-red transition-colors py-2 font-inter disabled:opacity-50 disabled:cursor-not-allowed"
                />
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
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-red text-brand-text py-4 font-barlow font-bold uppercase tracking-wide hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Prenotazione in corso...</span>
                  </>
                ) : (
                  'CONFERMA'
                )}
              </button>
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
