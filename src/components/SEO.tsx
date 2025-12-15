import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
}

const defaultTitle = 'Revolution Fit Lab'
const defaultDescription = 'Scopri il primo studio Pilates Urban Dark. Reformer, Matwork e un\'atmosfera unica. Prenota la tua sessione oggi.'
const defaultImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070'
const siteUrl = 'https://revolutionfitlab.com' // Update with your actual domain

function SEO({ 
  title = defaultTitle, 
  description = defaultDescription, 
  image = defaultImage 
}: SEOProps) {
  // Format title with template if needed
  const fullTitle = title.includes('|') ? title : `${title} | Revolution Fit Lab`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Italian" />
      <meta name="author" content="Revolution Fit Lab" />
    </Helmet>
  )
}

export default SEO
