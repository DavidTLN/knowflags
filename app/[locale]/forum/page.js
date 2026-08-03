// app/[locale]/forum/page.js
//
// SERVER Component. Charge la hiérarchie des catégories + leurs stats
// (nb de sujets, dernier message) et passe le tout au composant client.
// Aligné sur la convention de la page pays : createClient() synchrone.

import { createClient } from '@/lib/supabase-server'
import ForumHome from '@/components/forum/ForumHome'

const BASE_URL = 'https://knowflags.com'

// Le forum bouge plus souvent qu'une fiche pays : revalidation courte.
export const revalidate = 60

export async function generateMetadata({ params }) {
  const { locale } = await params
  const isFr = locale === 'fr'
  const title = isFr ? 'Forum' : 'Forum'
  const description = isFr
    ? 'Échangez sur les drapeaux, la géographie, la vexillologie et les cultures du monde.'
    : 'Discuss flags, geography, vexillology and world cultures.'
  const path = '/forum'
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}${path}`,
      languages: {
        en: `${BASE_URL}/en${path}`,
        fr: `${BASE_URL}/fr${path}`,
        'x-default': `${BASE_URL}/en${path}`,
      },
    },
  }
}

export default async function Page({ params }) {
  const { locale } = await params
  const supabase = await createClient()

  // Toutes les catégories (niveau 1 et 2) + les stats des sous-catégories.
  const [catsRes, statsRes] = await Promise.all([
    supabase
      .from('forum_categories')
      .select('id, parent_id, slug, name_fr, name_en, description_fr, description_en, icon, color, position, is_hidden')
      .eq('is_hidden', false)
      .order('position', { ascending: true }),
    supabase
      .from('forum_subcategory_stats')
      .select('category_id, topic_count, reply_count, last_topic'),
  ])

  const cats = catsRes.data || []
  const statsById = {}
  for (const s of (statsRes.data || [])) statsById[s.category_id] = s

  // Construire l'arbre : catégories niveau 1 avec leurs sous-catégories triées.
  const roots = cats
    .filter(c => !c.parent_id)
    .sort((a, b) => a.position - b.position)
    .map(root => ({
      ...root,
      children: cats
        .filter(c => c.parent_id === root.id)
        .sort((a, b) => a.position - b.position)
        .map(child => ({
          ...child,
          stats: statsById[child.id] || { topic_count: 0, reply_count: 0, last_topic: null },
        })),
    }))

  return <ForumHome tree={roots} locale={locale} />
}