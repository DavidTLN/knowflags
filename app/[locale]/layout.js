// app/[locale]/layout.js

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Script from 'next/script'
import '../globals.css'

// ── Inter — variable font, all weights in one request ─────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// ── Inter for display as well — same family, heavier weights ─────────────────
// We use Inter for both body and display to match the official DS.
// --font-display is kept as a separate variable so heading components
// can optionally differ if the DS evolves.
const interDisplay = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const BASE_URL = 'https://knowflags.com'

export const metadata = {
  title: {
    default:  'Knowflags — Explore the World Through Flags',
    template: '%s | Knowflags',
  },
  description: 'Flag quizzes, country facts and interactive maps — learn world geography on Knowflags.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'Knowflags',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Knowflags' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.svg',
    apple:    '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params
  const messages = await getMessages()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:        'Knowflags',
    url:         BASE_URL,
    logo:        `${BASE_URL}/logo.svg`,
    description: locale === 'fr'
      ? 'Quiz de drapeaux et exploration géographique interactive.'
      : 'Flag quizzes and interactive geographical exploration.',
    inLanguage: locale,
    potentialAction: {
      '@type':  'SearchAction',
      target:   { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/${locale}/countries?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang={locale} className={`${inter.variable} ${interDisplay.variable}`}>
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html { overflow-x: clip; }
          body { overflow-x: clip; max-width: 100vw; }
          img, video, canvas { max-width: 100%; }
        `}</style>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* GTM Consent Mode defaults */}
        <Script id="gtm-consent" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html: `
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

        {/* Cookiebot CMP */}
        <Script
          id="cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="6b85d18d-21c9-47ff-a2a6-36665635891e"
          data-blockingmode="auto"
          data-gtm="GTM-W6DS4C7M"
          strategy="beforeInteractive"
        />

        {/* Google Tag Manager */}
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