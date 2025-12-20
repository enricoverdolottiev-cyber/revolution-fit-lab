import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  Users,
  Target,
  Heart,
  Zap,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import SEO from '../components/SEO'
import Reveal from '../components/ui/Reveal'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface CourseDetail {
  id: string
  title: string
  heroImage: string
  description: string
  whatYouDo: string[]
  whoIsItFor: string[]
  results: string[]
  benefits: {
    icon: typeof Heart
    title: string
    description: string
  }[]
  gallery: string[]
  duration: string
  capacity: string
  levels?: string[]
}

const coursesData: Record<string, CourseDetail> = {
  'reformer-pilates': {
    id: 'reformer-pilates',
    title: 'Reformer Pilates',
    heroImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=80',
    description: 'Sessione intensiva su macchina Reformer mirata alla forza core e flessibilità. Massimo 3 partecipanti per garantire un\'attenzione sartoriale.',
    whatYouDo: [
      'Esercizi di resistenza con carrucole e molle del Reformer',
      'Sequenze dinamiche per potenziare il core',
      'Movimenti controllati per migliorare la postura',
      'Stretching profondo per aumentare la flessibilità',
      'Tecniche di respirazione coordinate con il movimento'
    ],
    whoIsItFor: [
      'Principianti che vogliono avvicinarsi al Pilates',
      'Atleti che cercano un complemento al loro allenamento',
      'Persone con problemi posturali o dolori alla schiena',
      'Chi vuole tonificare senza aumentare la massa muscolare',
      'Chi cerca un allenamento completo mente-corpo'
    ],
    results: [
      'Core più forte e stabile',
      'Postura migliorata e allineamento corretto',
      'Flessibilità aumentata del 30-40%',
      'Corpo tonico e definito',
      'Maggiore consapevolezza corporea',
      'Riduzione di tensioni e dolori muscolari'
    ],
    benefits: [
      {
        icon: Heart,
        title: 'Salute Cardiovascolare',
        description: 'Migliora la circolazione e la resistenza'
      },
      {
        icon: Zap,
        title: 'Energia',
        description: 'Aumenta i livelli di energia quotidiana'
      },
      {
        icon: Target,
        title: 'Precisione',
        description: 'Movimenti controllati e mirati'
      },
      {
        icon: TrendingUp,
        title: 'Progressi Costanti',
        description: 'Risultati visibili in poche settimane'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
    ],
    duration: '60 min',
    capacity: 'Max 3 persone',
    levels: ['Base', 'Advance']
  },
  'personal-training': {
    id: 'personal-training',
    title: 'Personal Training',
    heroImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80',
    description: 'Programma 100% personalizzato sugli obiettivi individuali: ipertrofia, postura o performance. Sessioni individuali o mini-gruppi (max 3 persone) per la massima efficacia.',
    whatYouDo: [
      'Valutazione iniziale degli obiettivi e delle capacità',
      'Programma di allenamento su misura',
      'Esercizi con attrezzature professionali',
      'Monitoraggio costante dei progressi',
      'Aggiustamenti dinamici del programma',
      'Supporto nutrizionale e lifestyle'
    ],
    whoIsItFor: [
      'Chi ha obiettivi specifici e mirati',
      'Atleti che vogliono migliorare le performance',
      'Persone che preferiscono un approccio individuale',
      'Chi ha bisogno di motivazione costante',
      'Chi vuole risultati rapidi e misurabili',
      'Chi ha limitazioni fisiche o infortuni passati'
    ],
    results: [
      'Raggiungimento degli obiettivi personalizzati',
      'Aumento della massa muscolare o definizione',
      'Miglioramento delle performance atletiche',
      'Correzione di squilibri posturali',
      'Aumento della forza e resistenza',
      'Miglioramento della composizione corporea'
    ],
    benefits: [
      {
        icon: Target,
        title: 'Personalizzazione',
        description: 'Programma studiato esclusivamente per te'
      },
      {
        icon: Zap,
        title: 'Efficienza',
        description: 'Massimi risultati in minor tempo'
      },
      {
        icon: TrendingUp,
        title: 'Progressi Misurabili',
        description: 'Tracking costante dei miglioramenti'
      },
      {
        icon: Heart,
        title: 'Salute Ottimale',
        description: 'Approccio olistico al benessere'
      }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
    ],
    duration: 'Su misura',
    capacity: 'Max 3 persone'
  }
}

function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const course = id ? coursesData[id] : null

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-barlow text-4xl font-black text-zinc-100 uppercase mb-4">
            Corso Non Trovato
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 text-white font-barlow font-bold uppercase tracking-wide rounded-xl hover:bg-red-700 transition-colors"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title={`${course.title} | Revolution Fit Lab`}
        description={course.description}
        image={course.heroImage}
      />

      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10" />
        <motion.img
          src={course.heroImage}
          alt={course.title}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <Reveal>
              <motion.button
                onClick={() => navigate('/')}
                className="mb-6 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group"
                whileHover={{ x: -4 }}
              >
                <ArrowLeft className="w-5 h-5 group-hover:text-red-600 transition-colors" />
                <span className="font-inter text-sm uppercase tracking-wide">Torna Indietro</span>
              </motion.button>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-barlow text-5xl md:text-7xl font-black text-white uppercase mb-4">
                {course.title}
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-inter text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed">
                {course.description}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span className="font-inter">{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Users className="w-5 h-5 text-red-600" />
                  <span className="font-inter">{course.capacity}</span>
                </div>
                {course.levels && (
                  <div className="flex items-center gap-2">
                    {course.levels.map((level, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-barlow font-bold uppercase tracking-wide bg-red-600/20 border border-red-600/30 text-red-600"
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-24"
        >
          {/* L'Essenza del Corso */}
          <motion.section variants={fadeInUp}>
            <Reveal>
              <h2 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase mb-8">
                L'Essenza del Corso
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="space-y-4">
                {course.whatYouDo.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-inter text-lg text-zinc-300 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </motion.section>

          {/* A chi si rivolge */}
          <motion.section variants={fadeInUp}>
            <Reveal>
              <h2 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase mb-8">
                A Chi Si Rivolge
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="space-y-4">
                {course.whoIsItFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="font-inter text-lg text-zinc-300 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </motion.section>

          {/* Benefici & Risultati */}
          <motion.section variants={fadeInUp}>
            <Reveal>
              <h2 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase mb-8">
                Benefici & Risultati
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {course.benefits.map((benefit, idx) => {
                  const Icon = benefit.icon
                  return (
                    <motion.div
                      key={idx}
                      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-8 hover:border-red-600/50 transition-colors"
                      whileHover={{ y: -4 }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-red-600/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="font-barlow text-xl font-black text-zinc-100 uppercase">
                          {benefit.title}
                        </h3>
                      </div>
                      <p className="font-inter text-zinc-400 leading-relaxed">
                        {benefit.description}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
              <Reveal delay={0.2}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.results.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-4">
                        <TrendingUp className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <span className="font-inter text-lg text-zinc-300 leading-relaxed">
                          {result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </Reveal>
          </motion.section>

          {/* Experience Gallery */}
          <motion.section variants={fadeInUp}>
            <Reveal>
              <h2 className="font-barlow text-4xl md:text-5xl font-black text-zinc-100 uppercase mb-8">
                Experience
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {course.gallery.map((image, idx) => (
                  <motion.div
                    key={idx}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800/50 group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={image}
                      alt={`${course.title} - Experience ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </motion.section>
        </motion.div>
      </div>
    </div>
  )
}

export default CourseDetail

