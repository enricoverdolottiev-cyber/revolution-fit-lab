import { useState } from 'react'
import SEO from './components/SEO'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Instructors from './components/Instructors'
import ClassesGrid from './components/ClassesGrid'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import BookingModal from './components/BookingModal'

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const onOpenBooking = () => setIsBookingOpen(true)

  return (
    <div className="min-h-screen bg-brand-bg">
      <SEO 
        title="Revolution Fit Lab | Urban Pilates Studio"
        description="Scopri il primo studio Pilates Urban Dark. Reformer, Matwork e un'atmosfera unica. Prenota la tua sessione oggi."
      />
      <Navbar onOpenBooking={onOpenBooking} />
      <Hero onOpenBooking={onOpenBooking} />
      <Marquee />
      <About />
      <Instructors />
      <ClassesGrid />
      <Pricing onOpenBooking={onOpenBooking} />
      <Footer />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  )
}

export default App