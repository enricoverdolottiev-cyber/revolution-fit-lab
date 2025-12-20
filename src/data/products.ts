import type { Product } from '../types/database.types'

/**
 * Mock Products Data per Revolution Fit Lab Shop
 * In produzione, questi dati verranno da Supabase
 */
export const mockProducts: Omit<Product, 'id' | 'created_at'>[] = [
  {
    name: 'Calzini Pilates Revolution',
    description: 'Calzini premium con grip innovativo per massima stabilità durante gli esercizi. Tecnologia anti-scivolo integrata per performance eccellenti.',
    price: 25.00,
    images: [
      'https://images.unsplash.com/photo-1587560699049-bd3f6384e9f0?w=800',
      'https://images.unsplash.com/photo-1595909527683-4c90c358ab8a?w=800',
    ],
    materials: '80% Cotone Organico, 20% Grip Silicone Revolution',
    tech_specs: 'Tecnologia Anti-slip Revolution | Ventilazione Mesh | Design Seamless | Lavabile in lavatrice',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Navy'],
  },
  {
    name: 'Leggings Premium Power',
    description: 'Leggings ad alto contenuto tecnologico con compressione mirata. Ideali per Pilates e training intenso. Taglio alto vita per supporto ottimale.',
    price: 89.00,
    images: [
      'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    ],
    materials: '85% Poliammide, 15% Elastan Premium',
    tech_specs: 'Compressione Graduata | Tecnologia Moisture-Wicking | Tasca Laterale Integrata | Flatlock Seams | UPF 50+',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Charcoal', 'Burgundy'],
  },
  {
    name: 'T-shirt Revolution Core',
    description: 'T-shirt tecnica con tecnologia breathable per massima traspirabilità. Taglio modulare perfetto per ogni tipo di movimento.',
    price: 45.00,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    ],
    materials: '100% Poliestere Riciclato',
    tech_specs: 'Tecnologia Dri-Fit | Collo Elasticizzato | Finiture Reflective | Taglio Slim Fit | Certificato OEKO-TEX',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Red'],
  },
  {
    name: 'Bra Top Athletic',
    description: 'Reggiseno sportivo ad alto supporto con design senza cuciture. Perfetto per Pilates e attività moderate. Massimo comfort senza compromessi.',
    price: 55.00,
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800',
    ],
    materials: '88% Poliammide, 12% Elastan',
    tech_specs: 'Supporto Medio-Alto | Design Seamless | Bande Elastiche Sottili | Allacciatura Posteriore Regolabile | Massima Traspirabilità',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Black', 'Nude', 'Burgundy'],
  },
  {
    name: 'Shorts Compression',
    description: 'Shorts compression con tecnologia avanzata per supporto muscolare. Ideali per sessioni intense di Pilates e training funzionale.',
    price: 65.00,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      'https://images.unsplash.com/photo-1506629905607-5d8d2c9d57f5?w=800',
    ],
    materials: '82% Poliammide, 18% Elastan',
    tech_specs: 'Compressione Graduata | Tecnologia Anti-Odor | Fessura Laterale per Mobilità | Banda Vita Elasticizzata | Design Aderente',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Charcoal', 'Navy'],
  },
  {
    name: 'Hoodie Revolution Fit',
    description: 'Hoodie premium con cappuccio regolabile e zip frontale. Perfetto per riscaldamento e cool-down. Design minimalista e funzionale.',
    price: 95.00,
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
    ],
    materials: '60% Cotone, 40% Poliestere',
    tech_specs: 'Tessuto French Terry Premium | Cappuccio Regolabile | Tasche Kangaroo | Finiture Ribbed | Lavabile in Lavatrice',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Charcoal', 'Navy'],
  },
]

