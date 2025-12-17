import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Reveal from './ui/Reveal'

interface Class {
  id: number
  title: string
  image: string
}

const classes: Class[] = [
  {
    id: 1,
    title: 'Full Body Reformer',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=FULL+BODY+REFORMER'
  },
  {
    id: 2,
    title: 'Glute & Abs',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=GLUTE+%26+ABS'
  },
  {
    id: 3,
    title: 'Cardio Jump',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=CARDIO+JUMP'
  },
  {
    id: 4,
    title: 'Power Tower',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=POWER+TOWER'
  },
  {
    id: 5,
    title: 'Core Dynamics',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=CORE+DYNAMICS'
  },
  {
    id: 6,
    title: 'Flex Flow',
    image: 'https://placehold.co/400x500/27272A/EF4444?text=FLEX+FLOW'
  },
]

interface ClassCardProps {
  classItem: Class
  index: number
}

function ClassCard({ classItem, index }: ClassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <Reveal delay={index * 0.1}>
      <motion.div
        ref={cardRef}
        className="group cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Poster Image */}
        <div className="aspect-[4/5] overflow-hidden mb-4 rounded-lg relative">
          <motion.img
            src={classItem.image}
            alt={classItem.title}
            className="w-full h-full object-cover"
            style={{ transform: 'translateZ(50px)' }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Shadow overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ transform: 'translateZ(25px)' }}
          />
        </div>
        
        {/* Title below image */}
        <motion.h3 
          className="font-barlow text-3xl font-black text-brand-text uppercase tracking-tight"
          style={{ transform: 'translateZ(50px)' }}
        >
          {classItem.title}
        </motion.h3>
      </motion.div>
    </Reveal>
  )
}

function ClassesGrid() {
  return (
    <section id="classes" className="bg-brand-bg py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <ClassCard key={classItem.id} classItem={classItem} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClassesGrid
