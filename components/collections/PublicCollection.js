import Link from 'next/link'
import Footer from '@/components/Footer'

const C = {
  navy: '#0B1F3B', blue: '#9EB7E5', cream: '#F4F1E6', bg: '#F4F1E6',
  border: '#E2DDD5', muted: '#8A8278', white: '#FFFFFF',
}

function thumbFor(item) {
  if (item.entity_type === 'country' && item.entity_code) return { type: 'img', src: `https://flagcdn.com/w160/${item.entity_code.toLowerCase()}.png` }
  if (item.country_code) return { type: 'img', src: `https://flagcdn.com/w160/${item.country_code.toLowerCase()}.png` }
  const emoji = item.entity_type === 'organisation' ? '🏛️' : item.entity_type === 'city' ? '🏙️' : '🗺️'
  return { type: 'emoji', emoji }
}

// Read-only, server-rendered view of a public collection.
export default function PublicCollection({ collection, ownerName, locale }) {
  const t = (en, fr) => (locale === 'fr' ? fr : en)

  if (!collection) {
    return (
      <>
        <div style={{ backgroundColor: C.bg, minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔒</div>
            <h1 style={{ color: C.navy, fontWeight: '900', fontSize: '22px', margin: '0 0 8px' }}>{t('Collection not available', 'Collection indisponible')}</h1>
            <p style={{ color: C.muted, fontSize: '14px', margin: '0 0 16px' }}>{t('This collection is private or does not exist.', 'Cette collection est privée ou n’existe pas.')}</p>
            <Link href={`/${locale}`} style={{ color: C.blue, textDecoration: 'none', fontWeight: '700' }}>← {t('Back to KnowFlags', 'Retour à KnowFlags')}</Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const items = collection.collection_items || []
  const name  = collection.is_default ? t('Favorites', 'Favoris') : collection.name

  return (
    <>
      <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #162d4a 100%)`, padding: '44px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div style={{ fontSize: '12px', color: 'rgba(244,241,230,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              📁 {t('Public collection', 'Collection publique')}
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '30px', fontWeight: '900', color: C.cream, fontFamily: 'var(--font-display)' }}>{name}</h1>
            {collection.description && <p style={{ margin: '0 0 10px', fontSize: '15px', color: '#cdd8ee', maxWidth: '640px', lineHeight: 1.5 }}>{collection.description}</p>}
            <div style={{ fontSize: '13px', color: 'rgba(244,241,230,0.55)' }}>
              {items.length} {t('flag', 'drapeau')}{items.length !== 1 ? (locale === 'fr' ? 'x' : 's') : ''}
              {ownerName ? ` · ${t('by', 'par')} ${ownerName}` : ''}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
          {items.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: C.muted, fontSize: '14px' }}>{t('This collection is empty.', 'Cette collection est vide.')}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
              {items.map(it => {
                const th = thumbFor(it)
                const href = it.entity_type === 'country'
                  ? `/${locale}/countries/${it.entity_code}`
                  : it.country_code ? `/${locale}/countries/${it.country_code}` : null
                const inner = (
                  <div style={{ backgroundColor: C.white, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}`, height: '100%' }}>
                    <div style={{ aspectRatio: '3/2', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                      {th.type === 'img'
                        ? <img src={th.src} alt={it.entity_code} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                        : <span>{th.emoji}</span>}
                    </div>
                    <div style={{ padding: '8px 10px', fontSize: '12px', fontWeight: '700', color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(it.entity_type === 'country' ? it.entity_code?.toUpperCase() : it.entity_code) || '—'}
                    </div>
                  </div>
                )
                return href
                  ? <Link key={it.id} href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
                  : <div key={it.id}>{inner}</div>
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
