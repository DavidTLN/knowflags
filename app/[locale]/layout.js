// app/[locale]/layout.js
// Changements vs version actuelle :
// - metadata de base simplifiée (les pages individuelles surchargent avec generateMetadata)
// - JSON-LD WebSite déplacé dans une constante propre
// - alternates canonical ajouté au niveau layout

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Roboto, Roboto_Slab } from 'next/font/google'
import Header from '@/components/Header'
import Script from 'next/script'
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

const BASE_URL = 'https://knowflags.com'

// Base metadata — individual pages override with generateMetadata()
export const metadata = {
  title: {
    default: 'KnowFlags — Explore the World Through Flags',
    template: '%s | KnowFlags',
  },
  description: 'Flag quizzes, country facts and interactive maps — learn world geography on KnowFlags.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'KnowFlags',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KnowFlags' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params
  const messages = await getMessages()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KnowFlags',
    url: BASE_URL,
    description: locale === 'fr'
      ? 'Quiz de drapeaux et exploration géographique interactive.'
      : 'Flag quizzes and interactive geographical exploration.',
    logo: `${BASE_URL}/logo.png`,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/${locale}/countries?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang={locale} className={`${roboto.variable} ${robotoSlab.variable}`}>
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html { overflow-x: clip; } body { overflow-x: clip; max-width: 100vw; }
          img, video, canvas { max-width: 100%; }
        `}</style>

        {/* JSON-LD WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* ── STEP 1 : GTM Consent Mode defaults (must be FIRST) ── */}
        <script dangerouslySetInnerHTML={{__html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage':              'denied',
            'ad_user_data':            'denied',
            'ad_personalization':      'denied',
            'analytics_storage':       'denied',
            'functionality_storage':   'denied',
            'personalization_storage': 'denied',
            'security_storage':        'granted',
            'wait_for_update':         500,
          });
          gtag('set', 'ads_data_redaction', true);
          gtag('set', 'url_passthrough', true);
        `}} />

        {/* ── STEP 2 : Cookiebot CMP ── */}
        <Script
          id="cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="6b85d18d-21c9-47ff-a2a6-36665635891e"
          data-blockingmode="auto"
          data-gtm="GTM-W6DS4C7M"
          strategy="beforeInteractive"
        />

        {/* ── STEP 3 : Google Tag Manager ── */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W6DS4C7M');`}}
        />
      </head>
      <body style={{ paddingTop: '60px' }}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W6DS4C7M"
            height="0" width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}