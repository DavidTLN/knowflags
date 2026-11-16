// app/robots.js
//
// Served at https://knowflags.com/robots.txt
//
// Le forum est desormais indexable : /forum, /forum/[cat] et /forum/[cat]/[topic]
// sont ouverts au crawl. Seules les pages de profil membre (/forum/u/...) restent
// exclues — ce sont des pages de compte, sans valeur de recherche, et elles
// exposeraient des pseudos dans l'index.

// Robots d'entraînement d'IA : ils explorent tout le site sans apporter de visiteurs
// et pèsent sur le quota Vercel (1 M de requêtes par mois en Hobby). Les robots de
// recherche des IA (OAI-SearchBot, ChatGPT-User, PerplexityBot) restent autorisés,
// pour que KnowFlags puisse être cité dans leurs réponses.
// Seuls les robots qui respectent robots.txt sont concernés : le blocage dur se fait
// dans Vercel (Firewall, règle « AI Bots »).
const AI_TRAINING_BOTS = [
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Bytespider', 'meta-externalagent',
  'Amazonbot', 'Applebot-Extended', 'Google-Extended', 'cohere-ai', 'Diffbot', 'omgili', 'Timpibot',
]

export default function robots() {
  return {
    rules: [
      { userAgent: AI_TRAINING_BOTS, disallow: '/' },
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