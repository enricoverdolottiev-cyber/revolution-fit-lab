import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ToastContainer, type ToastType } from './ui/Toast'

interface NavLink {
  name: string
  href: string
}

interface NavbarProps {
  // Nessuna prop necessaria - la Navbar è completamente autonoma
}

const navLinks: NavLink[] = [
  { name: 'Lo Studio', href: '#about' },
  { name: 'I Corsi', href: '#classes' },
  { name: 'Prezzi', href: '#pricing' },
  { name: 'Contatti', href: '#contact' },
]

function Navbar({}: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, isLoading, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])
  
  const { scrollY } = useScroll()
  
  // Monitor scroll per backdrop blur dinamico
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })


  // Funzione per scrollare a una sezione
  const scrollToSection = (sectionId: string) => {
    // Rimuovi il # se presente
    const cleanId = sectionId.replace('#', '')
    const element = document.getElementById(cleanId)
    if (element) {
      // Calcola l'offset per la navbar fissa (80px di altezza)
      const navbarHeight = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navbarHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Funzione universale per gestire la navigazione
  const handleNavigation = (sectionId: string) => {
    // Chiudi menu mobile se aperto
    setIsMenuOpen(false)

    // Se siamo già nella Home, scrolla direttamente alla sezione
    if (location.pathname === '/') {
      scrollToSection(sectionId)
      return
    }

    // Se siamo in un'altra rotta, naviga alla Home con hash
    // React Router gestirà l'hash e Home.tsx farà lo scroll automatico
    navigate(`/${sectionId}`, { replace: false })
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

    try {
      // 1. Esecuzione Logout Supabase con try/catch
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Errore durante logout:', error)
        setIsLoggingOut(false)
        showToast('Errore durante la disconnessione', 'error')
        return
      }
      
      // 2. Pulizia Totale (Hard Reset)
      // Svuota localStorage e sessionStorage per rimuovere ogni traccia di token JWT
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (storageError) {
        console.warn('⚠️ Errore durante pulizia storage:', storageError)
        // Continua comunque con il logout
      }
      
      // Chiudi dropdown
      setIsDropdownOpen(false)
      
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

  const getAuthButton = () => {
    // CRITICO: Mostra sempre "ACCEDI" se non c'è utente, anche durante il loading
    // Questo permette la navigazione alla pagina di login anche se il sistema sta ancora caricando
    if (!user) {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/login"
            className="bg-brand-red hover:bg-red-600 text-white px-6 py-2.5 font-barlow font-bold uppercase tracking-wide transition-colors text-sm inline-block rounded"
          >
            ACCEDI
          </Link>
        </motion.div>
      )
    }

    // Utente loggato: mostra pulsante dinamico con dropdown
    // FALLBACK: Se role è null ma user esiste, assumiamo customer (default)
    // Questo permette la navigazione anche se il profilo non è ancora stato caricato
    const buttonText = role === 'admin' 
      ? 'PANNELLO ADMIN' 
      : role === 'customer' || (role === null && user)
        ? 'AREA PERSONALE' 
        : 'ACCOUNT'
    const buttonPath = role === 'admin' 
      ? '/admin' 
      : role === 'customer' || (role === null && user)
        ? '/dashboard' 
        : '/'

    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-zinc-800 hover:bg-zinc-700 text-brand-text px-6 py-2.5 font-barlow font-bold uppercase tracking-wide rounded-2xl transition-colors text-sm border border-zinc-700 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <span>{buttonText}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-brand-surface border border-zinc-800 rounded-lg shadow-lg overflow-hidden z-50"
            >
              <button
                onClick={() => {
                  navigate(buttonPath)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-brand-text font-inter text-sm hover:bg-zinc-800 transition-colors"
              >
                {buttonText}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-3 text-red-400 font-inter text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {isLoggingOut ? 'Chiusura sessione...' : 'Logout'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
          isScrolled 
            ? 'bg-zinc-950/95 backdrop-blur-lg border-zinc-800 shadow-lg shadow-black/20' 
            : 'bg-zinc-950/80 backdrop-blur-md border-zinc-900'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link
              to="/"
              onClick={() => {
                setIsMenuOpen(false)
                // Se siamo già in Home, scrolla in cima
                if (location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              className="font-barlow text-2xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors cursor-pointer"
            >
              Revolution Fit Lab
            </Link>

            {/* Desktop Navigation Links - Centrati */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                // Se siamo sulla Home, usa button per scroll diretto
                // Altrimenti usa Link per navigazione React Router
                if (location.pathname === '/') {
                  return (
                    <motion.button
                      key={link.href}
                      onClick={() => handleNavigation(link.href)}
                      className="relative font-barlow text-base font-medium text-brand-text uppercase tracking-wide group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10 transition-colors group-hover:text-brand-red">
                        {link.name}
                      </span>
                      {/* Underline effect */}
                      <motion.span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </motion.button>
                  )
                }
                // Usa Link per mantenere il contesto React Router
                return (
                  <motion.div
                    key={link.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={`/${link.href}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="relative font-barlow text-base font-medium text-brand-text uppercase tracking-wide group block"
                    >
                      <span className="relative z-10 transition-colors group-hover:text-brand-red">
                        {link.name}
                      </span>
                      {/* Underline effect */}
                      <motion.span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </Link>
                  </motion.div>
                )
              })}
              {/* Link Il Team solo per Admin (Ghost Mode) */}
              {isAdmin && !isLoading && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {location.pathname === '/' ? (
                    <motion.button
                      onClick={() => handleNavigation('#instructors')}
                      className="relative font-barlow text-base font-medium text-brand-text uppercase tracking-wide group"
                    >
                      <span className="relative z-10 transition-colors group-hover:text-brand-red">
                        Il Team
                      </span>
                      <motion.span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </motion.button>
                  ) : (
                    <Link
                      to="/#instructors"
                      onClick={() => setIsMenuOpen(false)}
                      className="relative font-barlow text-base font-medium text-brand-text uppercase tracking-wide group block"
                    >
                      <span className="relative z-10 transition-colors group-hover:text-brand-red">
                        Il Team
                      </span>
                      <motion.span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </Link>
                  )}
                </motion.div>
              )}
              {/* Link Dashboard Admin solo per Admin */}
              {isAdmin && !isLoading && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/admin"
                    className="font-barlow text-base font-bold text-yellow-400 uppercase tracking-wide hover:text-yellow-300 transition-colors border-b-2 border-yellow-400 pb-1 px-2"
                  >
                    DASHBOARD ADMIN
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Desktop Auth Button */}
            <div className="hidden md:flex items-center justify-end">
              {getAuthButton()}
            </div>

            {/* Mobile Menu Button & Auth */}
            <div className="flex md:hidden items-center gap-2">
              {getAuthButton()}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-brand-text p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X size={24} className="text-brand-text" />
                ) : (
                  <Menu size={24} className="text-brand-text" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay - Full Screen */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-zinc-950 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center h-full gap-12"
            >
              {navLinks.map((link, index) => {
                // Se siamo sulla Home, usa button per scroll diretto
                // Altrimenti usa Link per navigazione React Router
                if (location.pathname === '/') {
                  return (
                    <motion.button
                      key={link.href}
                      onClick={() => handleNavigation(link.href)}
                      className="font-barlow text-4xl md:text-5xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {link.name}
                    </motion.button>
                  )
                }
                // Usa Link per mantenere il contesto React Router
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={`/${link.href}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="font-barlow text-4xl md:text-5xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors block"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                )
              })}
              {/* Link Il Team solo per Admin (Mobile - Ghost Mode) */}
              {isAdmin && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.1, duration: 0.3 }}
                >
                  {location.pathname === '/' ? (
                    <motion.button
                      onClick={() => handleNavigation('#instructors')}
                      className="font-barlow text-4xl md:text-5xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Il Team
                    </motion.button>
                  ) : (
                    <Link
                      to="/#instructors"
                      onClick={() => setIsMenuOpen(false)}
                      className="font-barlow text-4xl md:text-5xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors block"
                    >
                      Il Team
                    </Link>
                  )}
                </motion.div>
              )}
              {/* Link Dashboard Admin solo per Admin (Mobile) */}
              {isAdmin && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.1, duration: 0.3 }}
                >
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="font-barlow text-4xl md:text-5xl font-bold text-yellow-400 uppercase tracking-wide hover:text-yellow-300 transition-colors"
                  >
                    DASHBOARD ADMIN
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </>
  )
}

export default Navbar