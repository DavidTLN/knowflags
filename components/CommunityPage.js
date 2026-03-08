'use client'
import { useLocale } from 'next-intl'
import Link from 'next/link'

// DISCOURSE_URL: Set this env var to your Discourse instance URL
// e.g. NEXT_PUBLIC_DISCOURSE_URL=https://community.knowflags.com
const DISCOURSE_URL = process.env.NEXT_PUBLIC_DISCOURSE_URL || null

export default function CommunityPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const features = [
    { icon: '🏆', label: t('Leaderboards', 'Classements'), desc: t('Compare your scores with the world', 'Compare tes scores avec le monde entier') },
    { icon: '🌍', label: t('Flag discussions', 'Discussions drapeaux'), desc: t('Talk about vexillology & geography', 'Parle vexillologie & géographie') },
    { icon: '💡', label: t('Suggestions', 'Suggestions'), desc: t('Suggest new features & flags', 'Propose de nouvelles fonctionnalités') },
    { icon: '🎯', label: t('Challenges', 'Défis'), desc: t('Community flag challenges', 'Défis drapeaux communautaires') },
  ]

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 12px', letterSpacing: '-1.5px' }}>
            {t('Community', 'Communauté')}
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b', margin: '0 0 28px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            {t(
              'Join thousands of flag enthusiasts. Discuss, compete, and learn together.',
              'Rejoins des milliers de passionnés de drapeaux. Discute, rivalise et apprends ensemble.'
            )}
          </p>

          {DISCOURSE_URL ? (
            <a href={DISCOURSE_URL} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '16px' }}>
              {t('Join the forum →', 'Rejoindre le forum →')}
            </a>
          ) : (
            <div style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#f0ede4', borderRadius: '99px', fontSize: '13px', fontWeight: '700', color: '#806D40' }}>
              🚧 {t('Forum launching soon', 'Forum bientôt en ligne')}
            </div>
          )}
        </div>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>{f.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0B1F3B', marginBottom: '5px' }}>{f.label}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Discourse embed (when live) */}
        {DISCOURSE_URL && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '800', color: '#0B1F3B', fontSize: '15px' }}>{t('Recent discussions', 'Discussions récentes')}</span>
              <a href={DISCOURSE_URL} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
                {t('View all →', 'Tout voir →')}
              </a>
            </div>
            <iframe
              src={`${DISCOURSE_URL}/latest.json?api_key=anonymous`}
              style={{ width: '100%', height: '400px', border: 'none' }}
              title="Community forum"
            />
          </div>
        )}

        {/* Setup CTA when Discourse not configured */}
        {!DISCOURSE_URL && (
          <div style={{ backgroundColor: '#0B1F3B', borderRadius: '20px', padding: '36px 32px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h2 style={{ color: 'white', margin: '0 0 10px', fontSize: '22px', fontWeight: '900' }}>
                  {t('Forum coming soon', 'Forum bientôt disponible')}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontSize: '14px', lineHeight: '1.6' }}>
                  {t(
                    'We\'re setting up the KnowFlags forum powered by Discourse. Leave your email to be notified at launch.',
                    'Nous configurons le forum KnowFlags propulsé par Discourse. Laisse ton email pour être notifié au lancement.'
                  )}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input type="email" placeholder={t('your@email.com', 'votre@email.com')}
                    style={{ flex: 1, minWidth: '180px', padding: '11px 14px', borderRadius: '9px', border: 'none', fontSize: '14px', outline: 'none' }} />
                  <button style={{ padding: '11px 20px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', borderRadius: '9px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {t('Notify me', 'Me notifier')}
                  </button>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8' }}>
                  <div style={{ color: '#9EB7E5', fontWeight: '800', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Powered by</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Discourse</div>
                  <div>discourse.org</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}