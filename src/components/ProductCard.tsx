import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Info } from 'lucide-react'
import type { Product, TechSpecsObject } from '../types/database.types'

interface ProductCardProps {
  product: Product
  onProductClick: (product: Product) => void
}

/**
 * Card prodotto premium con effetto glow rosso al hover
 */
function ProductCard({ product, onProductClick }: ProductCardProps) {
  const [showTechSpecs, setShowTechSpecs] = useState(false)
  
  // Rendering difensivo per images con null check completo
  const imagesArray = (() => {
    if (!product || !product.images) return []
    if (Array.isArray(product.images)) {
      return product.images.filter((img): img is string => typeof img === 'string' && img.length > 0)
    }
    if (typeof product.images === 'string') {
      try {
        // Prova a parsare come JSON array
        const parsed = JSON.parse(product.images)
        if (Array.isArray(parsed)) {
          return parsed.filter((img): img is string => typeof img === 'string' && img.length > 0)
        }
      } catch {
        // Non è JSON, trattalo come stringa singola
        return [product.images]
      }
      return [product.images]
    }
    return []
  })()
  const mainImage = imagesArray[0] || ''
  
  // Rendering difensivo per tech_specs
  const parseTechSpecs = (): TechSpecsObject | null => {
    if (!product.tech_specs) return null
    
    // Se è già un oggetto
    if (typeof product.tech_specs === 'object' && product.tech_specs !== null) {
      return product.tech_specs as TechSpecsObject
    }
    
    // Se è una stringa, prova a parsarla come JSON
    if (typeof product.tech_specs === 'string') {
      try {
        const parsed = JSON.parse(product.tech_specs)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as TechSpecsObject
        }
      } catch {
        // Non è JSON valido, restituisci null
        return null
      }
    }
    
    return null
  }
  
  const techSpecsObj = parseTechSpecs()
  const hasTechSpecs = techSpecsObj && Object.keys(techSpecsObj).length > 0

  return (
    <div className="group relative">
      <motion.div
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden cursor-pointer relative group"
        whileHover={{ scale: 1.03, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => onProductClick(product)}
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
        onHoverStart={(e) => {
          if (e.currentTarget && 'style' in e.currentTarget) {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(220, 38, 38, 0.5)' // Red-600/50
          }
        }}
        onHoverEnd={(e) => {
          if (e.currentTarget && 'style' in e.currentTarget) {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(39, 39, 42, 0.5)' // zinc-800/50
          }
        }}
      >
        {/* Red Glow Effect - Intensifica al Hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl -z-10"
          style={{
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.2)',
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(220, 38, 38, 0.2)',
              '0 0 40px rgba(220, 38, 38, 0.4)',
              '0 0 20px rgba(220, 38, 38, 0.2)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Glassmorphism Avanzato - Riflesso Diagonale Animato */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          }}
          animate={{
            background: [
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              'linear-gradient(225deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Immagine Prodotto */}
        <div 
          className="relative aspect-square overflow-hidden bg-zinc-800/30"
          onMouseEnter={() => hasTechSpecs && setShowTechSpecs(true)}
          onMouseLeave={() => setShowTechSpecs(false)}
        >
          {mainImage ? (
            <motion.img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            // Placeholder elegante quando non ci sono immagini
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative overflow-hidden">
              {/* Logo Revolution Fit Lab sfocato come background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-20 blur-2xl">
                <div className="text-6xl font-barlow font-black text-red-600/30 uppercase tracking-wider">
                  RFL
                </div>
              </div>
              {/* Testo centrale */}
              <div className="relative z-10 text-center px-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-red-500/50" />
                </div>
                <p className="font-barlow text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  Revolution Fit Lab
                </p>
              </div>
            </div>
          )}
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Info Overlay - Tech Specs */}
          <AnimatePresence>
            {showTechSpecs && techSpecsObj && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3 max-w-xs z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-red-500" />
                  <span className="font-barlow text-xs font-bold text-zinc-300 uppercase tracking-wide">
                    Specifiche Tecniche
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(techSpecsObj).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-barlow font-bold text-zinc-400 uppercase tracking-wide">
                        {key}:
                      </span>
                      <span className="font-inter text-zinc-300 ml-2">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Prodotto */}
        <div className="p-6">
          <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase mb-2 group-hover:text-red-500 transition-colors">
            {product.name}
          </h3>
          <p className="font-inter text-sm text-zinc-400 mb-4 line-clamp-2">
            {product.description}
          </p>
          
          {/* Prezzo */}
          <div className="flex items-center justify-between">
            <span className="font-barlow text-2xl font-black text-zinc-100">
              €{product.price.toFixed(2)}
            </span>
            <motion.div
              className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/50 flex items-center justify-center group-hover:bg-red-600/30 transition-colors"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="w-5 h-5 text-red-500" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ProductCard

