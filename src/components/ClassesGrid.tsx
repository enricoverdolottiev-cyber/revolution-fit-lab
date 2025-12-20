import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Activity, User, Clock, Users, ArrowRight } from 'lucide-react'
import Reveal from './ui/Reveal'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface ClassCategory {
  id: string
  title: string
  description: string
  icon: typeof Activity
  features: string[]
  duration: string
  capacity: string
  levels?: string[]
}

const classCategories: ClassCategory[] = [
  {
    id: 'reformer-pilates',
    title: 'Reformer Pilates',
    description: 'Sessione intensiva su macchina Reformer mirata alla forza core e flessibilità. Massimo 3 partecipanti per garantire un\'attenzione sartoriale. Due livelli disponibili: Base per chi si avvicina al Reformer Pilates e Advance per chi vuole intensificare l\'allenamento.',
    icon: Activity,
    features: [
      'Due livelli: Base e Advance',
      'Sessione da 60 minuti',
      'Massimo 3 persone per classe',
      'Focus su postura e allineamento'
    ],
    duration: '60 min',
    capacity: 'Max 3 persone',
    levels: ['Base', 'Advance']
  },
  {
    id: 'personal-training',
    title: 'Personal Training',
    description: 'Programma 100% personalizzato sugli obiettivi individuali: ipertrofia, postura o performance. Sessioni individuali o mini-gruppi (max 3 persone) per la massima efficacia. Ogni percorso è studiato su misura per trasformare il tuo corpo e raggiungere risultati concreti.',
    icon: User,
    features: [
      'Individuale o mini-gruppo',
      'Massimo 3 persone',
      'Prenotazione oraria flessibile',
      'Programma personalizzato'
    ],
    duration: 'Su misura',
    capacity: 'Max 3 persone'
  }
]

interface ClassCardProps {
  category: ClassCategory
  index: number
}

function ClassCard({ category, index }: ClassCardProps) {
  return (
    <div className="h-full">
      <Reveal delay={index * 0.15}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          className="group h-full"
        >
          <motion.div
            className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 h-full flex flex-col relative overflow-hidden"
            style={{ minHeight: '550px' }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Red Glow Effect on Hover */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                boxShadow: '0 0 40px rgba(220, 38, 38, 0.3)',
              }}
            />

            {/* Glassmorphism Overlay */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 50%)',
              }}
              transition={{ duration: 0.3 }}
            />

            {/* Body Content Wrapper - flex: 1 1 auto per spingere footer in basso */}
            <div className="flex-1 flex flex-col relative z-10">
              {/* Title */}
              <h3 className="font-barlow text-2xl md:text-3xl font-black text-zinc-100 uppercase mb-3">
                {category.title}
              </h3>

              {/* Description */}
              <p className="font-inter text-zinc-400 mb-6 leading-relaxed">
                {category.description}
              </p>

              {/* Levels Badge (only for Reformer Pilates) */}
              {category.levels && (
                <div className="flex items-center gap-2 mb-6">
                  {category.levels.map((level, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-barlow font-bold uppercase tracking-wide bg-red-600/20 border border-red-600/30 text-red-600"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              )}

              {/* Features List */}
              <ul className="space-y-3 mb-6">
                {category.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 flex-shrink-0" />
                    <span className="font-inter text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Spacer div per forzare allineamento perfetto */}
              <div className="flex-grow"></div>
            </div>

            {/* Footer Info - mt-auto per posizionamento in basso */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-inter text-xs">{category.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span className="font-inter text-xs">{category.capacity}</span>
                </div>
              </div>
              <Link
                to={`/corso/${category.id}`}
                onClick={() => window.scrollTo(0, 0)}
                className="text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-red-600 hover:translate-x-1"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </Reveal>
    </div>
  )
}

function ClassesGrid() {
  return (
    <section id="classes" className="bg-brand-bg py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal width="fit-content" delay={0}>
          <div className="text-center mb-16">
            <h2 className="font-barlow text-5xl md:text-6xl font-black text-brand-text uppercase tracking-tight mb-4">
              Le Nostre Classi
            </h2>
            <p className="font-inter text-lg text-zinc-400 max-w-2xl mx-auto">
              Due modalità di allenamento premium per trasformare il tuo corpo
            </p>
          </div>
        </Reveal>

        {/* Classes Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {classCategories.map((category, index) => (
            <ClassCard key={category.id} category={category} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default ClassesGrid
