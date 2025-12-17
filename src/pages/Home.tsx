import SEO from '../components/SEO'
import Hero from '../components/Hero'
import Marquee from '../components/Marquee'
import About from '../components/About'
import Instructors from '../components/Instructors'
import ClassesGrid from '../components/ClassesGrid'
import Pricing from '../components/Pricing'
import Footer from '../components/Footer'

function Home() {
  // onOpenBooking è gestito globalmente da App.tsx tramite la Navbar
  const onOpenBooking = () => {
    // Questo sarà gestito dal context globale o tramite un evento custom
    // Per ora, creiamo un evento custom che App.tsx può ascoltare
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <SEO 
        title="Revolution Fit Lab | Urban Pilates Studio"
        description="Scopri il primo studio Pilates Urban Dark. Reformer, Matwork e un'atmosfera unica. Prenota la tua sessione oggi."
      />
      <Hero onOpenBooking={onOpenBooking} />
      <Marquee />
      <About />
      <Instructors />
      <ClassesGrid />
      <Pricing onOpenBooking={onOpenBooking} />
      <Footer />
    </div>
  )
}

export default Home

