import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SEO from '../components/SEO'
import Hero from '../components/Hero'
import About from '../components/About'
// import Instructors from '../components/Instructors' // Ghost Mode: Team section hidden from public
import ClassesGrid from '../components/ClassesGrid'
import Pricing from '../components/Pricing'
import ShopPreview from '../components/ShopPreview'
import Footer from '../components/Footer'

function Home() {
  const location = useLocation()

  // onOpenBooking è gestito globalmente da App.tsx tramite la Navbar
  const onOpenBooking = () => {
    // Questo sarà gestito dal context globale o tramite un evento custom
    // Per ora, creiamo un evento custom che App.tsx può ascoltare
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  // Scroll automatico alla sezione quando c'è un hash nell'URL
  useEffect(() => {
    const hash = location.hash

    if (hash) {
      // Rimuovi il # dall'hash
      const sectionId = hash.replace('#', '')
      
      // Aspetta che il DOM sia completamente renderizzato
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          // Calcola l'offset per la navbar fissa (80px di altezza)
          const navbarHeight = 80
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
          const offsetPosition = elementPosition - navbarHeight

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    } else {
      // Se non c'è hash, scrolla in cima quando si arriva dalla navigazione
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location])

  return (
    <div className="min-h-screen bg-brand-bg">
      <SEO 
        title="Revolution Fit Lab | Urban Pilates Studio"
        description="Scopri il primo studio Pilates Urban Dark. Reformer, Matwork e un'atmosfera unica. Prenota la tua sessione oggi."
      />
      <Hero onOpenBooking={onOpenBooking} />
      <div className="py-12" />
      <About />
      {/* <Instructors /> Ghost Mode: Team section hidden from public */}
      <ClassesGrid />
      <Pricing onOpenBooking={onOpenBooking} />
      <ShopPreview />
      <Footer />
    </div>
  )
}

export default Home

