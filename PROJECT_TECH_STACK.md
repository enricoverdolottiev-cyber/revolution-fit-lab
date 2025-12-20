# Revolution Fit Lab - Tech Stack & Project Structure

## Package.json

```json
{
  "name": "revolution-fit-lab",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "@supabase/supabase-js": "^2.87.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.23.26",
    "lucide-react": "^0.561.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^2.0.5",
    "react-router-dom": "^7.11.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

## Struttura delle Cartelle Principali

### Root Directory
```
RevolutionFitLab/
├── src/                    # Codice sorgente principale
├── dist/                   # Build di produzione
├── node_modules/           # Dipendenze npm
├── types/                  # Tipi TypeScript globali
├── index.html             # Entry point HTML
├── package.json           # Configurazione progetto e dipendenze
├── package-lock.json      # Lock file dipendenze
├── tailwind.config.js     # Configurazione Tailwind CSS
├── tsconfig.json          # Configurazione TypeScript
├── tsconfig.node.json     # Configurazione TypeScript per Node
├── vite.config.ts         # Configurazione Vite
├── postcss.config.js      # Configurazione PostCSS
└── README.md              # Documentazione progetto
```

### src/ - Struttura Dettagliata

```
src/
├── components/            # Componenti React riutilizzabili
│   ├── ui/               # Componenti UI base
│   │   ├── Reveal.tsx    # Componente per animazioni scroll reveal
│   │   └── Toast.tsx     # Sistema di notifiche toast
│   ├── About.tsx
│   ├── AdminCalendar.tsx
│   ├── AdminTeamDashboard.tsx
│   ├── BookingModal.tsx
│   ├── ClassesGrid.tsx
│   ├── ClassesSection.tsx
│   ├── ClassModal.tsx
│   ├── CoursesRack.tsx
│   ├── Features.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Instructors.tsx
│   ├── Marquee.tsx
│   ├── Navbar.tsx
│   ├── PaymentsSection.tsx
│   ├── Pricing.tsx
│   ├── ProductCard.tsx
│   ├── ProductDetailView.tsx
│   ├── ProfileSection.tsx
│   ├── ProtectedRoute.tsx
│   ├── RevenueProjectionWidget.tsx
│   ├── SEO.tsx
│   ├── ShopPreview.tsx    # Componente preview dello shop
│   └── ShopTab.tsx        # Componente principale tab dello shop
│
├── pages/                 # Pagine/Route principali
│   ├── AdminDashboard.tsx
│   ├── Auth.tsx
│   ├── CustomerDashboard.tsx
│   ├── Home.tsx
│   └── Login.tsx
│
├── hooks/                 # Custom React Hooks
│   └── useAuth.ts         # Hook per gestione autenticazione
│
├── lib/                   # Librerie e client esterni
│   └── supabase.ts        # Client Supabase configurato
│
├── types/                 # Definizioni TypeScript
│   └── database.types.ts  # Tipi generati da Supabase
│
├── utils/                 # Utility functions
│   ├── animations.ts      # Varianti animazioni Framer Motion
│   └── schedulingRules.ts # Regole per scheduling classi
│
├── data/                  # Dati statici
│   └── products.ts        # Dati prodotti shop
│
├── App.tsx                # Componente root dell'applicazione
├── main.tsx               # Entry point React
├── index.css              # Stili globali
└── vite-env.d.ts          # Tipi ambiente Vite
```

## Componenti Shop

✅ **Il progetto contiene già componenti dedicati allo Shop:**

1. **`src/components/ShopTab.tsx`** - Componente principale per la tab dello shop nella dashboard cliente
2. **`src/components/ShopPreview.tsx`** - Componente per l'anteprima dello shop
3. **`src/components/ProductCard.tsx`** - Card per visualizzare un singolo prodotto
4. **`src/components/ProductDetailView.tsx`** - Vista dettagliata del prodotto
5. **`src/data/products.ts`** - File dati contenente i prodotti dello shop

### Note sui Componenti Shop

- `ShopTab.tsx` è utilizzato nella `CustomerDashboard.tsx` come una delle sezioni principali
- Il sistema shop è già integrato con il sistema di toast per notifiche
- I prodotti sono gestiti tramite il file `src/data/products.ts`

## Tech Stack Summary

### Frontend Framework
- **React 18.2+** con TypeScript
- **Vite 5** come build tool
- **React Router DOM 7** per il routing

### Styling
- **Tailwind CSS 3.4+** (Mobile-First approach)
- **PostCSS** + **Autoprefixer**

### Animations
- **Framer Motion 12+** (animazioni principali)
- Varianti centralizzate in `src/utils/animations.ts`

### Icons
- **Lucide React** (icone moderne)

### Backend & Database
- **Supabase** (autenticazione e database)
- Client tipizzato in `src/lib/supabase.ts`

### SEO
- **react-helmet-async** per meta tags dinamici

### Utilities
- **date-fns** per gestione date
- **@emailjs/browser** per invio email

### Development Tools
- **TypeScript 5.2+**
- **ESLint** con plugin React
- **Vite** per sviluppo veloce

