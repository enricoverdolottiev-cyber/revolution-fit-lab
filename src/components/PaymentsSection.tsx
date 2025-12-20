import { motion } from 'framer-motion'
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface PaymentsSectionProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

interface Payment {
  id: string
  date: string
  amount: number
  method: string
  status: 'completed' | 'pending'
  description?: string
  service?: string
}

// Placeholder data - in production, this would come from Supabase
const mockPayments: Payment[] = [
  // Add mock data or fetch from database
]

function PaymentsSection({}: PaymentsSectionProps) {
  const payments: Payment[] = mockPayments // Replace with actual data fetching
  
  // Calculate total spent
  const totalSpent = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatusBadge = (status: 'completed' | 'pending') => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-barlow font-bold uppercase tracking-wide">
          <CheckCircle className="w-3 h-3" />
          Saldato
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/50 text-red-400 text-xs font-barlow font-bold uppercase tracking-wide">
        <Clock className="w-3 h-3" />
        In attesa
      </span>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Total Spent Card */}
      <motion.div
        variants={fadeInUp}
        className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-inter text-sm text-zinc-400 uppercase tracking-wide mb-2">
              Totale Speso
            </p>
            <p className="font-barlow text-4xl font-black text-brand-text">
              {new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalSpent)}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="font-barlow text-2xl font-black text-brand-text uppercase">
            Storico Pagamenti
          </h2>
        </div>

        {payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <motion.div
                  className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 hover:border-red-600/50 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Date */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-inter text-xs text-zinc-500 uppercase">
                          Data
                        </p>
                        <p className="font-barlow text-sm font-bold text-brand-text">
                          {formatDate(payment.date)}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-inter text-xs text-zinc-500 uppercase">
                          Servizio
                        </p>
                        <p className="font-barlow text-sm font-bold text-brand-text">
                          {payment.service || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-inter text-xs text-zinc-500 uppercase">
                          Importo
                        </p>
                        <p className="font-barlow text-lg font-black text-brand-text">
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                    </div>

                    {/* Method */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-inter text-xs text-zinc-500 uppercase">
                          Metodo
                        </p>
                        <p className="font-barlow text-sm font-bold text-brand-text">
                          {payment.method}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-start md:justify-end">
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>

                  {payment.description && (
                    <p className="font-inter text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-700/50">
                      {payment.description}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="font-barlow text-xl font-black text-brand-text uppercase mb-2">
                Nessun Pagamento Registrato
              </h3>
              <p className="font-inter text-zinc-400 max-w-md mx-auto">
                I tuoi pagamenti verranno visualizzati qui una volta completati.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default PaymentsSection

