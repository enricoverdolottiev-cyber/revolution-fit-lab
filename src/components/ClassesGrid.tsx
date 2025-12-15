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

function ClassesGrid() {
  return (
    <section id="classes" className="bg-brand-bg py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <Reveal key={classItem.id} delay={index * 0.1}>
              <div className="group cursor-pointer">
              {/* Poster Image */}
              <div className="aspect-[4/5] overflow-hidden mb-4">
                <img
                  src={classItem.image}
                  alt={classItem.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              {/* Title below image */}
              <h3 className="font-barlow text-3xl font-black text-brand-text uppercase tracking-tight">
                {classItem.title}
              </h3>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ClassesGrid
