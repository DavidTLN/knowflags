'use client'

/**
 * PageLoader — KnowFlags branded loading screen
 *
 * Reproduit les 3 éléments du logo en animation séquentielle :
 *   1. Card navy → scale in
 *   2. Triangle rouge → glisse depuis la gauche
 *   3. Cercle doré → scale in puis pulse
 *
 * Les keyframes @keyframes sont déclarés dans globals.css
 * (kf-card-in, kf-triangle-in, kf-circle-in, kf-pulse, kf-fade-up, kf-progress)
 *
 * USAGE :
 *   import PageLoader from '@/components/PageLoader'
 *
 *   // Remplacer un état de chargement existant :
 *   if (loading) return <PageLoader />
 *   if (loading) return <PageLoader label="Loading countries..." />
 *   if (loading) return <PageLoader label={t('Loading...', 'Chargement...')} />
 *
 * VARIANTE inline (pas full-screen) :
 *   <PageLoader inline />
 */

export default function PageLoader({ label, inline = false }) {
  const wrapper = inline ? {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '48px 24px',
    minHeight: '200px',
  } : {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    zIndex: 9999,
  }

  return (
    <div style={wrapper}>

      {/* ── Animated logo mark ── */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '18px',
        backgroundColor: '#16324F',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        animation: 'kf-card-in 0.35s cubic-bezier(0.32, 0.72, 0, 1) both',
      }}>

        {/* Red triangle */}
        <div style={{
          position: 'absolute',
          inset: 0,
          animation: 'kf-triangle-in 0.4s 0.12s cubic-bezier(0.32, 0.72, 0, 1) both',
        }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: 'block' }}>
            <polygon points="0,0 0,72 36,36" fill="#D62828" />
          </svg>
        </div>

        {/* Gold circle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: '#F4B400',
          animation: 'kf-circle-in 0.35s 0.28s cubic-bezier(0.32, 0.72, 0, 1) both, kf-pulse 1.8s 0.65s ease-in-out infinite',
        }} />
      </div>

      {/* ── Wordmark + optional label ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        animation: 'kf-fade-up 0.35s 0.3s ease both',
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '900',
          color: '#16324F',
          letterSpacing: '-0.3px',
          fontFamily: 'var(--font-display, system-ui)',
        }}>
          KnowFlags
        </span>
        {label && (
          <span style={{
            fontSize: '12px',
            color: '#8A8278',
            fontWeight: '500',
          }}>
            {label}
          </span>
        )}
      </div>

      {/* ── Gold progress bar ── */}
      <div style={{
        width: '72px',
        height: '3px',
        backgroundColor: '#E2DDD5',
        borderRadius: '999px',
        overflow: 'hidden',
        animation: 'kf-fade-up 0.35s 0.35s ease both',
      }}>
        <div style={{
          height: '100%',
          backgroundColor: '#F4B400',
          borderRadius: '999px',
          animation: 'kf-progress 1.4s 0.5s ease-in-out infinite',
        }} />
      </div>

    </div>
  )
}