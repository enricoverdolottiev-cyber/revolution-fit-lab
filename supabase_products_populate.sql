-- Script SQL per popolare i 6 prodotti reali nel database Revolution Fit Lab
-- Esegui questo script nella console SQL di Supabase

-- 1. Calzini Tecnici (Grip Control)
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'Calzini Tecnici Grip Control',
  'Calzini premium con grip innovativo per massima stabilità durante gli esercizi. Tecnologia anti-scivolo integrata per performance eccellenti su ogni superficie.',
  25.00,
  ARRAY[
    'https://images.unsplash.com/photo-1587560699049-bd3f6384e9f0?w=800',
    'https://images.unsplash.com/photo-1595909527683-4c90c358ab8a?w=800'
  ],
  '80% Cotone Organico, 20% Grip Silicone Revolution',
  'Tessuto traspirante 4-way stretch | Tecnologia Anti-slip Revolution | Ventilazione Mesh | Design Seamless | Lavabile in lavatrice',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Red', 'Black', 'Slate']
);

-- 2. Leggings Compressione "Python"
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'Leggings Compressione Python',
  'Leggings ad alto contenuto tecnologico con compressione mirata. Ideali per Pilates e training intenso. Taglio alto vita per supporto ottimale e design premium.',
  89.00,
  ARRAY[
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800'
  ],
  '85% Poliammide, 15% Elastan Premium',
  'Tessuto traspirante 4-way stretch | Compressione Graduata | Tecnologia Moisture-Wicking | Tasca Laterale Integrata | Flatlock Seams | UPF 50+',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Red', 'Black', 'Slate']
);

-- 3. T-shirt Performance Dry-Fit
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'T-shirt Performance Dry-Fit',
  'T-shirt tecnica con tecnologia breathable per massima traspirabilità. Taglio modulare perfetto per ogni tipo di movimento e performance ottimale.',
  45.00,
  ARRAY[
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
  ],
  '100% Poliestere Riciclato',
  'Tessuto traspirante 4-way stretch | Tecnologia Dri-Fit | Collo Elasticizzato | Finiture Reflective | Taglio Slim Fit | Certificato OEKO-TEX',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Red', 'Black', 'Slate']
);

-- 4. Felpa Oversize "Lab"
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'Felpa Oversize Lab',
  'Felpa premium con cappuccio regolabile e zip frontale. Perfetta per riscaldamento e cool-down. Design minimalista e funzionale con logo Revolution Fit Lab.',
  95.00,
  ARRAY[
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'
  ],
  '60% Cotone, 40% Poliestere',
  'Tessuto traspirante 4-way stretch | Tessuto French Terry Premium | Cappuccio Regolabile | Tasche Kangaroo | Finiture Ribbed | Lavabile in Lavatrice',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Red', 'Black', 'Slate']
);

-- 5. Borsone Gym Pro
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'Borsone Gym Pro',
  'Borsone professionale con compartimenti organizzati e materiali premium. Perfetto per trasportare tutto il necessario per il tuo allenamento Revolution Fit Lab.',
  75.00,
  ARRAY[
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    'https://images.unsplash.com/photo-1621926789373-1c8b8a0b0b0b?w=800'
  ],
  'Poliestere Resistente 600D, Fodera Interna Antimuffa',
  'Tessuto traspirante 4-way stretch | Compartimenti Organizzati | Cerniere YKK Premium | Borsello Esterno | Spallacci Regolabili | Base Rinforzata',
  ARRAY['One Size'],
  ARRAY['Red', 'Black', 'Slate']
);

-- 6. Shaker Titanio
INSERT INTO public.products (
  name,
  description,
  price,
  images,
  materials,
  tech_specs,
  sizes,
  colors
) VALUES (
  'Shaker Titanio',
  'Shaker premium in acciaio inox con design elegante e funzionale. Perfetto per i tuoi integratori e bevande pre/post workout. Capacità 700ml.',
  35.00,
  ARRAY[
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
  ],
  'Acciaio Inox 18/8, BPA Free, Silicone Premium',
  'Tessuto traspirante 4-way stretch | Capacità 700ml | Design Ergonomico | Chiusura Ermetica | Filtro Integrato | Lavabile in Lavastoviglie',
  ARRAY['One Size'],
  ARRAY['Red', 'Black', 'Slate']
);

