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

  // Mostra loader durante il caricamento iniziale
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    )
  }

  // Se l'utente non è autenticato, reindirizza al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se è richiesto un ruolo specifico, verifica che corrisponda
  if (requiredRole) {
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
    if (requiredRole === 'customer' && role !== 'customer') {
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

