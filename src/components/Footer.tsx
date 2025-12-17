import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Instagram } from 'lucide-react'
import Reveal from './ui/Reveal'

function Footer() {
  return (
    <footer id="contact" className="bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
            {/* Colonna Sinistra - Location & Info (60%) */}
            <div className="lg:col-span-3">
              {/* Mappa */}
              <div className="mb-8">
                <div className="relative w-full h-[400px] overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2798.0!2d9.1859!3d45.4654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI3JzU1LjQiTiA5wrAxMScwOS4yIkU!5e0!3m2!1sit!2sit!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(100%) invert(10%)' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                    title="Revolution Fit Lab Location"
                  ></iframe>
                </div>
              </div>

              {/* Info Contatti */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-red flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-inter text-brand-text">
                      Via del Fitness, 123
                    </p>
                    <p className="font-inter text-zinc-400">
                      20100 Milano, Italia
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand-red flex-shrink-0" />
                  <a 
                    href="tel:+391234567890" 
                    className="font-inter text-brand-text hover:text-brand-red transition-colors"
                  >
                    +39 123 456 7890
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-brand-red flex-shrink-0" />
                  <a 
                    href="mailto:info@revolutionfitlab.com" 
                    className="font-inter text-brand-text hover:text-brand-red transition-colors"
                  >
                    info@revolutionfitlab.com
                  </a>
                </div>
              </div>
            </div>

            {/* Colonna Destra - Nav & Social (40%) */}
            <div className="lg:col-span-2">
              {/* Logo */}
              <h3 className="font-barlow text-2xl font-bold text-brand-text uppercase mb-8">
                Revolution Fit Lab
              </h3>

              {/* Link Rapidi */}
              <div className="mb-8">
                <h4 className="font-barlow text-sm font-semibold text-brand-text uppercase tracking-wide mb-4">
                  Link Rapidi
                </h4>
                <ul className="space-y-3">
                  <li>
                    <a 
                      href="#home" 
                      className="font-inter text-zinc-400 hover:text-brand-text transition-colors"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#classes" 
                      className="font-inter text-zinc-400 hover:text-brand-text transition-colors"
                    >
                      Classes
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#instructors" 
                      className="font-inter text-zinc-400 hover:text-brand-text transition-colors"
                    >
                      Team
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#pricing" 
                      className="font-inter text-zinc-400 hover:text-brand-text transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div className="mb-8">
                <h4 className="font-barlow text-sm font-semibold text-brand-text uppercase tracking-wide mb-4">
                  Seguici
                </h4>
                <div className="flex items-center gap-4">
                  <motion.a
                    href="https://instagram.com/revolutionfitlab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-brand-red transition-colors"
                    aria-label="Instagram"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Instagram size={20} />
                  </motion.a>
                  <motion.a
                    href="https://tiktok.com/@revolutionfitlab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-brand-red transition-colors font-inter text-sm"
                    aria-label="TikTok"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    TikTok
                  </motion.a>
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block font-inter text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <a 
                  href="#" 
                  className="block font-inter text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Copyright */}
        <Reveal delay={0.2}>
          <div className="pt-8 border-t border-zinc-900">
            <p className="font-inter text-zinc-500 text-sm text-center">
              © 2025 Revolution Fit Lab. All rights reserved.
            </p>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}

export default Footer
