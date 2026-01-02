import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, XCircle, Camera, CameraOff, Clock, ArrowLeft, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Profile, UserSubscription } from '../types/database.types'
import SEO from '../components/SEO'

interface RecentCheckIn {
  id: string
  user_name: string
  status: 'granted' | 'denied'
  created_at: string
}

type ScanResult = {
  status: 'granted' | 'denied'
  userName: string
  reason?: string
} | null

function AdminScanner() {
  const { user: adminUser } = useAuth()
  const navigate = useNavigate()
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Carica gli ultimi 5 check-in
  useEffect(() => {
    const fetchRecentCheckIns = async () => {
      if (!supabase) return

      try {
        const { data: checkInsData, error: checkInsError } = await supabase
          .from('check_ins')
          .select('id, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5)

        if (checkInsError) {
          console.error('Errore nel recupero check-in:', checkInsError)
          return
        }

        if (checkInsData && checkInsData.length > 0) {
          // Type assertion per i check-in
          const typedCheckIns = checkInsData as Array<{
            id: string
            user_id: string
            status: 'granted' | 'denied'
            created_at: string
          }>

          // Recupera i profili per i user_id
          const userIds = typedCheckIns.map((ci) => ci.user_id)
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          // Crea una mappa per lookup veloce
          const profilesMap = new Map(
            (profilesData || []).map((p: Profile) => [p.id, p.full_name])
          )

          const formatted = typedCheckIns.map((item) => ({
            id: item.id,
            user_name: profilesMap.get(item.user_id) || 'Utente Sconosciuto',
            status: item.status,
            created_at: item.created_at,
          }))
          setRecentCheckIns(formatted)
        } else {
          setRecentCheckIns([])
        }
      } catch (error) {
        console.error('Errore nel fetch check-in:', error)
      }
    }

    fetchRecentCheckIns()
  }, [scanResult]) // Ricarica quando c'è un nuovo scan

  // Inizializza scanner
  useEffect(() => {
    if (isScanning && !html5QrCodeRef.current) {
      const html5QrCode = new Html5Qrcode('scanner-container')
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      }

      html5QrCode
        .start(
          { facingMode: 'environment' }, // Usa camera posteriore su mobile
          config,
          (decodedText) => {
            // QR Code scansionato
            handleQRScan(decodedText)
          },
          () => {
            // Ignora errori di scansione (continua a cercare)
          }
        )
        .catch((err) => {
          console.error('Errore nell\'avvio scanner:', err)
          setIsScanning(false)
          html5QrCodeRef.current = null
          
          // Gestione errori webcam
          let errorMsg = 'Errore nell\'accesso alla webcam'
          if (err.message?.includes('Permission denied') || err.message?.includes('NotAllowedError')) {
            errorMsg = 'Accesso alla webcam negato. Verifica i permessi del browser.'
          } else if (err.message?.includes('NotFoundError') || err.message?.includes('No camera')) {
            errorMsg = 'Nessuna webcam trovata. Assicurati che sia collegata e funzionante.'
          } else if (err.message?.includes('NotReadableError')) {
            errorMsg = 'Webcam già in uso da un\'altra applicazione.'
          }
          setCameraError(errorMsg)
        })
    }

    return () => {
      // Cleanup: ferma scanner quando il componente si smonta
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear()
            html5QrCodeRef.current = null
          })
          .catch((err) => {
            console.error('Errore nello stop scanner:', err)
            html5QrCodeRef.current = null
          })
      }
    }
  }, [isScanning])

  // Gestione scansione QR
  const handleQRScan = async (qrData: string) => {
    if (isProcessing || !supabase) return

    setIsProcessing(true)
    setScanResult(null)

    try {
      // Parse QR data (può essere JSON o semplice stringa con user ID)
      let userId: string
      try {
        const parsed = JSON.parse(qrData)
        userId = parsed.uid || qrData
      } catch {
        // Se non è JSON, usa direttamente la stringa come user ID
        userId = qrData
      }

      // Cerca utente e abbonamento
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('expiry_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const profile = profileResult.data as Profile | null
      const subscription = subscriptionResult.data as UserSubscription | null

      // Validazione
      let status: 'granted' | 'denied' = 'granted'
      let reason: string | undefined

      if (!profile) {
        status = 'denied'
        reason = 'Utente non trovato'
      } else if (!subscription) {
        status = 'denied'
        reason = 'Nessun abbonamento attivo'
      } else {
        // Verifica scadenza
        const expiryDate = new Date(subscription.expiry_date)
        const now = new Date()
        if (expiryDate <= now) {
          status = 'denied'
          reason = 'Abbonamento scaduto'
        }
      }

      const userName = profile?.full_name || 'Utente Sconosciuto'

      // Registra check-in
      const checkInPayload = {
        user_id: userId,
        status,
        reason: status === 'denied' ? reason : null,
        admin_id: adminUser?.id || null,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('check_ins')
        .insert([checkInPayload] as any)

      if (insertError) {
        console.error('Errore nell\'inserimento check-in:', insertError)
      }

      // Feedback visivo e sonoro
      setFlashColor(status === 'granted' ? 'green' : 'red')
      setScanResult({ status, userName, reason })

      // Suono beep (solo se granted)
      if (status === 'granted') {
        playBeepSound()
      }

      // Reset flash dopo 1 secondo
      setTimeout(() => {
        setFlashColor(null)
      }, 1000)

      // Reset scan result dopo 3 secondi per permettere nuova scansione
      setTimeout(() => {
        setScanResult(null)
        setIsProcessing(false)
      }, 3000)
    } catch (error) {
      console.error('Errore nella validazione QR:', error)
      setFlashColor('red')
      setScanResult({
        status: 'denied',
        userName: 'Errore',
        reason: 'Errore nella validazione',
      })
      setTimeout(() => {
        setFlashColor(null)
        setScanResult(null)
        setIsProcessing(false)
      }, 3000)
    }
  }

  // Suono beep positivo
  const playBeepSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800 // Frequenza beep
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  // Toggle scanner
  const toggleScanner = async () => {
    if (isScanning) {
      // Stop scanner
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          html5QrCodeRef.current.clear()
          html5QrCodeRef.current = null
          setIsScanning(false)
          setCameraError(null) // Reset errori quando si ferma
        } catch (err) {
          console.error('Errore nello stop scanner:', err)
          setIsScanning(false)
          html5QrCodeRef.current = null
        }
      } else {
        setIsScanning(false)
      }
    } else {
      // Start scanner - reset errori
      setCameraError(null)
      setIsScanning(true)
    }
  }

  // Formatta orario
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <>
      <SEO
        title="Scanner QR Code | Revolution Fit Lab"
        description="Scanner QR Code per validazione accessi"
      />
      <div className="min-h-screen bg-zinc-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase mb-2">
                  Scanner QR Code
                </h1>
                <p className="font-inter text-zinc-400">
                  Scansiona il QR Code per validare l'accesso
                </p>
              </div>
              <motion.button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-colors font-barlow font-bold uppercase text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Torna alla Dashboard</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Scanner Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 mb-6"
          >
            {/* Controlli */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-barlow text-xl font-bold text-zinc-100 uppercase">
                Camera Scanner
              </h2>
              <motion.button
                onClick={toggleScanner}
                disabled={isProcessing}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl
                  font-barlow font-bold uppercase text-sm tracking-wide
                  transition-colors
                  ${
                    isScanning
                      ? 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30'
                      : 'bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    <span>Stop Scanner</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Avvia Scanner</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Scanner Area con Mirino */}
            <div className="relative">
              {/* Flash Overlay con Overlay Accesso */}
              <AnimatePresence>
                {flashColor && scanResult && (
                  <>
                    {/* Flash Background */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`
                        absolute inset-0 z-50 pointer-events-none
                        ${flashColor === 'green' ? 'bg-green-500' : 'bg-red-500'}
                      `}
                    />
                    {/* Overlay Accesso OK/NEGATO */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                      className={`
                        absolute inset-0 z-50 flex items-center justify-center pointer-events-none
                      `}
                    >
                      <div className={`
                        px-8 py-6 rounded-2xl border-4 backdrop-blur-md
                        ${scanResult.status === 'granted'
                          ? 'bg-green-600/90 border-green-400 text-white'
                          : 'bg-red-600/90 border-red-400 text-white'
                        }
                      `}>
                        <div className="text-center">
                          {scanResult.status === 'granted' ? (
                            <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                          ) : (
                            <XCircle className="w-16 h-16 mx-auto mb-3" />
                          )}
                          <p className="font-barlow text-3xl font-black uppercase mb-2">
                            {scanResult.status === 'granted' ? 'ACCESSO OK' : 'ACCESSO NEGATO'}
                          </p>
                          <p className="font-inter text-lg font-semibold">
                            {scanResult.userName}
                          </p>
                          {scanResult.reason && (
                            <p className="font-inter text-sm mt-2 opacity-90">
                              {scanResult.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Mirino Scanner - Design Red Luxury con angoli neon */}
              <div className="relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden border-4 border-red-500/30">
                {/* Corners animati - Red Neon */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Top Left */}
                  <motion.div
                    className="absolute top-0 left-0 w-20 h-20"
                    style={{
                      background: 'linear-gradient(135deg, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.8) 50%, rgba(239, 68, 68, 0.8) 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      boxShadow: [
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                        '0 0 40px rgba(239, 68, 68, 1), inset 0 0 30px rgba(239, 68, 68, 0.6)',
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Top Right */}
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20"
                    style={{
                      background: 'linear-gradient(225deg, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.8) 50%, rgba(239, 68, 68, 0.8) 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      boxShadow: [
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                        '0 0 40px rgba(239, 68, 68, 1), inset 0 0 30px rgba(239, 68, 68, 0.6)',
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  />
                  {/* Bottom Left */}
                  <motion.div
                    className="absolute bottom-0 left-0 w-20 h-20"
                    style={{
                      background: 'linear-gradient(45deg, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.8) 50%, rgba(239, 68, 68, 0.8) 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      boxShadow: [
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                        '0 0 40px rgba(239, 68, 68, 1), inset 0 0 30px rgba(239, 68, 68, 0.6)',
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1,
                    }}
                  />
                  {/* Bottom Right */}
                  <motion.div
                    className="absolute bottom-0 right-0 w-20 h-20"
                    style={{
                      background: 'linear-gradient(315deg, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.8) 50%, rgba(239, 68, 68, 0.8) 100%)',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      boxShadow: [
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                        '0 0 40px rgba(239, 68, 68, 1), inset 0 0 30px rgba(239, 68, 68, 0.6)',
                        '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1.5,
                    }}
                  />
                </div>

                {/* Laser Scan Line - Animazione che scende e sale */}
                {isScanning && (
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent z-20"
                    style={{
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)',
                    }}
                    animate={{
                      y: [0, '100%', 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Scanner Container */}
                <div id="scanner-container" className="w-full h-full" />
              </div>

              {/* Errore Webcam */}
              <AnimatePresence>
                {cameraError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-red-900/20 border border-red-600/50 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-barlow text-sm font-bold text-red-400 uppercase mb-1">
                        Errore Webcam
                      </p>
                      <p className="font-inter text-xs text-red-300">
                        {cameraError}
                      </p>
                    </div>
                    <button
                      onClick={() => setCameraError(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messaggio quando scanner non attivo */}
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm rounded-xl">
                  <div className="text-center">
                    <CameraOff className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <p className="font-barlow text-lg font-bold text-zinc-400 uppercase">
                      Scanner Non Attivo
                    </p>
                    <p className="font-inter text-sm text-zinc-500 mt-2">
                      Clicca "Avvia Scanner" per iniziare
                    </p>
                  </div>
                </div>
              )}
            </div>

          </motion.div>

          {/* Lista Recenti Check-In */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6"
          >
            <h2 className="font-barlow text-xl font-bold text-zinc-100 uppercase mb-4">
              Ultimi Ingressi
            </h2>
            {recentCheckIns.length === 0 ? (
              <p className="font-inter text-sm text-zinc-500 text-center py-8">
                Nessun ingresso registrato
              </p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((checkIn) => (
                  <motion.div
                    key={checkIn.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border
                      ${
                        checkIn.status === 'granted'
                          ? 'bg-green-600/10 border-green-600/30'
                          : 'bg-red-600/10 border-red-600/30'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${
                          checkIn.status === 'granted'
                            ? 'bg-green-600/20'
                            : 'bg-red-600/20'
                        }
                      `}
                    >
                      {checkIn.status === 'granted' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-barlow text-sm font-bold text-zinc-100 uppercase truncate">
                        {checkIn.user_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <p className="font-inter text-xs text-zinc-400">
                          {formatTime(checkIn.created_at)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`
                        px-2 py-1 rounded-full text-xs font-barlow font-bold uppercase
                        ${
                          checkIn.status === 'granted'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }
                      `}
                    >
                      {checkIn.status === 'granted' ? 'OK' : 'NEGATO'}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}

export default AdminScanner

