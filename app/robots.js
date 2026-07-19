// app/robots.js
//
// Served at https://knowflags.com/robots.txt

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/en/admin/',
          '/fr/admin/',
          '/en/auth/',
          '/fr/auth/',
          '/en/profile',
          '/fr/profile',
          '/en/flags/draw-test',
          '/fr/flags/draw-test',
        ],
      },
    ],
    sitemap: 'https://knowflags.com/sitemap.xml',
    host: 'https://knowflags.com',
  }
}