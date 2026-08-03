// app/robots.js
//
// Served at https://knowflags.com/robots.txt
//
// Le forum est desormais indexable : /forum, /forum/[cat] et /forum/[cat]/[topic]
// sont ouverts au crawl. Seules les pages de profil membre (/forum/u/...) restent
// exclues — ce sont des pages de compte, sans valeur de recherche, et elles
// exposeraient des pseudos dans l'index.

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
          '/en/forum/u/',
          '/fr/forum/u/',
          '/en/flags/draw-test',
          '/fr/flags/draw-test',
        ],
      },
    ],
    sitemap: 'https://knowflags.com/sitemap.xml',
    host: 'https://knowflags.com',
  }
}