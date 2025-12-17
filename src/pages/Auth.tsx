import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fadeInUp } from '../utils/animations'

function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  /**
   * Funzione helper per ottenere il ruolo dell'utente e reindirizzare
   * Gestisce errori 500 (infinite recursion RLS) senza bloccare l'app
   * FALLBACK: Se email è admin, reindirizza a /admin anche se query fallisce
   */
  const redirectBasedOnRole = async (userId: string, userEmail?: string) => {
    if (!supabase) {
      navigate('/', { replace: true })
      return
    }

    // FALLBACK TEMPORANEO: Email admin hardcoded per bypassare crash database
    const ADMIN_EMAIL = 'enricoverdolotti.ev@gmail.com'
    const isAdminEmail = userEmail === ADMIN_EMAIL

    try {
      // Query semplificata per evitare recursion
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      // Gestione errori 500: non bloccare l'app
      if (error) {
        // Errore 500 = infinite recursion nelle policy RLS
        if (error.code === '500' || error.message?.includes('recursion') || error.message?.includes('500')) {
          console.warn('⚠️ Errore 500 nel recupero profilo (possibile recursion RLS)')
          
          // FALLBACK: Se è email admin, reindirizza comunque a /admin
          if (isAdminEmail) {
            console.log('🔄 Fallback attivato: errore 500 ma email admin, redirect a /admin')
            navigate('/admin', { replace: true })
            return
          }
          
          console.warn('⚠️ Reindirizzamento alla Home per evitare blocco app')
          navigate('/', { replace: true })
          return
        }
        
        // Altri errori
        console.error('Error fetching profile:', error.code, error.message)
        
        // FALLBACK: Se è email admin, reindirizza comunque a /admin
        if (isAdminEmail) {
          console.log('🔄 Fallback attivato: errore query ma email admin, redirect a /admin')
          navigate('/admin', { replace: true })
          return
        }
        
        navigate('/', { replace: true })
        return
      }

      if (!profile) {
        // Nessun profilo trovato
        // FALLBACK: Se è email admin, reindirizza comunque a /admin
        if (isAdminEmail) {
          console.log('🔄 Fallback attivato: profilo non trovato ma email admin, redirect a /admin')
          navigate('/admin', { replace: true })
          return
        }
        
        navigate('/', { replace: true })
        return
      }

      // Reindirizza in base al ruolo
      const profileData = profile as { role?: 'admin' | 'customer' } | null
      if (profileData?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (profileData?.role === 'customer') {
        navigate('/dashboard', { replace: true })
      } else {
        // Ruolo non riconosciuto
        // FALLBACK: Se è email admin, reindirizza comunque a /admin
        if (isAdminEmail) {
          console.log('🔄 Fallback attivato: ruolo non riconosciuto ma email admin, redirect a /admin')
          navigate('/admin', { replace: true })
          return
        }
        
        navigate('/', { replace: true })
      }
    } catch (err) {
      // Catch per errori imprevisti (inclusi errori 500)
      console.error('Error redirecting based on role:', err)
      
      // FALLBACK: Se è email admin, reindirizza comunque a /admin
      if (isAdminEmail) {
        console.log('🔄 Fallback attivato: exception ma email admin, redirect a /admin')
        navigate('/admin', { replace: true })
        return
      }
      
      console.warn('⚠️ Reindirizzamento alla Home per evitare blocco app')
      navigate('/', { replace: true })
    }
  }

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsCheckingAuth(false)
        return
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Se c'è un errore o non c'è sessione, mostra semplicemente il form
        if (error || !session?.user) {
          setIsCheckingAuth(false)
          return
        }

        // Se l'utente è già autenticato, reindirizza in base al ruolo
        await redirectBasedOnRole(session.user.id, session.user.email ?? undefined)
      } catch (err) {
        console.error('Error checking auth:', err)
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await redirectBasedOnRole(session.user.id, session.user.email ?? undefined)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [navigate])

  /**
   * Gestisce l'autenticazione (login o registrazione)
   */
  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validazione base
    if (!email || !password) {
      setError('Compila tutti i campi')
      return
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Inserisci un indirizzo email valido')
      return
    }

    // Validazione password (minimo 6 caratteri per Supabase)
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri')
      return
    }

    if (!supabase) {
      setError('Database non configurato. Controlla le variabili d\'ambiente.')
      return
    }

    setIsLoading(true)

    try {
      if (activeTab === 'register') {
        // Registrazione nuovo utente
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })

        if (signUpError) {
          // Gestione errori specifici per la registrazione
          let errorMessage = signUpError.message
          
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            errorMessage = 'Questa email è già registrata. Usa il login.'
            setActiveTab('login') // Passa automaticamente alla tab login
          } else if (signUpError.message.includes('password')) {
            errorMessage = 'Password non valida. Usa almeno 6 caratteri.'
          } else if (signUpError.message.includes('email')) {
            errorMessage = 'Indirizzo email non valido.'
          }

          setError(errorMessage)
          setIsLoading(false)
          return
        }

        // Se la registrazione ha successo e l'utente è già autenticato
        if (data.session?.user) {
          await redirectBasedOnRole(data.session.user.id, data.session.user.email ?? undefined)
          return
        }

        // Fallback: prova a fare login automatico
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          setError('Registrazione completata. Esegui il login.')
          setActiveTab('login')
          setIsLoading(false)
          return
        }

        // Controlla il ruolo e reindirizza
        if (signInData.session?.user) {
          await redirectBasedOnRole(signInData.session.user.id, signInData.session.user.email ?? undefined)
        }
      } else {
        // Login utente esistente
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          // Gestione errori specifici per il login
          let errorMessage = signInError.message

          if (signInError.message.includes('Invalid login credentials')) {
            errorMessage = 'Email o password non corretti.'
          } else if (signInError.message.includes('Email not confirmed')) {
            errorMessage = 'Email non confermata. Controlla la tua casella di posta.'
          } else if (signInError.message.includes('Too many requests')) {
            errorMessage = 'Troppi tentativi. Riprova tra qualche minuto.'
          }

          setError(errorMessage)
          setIsLoading(false)
          return
        }

        // Success: controlla il ruolo e reindirizza
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await redirectBasedOnRole(session.user.id, session.user.email ?? undefined)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : activeTab === 'register'
          ? 'Errore durante la registrazione. Riprova.' 
          : 'Errore durante il login. Riprova.'
      setError(errorMessage)
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Cambia tab e resetta il form
   */
  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    setError(null)
    setPassword('') // Reset password per sicurezza
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 pt-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-barlow text-3xl font-black uppercase text-white mb-2">
              {activeTab === 'register' ? 'REGISTRAZIONE' : 'ACCEDI'}
            </h1>
            <p className="text-zinc-400 font-inter text-sm">
              Revolution Fit Lab
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-6 bg-zinc-950 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => switchTab('login')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-md font-barlow text-sm font-bold uppercase transition-all ${
                activeTab === 'login'
                  ? 'bg-brand-red text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-md font-barlow text-sm font-bold uppercase transition-all ${
                activeTab === 'register'
                  ? 'bg-brand-red text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Registrati
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-400 text-sm font-inter">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-inter text-zinc-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-brand-text font-inter focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="email@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-inter text-zinc-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-brand-text font-inter focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              {activeTab === 'register' && (
                <p className="mt-1 text-xs text-zinc-500 font-inter">
                  Minimo 6 caratteri
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-red hover:bg-red-600 text-white font-barlow uppercase font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{activeTab === 'register' ? 'Registrazione in corso...' : 'Accesso in corso...'}</span>
                </>
              ) : (
                <>
                  {activeTab === 'register' ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Registrati</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Accedi</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth

