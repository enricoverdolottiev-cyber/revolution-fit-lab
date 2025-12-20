# Sitemap Generation Guide

## Overview
Questo documento descrive come generare automaticamente una sitemap.xml per Revolution Fit Lab.

## Manual Sitemap Creation

Per ora, puoi creare manualmente un file `public/sitemap.xml` con questa struttura:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://revolutionfitlab.com/</loc>
    <lastmod>2025-01-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://revolutionfitlab.com/corso/reformer-pilates</loc>
    <lastmod>2025-01-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://revolutionfitlab.com/corso/personal-training</loc>
    <lastmod>2025-01-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Automated Sitemap Generation (Future Enhancement)

Per generare automaticamente la sitemap, puoi usare una di queste opzioni:

### Option 1: Vite Plugin
Installa `vite-plugin-sitemap`:
```bash
npm install --save-dev vite-plugin-sitemap
```

Crea `vite.config.ts` con il plugin (già configurato se presente).

### Option 2: Build Script
Crea uno script Node.js che generi la sitemap basandosi sulle route definite in `src/App.tsx`:

```javascript
// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');

const routes = [
  { url: '/', priority: 1.0, changefreq: 'weekly' },
  { url: '/corso/reformer-pilates', priority: 0.8, changefreq: 'monthly' },
  { url: '/corso/personal-training', priority: 0.8, changefreq: 'monthly' },
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>https://revolutionfitlab.com${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
console.log('Sitemap generated successfully!');
```

Aggiungi al `package.json`:
```json
"scripts": {
  "generate-sitemap": "node scripts/generate-sitemap.js",
  "build": "npm run generate-sitemap && tsc && vite build"
}
```

## Update robots.txt

Una volta creata la sitemap, aggiorna `public/robots.txt` per includere il riferimento:
```
Sitemap: https://revolutionfitlab.com/sitemap.xml
```

