import { motion } from 'framer-motion'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Reveal from './ui/Reveal'
import { fadeInUp, staggerContainer } from '../utils/animations'

/**
 * Shop Preview Section per la homepage
 * Mostra 3 prodotti top in modalità Bento Grid
 */
function ShopPreview() {
  const { user } = useAuth()

  // Mock products - in production questi verranno da Supabase
  const featuredProducts = [
    {
      id: '1',
      name: 'Calzini Pilates',
      price: 25,
      image: 'https://images.unsplash.com/photo-1587560699049-bd3f6384e9f0?w=800',
    },
    {
      id: '2',
      name: 'Leggings Premium',
      price: 89,
      image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800',
    },
    {
      id: '3',
      name: 'T-shirt Revolution',
      price: 45,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    },
  ]

  const handleCTAClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth'
      return
    }
    // Redirect to dashboard shop tab
    window.location.href = '/dashboard'
  }

  return (
    <section id="shop" className="bg-zinc-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal width="fit-content" delay={0}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase">
              Shop Revolution
            </h2>
          </div>
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={fadeInUp}
              className="group relative"
            >
              <motion.div
                className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Glow Effect Rosso al Hover */}
                <motion.div
                  className="absolute inset-0 bg-red-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
                />

                {/* Immagine Prodotto */}
                <div className="relative aspect-square overflow-hidden bg-zinc-800/30">
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Info Prodotto */}
                <div className="p-6">
                  <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase mb-2 group-hover:text-red-500 transition-colors">
                    {product.name}
                  </h3>
                  <span className="font-barlow text-2xl font-black text-zinc-100">
                    €{product.price.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <Reveal delay={0.3}>
          <div className="text-center">
            <motion.button
              onClick={handleCTAClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-barlow font-bold uppercase tracking-wide rounded-2xl shadow-lg hover:shadow-red-500/20 transition-shadow group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <span>Scopri la Collezione</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default ShopPreview

