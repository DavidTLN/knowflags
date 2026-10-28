import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  // Les fichiers de public/ sont servis par defaut avec max-age=0 : le navigateur
  // les redemande a chaque visite, et chaque redemande compte dans le quota CDN Vercel.
  // On les garde 7 jours en cache navigateur (30 jours de stale-while-revalidate).
  // Pas d'immutable : les noms de fichiers ne sont pas hashes, une image corrigee
  // doit pouvoir remplacer l'ancienne.
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }]
    return [
      { source: '/flags/:path*', headers: cache },
      { source: '/:all*(svg|png|jpg|jpeg|webp|ico)', headers: cache },
    ]
  },
}

export default withNextIntl(nextConfig)