interface Course {
  id: number
  title: string
  image: string
  shortDescription: string
}

const courses: Course[] = [
  {
    id: 1,
    title: 'Reformer Foundations',
    image: 'https://placehold.co/600x600/374151/FFFFFF?text=Reformer+Foundations',
    shortDescription: 'Base tecnica per principianti'
  },
  {
    id: 2,
    title: 'Cardio Jumpboard',
    image: 'https://placehold.co/600x600/374151/FFFFFF?text=Cardio+Jumpboard',
    shortDescription: 'Intensità cardiovascolare elevata'
  },
  {
    id: 3,
    title: 'Power Tower',
    image: 'https://placehold.co/600x600/374151/FFFFFF?text=Power+Tower',
    shortDescription: 'Forza e controllo totale'
  },
  {
    id: 4,
    title: 'Flex Flow',
    image: 'https://placehold.co/600x600/374151/FFFFFF?text=Flex+Flow',
    shortDescription: 'Mobilità e flessibilità'
  },
  {
    id: 5,
    title: 'Core Dynamics',
    image: 'https://placehold.co/600x600/374151/FFFFFF?text=Core+Dynamics',
    shortDescription: 'Stabilizzazione profonda'
  },
]

function CoursesRack() {
  return (
    <section className="bg-[#1F2937] py-24 relative overflow-hidden">
      {/* Metal Rack Shelf */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative pt-4">
          {/* Metal rail/shelf bar - Industrial rack */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-[#6B7280] via-[#4B5563] to-[#374151] border-t-2 border-[#9CA3AF] shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)]">
            {/* Metallic shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
            {/* Bottom edge highlight */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#9CA3AF]/50"></div>
          </div>

          {/* 3D Perspective Container */}
          <div 
            className="pt-12 flex flex-wrap justify-center gap-8 md:gap-12"
            style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}
          >
            {courses.map((course, index) => {
              const baseRotation = 15 - index * 2
              const baseTranslation = index * 6
              
              return (
              <div
                key={course.id}
                className="group relative cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${baseRotation}deg) translateY(${baseTranslation}px)`,
                  transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'rotateX(0deg) translateY(-12px) scale(1.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotateX(${baseRotation}deg) translateY(${baseTranslation}px) scale(1)`
                }}
              >
                {/* Course Card */}
                <div 
                  className="relative w-[280px] aspect-square rounded-lg overflow-hidden shadow-2xl bg-brand-dark"
                  style={{
                    transformStyle: 'preserve-3d',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(107, 114, 128, 0.3)',
                  }}
                >
                  {/* Image */}
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform-gpu">
                    <h3 className="font-barlow text-xl font-bold text-white mb-2 drop-shadow-lg">
                      {course.title}
                    </h3>
                    <p className="font-inter text-sm text-white/90 drop-shadow-md">
                      {course.shortDescription}
                    </p>
                  </div>

                  {/* Subtle border glow on hover */}
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-brand-red/50 transition-all duration-300"></div>
                </div>

                {/* Shadow beneath card - adjusts based on rotation */}
                <div 
                  className="absolute -bottom-4 left-1/2 w-[240px] h-8 bg-black/50 rounded-full blur-xl -translate-x-1/2 transition-all duration-500 group-hover:bg-black/70 group-hover:scale-110 group-hover:blur-2xl"
                  style={{
                    transform: `translateX(-50%) scaleX(${1 + Math.abs(baseRotation / 80)})`,
                  }}
                ></div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Subtle background texture/gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>
    </section>
  )
}

export default CoursesRack
