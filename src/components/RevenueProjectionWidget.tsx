import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Euro, Target, Zap } from 'lucide-react'
import { startOfWeek, endOfWeek, format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { ClassSession } from '../types/database.types'
import { fadeInUp } from '../utils/animations'

interface RevenueProjectionWidgetProps {
  sessions: ClassSession[]
  enrolledCounts: Record<string, number>
}

// Prezzo standard per sessione (drop-in)
const PRICE_PER_SESSION = 25

function RevenueProjectionWidget({ sessions, enrolledCounts }: RevenueProjectionWidgetProps) {
  const currentWeek = useMemo(() => {
    const now = new Date()
    return {
      start: startOfWeek(now, { locale: it, weekStartsOn: 1 }),
      end: endOfWeek(now, { locale: it, weekStartsOn: 1 })
    }
  }, [])

  const revenueData = useMemo(() => {
    // Revenue potenziale: tutte le classi piene (max_capacity * numero classi * prezzo)
    const potentialRevenue = sessions.reduce((total, session) => {
      return total + (session.max_capacity * PRICE_PER_SESSION)
    }, 0)

    // Revenue attuale: prenotazioni esistenti * prezzo
    const currentRevenue = sessions.reduce((total, session) => {
      const enrolled = enrolledCounts[session.id] || 0
      return total + (enrolled * PRICE_PER_SESSION)
    }, 0)

    // Percentuale raggiunta
    const percentage = potentialRevenue > 0 
      ? Math.round((currentRevenue / potentialRevenue) * 100) 
      : 0

    // Differenza
    const difference = potentialRevenue - currentRevenue

    return {
      potential: potentialRevenue,
      current: currentRevenue,
      difference,
      percentage
    }
  }, [sessions, enrolledCounts])

  // Determina il colore in base alla percentuale
  const getColorScheme = () => {
    if (revenueData.percentage >= 80) {
      return {
        bg: 'bg-gradient-to-br from-yellow-500/20 via-yellow-600/20 to-amber-600/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        accent: 'text-yellow-500',
        glow: 'shadow-yellow-500/20'
      }
    } else if (revenueData.percentage >= 60) {
      return {
        bg: 'bg-gradient-to-br from-red-600/20 via-red-700/20 to-red-800/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        accent: 'text-red-500',
        glow: 'shadow-red-500/20'
      }
    } else {
      return {
        bg: 'bg-gradient-to-br from-zinc-800/40 via-zinc-800/30 to-zinc-900/40',
        border: 'border-zinc-700/50',
        text: 'text-zinc-400',
        accent: 'text-zinc-500',
        glow: 'shadow-zinc-500/10'
      }
    }
  }

  const colors = getColorScheme()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-xl p-6 ${colors.glow} shadow-2xl`}
    >
      {/* Animated Background Glow */}
      <motion.div
        className={`absolute inset-0 opacity-30 ${colors.bg}`}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <TrendingUp className={`w-6 h-6 ${colors.accent}`} />
            </div>
            <div>
              <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase">
                Revenue Projection
              </h3>
              <p className="font-inter text-xs text-zinc-400 mt-1">
                {format(currentWeek.start, 'd MMM', { locale: it })} - {format(currentWeek.end, 'd MMM yyyy', { locale: it })}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${colors.bg} border ${colors.border}`}>
            <span className={`font-barlow text-2xl font-black ${colors.accent}`}>
              {revenueData.percentage}%
            </span>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Revenue */}
          <motion.div
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Euro className={`w-4 h-4 ${colors.accent}`} />
              <span className="font-inter text-xs text-zinc-400 uppercase">Revenue Attuale</span>
            </div>
            <p className={`font-barlow text-2xl font-black ${colors.text}`}>
              €{revenueData.current.toLocaleString('it-IT')}
            </p>
          </motion.div>

          {/* Potential Revenue */}
          <motion.div
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-4 h-4 ${colors.accent}`} />
              <span className="font-inter text-xs text-zinc-400 uppercase">Revenue Potenziale</span>
            </div>
            <p className="font-barlow text-2xl font-black text-zinc-100">
              €{revenueData.potential.toLocaleString('it-IT')}
            </p>
          </motion.div>

          {/* Difference */}
          <motion.div
            className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-4 h-4 ${colors.accent}`} />
              <span className="font-inter text-xs text-zinc-400 uppercase">Potenziale Mancante</span>
            </div>
            <p className={`font-barlow text-2xl font-black ${colors.text}`}>
              €{revenueData.difference.toLocaleString('it-IT')}
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-inter text-xs text-zinc-400">Progresso Settimanale</span>
            <span className={`font-barlow text-sm font-bold ${colors.accent}`}>
              {revenueData.current.toLocaleString('it-IT')} / {revenueData.potential.toLocaleString('it-IT')} €
            </span>
          </div>
          <div className="h-3 bg-zinc-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${revenueData.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                revenueData.percentage >= 80 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                  : revenueData.percentage >= 60
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-zinc-500 to-zinc-600'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RevenueProjectionWidget

