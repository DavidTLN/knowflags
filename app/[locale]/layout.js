import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
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
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}