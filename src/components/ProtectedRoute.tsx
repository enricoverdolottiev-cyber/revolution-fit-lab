import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'customer'
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, role, isLoading, isAdmin } = useAuth()

  // Log per debug
  useEffect(() => {
    console.log('🔍 ProtectedRoute render:', { 
      path: location.pathname, 
      requiredRole, 
      hasUser: !!user, 
      userId: user?.id,
      role, 
      isAdmin,
      isLoading
    })
    
    // Log specifico per il loader
    if (isLoading) {
      console.log('⚠️ Loader visibile perché:', { isLoading, user: !!user, path: location.pathname })
    }
  }, [location.pathname, requiredRole, user, role, isAdmin, isLoading])

  // CRITICO: Se siamo sulla pagina di login, non mostrare il loader
  // La pagina di login deve essere sempre accessibile
  const isLoginPage = location.pathname === '/login' || location.pathname === '/auth'
  
  // Mostra loader durante il caricamento iniziale
  // IMPORTANTE: Non reindirizzare durante il loading per evitare redirect prematuri
  // MA: Non interferire con la pagina di login
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          <p className="font-inter text-sm text-zinc-400">Caricamento...</p>
        </div>
      </div>
    )
  }

  // Se l'utente non è autenticato, reindirizza al login
  // IMPORTANTE: Controlla solo dopo che isLoading è false
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se è richiesto un ruolo specifico, verifica che corrisponda
  // IMPORTANTE: Gestione intelligente del ruolo null
  if (requiredRole) {
    // FALLBACK: Se role è null ma user esiste e requiredRole è 'customer',
    // permettiamo l'accesso (assumiamo customer come default)
    // Questo evita blocchi quando il profilo tarda a caricarsi
    if (requiredRole === 'customer' && role === null && user) {
      console.log('✅ ProtectedRoute: Ruolo null ma user presente - Permetto accesso come customer (fallback)')
      // Permetti l'accesso anche se il ruolo non è ancora stato caricato
      // Il componente potrà funzionare con i dati dell'utente
      return <>{children}</>
    }

    // Se il ruolo non è ancora stato caricato (null) e requiredRole è 'admin',
    // mostra loader (admin richiede verifica esplicita)
    if (requiredRole === 'admin' && role === null && user) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            <p className="font-inter text-sm text-zinc-400">Caricamento profilo...</p>
          </div>
        </div>
      )
    }

    // Protezione per admin: usa isAdmin per maggiore sicurezza
    if (requiredRole === 'admin' && !isAdmin) {
      // Se l'utente è customer, reindirizza alla sua dashboard
      if (role === 'customer') {
        return <Navigate to="/dashboard" replace />
      }
      // Altrimenti reindirizza alla home
      return <Navigate to="/" replace />
    }

    // Protezione per customer
    if (requiredRole === 'customer' && role !== 'customer' && role !== null) {
      // Se l'utente è admin, reindirizza alla dashboard admin
      if (isAdmin) {
        return <Navigate to="/admin" replace />
      }
      // Altrimenti reindirizza alla home
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}

export default ProtectedRoute

