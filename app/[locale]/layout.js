import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Header from '@/components/Header'
import '../globals.css'

export const metadata = {
  title: {
    default: 'KnowFlags — Explore the World Through Flags',
    template: '%s | KnowFlags'
  },
  description: 'Discover, explore and learn about flags from around the world.',
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-W6DS4C7M');`}} />
        {/* End Google Tag Manager */}

        {/* Mida A/B Testing — anti-flickering */}
        <script dangerouslySetInnerHTML={{__html: `var timeout=3000;!function(h,i,d,e){var t,n=h.createElement("style");n.id=e,n.innerHTML="body{opacity:0}",h.head.appendChild(n),t=d,i.rmfk=function(){var t=h.getElementById(e);t&&t.parentNode.removeChild(t)},setTimeout(i.rmfk,t)}(document,window,timeout,"abhide");`}} />
        {/* Mida optimize script — async */}
        <script async src="https://cdn-eu.mida.so/js/optimize.js?key=LMVDyvwzYZW1KRq9OoJnpx" />
        {/* End Mida */}
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