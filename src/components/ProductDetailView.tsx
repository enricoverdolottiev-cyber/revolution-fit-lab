import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Check, Package, Info, Loader2, CheckCircle2, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Product, AddressObject } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { shake } from '../utils/animations'

interface ProductDetailViewProps {
  product: Product | null
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

/**
 * Vista dettagliata prodotto con galleria immagini, selettori e checkout
 */
function ProductDetailView({
  product,
  onClose,
  onSuccess,
  onError,
}: ProductDetailViewProps) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [sizeError, setSizeError] = useState(false)
  const [colorError, setColorError] = useState(false)
  const [isTypingAddress, setIsTypingAddress] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    zip: '',
    country: 'Italia',
  })
  
  // Rendering difensivo per sizes con parsing JSON robusto
  const safeSizes = (() => {
    if (!product?.sizes) return []
    if (Array.isArray(product.sizes)) {
      return product.sizes.filter((size): size is string => typeof size === 'string' && size.length > 0)
    }
    if (typeof product.sizes === 'string') {
      try {
        // Prova a parsare come JSON array
        const parsed = JSON.parse(product.sizes)
        if (Array.isArray(parsed)) {
          return parsed.filter((size): size is string => typeof size === 'string' && size.length > 0)
        }
      } catch {
        // Non è JSON, trattalo come stringa singola
        return [product.sizes]
      }
      return [product.sizes]
    }
    return []
  })()
  
  // Rendering difensivo per colors con parsing JSON robusto
  const safeColors = (() => {
    if (!product?.colors) return []
    if (Array.isArray(product.colors)) {
      return product.colors.filter((color): color is string => typeof color === 'string' && color.length > 0)
    }
    if (typeof product.colors === 'string') {
      try {
        // Prova a parsare come JSON array
        const parsed = JSON.parse(product.colors)
        if (Array.isArray(parsed)) {
          return parsed.filter((color): color is string => typeof color === 'string' && color.length > 0)
        }
      } catch {
        // Non è JSON, trattalo come stringa singola
        return [product.colors]
      }
      return [product.colors]
    }
    return []
  })()
  
  const safeImages = Array.isArray(product?.images) 
    ? product.images 
    : typeof product?.images === 'string' 
      ? [product.images] 
      : []

  // Verifica se l'utente ha un indirizzo nel profilo quando apre il checkout
  useEffect(() => {
    if (showCheckout && profile) {
      const hasAddress = profile.address && 
        typeof profile.address === 'object' && 
        profile.address !== null &&
        (profile.address as AddressObject).street
      
      if (!hasAddress) {
        // Mostra form indirizzo se non presente
        setShowAddressForm(true)
      } else {
        // Usa indirizzo dal profilo
        const addr = profile.address as AddressObject
        const addressString = [
          addr.street,
          addr.city,
          addr.zip,
          addr.country,
        ].filter(Boolean).join(', ')
        setShippingAddress(addressString)
        setShowAddressForm(false)
      }
    }
  }, [showCheckout, profile])

  if (!product) return null

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const handleSaveAddress = async () => {
    // Validazione form indirizzo
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.zip.trim()) {
      setPurchaseError(true)
      setTimeout(() => setPurchaseError(false), 600)
      onError('Compila tutti i campi dell\'indirizzo')
      return
    }

    if (!supabase || !user) {
      onError('Servizio non disponibile')
      return
    }

    try {
      // Salva indirizzo nel profilo
      const addressObject: AddressObject = {
        street: addressForm.street.trim(),
        city: addressForm.city.trim(),
        zip: addressForm.zip.trim(),
        country: addressForm.country.trim() || 'Italia',
      }

      const updatePayload: { address: AddressObject } = { address: addressObject }
      const updateQuery = supabase
        .from('profiles')
        // @ts-expect-error - Supabase type inference issue with JSONB fields
        .update(updatePayload)
        .eq('id', user.id)
      const { error: updateError } = await updateQuery

      if (updateError) {
        throw updateError
      }

      // Aggiorna indirizzo locale e nascondi form
      const addressString = [
        addressObject.street,
        addressObject.city,
        addressObject.zip,
        addressObject.country,
      ].filter(Boolean).join(', ')
      
      setShippingAddress(addressString)
      setShowAddressForm(false)
      onSuccess('Indirizzo salvato nel profilo')
    } catch (error: any) {
      console.error('Error saving address:', error)
      onError('Errore nel salvataggio dell\'indirizzo')
    }
  }

  const handlePurchase = async () => {
    // Reset stati feedback
    setPurchaseSuccess(false)
    setPurchaseError(false)

    // Validazione taglia e colore
    if (!selectedSize || !selectedColor) {
      if (!selectedSize) {
        setSizeError(true)
        setTimeout(() => setSizeError(false), 600)
      }
      if (!selectedColor) {
        setColorError(true)
        setTimeout(() => setColorError(false), 600)
      }
      setPurchaseError(true)
      setTimeout(() => setPurchaseError(false), 600)
      onError('Seleziona taglia e colore prima di procedere')
      return
    }

    // Validazione indirizzo
    if (!shippingAddress.trim()) {
      setPurchaseError(true)
      setTimeout(() => setPurchaseError(false), 600)
      onError('Inserisci un indirizzo di spedizione')
      return
    }

    setIsPurchasing(true)

    try {
      // Guard clause: verifica Supabase disponibile
      if (!supabase) {
        throw new Error('Servizio non disponibile')
      }

      // 1. Recupera ID utente autenticato tramite supabase.auth.getUser()
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        throw new Error('Utente non autenticato. Effettua il login per procedere.')
      }

      // 2. Recupera dati del profilo (specialmente l'oggetto JSONB address)
      const { data: profileDataRaw } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', authUser.id)
        .single()
      
      // Type assertion per profileData con address
      const profileData = profileDataRaw as { address?: AddressObject | null } | null

      // Formatta l'indirizzo: usa quello dal profilo se disponibile, altrimenti quello manuale
      let finalShippingAddress = shippingAddress.trim()
      
      // Se abbiamo un indirizzo strutturato nel form, usalo
      if (showAddressForm && addressForm.street) {
        const addressParts = [
          addressForm.street,
          addressForm.city,
          addressForm.zip,
          addressForm.country,
        ].filter(Boolean)
        finalShippingAddress = addressParts.join(', ')
        
        // Salva anche nel profilo se non già presente
        if (!profileData?.address) {
          const addressObject: AddressObject = {
            street: addressForm.street.trim(),
            city: addressForm.city.trim(),
            zip: addressForm.zip.trim(),
            country: addressForm.country.trim() || 'Italia',
          }
          
          const updatePayload: { address: AddressObject } = { address: addressObject }
          const updateQuery = supabase
            .from('profiles')
            // @ts-expect-error - Supabase type inference issue with JSONB fields
            .update(updatePayload)
            .eq('id', authUser.id)
          await updateQuery
        }
      } else if (profileData?.address) {
        // Usa indirizzo dal profilo
        const addressObj = profileData.address as AddressObject
        if (addressObj && typeof addressObj === 'object') {
          const addressParts = [
            addressObj.street,
            addressObj.city,
            addressObj.zip,
            addressObj.country,
          ].filter(Boolean)
          
          if (addressParts.length > 0) {
            finalShippingAddress = addressParts.join(', ')
          }
        }
      }

      // Calcola prezzo totale
      const totalPrice = product.price * quantity

      // 3. Inserisci nuovo record nella tabella orders
      const payload = {
        user_id: authUser.id,
        product_id: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
        total_price: totalPrice,
        status: 'pending' as const,
        shipping_address: finalShippingAddress,
      }

      const { error: orderError } = await supabase
        .from('orders')
        .insert([payload] as any)

      if (orderError) {
        throw orderError
      }

      // Successo: mostra feedback Emerald-400 con animazione
      setPurchaseSuccess(true)
      onSuccess('Ordine confermato! Riceverai una email di conferma.')
      
      // Non chiudere subito, mostra UI di successo
    } catch (error: any) {
      console.error('Error creating order:', error)
      
      // Errore: mostra shake animation e feedback Red-600
      setPurchaseError(true)
      setTimeout(() => setPurchaseError(false), 600)
      onError(error.message || 'Errore durante la creazione dell\'ordine')
      setIsPurchasing(false)
    }
  }

  const handleGoToOrders = () => {
    onClose()
    // Naviga alla dashboard e imposta tab payments
    navigate('/dashboard')
    // Usa evento custom per cambiare tab nella dashboard
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('switchDashboardTab', { detail: 'payments' }))
    }, 100)
  }

  const totalPrice = product.price * quantity

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/50 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 sticky top-0 bg-zinc-900/95 backdrop-blur-xl z-10">
              <h2 className="font-barlow text-3xl font-black text-zinc-100 uppercase">
                {product.name}
              </h2>
              <motion.button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-zinc-400" />
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              {/* Galleria Immagini */}
              <div className="space-y-4">
                {/* Immagine Principale */}
                <motion.div
                  className="relative aspect-square bg-zinc-800/30 rounded-xl overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.img
                    src={safeImages[selectedImageIndex] || safeImages[0] || ''}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-zoom-in"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.div>

                {/* Thumbnails */}
                {safeImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {safeImages.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-red-600'
                            : 'border-transparent hover:border-zinc-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Prodotto */}
              <div className="space-y-6">
                {/* Prezzo */}
                <div>
                  <span className="font-barlow text-4xl font-black text-zinc-100">
                    €{product.price.toFixed(2)}
                  </span>
                </div>

                {/* Descrizione */}
                <p className="font-inter text-zinc-400 leading-relaxed">
                  {product.description}
                </p>

                {/* Selettore Taglia */}
                <div>
                  <label className="block font-barlow text-sm font-bold text-zinc-400 uppercase mb-3">
                    Taglia
                  </label>
                  <motion.div
                    className="flex flex-wrap gap-3"
                    animate={
                      sizeError
                        ? {
                            x: [0, -10, 10, -10, 10, 0],
                          }
                        : {}
                    }
                    transition={{ duration: 0.6 }}
                  >
                    {safeSizes.length > 0 ? (
                      safeSizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => {
                            setSelectedSize(size)
                            setSizeError(false)
                          }}
                          className={`px-6 py-3 rounded-lg font-barlow font-bold uppercase border-2 transition-all ${
                            selectedSize === size
                              ? 'bg-red-600 border-red-600 text-white shadow-inner'
                              : sizeError
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-red-600/50'
                          }`}
                          whileHover={{ scale: selectedSize === size ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          {size}
                        </motion.button>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm font-inter">Taglie non disponibili</p>
                    )}
                  </motion.div>
                </div>

                {/* Selettore Colore */}
                <div>
                  <label className="block font-barlow text-sm font-bold text-zinc-400 uppercase mb-3">
                    Colore
                  </label>
                  <motion.div
                    className="flex flex-wrap gap-3"
                    animate={
                      colorError
                        ? {
                            x: [0, -10, 10, -10, 10, 0],
                          }
                        : {}
                    }
                    transition={{ duration: 0.6 }}
                  >
                    {safeColors.length > 0 ? (
                      safeColors.map((color) => (
                        <motion.button
                          key={color}
                          onClick={() => {
                            setSelectedColor(color)
                            setColorError(false)
                          }}
                          className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? 'border-red-600 scale-110 shadow-inner'
                              : colorError
                              ? 'border-red-500 scale-110'
                              : 'border-zinc-700 hover:border-red-600/50'
                          }`}
                          style={{
                            backgroundColor: color.toLowerCase(),
                          }}
                          whileHover={{ scale: selectedColor === color ? 1.1 : 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          title={color}
                        >
                          {selectedColor === color && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check className="w-5 h-5 text-white drop-shadow-lg" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm font-inter">Colori non disponibili</p>
                    )}
                  </motion.div>
                </div>

                {/* Quantità */}
                <div>
                  <label className="block font-barlow text-sm font-bold text-zinc-400 uppercase mb-3">
                    Quantità
                  </label>
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={handleDecrement}
                      className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center hover:border-red-600/50 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Minus className="w-5 h-5 text-zinc-400" />
                    </motion.button>
                    <span className="font-barlow text-2xl font-black text-zinc-100 w-12 text-center">
                      {quantity}
                    </span>
                    <motion.button
                      onClick={handleIncrement}
                      className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center hover:border-red-600/50 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus className="w-5 h-5 text-zinc-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Specifiche */}
                <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                  {/* Materiali */}
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-barlow text-sm font-bold text-zinc-400 uppercase mb-1">
                        Materiali
                      </h4>
                      <p className="font-inter text-sm text-zinc-300">{product.materials}</p>
                    </div>
                  </div>

                  {/* Specifiche Tecniche */}
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-barlow text-sm font-bold text-zinc-400 uppercase mb-1">
                        Specifiche Tecniche
                      </h4>
                      {(() => {
                        // Rendering difensivo per tech_specs
                        if (typeof product.tech_specs === 'object' && product.tech_specs !== null) {
                          // È un oggetto JSONB
                          const specsObj = product.tech_specs as Record<string, string>
                          return (
                            <div className="space-y-1.5">
                              {Object.entries(specsObj).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-barlow font-bold text-zinc-400 uppercase tracking-wide">
                                    {key}:
                                  </span>
                                  <span className="font-inter text-zinc-300 ml-2">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        } else if (typeof product.tech_specs === 'string') {
                          // È una stringa, prova a parsarla come JSON
                          try {
                            const parsed = JSON.parse(product.tech_specs)
                            if (typeof parsed === 'object' && parsed !== null) {
                              const specsObj = parsed as Record<string, string>
                              return (
                                <div className="space-y-1.5">
                                  {Object.entries(specsObj).map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-barlow font-bold text-zinc-400 uppercase tracking-wide">
                                        {key}:
                                      </span>
                                      <span className="font-inter text-zinc-300 ml-2">
                                        {value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                          } catch {
                            // Non è JSON, mostra come stringa
                            return <p className="font-inter text-sm text-zinc-300">{product.tech_specs}</p>
                          }
                          // Fallback: mostra come stringa
                          return <p className="font-inter text-sm text-zinc-300">{product.tech_specs}</p>
                        }
                        return <p className="font-inter text-sm text-zinc-300">Specifiche non disponibili</p>
                      })()}
                    </div>
                  </div>
                </div>

                {/* Checkout */}
                {!showCheckout ? (
                  <motion.button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-red-600 text-white font-barlow font-bold uppercase tracking-wide rounded-full shadow-lg hover:shadow-red-500/20 transition-shadow disabled:opacity-50"
                    whileHover={{ scale: !selectedSize || !selectedColor ? 1 : 1.05 }}
                    whileTap={{ scale: !selectedSize || !selectedColor ? 1 : 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    disabled={!selectedSize || !selectedColor}
                  >
                    <span>
                      Acquista - €{totalPrice.toFixed(2)}
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Riepilogo Ordine */}
                    <div className="bg-zinc-800/30 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Prodotto:</span>
                        <span className="text-zinc-100 font-semibold">{product.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Taglia:</span>
                        <span className="text-zinc-100 font-semibold">{selectedSize}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Colore:</span>
                        <span className="text-zinc-100 font-semibold">{selectedColor}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Quantità:</span>
                        <span className="text-zinc-100 font-semibold">{quantity}</span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t border-zinc-700">
                        <span className="text-zinc-400 font-bold">Totale:</span>
                        <span className="text-zinc-100 font-black">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Indirizzo di Spedizione */}
                    {showAddressForm ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-5 h-5 text-red-500" />
                          <label className="block font-barlow text-sm font-bold text-zinc-400 uppercase">
                            Inserisci il tuo indirizzo di spedizione
                          </label>
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Via e numero civico"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Città"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                            />
                            <input
                              type="text"
                              placeholder="CAP"
                              value={addressForm.zip}
                              onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Paese (default: Italia)"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter"
                          />
                        </div>
                        
                        <motion.button
                          onClick={handleSaveAddress}
                          className="w-full py-3 bg-zinc-800/50 border border-red-600/50 text-red-400 font-barlow font-bold uppercase tracking-wide rounded-lg hover:bg-red-600/10 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Salva Indirizzo
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <label className="block font-barlow text-sm font-bold text-zinc-400 uppercase mb-2">
                          Indirizzo di Spedizione
                        </label>
                        <motion.textarea
                          value={shippingAddress}
                          onChange={(e) => {
                            setShippingAddress(e.target.value)
                            setIsTypingAddress(true)
                          }}
                          onBlur={() => setIsTypingAddress(false)}
                          placeholder="Via, Città, CAP"
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors font-inter resize-none"
                          rows={3}
                          animate={
                            isTypingAddress
                              ? {
                                  borderColor: 'rgba(220, 38, 38, 0.5)',
                                }
                              : {}
                          }
                        />
                        {profile?.address && !isTypingAddress && (
                          <p className="font-inter text-xs text-zinc-500 mt-1">
                            Pre-compilato dal tuo profilo
                          </p>
                        )}
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="mt-2 text-xs text-red-400 hover:text-red-300 font-inter underline"
                        >
                          Modifica indirizzo
                        </button>
                      </motion.div>
                    )}

                    {/* Conferma Acquisto o Successo */}
                    {purchaseSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="space-y-4"
                      >
                        {/* Success Box */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-6 space-y-4"
                        >
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              type: 'spring', 
                              stiffness: 300, 
                              damping: 20,
                              delay: 0.1
                            }}
                            className="flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                          </motion.div>
                          
                          <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="font-barlow text-2xl font-black text-emerald-400 uppercase text-center"
                          >
                            Ordine Confermato!
                          </motion.h3>
                          
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="font-inter text-sm text-zinc-300 text-center"
                          >
                            Riceverai una email di conferma a breve. Il tuo ordine è stato registrato con successo.
                          </motion.p>
                        </motion.div>

                        {/* Pulsante Redirect */}
                        <motion.button
                          onClick={handleGoToOrders}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="w-full py-4 bg-emerald-400 text-zinc-950 font-barlow font-bold uppercase tracking-wide rounded-full shadow-lg hover:shadow-emerald-400/20 transition-shadow"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Torna ai Miei Ordini
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={handlePurchase}
                        className="w-full py-4 bg-red-600 text-white font-barlow font-bold uppercase tracking-wide rounded-full shadow-lg hover:shadow-red-500/20 transition-shadow disabled:opacity-50 relative overflow-hidden"
                        whileHover={{ scale: isPurchasing || !shippingAddress.trim() || showAddressForm ? 1 : 1.05 }}
                        whileTap={{ scale: isPurchasing || !shippingAddress.trim() || showAddressForm ? 1 : 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        disabled={isPurchasing || !shippingAddress.trim() || showAddressForm}
                        variants={shake}
                        animate={
                          purchaseError
                            ? 'shake'
                            : {}
                        }
                        style={
                          purchaseError
                            ? { border: '2px solid #dc2626' }
                            : {}
                        }
                      >
                        <span className="flex items-center justify-center gap-2 relative z-10">
                          {isPurchasing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Elaborazione...</span>
                            </>
                          ) : (
                            'Conferma Acquisto'
                          )}
                        </span>
                      </motion.button>
                    )}

                    <button
                      onClick={() => setShowCheckout(false)}
                      className="w-full py-2 text-zinc-400 hover:text-zinc-100 font-inter text-sm transition-colors"
                    >
                      Modifica selezione
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ProductDetailView

