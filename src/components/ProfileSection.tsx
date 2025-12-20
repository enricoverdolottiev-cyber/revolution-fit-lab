import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Lock, Loader2, Check, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { fadeInUp, staggerContainer } from '../utils/animations'
import type { AddressObject } from '../types/database.types'

interface ProfileSectionProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: AddressObject
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

function ProfileSection({ showToast }: ProfileSectionProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: {
      street: '',
      city: '',
      zip: '',
      country: 'Italia', // Default
    },
  })
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase || !user) {
        setIsLoading(false)
        return
      }

      try {
        // Recupera il profilo usando id (colonna primaria)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          const profile = profileData as any
          
          // Parse full_name se disponibile, altrimenti usa email
          let firstName = ''
          let lastName = ''
          if (profile.full_name) {
            const nameParts = profile.full_name.trim().split(' ')
            firstName = nameParts[0] || ''
            lastName = nameParts.slice(1).join(' ') || ''
          } else {
            // Fallback: usa email per estrarre nome
            const emailParts = (user.email || '').split('@')[0].split('.')
            firstName = emailParts[0] || ''
            lastName = emailParts[1] || ''
          }
          
          // Parse address se è un oggetto o stringa
          let addressData: AddressObject = {
            street: '',
            city: '',
            zip: '',
            country: 'Italia',
          }
          
          if (profile.address) {
            if (typeof profile.address === 'object' && profile.address !== null) {
              addressData = {
                street: profile.address.street || '',
                city: profile.address.city || '',
                zip: profile.address.zip || '',
                country: profile.address.country || 'Italia',
              }
            } else if (typeof profile.address === 'string') {
              // Backward compatibility: se è una stringa, prova a parsarla
              try {
                addressData = JSON.parse(profile.address)
              } catch {
                // Se non è JSON valido, usa la stringa come street
                addressData.street = profile.address
              }
            }
          }
          
          setFormData({
            firstName,
            lastName,
            email: user.email || '',
            phone: '',
            address: addressData,
          })
        } else {
          // No profile found, use auth user data
          const emailParts = (user.email || '').split('@')[0].split('.')
          setFormData({
            firstName: emailParts[0] || '',
            lastName: emailParts[1] || '',
            email: user.email || '',
            phone: '',
            address: {
              street: '',
              city: '',
              zip: '',
              country: 'Italia',
            },
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback to auth user email
        const emailParts = (user.email || '').split('@')[0].split('.')
        setFormData({
          firstName: emailParts[0] || '',
          lastName: emailParts[1] || '',
          email: user.email || '',
          phone: '',
          address: {
            street: '',
            city: '',
            zip: '',
            country: 'Italia',
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const fieldName = e.target.name

    // Gestione campi indirizzo separati
    if (fieldName.startsWith('address.')) {
      const addressField = fieldName.split('.')[1] as keyof AddressObject
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: newValue,
        },
      })
    } else {
      setFormData({
        ...formData,
        [fieldName]: newValue,
      })
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user) {
      showToast('Errore: utente non autenticato', 'error')
      setHasError(true)
      return
    }

    setIsSaving(true)
    setHasError(false)
    setSaveSuccess(false)

    try {
      // Prepara full_name unendo firstName e lastName
      const fullName = [formData.firstName, formData.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || null

      // Prepara l'oggetto address: se tutti i campi sono vuoti, invia null
      const addressPayload =
        !formData.address.street &&
        !formData.address.city &&
        !formData.address.zip &&
        !formData.address.country
          ? null
          : {
              street: formData.address.street || '',
              city: formData.address.city || '',
              zip: formData.address.zip || '',
              country: formData.address.country || 'Italia',
            }

      // Costruisci il payload usando id come chiave primaria
      const updatePayload = {
        id: user.id, // id corrisponde all'id dell'utente auth
        full_name: fullName,
        address: addressPayload,
        updated_at: new Date().toISOString(),
      }

      // Upsert profile: crea se non esiste, aggiorna se esiste (usa id come chiave primaria)
      const { error } = await supabase
        .from('profiles')
        .upsert(updatePayload as any, {
          onConflict: 'id', // Specifica che il conflitto è sulla colonna id
        })

      if (error) {
        // Gestione specifica errori RLS (403 Forbidden / 42501)
        if (error.code === '42501' || error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('new row violates row-level security')) {
          console.error('❌ RLS Error (403/42501):', error)
          throw new Error('RLS_PERMISSION_DENIED')
        }
        throw error
      }

      // Success feedback con colore Red-600
      setSaveSuccess(true)
      showToast('Profilo aggiornato con successo', 'success')

      // Reset success indicator after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('❌ Error saving profile:', error)
      setHasError(true)
      
      // Messaggio specifico per errori RLS
      if (error.message === 'RLS_PERMISSION_DENIED' || error.code === '42501' || error.code === 'PGRST301') {
        showToast('Permesso negato: controlla le politiche di sicurezza del database', 'error')
      } else {
        showToast(error.message || 'Errore nel salvataggio del profilo', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user) {
      showToast('Errore: utente non autenticato', 'error')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Le password non coincidono', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast('La password deve essere di almeno 6 caratteri', 'error')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      showToast('Password cambiata con successo', 'success')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      showToast(error.message || 'Errore nel cambio password', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 animate-pulse"
          >
            <div className="h-4 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Profile Form */}
      <motion.div
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
            <User className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="font-barlow text-2xl font-black text-brand-text uppercase">
            Informazioni Personali
          </h2>
        </div>

        <motion.form
          onSubmit={handleSaveProfile}
          className={`space-y-4 ${
            hasError ? 'border-2 border-red-600 rounded-xl p-4' : ''
          }`}
          animate={{
            borderColor: hasError ? 'rgba(220, 38, 38, 1)' : 'rgba(220, 38, 38, 0)',
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleProfileChange}
                  placeholder="Nome"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
                Cognome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleProfileChange}
                  placeholder="Cognome"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                />
              </div>
            </div>
          </div>

          {/* Email (Readonly) */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full pl-10 pr-4 py-3 bg-zinc-800/30 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed font-inter"
              />
            </div>
            <p className="font-inter text-xs text-zinc-500 mt-1">
              L'email non può essere modificata
            </p>
          </div>

          {/* Phone (Legacy - non presente nel DB schema ma mantenuto per UI) */}

          {/* Phone */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Telefono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleProfileChange}
                placeholder="+39 123 456 7890"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
              />
            </div>
          </div>

          {/* Address Section */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-4">
              <MapPin className="w-4 h-4 inline-block mr-2 text-red-500" />
              Indirizzo di Spedizione
            </label>
            <div className="space-y-4">
              {/* Via e Numero */}
              <div>
                <label className="block font-inter text-xs text-zinc-500 uppercase tracking-wide mb-2">
                  Via e Numero
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street || ''}
                  onChange={handleProfileChange}
                  placeholder="Via Roma, 123"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                />
              </div>

              {/* Città e CAP sulla stessa riga */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-inter text-xs text-zinc-500 uppercase tracking-wide mb-2">
                    Città
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city || ''}
                    onChange={handleProfileChange}
                    placeholder="Milano"
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                  />
                </div>
                <div>
                  <label className="block font-inter text-xs text-zinc-500 uppercase tracking-wide mb-2">
                    CAP
                  </label>
                  <input
                    type="text"
                    name="address.zip"
                    value={formData.address.zip || ''}
                    onChange={handleProfileChange}
                    placeholder="20100"
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                  />
                </div>
              </div>

              {/* Paese */}
              <div>
                <label className="block font-inter text-xs text-zinc-500 uppercase tracking-wide mb-2">
                  Paese
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country || 'Italia'}
                  onChange={handleProfileChange}
                  placeholder="Italia"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <motion.button
              type="submit"
              disabled={isSaving}
              className="relative px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-2xl shadow-lg hover:shadow-red-500/20 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isSaving ? 1 : 1.05 }}
              whileTap={{ scale: isSaving ? 1 : 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              animate={{
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  'Salva Modifiche'
                )}
              </span>
            </motion.button>

            {/* Success Checkmark */}
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/50 flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.form>
      </motion.div>

      {/* Password Change */}
      <motion.div
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="font-barlow text-2xl font-black text-brand-text uppercase">
            Cambia Password
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Password Attuale
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Inserisci password attuale"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Nuova Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="Minimo 6 caratteri"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-inter text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Conferma Nuova Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Ripeti la nuova password"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-brand-text placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
            />
          </div>

          {/* Change Password Button */}
          <motion.button
            type="submit"
            disabled={isChangingPassword}
            className="relative w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-2xl shadow-lg hover:shadow-red-500/20 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isChangingPassword ? 1 : 1.05 }}
            whileTap={{ scale: isChangingPassword ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            animate={{
              opacity: isChangingPassword ? 0.7 : 1,
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Aggiornamento...</span>
                </>
              ) : (
                'Cambia Password'
              )}
            </span>
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ProfileSection

