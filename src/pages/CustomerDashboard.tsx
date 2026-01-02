import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CreditCard, ShoppingBag, User } from 'lucide-react'
import ProfileSection from '../components/ProfileSection'
import ClassesSection from '../components/ClassesSection'
import AccessPass from '../components/AccessPass'
import { ToastContainer } from '../components/ui/Toast'

// Lazy loading per Shop e Pagamenti per migliorare performance
const ShopTab = lazy(() => import('../components/ShopTab'))
const PaymentsSection = lazy(() => import('../components/PaymentsSection'))

type TabType = 'classes' | 'payments' | 'shop' | 'profile'

interface Tab {
  id: TabType
  label: string
  icon: typeof Calendar
}

const tabs: Tab[] = [
  { id: 'classes', label: 'Classi', icon: Calendar },
  { id: 'payments', label: 'Pagamenti', icon: CreditCard },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'profile', label: 'Profilo', icon: User },
]

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('classes')
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  >([])

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Ascolta evento custom per cambiare tab (es. da ProductDetailView dopo ordine)
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      const tab = event.detail as TabType
      if (tabs.some(t => t.id === tab)) {
        setActiveTab(tab)
      }
    }

    window.addEventListener('switchDashboardTab', handleSwitchTab as EventListener)
    return () => {
      window.removeEventListener('switchDashboardTab', handleSwitchTab as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <h1 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase">
              La Tua Dashboard
            </h1>
            <AccessPass compact={true} showToast={showToast} />
          </div>
          <p className="font-inter text-zinc-400">
            Gestisci le tue classi, pagamenti e profilo
          </p>
        </motion.div>

        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:flex gap-8">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-64 flex-shrink-0"
          >
            <nav className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-2 sticky top-24">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      font-barlow font-bold uppercase tracking-wide text-sm
                      transition-colors relative
                      ${
                        isActive
                          ? 'text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-red-600/20 border border-red-600/50 rounded-xl"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 relative z-10 ${
                        isActive ? 'text-red-500' : 'text-zinc-500'
                      }`}
                    />
                    <span className="relative z-10">{tab.label}</span>
                  </motion.button>
                )
              })}
            </nav>
          </motion.aside>

          {/* Content */}
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'classes' && (
                <ClassesSection key="classes" showToast={showToast} />
              )}
              {activeTab === 'payments' && (
                <Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 animate-pulse">
                        <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-4"></div>
                        <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded"></div>
                      </div>
                    </div>
                  }
                >
                  <PaymentsSection key="payments" showToast={showToast} />
                </Suspense>
              )}
              {activeTab === 'shop' && (
                <Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
                        <div className="h-8 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-pulse"
                            >
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
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <ShopTab key="shop" showToast={showToast} />
                </Suspense>
              )}
              {activeTab === 'profile' && (
                <ProfileSection key="profile" showToast={showToast} />
              )}
            </AnimatePresence>
          </motion.main>
        </div>

        {/* Mobile/Tablet Top Scroller Navigation */}
        <div className="lg:hidden">
          {/* Scrollable Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="relative bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl
                        font-barlow font-bold uppercase tracking-wide text-sm
                        transition-colors relative whitespace-nowrap
                        ${
                          isActive
                            ? 'text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-100'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicatorMobile"
                          className="absolute inset-0 bg-red-600/20 border border-red-600/50 rounded-xl"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 relative z-10 ${
                          isActive ? 'text-red-500' : 'text-zinc-500'
                        }`}
                      />
                      <span className="relative z-10">{tab.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'classes' && (
                <ClassesSection key="classes" showToast={showToast} />
              )}
              {activeTab === 'payments' && (
                <Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 animate-pulse">
                        <div className="h-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-4"></div>
                        <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded"></div>
                      </div>
                    </div>
                  }
                >
                  <PaymentsSection key="payments" showToast={showToast} />
                </Suspense>
              )}
              {activeTab === 'shop' && (
                <Suspense
                  fallback={
                    <div className="space-y-6">
                      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6">
                        <div className="h-8 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-pulse"
                            >
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
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <ShopTab key="shop" showToast={showToast} />
                </Suspense>
              )}
              {activeTab === 'profile' && (
                <ProfileSection key="profile" showToast={showToast} />
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

export default CustomerDashboard
