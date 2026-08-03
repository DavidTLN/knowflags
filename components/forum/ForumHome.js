'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForumIcon from '@/components/forum/ForumIcon'

// Design tokens KnowFlags
const C = {
  navy:    '#16324F',
  navyLt:  '#1E4976',
  gold:    '#F4B400',
  green:   '#16A34A',
  bg:      '#F4F1E6',
  bgAlt:   '#FAFAF7',
  surface: '#FFFFFF',
  border:  'rgba(22,50,79,0.12)',
  borderSolid: '#E2DDD5',
  text:    '#0F1923',
  muted:   '#6B7280',
  light:   '#9CA3AF',
}

function timeAgo(iso, locale) {
  if (!iso) return null
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  const fr = locale === 'fr'
  if (s < 60)      return fr ? "à l'instant" : 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)      return fr ? `il y a ${m} min` : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)      return fr ? `il y a ${h}h` : `${h}h ago`
  const j = Math.floor(h / 24)
  if (j < 30)      return fr ? `il y a ${j}j` : `${j}d ago`
  return d.toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
}

function SubcategoryRow({ cat, locale, isLast }) {
  const [hover, setHover] = useState(false)
  const t = (en, fr) => locale === 'fr' ? fr : en
  const name = t(cat.name_en, cat.name_fr)
  const desc = t(cat.description_en, cat.description_fr)
  const stats = cat.stats || {}
  const last = stats.last_topic

  return (
    <Link
      href={`/${locale}/forum/${cat.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        backgroundColor: hover ? C.bgAlt : 'transparent',
        transition: 'background-color 0.12s ease',
      }}>
        <span style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          backgroundColor: '#EEF2F7', color: C.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ForumIcon name={cat.icon} size={20} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '15px', color: C.navy }}>{name}</p>
          {desc && <p style={{ margin: 0, fontSize: '13px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '54px' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.navy }}>{stats.topic_count ?? 0}</p>
          <p style={{ margin: 0, fontSize: '11px', color: C.light }}>{t('topics', 'sujets')}</p>
        </div>

        <div style={{ width: '150px', flexShrink: 0, paddingLeft: '14px', borderLeft: `1px solid ${C.border}` }} className="forum-last-col">
          {last ? (
            <>
              <p style={{ margin: 0, fontSize: '12px', color: C.navy, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.title}</p>
              <p style={{ margin: 0, fontSize: '11px', color: C.light }}>
                {last.by ? `${t('by', 'par')} ${last.by} · ` : ''}{timeAgo(last.at, locale)}
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: C.light }}>{t('No topics yet', 'Aucun sujet')}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function ForumHome({ tree, locale }) {
  const t = (en, fr) => locale === 'fr' ? fr : en

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* Hero navy */}
      <div style={{ backgroundColor: C.navy, padding: '40px 24px 32px', color: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <nav style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', alignItems: 'center', marginBottom: '12px' }}>
            <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{t('Home', 'Accueil')}</Link>
            <span>›</span>
            <span style={{ color: '#9EB7E5' }}>Forum</span>
          </nav>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em' }}>Forum</h1>
          <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '540px' }}>
            {t('Discuss flags, geography, vexillology and world cultures with the community.',
               'Échangez sur les drapeaux, la géographie, la vexillologie et les cultures du monde.')}
          </p>
        </div>
      </div>

      {/* Corps */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {tree.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: C.light }}>
              <ForumIcon name="messages" size={40} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.navy, margin: 0 }}>{t('No categories yet', 'Aucune catégorie pour le moment')}</p>
          </div>
        )}

        {tree.map(cat => {
          const catName = t(cat.name_en, cat.name_fr)
          return (
            <div key={cat.id} style={{
              backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
              overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 8px rgba(22,50,79,0.06)',
            }}>
              {/* En-tête de grande catégorie */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', backgroundColor: C.bgAlt,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{ color: C.navy, display: 'flex' }}><ForumIcon name={cat.icon} size={18} /></span>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.navy }}>{catName}</span>
              </div>

              {/* Sous-catégories */}
              {cat.children.length === 0 ? (
                <div style={{ padding: '18px 16px', fontSize: '13px', color: C.light }}>
                  {t('No sub-categories.', 'Aucune sous-catégorie.')}
                </div>
              ) : (
                cat.children.map((sub, i) => (
                  <SubcategoryRow key={sub.id} cat={sub} locale={locale} isLast={i === cat.children.length - 1} />
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* Masquer la colonne "dernier message" sur petit écran */}
      <style>{`
        @media (max-width: 640px) {
          .forum-last-col { display: none !important; }
        }
      `}</style>
    </div>
  )
}