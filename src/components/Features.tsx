import { Activity, Zap, Users } from 'lucide-react'

function Features() {
  const features = [
    {
      title: 'Tecnologia Reformer',
      description: 'Macchinari di precisione per isolare i gruppi muscolari senza impatto.',
      icon: Activity,
    },
    {
      title: 'Total Body Tone',
      description: 'Scolpisci e allunga ogni muscolo con resistenza progressiva.',
      icon: Zap,
    },
    {
      title: 'Classi Boutique',
      description: 'Massimo 6 persone. Attenzione maniacale alla tua postura.',
      icon: Users,
    },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-barlow text-center text-brand-dark text-4xl md:text-5xl font-semibold mb-12">
          Il Metodo RFL
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <IconComponent className="text-brand-red w-12 h-12" />
                </div>
                <h3 className="font-barlow text-xl font-bold text-brand-dark mb-3">
                  {feature.title}
                </h3>
                <p className="font-inter text-brand-dark/80">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
