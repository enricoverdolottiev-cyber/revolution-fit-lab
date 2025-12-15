import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavLink {
  name: string
  href: string
}

interface NavbarProps {
  onOpenBooking: () => void
}

const navLinks: NavLink[] = [
  { name: 'Studio', href: '#about' },
  { name: 'Team', href: '#instructors' },
  { name: 'Classes', href: '#classes' },
  { name: 'Pricing', href: '#pricing' },
]

function Navbar({ onOpenBooking }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLinkClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="font-barlow text-2xl font-bold text-brand-text uppercase tracking-wide">
              Revolution Fit Lab
            </div>

            {/* Desktop Navigation Links - Centrati */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-barlow text-base font-medium text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Desktop CTA Button */}
            <motion.button 
              onClick={onOpenBooking}
              className="hidden md:block bg-brand-red text-brand-text px-8 py-3 font-barlow font-bold uppercase tracking-wide hover:bg-red-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Prenota
            </motion.button>

            {/* Mobile Menu Button & CTA */}
            <div className="flex md:hidden items-center gap-4">
              <motion.button 
                onClick={onOpenBooking}
                className="bg-brand-red text-brand-text px-6 py-2.5 font-barlow font-bold uppercase tracking-wide hover:bg-red-600 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Prenota
              </motion.button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-brand-text p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X size={24} className="text-brand-text" />
                ) : (
                  <Menu size={24} className="text-brand-text" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay - Full Screen */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-zinc-950 md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-12">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="font-barlow text-4xl md:text-5xl font-bold text-brand-text uppercase tracking-wide hover:text-brand-red transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar