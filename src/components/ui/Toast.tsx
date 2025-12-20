import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  }

  const colors = {
    success: {
      bg: 'bg-zinc-900/80',
      border: 'border-emerald-500/30',
      text: 'text-zinc-100',
      icon: 'text-emerald-400',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]', // Glow emerald smeraldo molto sfumato
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      icon: 'text-red-400',
      shadow: '',
    },
    info: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      icon: 'text-orange-400',
      shadow: '',
    },
  }

  const Icon = icons[type]
  const colorScheme = colors[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`
        ${colorScheme.bg} ${colorScheme.border}
        backdrop-blur-md border rounded-xl p-4
        flex items-center gap-3 min-w-[300px] max-w-md
        ${colorScheme.shadow || 'shadow-lg'}
      `}
    >
      <Icon className={`w-5 h-5 ${colorScheme.icon} flex-shrink-0`} />
      <p className={`font-inter text-sm ${colorScheme.text} flex-1`}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className={`${colorScheme.icon} hover:opacity-70 transition-opacity p-1`}
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook per gestire i toast
export function useToast() {
  const showToast = (
    message: string,
    type: ToastType = 'info',
    setToasts: React.Dispatch<React.SetStateAction<Array<{ id: string; message: string; type: ToastType }>>>
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  return { showToast }
}

