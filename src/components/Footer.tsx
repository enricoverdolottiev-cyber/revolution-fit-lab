import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Instagram, Clock } from 'lucide-react'
import Reveal from './ui/Reveal'

function Footer() {
  return (
    <footer id="contact" className="bg-black border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Colonna Sinistra - Mappa Google Maps */}
            <div>
              <div className="relative w-full h-[400px] overflow-hidden rounded-xl border border-red-600/30">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.671542197543!2d12.5283437!3d41.8784841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132f6229569e2515%3A0x633190b9b32e6047!2sVia%20Nocera%20Umbra%2C%2062%2C%2000181%20Roma%20RM!5e0!3m2!1sit!2sit!4v1703080000000!5m2!1sit!2sit"
                  width="100%"
                  height="100%"
                  style={{ 
                    border: 0, 
                    filter: 'grayscale(1) invert(0.9)',
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="Revolution Fit Lab - Via Nocera Umbra 62, Roma"
                ></iframe>
              </div>
            </div>

            {/* Colonna Destra - Contatti & Social */}
            <div className="flex flex-col justify-between">
              {/* Logo */}
              <div className="mb-8">
                <h3 className="font-barlow text-3xl font-black text-brand-text uppercase mb-8">
                  Revolution Fit Lab
                </h3>
              </div>

              {/* Blocco Informazioni Contatti */}
              <div className="space-y-6 mb-8">
                {/* Indirizzo */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-inter text-brand-text font-medium">
                      Via Nocera Umbra 62, Roma
                    </p>
                  </div>
                </div>

                {/* Telefono */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <a 
                    href="tel:+391234567890" 
                    className="font-inter text-brand-text hover:text-red-600 transition-colors"
                  >
                    +39 123 456 7890
                  </a>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <a 
                    href="mailto:info@revolutionfitlab.com" 
                    className="font-inter text-brand-text hover:text-red-600 transition-colors"
                  >
                    info@revolutionfitlab.com
                  </a>
                </div>

                {/* Orari */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-inter text-brand-text font-medium">
                      Lun - Dom: 10:00 - 20:00
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-6">
                <motion.a
                  href="https://instagram.com/revolutionfitlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-red-600 transition-colors"
                  aria-label="Instagram"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Instagram size={24} strokeWidth={1.5} />
                </motion.a>
                <motion.a
                  href="https://tiktok.com/@revolutionfitlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-red-600 transition-colors font-inter text-sm font-medium"
                  aria-label="TikTok"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  TikTok
                </motion.a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Copyright */}
        <Reveal delay={0.2}>
          <div className="pt-8 border-t border-zinc-800/50">
            <p className="font-inter text-zinc-500 text-sm text-center">
              © 2025 Revolution Fit Lab. Tutti i diritti riservati.
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}

export default Footer
