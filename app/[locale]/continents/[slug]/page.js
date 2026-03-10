// app/[locale]/continents/[slug]/page.js
import ContinentPage from '@/components/continents/ContinentPage'

export default async function Page({ params }) {
  const { slug } = await params
  return <ContinentPage slug={slug} />
}