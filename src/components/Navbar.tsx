import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface NavLink {
  name: string
  href: string
}

interface NavbarProps {
  // Nessuna prop necessaria - la Navbar è completamente autonoma
}

const navLinks: NavLink[] = [
  { name: 'Studio', href: '#about' },
  { name: 'Team', href: '#instructors' },
  { name: 'Classes', href: '#classes' },
  { name: 'Pricing', href: '#pricing' },
]

function Navbar({}: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, isLoading, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  const { scrollY } = useScroll()
  
  // Monitor scroll per backdrop blur dinamico
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  // Log pulito per debug: mostra ruolo solo quando non è in loading
  useEffect(() => {
    if (!isLoading) {
      console.log('Sistema Sbloccato - Ruolo attuale:', role)
    }
  }, [role, isLoading])

  // Funzione per scrollare a una sezione
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

    // Se siamo in un'altra rotta, naviga alla Home con hash e poi scrolla
    navigate(`/${sectionId}`, { replace: false })
    
    // Aspetta che la Home sia caricata prima di scrollare
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 200)
  }

  const handleLogout = async () => {
    if (!supabase) {
      console.error('❌ Supabase non disponibile per il logout')
      return
    }

    // Feedback visivo: mostra stato di logout
    setIsLoggingOut(true)
    console.log('🚪 Avvio logout...')

    try {
      // Chiama signOut e aspetta il completamento
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Errore durante logout:', error)
        setIsLoggingOut(false)
        return
      }

      console.log('✅ Logout completato con successo')
      
      // Chiudi dropdown
      setIsDropdownOpen(false)
      
      // Naviga alla home - React Router gestirà il routing
      // useAuth.onAuthStateChange aggiornerà automaticamente lo stato
      navigate('/', { replace: true })
      
    } catch (err) {
      console.error('❌ Errore critico durante logout:', err)
      setIsLoggingOut(false)
    }
  }

  const getAuthButton = () => {
    // Se isLoading è true, mostra versione semplificata senza pulsanti
    if (isLoading) {
      return null // Navbar semplificata durante il caricamento
    }

    // CRITICO: Se !user && !isLoading, mostra sempre "ACCEDI"
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
    // Usa optional chaining e fallback per evitare errori se role è null
    // Assicurati che role sia sempre definito prima di usarlo
    const buttonText = role === 'admin' 
      ? 'PANNELLO ADMIN' 
      : role === 'customer' 
        ? 'AREA PERSONALE' 
        : 'ACCOUNT'
    const buttonPath = role === 'admin' 
      ? '/admin' 
      : role === 'customer' 
        ? '/dashboard' 
        : '/'

    return (
      <div className="relative">
        <motion.button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-zinc-800 hover:bg-zinc-700 text-brand-text px-6 py-2.5 font-barlow font-bold uppercase tracking-wide transition-colors text-sm border border-zinc-700 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
                <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                {isLoggingOut ? 'Disconnessione...' : 'Logout'}
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
              {navLinks.map((link) => (
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
              ))}
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
              {navLinks.map((link, index) => (
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
              ))}
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
    </>
  )
}

export default Navbar