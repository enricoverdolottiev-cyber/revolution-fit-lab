import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import BookingModal from './components/BookingModal'
import Home from './pages/Home'
import Auth from './pages/Auth'
import AdminDashboard from './pages/AdminDashboard'
import AdminScanner from './pages/AdminScanner'
import CustomerDashboard from './pages/CustomerDashboard'
import CourseDetail from './pages/CourseDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  
  // Ascolta l'evento custom per aprire il booking modal da qualsiasi componente
  useEffect(() => {
    const handleOpenBooking = () => {
      setIsBookingOpen(true)
    }

    window.addEventListener('openBooking', handleOpenBooking)
    return () => {
      window.removeEventListener('openBooking', handleOpenBooking)
    }
  }, [])

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/corso/:id" element={<CourseDetail />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scanner"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </>
  )
}

export default App