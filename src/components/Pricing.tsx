import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Reveal from './ui/Reveal'

interface Plan {
  id: string
  title: string
  subtitle: string
  price: string
  features: string[]
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'drop-in',
    title: 'DROP-IN',
    subtitle: '1 Sessione',
    price: '€25',
    features: [
      '1 lezione singola',
      'Accesso a tutte le classi',
      'Prenotazione flessibile',
      'Validità 30 giorni'
    ],
    popular: false
  },
  {
    id: 'pack-5',
    title: '5-PACK',
    subtitle: 'Pacchetto',
    price: '€110',
    features: [
      '5 lezioni a scelta',
      'Risparmio del 12%',
      'Accesso a tutte le classi',
      'Validità 60 giorni',
      'Trasferibile ad amici'
    ],
    popular: true
  },
  {
    id: 'membership',
    title: 'MEMBERSHIP',
    subtitle: 'Mensile',
    price: '€180',
    features: [
      'Lezioni illimitate',
      'Accesso prioritario',
      'Tutte le classi incluse',
      'Canale privato community',
      'Consulenza personalizzata',
      'Cancellazione flessibile'
    ],
    popular: false
  }
]

interface PricingProps {
  onOpenBooking: () => void
}

function Pricing({ onOpenBooking }: PricingProps) {
  return (
    <section id="pricing" className="bg-brand-bg py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal width="fit-content" delay={0}>
          <div className="text-center mb-16">
            <h2 className="font-barlow text-5xl md:text-6xl font-black text-brand-text uppercase tracking-tight">
              INVEST IN YOURSELF
            </h2>
          </div>
        </Reveal>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.1}>
              <motion.div
                className={`relative flex flex-col p-8 ${
                  plan.popular
                    ? 'bg-zinc-800 border-2 border-brand-red'
                    : 'bg-zinc-900/50 border-2 border-zinc-800'
                }`}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
              {/* Popular Badge */}
              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                >
                  <span className="bg-brand-red text-brand-text px-4 py-1 font-barlow font-bold text-sm uppercase tracking-wide">
                    MOST POPULAR
                  </span>
                </motion.div>
              )}

              {/* Title */}
              <h3 className="font-barlow text-2xl font-black text-brand-text uppercase tracking-tight mb-2">
                {plan.title}
              </h3>
              <p className="font-inter text-sm text-zinc-400 mb-6">
                {plan.subtitle}
              </p>

              {/* Price */}
              <div className="mb-8">
                <span className="font-barlow text-7xl font-black text-brand-text">
                  {plan.price}
                </span>
              </div>

              {/* Features List */}
              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li
                    key={featureIndex}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Check 
                        className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" 
                        strokeWidth={3}
                      />
                    </motion.div>
                    <span className="font-inter text-sm text-zinc-300">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.button
                onClick={onOpenBooking}
                className={`w-full py-4 font-barlow font-bold uppercase tracking-wide transition-colors ${
                  plan.popular
                    ? 'bg-brand-red text-brand-text hover:bg-red-600'
                    : 'bg-transparent text-brand-text border-2 border-brand-red hover:bg-brand-red hover:text-brand-text'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ACQUISTA
              </motion.button>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing