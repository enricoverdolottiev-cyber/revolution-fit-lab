import { motion } from 'framer-motion'
import Reveal from './ui/Reveal'

function About() {
  return (
    <section id="about" className="bg-zinc-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Parte Visual (Sinistra) */}
          <Reveal>
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Immagine Reformer */}
              <img
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070"
                alt="Donna che esegue esercizio su macchinario Reformer"
                className="w-full rounded-2xl border border-zinc-800/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] object-cover"
                style={{ aspectRatio: '4/3' }}
              />
            </motion.div>
          </Reveal>

          {/* Parte Testo (Destra) */}
          <Reveal delay={0.1}>
            {/* Titolo overline */}
            <p className="font-barlow text-sm font-bold text-brand-red uppercase tracking-wider mb-4">
              STUDIO
            </p>

            {/* Titolo grande */}
            <h2 className="font-barlow text-4xl md:text-5xl font-black text-brand-text uppercase tracking-tight mb-6">
              REDEFINING PILATES
            </h2>

            {/* Paragrafo */}
            <p className="font-inter text-base text-zinc-400 leading-relaxed">
              In Revolution Fit Lab, l'approccio al Reformer Pilates trascende il semplice allenamento. Combiniamo precisione anatomica e dinamismo atletico in un ambiente esclusivo. Ogni movimento è progettato per scolpire il corpo e potenziare la mente, utilizzando macchinari di ultima generazione per garantire risultati visibili e una postura impeccabile. Non è solo pilates, è l'evoluzione del tuo potenziale.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default About