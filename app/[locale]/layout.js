import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Roboto, Roboto_Slab } from 'next/font/google'
import Header from '@/components/Header'
import '../globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
})

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'KnowFlags — Explore the World Through Flags',
    template: '%s | KnowFlags',
  },
  description: 'Discover, explore and learn about flags from around the world.',
  metadataBase: new URL('https://knowflags.com'),
  openGraph: {
    title: 'KnowFlags — Explore the World Through Flags',
    description: 'Discover, explore and learn about flags from around the world.',
    url: 'https://knowflags.com',
    siteName: 'KnowFlags',
    images: [
      {
        url: '/og-image.png', // à créer : image 1200×630px dans /public
        width: 1200,
        height: 630,
        alt: 'KnowFlags — Explore the World Through Flags',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KnowFlags — Explore the World Through Flags',
    description: 'Discover, explore and learn about flags from around the world.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// JSON-LD structured data — logo visible sur Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KnowFlags',
  url: 'https://knowflags.com',
  description: 'Discover, explore and learn about flags from around the world.',
  logo: 'https://knowflags.com/logo.png', // à placer dans /public/logo.png (min 112×112px)
  sameAs: [
    // Ajoute ici tes réseaux sociaux si tu en as
    // 'https://twitter.com/knowflags',
    // 'https://instagram.com/knowflags',
  ],
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${roboto.variable} ${robotoSlab.variable}`}>
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html, body { overflow-x: hidden; max-width: 100vw; }
          img, video, canvas { max-width: 100%; }
        `}</style>

        {/* JSON-LD — structured data pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W6DS4C7M');`}} />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W6DS4C7M"
            height="0"
            width="0"
            style={{display: 'none', visibility: 'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}