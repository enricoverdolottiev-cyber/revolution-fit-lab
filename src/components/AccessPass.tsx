import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Radio, Calendar, ExternalLink, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { UserSubscription } from '../types/database.types'
import { fadeInUp } from '../utils/animations'
import { useNavigate } from 'react-router-dom'

interface AccessPassProps {
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void
  compact?: boolean // Nuova prop per modalità compatta
}

function AccessPass({ showToast, compact = false }: AccessPassProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Debug: Log user ID per facilitare il debug su Supabase
        console.log('🎫 AccessPass: Recupero abbonamento per user_id:', user.id)
        
        // Recupera l'abbonamento attivo dell'utente
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Debug Intelligence: Log dettagliato dello stato
        console.log('🎫 AccessPass: Stato abbonamento', {
          data,
          error,
          userId: user.id,
          hasData: !!data,
          errorCode: error?.code,
          errorMessage: error?.message
        })

        if (error) {
          console.error('❌ AccessPass: Errore nel recupero abbonamento:', error)
          
          // Se l'utente è loggato ma manca il record nel DB, log dettagliato
          if (error.code === 'PGRST116' && user.id) {
            console.warn('⚠️ AccessPass: Utente loggato ma nessun record trovato in user_subscriptions', {
              userId: user.id,
              userEmail: user.email,
              suggestion: 'Verifica che esista un record con questo user_id nella tabella user_subscriptions'
            })
          }
          
          if (showToast && error.code !== 'PGRST116') {
            showToast('Errore nel caricamento dell\'abbonamento', 'error')
          }
          setSubscription(null)
        } else if (data) {
          // Verifica se l'abbonamento è ancora valido (non scaduto)
          const subscriptionData = data as UserSubscription
          const expiryDate = new Date(subscriptionData.expiry_date)
          const now = new Date()
          
          if (expiryDate > now) {
            console.log('✅ AccessPass: Abbonamento attivo trovato', {
              type: subscriptionData.type,
              expiryDate: subscriptionData.expiry_date
            })
            setSubscription(subscriptionData)
          } else {
            // Abbonamento scaduto
            console.warn('⚠️ AccessPass: Abbonamento trovato ma scaduto', {
              expiryDate: subscriptionData.expiry_date,
              now: now.toISOString()
            })
            setSubscription(null)
            // Nota: L'aggiornamento dello status nel database può essere gestito
            // da una funzione server-side o da un job schedulato
          }
        } else {
          // Nessun abbonamento trovato - Stato Guest
          console.log('ℹ️ AccessPass: Nessun abbonamento attivo trovato - Stato Guest attivato', {
            userId: user.id
          })
          setSubscription(null)
        }
      } catch (error) {
        console.error('❌ AccessPass: Errore critico nel fetch abbonamento:', error)
        if (showToast) {
          showToast('Errore nel caricamento dell\'abbonamento', 'error')
        }
        setSubscription(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchSubscription()
    } else {
      setIsLoading(false)
    }
  }, [user, showToast])

  // Genera il JSON per il QR Code
  // IMPORTANTE: Fallback sempre attivo - usa user?.id || 'guest-access' per garantire visibilità
  const getQRData = (): string => {
    // Fallback: sempre genera un QR Code, anche senza abbonamento
    const userId = user?.id || 'guest-access'
    
    if (!subscription) {
      // Guest mode: QR Code con ID utente o guest-access
      return userId
    }
    
    const qrPayload = {
      uid: user?.id || 'guest-access',
      type: subscription.type,
      ts: Date.now()
    }
    
    return JSON.stringify(qrPayload)
  }

  // Formatta il tipo di abbonamento in italiano
  const getSubscriptionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'drop-in': 'Ingresso Singolo',
      'pack-10': 'Pacchetto 10 Ingressi',
      'membership': 'Abbonamento Mensile'
    }
    return labels[type] || type
  }

  // Formatta la data di scadenza
  const formatExpiryDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Skeleton Loader per QR Code
  const QRSkeleton = () => (
    <div className="w-full aspect-square bg-zinc-800/50 rounded-xl border border-orange-500/30 animate-pulse flex items-center justify-center">
      <div className="w-16 h-16 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-lg"></div>
    </div>
  )

  // Guest State Component
  const GuestState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-800/50 border-2 border-orange-500/30 flex items-center justify-center"
      >
        <Lock className="w-12 h-12 text-orange-500" strokeWidth={1.5} />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="font-barlow text-xl font-black text-zinc-100 uppercase mb-3"
      >
        Nessun Abbonamento Attivo Rilevato
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="font-inter text-zinc-400 mb-8 max-w-md mx-auto"
      >
        Ottieni il tuo Digital Access Pass acquistando uno dei nostri piani di abbonamento
      </motion.p>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => {
          // Naviga alla home e poi scrolla alla sezione pricing
          navigate('/')
          setTimeout(() => {
            const pricingSection = document.getElementById('pricing')
            if (pricingSection) {
              const navbarHeight = 80
              const elementPosition = pricingSection.getBoundingClientRect().top + window.pageYOffset
              const offsetPosition = elementPosition - navbarHeight
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
            }
          }, 100)
        }}
        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-xl shadow-lg hover:shadow-red-500/20 transition-shadow flex items-center gap-2 mx-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17, delay: 0.4 }}
      >
        <span>Scopri i Nostri Piani</span>
        <ExternalLink className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )

  // Active Subscription Component
  const ActiveSubscription = () => (
    <>
      {/* Header con badge Live */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-barlow text-2xl font-black text-zinc-100 uppercase">
          Digital Access Pass
        </h3>
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-600/50 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0px rgba(239, 68, 68, 0.4)',
              '0 0 20px rgba(239, 68, 68, 0.6)',
              '0 0 0px rgba(239, 68, 68, 0.4)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className="w-2 h-2 bg-red-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span className="font-barlow text-xs font-bold text-red-400 uppercase tracking-wide">
            Live
          </span>
        </motion.div>
      </div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6"
      >
        <div className="w-full aspect-square bg-white rounded-xl border-2 border-orange-500/30 p-4 flex items-center justify-center">
          <QRCodeSVG
            value={getQRData()}
            size={256}
            level="M"
            includeMargin={false}
            fgColor="#18181B"
            bgColor="#FFFFFF"
            className="w-full h-full"
          />
        </div>
      </motion.div>

      {/* Info Abbonamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-barlow text-sm font-bold text-zinc-400 uppercase tracking-wide mb-1">
              Tipo Abbonamento
            </p>
            <p className="font-inter text-base font-semibold text-zinc-100">
              {subscription && getSubscriptionTypeLabel(subscription.type)}
            </p>
          </div>
          <div className="px-3 py-1 bg-green-600/20 border border-green-600/50 rounded-full">
            <span className="font-barlow text-xs font-bold text-green-400 uppercase tracking-wide">
              Attivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="font-barlow text-sm font-bold text-zinc-400 uppercase tracking-wide mb-1">
              Scadenza
            </p>
            <p className="font-inter text-base font-semibold text-zinc-100">
              {subscription && formatExpiryDate(subscription.expiry_date)}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )

  // Compact Mode Component (per header dashboard)
  // IMPORTANTE: Mostra sempre il QR Code, anche durante il loading (usa fallback)
  const CompactMode = () => {
    // Usa sempre getQRData() che ha fallback garantito (user?.id || 'guest-access')
    const qrValue = getQRData()
    // Determina lo stato attivo basandosi su subscription (anche se in loading)
    const isActive = !!subscription && !isLoading

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-zinc-900/60 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-3 flex items-center gap-3"
      >
        {/* QR Code - dimensione fissa, sempre visibile */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 flex-shrink-0 bg-white rounded-2xl border border-orange-500/30 p-1.5 flex items-center justify-center"
        >
          <QRCodeSVG
            value={qrValue}
            size={80}
            level="M"
            includeMargin={false}
            fgColor="#18181B"
            bgColor="#FFFFFF"
            className="w-full h-full"
          />
        </motion.div>

        {/* Badge Status */}
        <div className="flex flex-col gap-1">
          {isLoading ? (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse" />
              <span className="font-barlow text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Caricamento...
              </span>
            </motion.div>
          ) : isActive ? (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="font-barlow text-xs font-bold text-red-400 uppercase tracking-wide">
                Pass Attivo
              </span>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="font-barlow text-xs font-bold text-orange-400 uppercase tracking-wide">
                Guest Access
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  // Main Card Container
  // Se compact=true, mostra solo la versione mini
  if (compact) {
    return <CompactMode />
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 bg-zinc-800/50 rounded w-48 animate-pulse"></div>
            </div>
            <QRSkeleton />
          </motion.div>
        ) : subscription ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ActiveSubscription />
          </motion.div>
        ) : (
          <motion.div
            key="guest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <GuestState />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default AccessPass

