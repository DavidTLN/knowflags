// Page d'accueil — knowflags.com/en

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import CategoryGrid from '@/components/CategoryGrid'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <CategoryGrid />
    </main>
  )
}