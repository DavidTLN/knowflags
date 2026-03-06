'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function Hero() {
  const t = useTranslations('hero')
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
    <section style={{backgroundColor: '#F4F1E6', color: '#0B1F3B', padding: isMobile ? '32px 24px' : '64px 24px'}}>
      <div style={{maxWidth: '1152px', margin: '0 auto'}}>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '32px' : '64px'
        }}>

          {/* Image du drapeau */}
          <div style={{width: isMobile ? '100%' : '60%', flexShrink: 0}}>
            <img
              src="https://flagcdn.com/w640/fr.png"
              alt="Flag of France"
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '8px solid white',
                boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
                display: 'block'
              }}
            />
          </div>

          {/* Texte */}
          <div style={{
            width: isMobile ? '100%' : '40%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <span style={{color: '#426A5A', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '12px'}}>
              {t('featured')}
            </span>
            <h1 style={{fontSize: isMobile ? '32px' : '48px', fontWeight: '900', lineHeight: '1.2', margin: 0}}>
              The Tricolour of Liberty
            </h1>
            <p style={{fontSize: '16px', lineHeight: '1.6', opacity: 0.8, margin: 0}}>
              The Flag of France features three vertical bands of blue, white, and red. Known as the Tricolore, it has become one of the most influential flags in history.
            </p>
            <button style={{
              backgroundColor: '#0B1F3B',
              color: '#F4F1E6',
              padding: '16px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              width: isMobile ? '100%' : 'auto',
              alignSelf: 'flex-start'
            }}>
              {t('button')}
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
