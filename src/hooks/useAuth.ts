import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database.types'

interface AuthState {
  user: { id: string; email?: string } | null
  profile: Profile | null
  role: 'admin' | 'customer' | null
  isLoading: boolean
  isAdmin: boolean
}

/**
 * Hook personalizzato per gestire autenticazione e ruolo utente
 * Interroga la tabella profiles per ottenere il ruolo dell'utente
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<'admin' | 'customer' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let safetyTimeout: NodeJS.Timeout | null = null

    // TIMEOUT DI SICUREZZA: forza setIsLoading(false) dopo 2 secondi massimo
    safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⏱️ Timeout sicurezza: forzo setIsLoading(false) dopo 2s')
        setIsLoading(false)
      }
    }, 2000)

    // Funzione per recuperare il ruolo dal database
    // SEMPLIFICATA: Query minimale per evitare infinite recursion nelle policy RLS
    // FALLBACK: Se la query fallisce ma l'email è admin, usa fallback hardcoded
    const fetchUserProfile = async (userId: string, userEmail?: string): Promise<void> => {
      if (!supabase || !isMounted) {
        return
      }
      
      // FALLBACK TEMPORANEO: Email admin hardcoded per bypassare crash database
      const ADMIN_EMAIL = 'enricoverdolotti.ev@gmail.com'
      const isAdminEmail = userEmail === ADMIN_EMAIL
      
      try {
        // Query SEMPLIFICATA: solo 'role', nessun join o logica complessa
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()
        
        // Gestione errori robusta: anche errori 500 non bloccano l'app
        if (error) {
          // Errore 500 = infinite recursion nelle policy RLS
          if (error.code === '500' || error.message?.includes('recursion') || error.message?.includes('500')) {
            console.warn('⚠️ Errore 500 rilevato (possibile recursion RLS). Sistema sbloccato.')
            
            // FALLBACK: Se è email admin, imposta ruolo admin anche se query fallisce
            if (isAdminEmail && isMounted) {
              console.log('🔄 Fallback attivato: email admin rilevata, ruolo impostato a admin')
              console.log('Sistema Sbloccato - Ruolo attuale: admin (fallback)')
              setRole('admin')
              setProfile(null) // Profilo non disponibile ma ruolo sì
              return
            }
            
            console.log('Sistema Sbloccato - Ruolo attuale: null (query fallita)')
            if (isMounted) {
              setRole(null)
              setProfile(null)
            }
            return // Esci senza bloccare l'app
          }
          
          // PGRST116 = "no rows returned" - profilo non esiste ancora (normale)
          if (error.code === 'PGRST116') {
            // FALLBACK: Se è email admin ma profilo non esiste, imposta admin
            if (isAdminEmail && isMounted) {
              console.log('🔄 Fallback attivato: profilo non trovato ma email admin, ruolo impostato a admin')
              setRole('admin')
              setProfile(null)
              return
            }
            
            if (isMounted) {
              setRole(null)
              setProfile(null)
            }
            return
          }
          
          // Altri errori
          console.error('❌ Errore nel recupero profilo:', error.code, error.message)
          
          // FALLBACK: Se è email admin, imposta ruolo admin anche con altri errori
          if (isAdminEmail && isMounted) {
            console.log('🔄 Fallback attivato: errore query ma email admin, ruolo impostato a admin')
            setRole('admin')
            setProfile(null)
            return
          }
          
          if (isMounted) {
            setRole(null)
            setProfile(null)
          }
          return
        }
        
        // Successo: ruolo recuperato
        if (data && isMounted) {
          const profileRole = (data as { role: 'admin' | 'customer' }).role
          console.log('✅ Ruolo caricato:', profileRole)
          console.log('Sistema Sbloccato - Ruolo attuale:', profileRole)
          setRole(profileRole)
          
          // Carica profilo completo solo se necessario (evita doppia query)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (profileData && isMounted) {
            setProfile(profileData as Profile)
          }
        } else if (isMounted) {
          // Nessun dato restituito
          // FALLBACK: Se è email admin, imposta ruolo admin
          if (isAdminEmail) {
            console.log('🔄 Fallback attivato: nessun dato ma email admin, ruolo impostato a admin')
            setRole('admin')
            setProfile(null)
            return
          }
          
          setRole(null)
          setProfile(null)
        }
      } catch (err) {
        // Catch per errori imprevisti (inclusi errori 500)
        console.error('❌ Errore critico in fetchUserProfile:', err)
        
        // FALLBACK: Se è email admin, imposta ruolo admin anche con exception
        if (isAdminEmail && isMounted) {
          console.log('🔄 Fallback attivato: exception ma email admin, ruolo impostato a admin')
          console.log('Sistema Sbloccato - Ruolo attuale: admin (fallback exception)')
          setRole('admin')
          setProfile(null)
          return
        }
        
        console.log('Sistema Sbloccato - Ruolo attuale: null (exception)')
        if (isMounted) {
          setRole(null)
          setProfile(null)
        }
      }
    }

    // Verifica Supabase disponibile
    if (!supabase) {
      console.warn('⚠️ Supabase non disponibile - variabili d\'ambiente mancanti')
      setUser(null)
      setRole(null)
      setProfile(null)
      setIsLoading(false)
      return
    }

    // Controlla sessione iniziale
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!isMounted) return
      
      if (sessionError) {
        console.error('❌ Errore nel recupero sessione:', sessionError)
        setUser(null)
        setRole(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? undefined })
        // CRITICO: Aspetta che fetchUserProfile finisca prima di impostare isLoading=false
        // Passa anche l'email per il fallback
        await fetchUserProfile(session.user.id, session.user.email ?? undefined)
      } else {
        setUser(null)
        setRole(null)
        setProfile(null)
      }
      
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
      }
      // CRITICO: isLoading viene impostato a false solo dopo che fetchUserProfile è completato
      setIsLoading(false)
    })

    // Ascolta cambiamenti autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        
        try {
          if (session?.user) {
            // Login o refresh sessione
            setUser({ id: session.user.id, email: session.user.email ?? undefined })
            // CRITICO: Aspetta che fetchUserProfile finisca
            // Passa anche l'email per il fallback
            await fetchUserProfile(session.user.id, session.user.email ?? undefined)
          } else {
            // Logout o sessione scaduta
            setUser(null)
            setRole(null)
            setProfile(null)
          }
        } catch (err) {
          console.error('❌ Errore in auth state change:', err)
          if (isMounted) {
            setUser(null)
            setRole(null)
            setProfile(null)
          }
        } finally {
          if (safetyTimeout) {
            clearTimeout(safetyTimeout)
          }
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }
    )

    // Cleanup
    return () => {
      isMounted = false
      if (safetyTimeout) {
        clearTimeout(safetyTimeout)
      }
      subscription.unsubscribe()
    }
  }, []) // Array vuoto - nessuna dipendenza per evitare re-render infiniti

  // Calcola isAdmin solo quando role è effettivamente 'admin' (stringa esatta)
  const isAdmin = role === 'admin'

  // Log essenziale per monitorare lo stato
  useEffect(() => {
    if (!isLoading) {
      console.log('Sistema Sbloccato - Ruolo attuale:', role, '| IsAdmin:', isAdmin)
    }
  }, [role, isAdmin, isLoading])

  return {
    user,
    profile,
    role,
    isLoading,
    isAdmin
  }
}

