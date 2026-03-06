'use client'

import { useState, useEffect } from 'react'

const categories = [
  {id: 1, title: 'Europe', image: 'https://flagcdn.com/w640/eu.png', link: '/gallery?continent=europe'},
  {id: 2, title: 'Africa', image: 'https://flagcdn.com/w640/za.png', link: '/gallery?continent=africa'},
  {id: 3, title: 'Asia', image: 'https://flagcdn.com/w640/jp.png', link: '/gallery?continent=asia'},
  {id: 4, title: 'Americas', image: 'https://flagcdn.com/w640/br.png', link: '/gallery?continent=americas'}
]

export default function CategoryGrid() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section style={{backgroundColor: '#F4F1E6', padding: isMobile ? '32px 24px' : '48px 24px'}}>
      <div style={{maxWidth: '1152px', margin: '0 auto'}}>

        <h2 style={{fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#0B1F3B', marginBottom: '24px'}}>
          Explore by Region
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : '24px'
        }}>
          {categories.map((category) => (
            <a key={category.id} href={category.link} style={{textDecoration: 'none', color: '#0B1F3B'}}>

              <div style={{width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: '8px'}}>
                <img
                  src={category.image}
                  alt={category.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span style={{fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase'}}>
                  {category.title}
                </span>
                <span style={{fontSize: '16px'}}>›</span>
              </div>

            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
