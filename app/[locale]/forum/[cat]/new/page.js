// app/[locale]/forum/[cat]/new/page.js
//
// SERVER Component minimal : résout la catégorie et passe au formulaire client.

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ForumNewTopic from '@/components/forum/ForumNewTopic'

export const dynamic = 'force-dynamic'  // page d'action, pas de cache

export async function generateMetadata({ params }) {
  const { locale } = await params
  return { title: locale === 'fr' ? 'Nouveau sujet — Forum' : 'New topic — Forum' }
}

export default async function Page({ params }) {
  const { locale, cat } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('forum_categories')
    .select('id, slug, name_fr, name_en, parent_id')
    .eq('slug', cat)
    .single()
  if (!category) notFound()

  let parent = null
  if (category.parent_id) {
    const { data: p } = await supabase
      .from('forum_categories').select('slug, name_fr, name_en').eq('id', category.parent_id).single()
    parent = p || null
  }

  return <ForumNewTopic category={category} parent={parent} locale={locale} />
}