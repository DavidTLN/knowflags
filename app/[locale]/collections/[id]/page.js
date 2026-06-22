// DESTINATION: app/[locale]/collections/[id]/page.js
import { createClient } from '@/lib/supabase-server'
import { fetchCollectionById } from '@/lib/collections'
import PublicCollection from '@/components/collections/PublicCollection'

const BASE_URL = 'https://knowflags.com'

export async function generateMetadata({ params }) {
  const { id, locale } = await params
  const isFr = locale === 'fr'
  try {
    const supabase = await createClient()
    const collection = await fetchCollectionById(supabase, id)
    if (!collection || collection.visibility !== 'public') throw new Error('private')
    const name = collection.is_default ? (isFr ? 'Favoris' : 'Favorites') : collection.name
    const count = (collection.collection_items || []).length
    const title = isFr ? `${name} — collection de drapeaux | KnowFlags` : `${name} — flag collection | KnowFlags`
    const description = collection.description
      || (isFr ? `Une collection de ${count} drapeaux sur KnowFlags.` : `A collection of ${count} flags on KnowFlags.`)
    const pageUrl = `${BASE_URL}/${locale}/collections/${id}`
    return {
      title, description,
      alternates: { canonical: pageUrl },
      openGraph: { title, description, url: pageUrl, siteName: 'KnowFlags', type: 'website', locale: isFr ? 'fr_FR' : 'en_US' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return {
      title: isFr ? 'Collection | KnowFlags' : 'Collection | KnowFlags',
      robots: { index: false },
    }
  }
}

export default async function Page({ params }) {
  const { id, locale } = await params
  const supabase = await createClient()
  const collection = await fetchCollectionById(supabase, id)

  // Only public collections are viewable here (owner sees their own in /profile).
  const visible = collection && collection.visibility === 'public' ? collection : null

  let ownerName = null
  if (visible) {
    const { data: prof } = await supabase.from('profiles').select('username').eq('user_id', visible.user_id).maybeSingle()
    ownerName = prof?.username || null
  }

  return <PublicCollection collection={visible} ownerName={ownerName} locale={locale} />
}
