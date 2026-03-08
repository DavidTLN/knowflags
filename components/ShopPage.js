'use client'
import { useLocale } from 'next-intl'
import Link from 'next/link'

export default function ShopPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 12px', letterSpacing: '-1.5px' }}>
            {t('Shop', 'Shop')}
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', margin: 0 }}>
            {t('Coming soon — flags merch, prints & more', 'Bientôt — merch, affiches et plus encore')}
          </p>
        </div>

        {/* Placeholder grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            { icon: '👕', label: t('T-Shirts', 'T-Shirts'), desc: t('Wear your favourite flag', 'Porte ton drapeau préféré') },
            { icon: '🖼️', label: t('Prints', 'Affiches'), desc: t('High quality flag posters', 'Affiches drapeaux haute qualité') },
            { icon: '🗓️', label: t('Calendar', 'Calendrier'), desc: t('Flags of the world calendar', 'Calendrier des drapeaux du monde') },
            { icon: '🎒', label: t('Accessories', 'Accessoires'), desc: t('Pins, patches & more', 'Pins, patches et plus') },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>{item.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0B1F3B', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>{item.desc}</div>
              <div style={{ display: 'inline-block', padding: '7px 18px', borderRadius: '99px', backgroundColor: '#f0ede4', fontSize: '12px', fontWeight: '700', color: '#806D40', letterSpacing: '0.5px' }}>
                {t('Coming soon', 'Bientôt')}
              </div>
            </div>
          ))}
        </div>

        {/* Email capture */}
        <div style={{ marginTop: '56px', backgroundColor: '#0B1F3B', borderRadius: '20px', padding: '40px 32px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', margin: '0 0 10px', fontSize: '24px', fontWeight: '900' }}>
            {t('Get notified when we launch', 'Soyez notifié au lancement')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', fontSize: '15px' }}>
            {t('Be the first to know about new products.', 'Soyez les premiers informés des nouveaux produits.')}
          </p>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="email" placeholder={t('your@email.com', 'votre@email.com')}
              style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '10px', border: 'none', fontSize: '15px', outline: 'none' }} />
            <button style={{ padding: '12px 24px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t('Notify me', 'Me notifier')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}