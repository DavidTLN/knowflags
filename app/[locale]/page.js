// Page d'accueil — knowflags.com/en

import Hero from '@/components/Hero'
import CategoryGrid from '@/components/CategoryGrid'
import Footer from '@/components/Footer'
import TrueSizeModule from '@/components/TrueSizeModule'
import FeaturedFlag from '@/components/FeaturedFlag'


export default function Home() {
  return (
    <main>
      <Hero />
      <CategoryGrid />
      <TrueSizeModule />
      <Footer />
    </main>
  )
}