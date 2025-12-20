# Current Shop Logic - ShopTab.tsx

## File: src/components/ShopTab.tsx

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types/database.types'
import ProductCard from './ProductCard'
import ProductDetailView from './ProductDetailView'
import { fadeInUp, staggerContainer, staggerProducts } from '../utils/animations'

interface ShopTabProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

// Timeout costante: 5 secondi
const FETCH_TIMEOUT_MS = 5000

/**
 * Sezione Shop con vetrina prodotti premium (grid 2x3)
 * RESILIENTE: Gestione errori completa, timeout, AbortController
 */
function ShopTab({ showToast }: ShopTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)
  
  // useRef per memorizzare showToast (evita loop infinito)
  const showToastRef = useRef(showToast)
  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])

  // Verifica variabili d'ambiente all'avvio (solo una volta)
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔍 ShopTab: Verifica variabili d\'ambiente')
    console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Mancante')
    console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Presente' : '❌ Mancante')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ ShopTab: Variabili d\'ambiente mancanti!')
      console.error('  Controlla il file .env nella root del progetto')
      console.error('  Assicurati che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano impostati')
    }
  }, [])

  // Test di connessione esplicito all'avvio
  const testConnection = async (): Promise<boolean> => {
    if (!supabase) {
      console.error('❌ ERRORE CRITICO: Supabase client non disponibile')
      return false
    }

    try {
      console.log('🔍 ShopTab: Test connessione Supabase in corso...')
      const { error: testError } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true })
      
      if (testError) {
        console.error('❌ ERRORE CRITICO: Supabase non risponde. Verifica la tua connessione internet o le chiavi API.')
        console.error('  Dettagli errore:', testError)
        return false
      }
      
      console.log('✅ ShopTab: Connessione Supabase verificata con successo')
      return true
    } catch (err: any) {
      console.error('❌ ERRORE CRITICO: Supabase non risponde. Verifica la tua connessione internet o le chiavi API.')
      console.error('  Errore:', err)
      return false
    }
  }

  // Fetch prodotti da Supabase con AbortController, Timeout e Retry Strategy
  useEffect(() => {
    // AbortController per cancellare richieste quando componente si smonta
    const abortController = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const fetchProducts = async (attempt: number = 1): Promise<void> => {
      console.log(`🛒 ShopTab: Inizio fetch prodotti da Supabase (tentativo ${attempt}/3)`)
      
      // Reset error state al primo tentativo
      if (attempt === 1) {
        setError(null)
        setRetryMessage(null)
      }
      
      if (!supabase) {
        console.error('❌ ShopTab: Supabase client non disponibile')
        console.error('  Motivo: Client non inizializzato (variabili d\'ambiente mancanti o errore di inizializzazione)')
        setIsLoading(false)
        setError('Database non connesso')
        return
      }

      // Test connessione al primo tentativo
      if (attempt === 1) {
        const connectionOk = await testConnection()
        if (!connectionOk) {
          setIsLoading(false)
          setError('Impossibile connettersi al database. Verifica la connessione internet o le chiavi API.')
          return
        }
      }

      setIsLoading(true)
      
      try {
        // Timeout di sicurezza: dopo 5 secondi forza il fallimento
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Timeout connessione: la richiesta ha impiegato troppo tempo'))
          }, FETCH_TIMEOUT_MS)
        })

        console.log('📡 ShopTab: Esecuzione query Supabase...')
        
        // Race tra query e timeout
        const queryPromise = supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        const { data, error: queryError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as { data: Product[] | null; error: any }

        // Cancella timeout se la query è completata
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        // Verifica se la richiesta è stata cancellata
        if (abortController.signal.aborted) {
          console.log('⚠️ ShopTab: Richiesta cancellata (componente smontato)')
          return
        }

        // Logging diagnostico dettagliato
        console.log('📦 ShopTab: Dati recuperati:', data)
        console.log('  Tipo dati:', typeof data)
        console.log('  È array?', Array.isArray(data))
        console.log('  Lunghezza:', Array.isArray(data) ? data.length : 'N/A')
        
        if (queryError) {
          console.error('❌ ShopTab: Errore Supabase:', queryError)
          console.error('  Codice errore:', queryError.code)
          console.error('  Messaggio errore:', queryError.message)
          console.error('  Dettagli errore:', queryError.details)
          console.error('  Hint errore:', queryError.hint)
          throw queryError
        }

        // Rendering ultra-sicuro: verifica che data sia un array valido
        if (Array.isArray(data) && data.length > 0) {
          console.log(`✅ ShopTab: ${data.length} prodotti recuperati con successo`)
          
          // Validazione difensiva: filtra prodotti null/undefined/invalidi
          const validProducts = data.filter(
            (product): product is Product =>
              product !== null &&
              product !== undefined &&
              typeof product === 'object' &&
              typeof product.id === 'string' &&
              product.id.length > 0 &&
              typeof product.name === 'string' &&
              product.name.length > 0 &&
              typeof product.price === 'number'
          )
          
          setProducts(validProducts)
        } else {
          console.warn('⚠️ ShopTab: Nessun prodotto disponibile')
          setProducts([])
        }
      } catch (error: any) {
        // Cancella timeout se c'è stato un errore
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        // Ignora errori se la richiesta è stata cancellata
        if (abortController.signal.aborted) {
          console.log('⚠️ ShopTab: Richiesta cancellata durante errore')
          return
        }

        console.error('❌ ShopTab: Errore durante fetch prodotti:', error)
        console.error('  Stack trace:', error?.stack)
        
        // Gestione retry per timeout o errori di connessione
        const isTimeoutError = error?.message?.includes('Timeout') || error?.message?.includes('timeout')
        const isConnectionError = error?.code === 'PGRST116' || error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT'
        
        if ((isTimeoutError || isConnectionError) && attempt < 3) {
          const nextAttempt = attempt + 1
          setRetryMessage(`Connessione lenta rilevata, sto riprovando (tentativo ${nextAttempt}/3)...`)
          
          console.log(`⚠️ ShopTab: Errore di connessione rilevato. Riprovo tra 3 secondi (tentativo ${nextAttempt}/3)...`)
          
          // Attendi 3 secondi prima di riprovare
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Verifica se la richiesta è stata cancellata durante l'attesa
          if (abortController.signal.aborted) {
            console.log('⚠️ ShopTab: Richiesta cancellata durante attesa retry')
            return
          }
          
          // Riprova
          return fetchProducts(nextAttempt)
        }
        
        // Se non è un errore di timeout/connessione o abbiamo esaurito i tentativi
        const errorMessage = error?.message || 'Errore nel caricamento prodotti'
        setError(errorMessage)
        setRetryMessage(null)
        showToastRef.current(errorMessage, 'error')
        setProducts([]) // Assicura che products sia sempre un array
      } finally {
        // Solo se non è stato cancellato
        if (!abortController.signal.aborted) {
          setIsLoading(false)
          setRetryMessage(null)
          console.log('🏁 ShopTab: Fetch completato')
        }
      }
    }

    fetchProducts(1)

    // Cleanup: cancella richiesta quando componente si smonta o cambia tab
    return () => {
      console.log('🧹 ShopTab: Cleanup - Cancellazione richiesta in corso')
      abortController.abort()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, []) // Array vuoto: esegue solo al mount

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleCloseDetail = () => {
    setSelectedProduct(null)
  }

  const handleSuccess = useCallback((message: string) => {
    showToastRef.current(message, 'success')
  }, [])

  const handleError = useCallback((message: string) => {
    showToastRef.current(message, 'error')
  }, [])

  // Skeleton Loader - Matcha esattamente la struttura delle card prodotto
  const ProductSkeleton = () => (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-t-2xl"></div>
      <div className="p-6">
        <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-full mb-1"></div>
        <div className="h-4 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-2/3 mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-24"></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-700"></div>
        </div>
      </div>
    </div>
  )

  // Loading State con spinner Red-600 (non blocca navbar, z-index controllato)
  // Nota: Non usa overlay full-screen per permettere navigazione

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8 relative min-h-[400px]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-barlow text-3xl font-black text-zinc-100 uppercase">
                Shop Revolution
              </h2>
              <p className="font-inter text-sm text-zinc-400 mt-1">
                Abbigliamento e accessori premium per il tuo allenamento
              </p>
            </div>
          </div>

          {/* Loading Overlay (Glassmorphism, non blocca navbar) */}
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mb-4"
              >
                <Loader2 className="w-12 h-12 text-red-600" />
              </motion.div>
              <p className="font-inter text-sm text-zinc-400">
                Caricamento prodotti premium...
              </p>
              {/* Messaggio di retry sotto lo skeleton loader */}
              {retryMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-inter text-xs text-zinc-500 mt-2"
                >
                  {retryMessage}
                </motion.p>
              )}
              {/* Skeleton Grid in background per preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full px-6 opacity-30">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-barlow text-sm font-bold text-red-400 uppercase">
                  Errore di Connessione
                </span>
              </div>
              <p className="font-inter text-sm text-zinc-400">{error}</p>
            </motion.div>
          )}

          {/* Grid Prodotti - Rendering Ultra-Sicuro con Null Check Completo e Animazioni */}
          {!isLoading && (() => {
            // Se ci sono prodotti validi, mostra la griglia con animazioni
            if (products && Array.isArray(products) && products.length > 0) {
              return (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerProducts}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]"
                >
                  {products
                    ?.slice(0, 6)
                    ?.filter((product) => product && product.id && typeof product === 'object')
                    ?.map((product, index) => (
                      <motion.div
                        key={product.id || `product-${index}`}
                        variants={fadeInUp}
                      >
                        <ProductCard
                          product={product}
                          onProductClick={handleProductClick}
                        />
                      </motion.div>
                    )) || null}
                </motion.div>
              )
            }
            
            // Altrimenti mostra messaggio "Nessun prodotto disponibile"
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 min-h-[400px] flex items-center justify-center"
              >
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-12">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center"
                  >
                    <ShoppingBag className="w-10 h-10 text-red-500" />
                  </motion.div>
                  
                  <h3 className="font-barlow text-2xl font-black text-zinc-100 uppercase mb-3">
                    Collezione in Arrivo
                  </h3>
                  
                  <p className="font-inter text-zinc-400 mb-6 max-w-md mx-auto">
                    La nostra collezione premium di abbigliamento e accessori sarà disponibile a breve.
                  </p>
                  
                  {!supabase && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 justify-center mb-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="font-barlow text-sm font-bold text-red-400 uppercase">
                          Database Non Connesso
                        </span>
                      </div>
                      <p className="font-inter text-xs text-zinc-500">
                        Verifica le variabili d'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })()}
        </motion.div>
      </motion.div>

      {/* Product Detail View Modal */}
      <ProductDetailView
        product={selectedProduct}
        onClose={handleCloseDetail}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  )
}

export default ShopTab
```

## Logica di Fetch Prodotti

### Posizione
La logica di recupero prodotti è gestita completamente in **`src/components/ShopTab.tsx`** all'interno del `useEffect` che si esegue al mount del componente.

### Caratteristiche Principali

1. **Fonte Dati**: 
   - Recupera prodotti da **Supabase** (tabella `products`)
   - Query: `supabase.from('products').select('*').order('created_at', { ascending: false })`

2. **Gestione Errori Robusta**:
   - Timeout di 5 secondi (`FETCH_TIMEOUT_MS = 5000`)
   - Retry automatico fino a 3 tentativi per errori di connessione/timeout
   - AbortController per cancellare richieste quando il componente si smonta
   - Validazione difensiva dei dati ricevuti

3. **Test di Connessione**:
   - Verifica connessione Supabase prima del fetch principale
   - Controllo variabili d'ambiente all'avvio

4. **Stati Gestiti**:
   - `isLoading`: stato di caricamento
   - `error`: messaggi di errore
   - `retryMessage`: messaggi durante i retry
   - `products`: array di prodotti validati

5. **Validazione Dati**:
   - Filtra prodotti null/undefined/invalidi
   - Verifica presenza di campi obbligatori (id, name, price)
   - Limita visualizzazione a 6 prodotti (`.slice(0, 6)`)

### File Correlati

- **`src/data/products.ts`**: Contiene dati mock (`mockProducts`) ma **NON viene utilizzato** nel componente ShopTab. Il componente recupera sempre i dati da Supabase.
- **`src/components/ProductCard.tsx`**: Componente per visualizzare singolo prodotto
- **`src/components/ProductDetailView.tsx`**: Modal per dettagli prodotto

