import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fadeInUp } from '../utils/animations'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  /**
   * Funzione helper per ottenere il ruolo dell'utente e reindirizzare
   */
  const redirectBasedOnRole = async (userId: string) => {
    if (!supabase) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Se non c'è profilo, reindirizza alla home
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
        // Ruolo non riconosciuto, reindirizza alla home
        navigate('/', { replace: true })
      }
    } catch (err) {
      console.error('Error redirecting based on role:', err)
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
        
        // Se c'è un errore o non c'è sessione, mostra semplicemente il form di login
        if (error || !session?.user) {
          return
        }

        // Se l'utente è già autenticato, reindirizza in base al ruolo
        await redirectBasedOnRole(session.user.id)
      } catch (err) {
        console.error('Error checking auth:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth changes (solo se l'utente si autentica mentre è sulla pagina)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // Solo reindirizza se l'utente si autentica (non quando si disconnette)
        if (session?.user) {
          await redirectBasedOnRole(session.user.id)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [navigate])

  /**
   * Gestisce l'autenticazione (login o registrazione)
   * Poiché la conferma email è disabilitata su Supabase,
   * dopo la registrazione l'utente viene autenticato automaticamente
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
      if (isSignUp) {
        // Registrazione nuovo utente
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })

        if (signUpError) {
          // Gestione errori specifici per la registrazione
          let errorMessage = signUpError.message
          
          if (signUpError.message.includes('already registered')) {
            errorMessage = 'Questa email è già registrata. Usa il login.'
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
        // (conferma email disabilitata), controlla il ruolo e reindirizza
        if (data.session?.user) {
          await redirectBasedOnRole(data.session.user.id)
          return
        }

        // Fallback: anche se non c'è sessione, prova a fare login
        // (dovrebbe essere automatico con conferma email disabilitata)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          setError('Registrazione completata. Esegui il login.')
          setIsSignUp(false) // Passa alla modalità login
          setIsLoading(false)
          return
        }

        // Controlla il ruolo e reindirizza
        if (signInData.session?.user) {
          await redirectBasedOnRole(signInData.session.user.id)
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
          await redirectBasedOnRole(session.user.id)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : isSignUp 
          ? 'Errore durante la registrazione. Riprova.' 
          : 'Errore durante il login. Riprova.'
      setError(errorMessage)
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle tra modalità Login e Sign Up
   * Resetta il form quando si cambia modalità
   */
  const toggleMode = () => {
    setIsSignUp(!isSignUp)
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
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <div className="bg-brand-surface border border-zinc-800 rounded-lg p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-barlow text-3xl font-black uppercase text-white mb-2">
              {isSignUp ? 'REGISTRAZIONE ADMIN' : 'ADMIN LOGIN'}
            </h1>
            <p className="text-zinc-400 font-inter text-sm">
              Revolution Fit Lab Dashboard
            </p>
          </div>

          {/* Toggle Login/Sign Up */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg font-inter text-sm font-medium transition-colors ${
                !isSignUp
                  ? 'bg-brand-red text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg font-inter text-sm font-medium transition-colors ${
                isSignUp
                  ? 'bg-brand-red text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Registrazione
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm font-inter">{error}</p>
            </motion.div>
          )}

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
                className="w-full bg-brand-bg border border-zinc-700 rounded-lg px-4 py-3 text-brand-text font-inter focus:outline-none focus:border-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@example.com"
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
                className="w-full bg-brand-bg border border-zinc-700 rounded-lg px-4 py-3 text-brand-text font-inter focus:outline-none focus:border-brand-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              {isSignUp && (
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
                  <span>{isSignUp ? 'Registrazione in corso...' : 'Accesso in corso...'}</span>
                </>
              ) : (
                <>
                  {isSignUp ? (
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

export default Login

