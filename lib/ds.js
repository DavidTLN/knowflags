/**
 * KnowFlags Design System — JS tokens
 * Source of truth: Design_System_for_KnowFlags/src/styles/theme.css
 *
 * COLOR ARCHITECTURE (reverted + DS official):
 *   Page background  → #F4F1E6  (warm beige — KnowFlags signature)
 *   Cards / surfaces → #FFFFFF  (white — content floats on beige)
 *   Header / Footer  → #16324F  (navy — DS official primary)
 *
 * Usage:
 *   import { C, S, R, T, FW } from '@/lib/ds'
 */

// ── Colors ────────────────────────────────────────────────────────────────────
export const C = {
  // Brand (DS official)
  navy:        '#16324F',   // Primary — DS brand-navy
  navyLight:   '#1E4976',   // Hover
  navyDark:    '#0F1923',   // Pressed, deep text
  gold:        '#F4B400',   // Accent — DS brand-gold
  goldDark:    '#92400E',   // Gold on light bg
  red:         '#D62828',   // Destructive — DS brand-red
  redLight:    '#FEE2E2',
  green:       '#16A34A',   // Success, tags
  greenLight:  '#DCFCE7',
  blue:        '#2563EB',   // Info
  blueLight:   '#DBEAFE',

  // Neutrals
  bg:          '#F4F1E6',   // Page — warm beige (KnowFlags signature)
  bgAlt:       '#FAFAF7',   // Near-white
  surface:     '#FFFFFF',   // Cards, modals
  secondary:   '#EEF2F7',   // Chips inactive, secondary bg

  border:      'rgba(22,50,79,0.12)',  // Default border
  borderSolid: '#E2DDD5',             // Solid border (beige context)

  text:        '#0F1923',   // Body text
  muted:       '#6B7280',   // Secondary text
  light:       '#9CA3AF',   // Tertiary, placeholders
}

// ── Shadows ───────────────────────────────────────────────────────────────────
export const S = {
  xs:  '0 1px 3px rgba(22,50,79,0.06)',
  sm:  '0 2px 8px rgba(22,50,79,0.08)',
  md:  '0 4px 16px rgba(22,50,79,0.10)',
  lg:  '0 8px 32px rgba(22,50,79,0.12)',
  xl:  '0 16px 48px rgba(22,50,79,0.18)',
  xxl: '0 24px 64px rgba(22,50,79,0.22)',
}

// ── Border Radius ─────────────────────────────────────────────────────────────
export const R = {
  sm:   '6px',
  md:   '10px',
  lg:   '12px',
  xl:   '16px',
  xxl:  '20px',
  full: '9999px',
}

// ── Type sizes ────────────────────────────────────────────────────────────────
export const T = {
  xs: '11px', sm: '13px', base: '15px', md: '16px',
  lg: '18px', xl: '22px', '2xl': '28px', '3xl': '36px', '4xl': '48px',
}

// ── Font weights ──────────────────────────────────────────────────────────────
export const FW = {
  light: 300, regular: 400, medium: 500, semibold: 600,
  bold: 700, extrabold: 800, black: 900,
}

// ── Transitions ───────────────────────────────────────────────────────────────
export const TR = {
  fast: '0.12s ease', base: '0.2s ease', slow: '0.3s ease',
  spring: '0.28s cubic-bezier(0.32, 0.72, 0, 1)',
}

// ── Composite helpers ─────────────────────────────────────────────────────────

export const chipStyle = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', borderRadius: R.full,
  fontSize: T.sm, fontWeight: FW.semibold, cursor: 'pointer',
  border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.borderSolid}`,
  backgroundColor: active ? C.navy : C.secondary,
  color: active ? 'white' : C.muted,
  transition: `all ${TR.fast}`, whiteSpace: 'nowrap',
})

export const cardStyle = (hovered = false) => ({
  backgroundColor: C.surface,
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  overflow: 'hidden',
  transition: `transform ${TR.base}, box-shadow ${TR.base}`,
  transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
  boxShadow: hovered ? S.lg : S.xs,
})

export const btnPrimary = (hovered = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '10px 20px', borderRadius: R.md,
  fontSize: T.sm, fontWeight: FW.semibold, border: 'none',
  cursor: 'pointer', textDecoration: 'none', transition: `all ${TR.fast}`,
  backgroundColor: hovered ? C.navyLight : C.navy, color: 'white',
  boxShadow: S.sm,
})

export const btnSecondary = (hovered = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '9px 20px', borderRadius: R.md,
  fontSize: T.sm, fontWeight: FW.semibold, cursor: 'pointer', textDecoration: 'none',
  transition: `all ${TR.fast}`, color: C.navy,
  backgroundColor: hovered ? C.secondary : 'transparent',
  border: `1.5px solid ${C.borderSolid}`,
})

export const sectionLabel = {
  fontSize: T.xs, fontWeight: FW.extrabold, textTransform: 'uppercase',
  letterSpacing: '0.15em', color: C.green, margin: '0 0 6px',
  display: 'flex', alignItems: 'center', gap: '8px',
}

export const sectionTitle = (isMobile = false) => ({
  margin: 0,
  fontSize: isMobile ? '22px' : '28px',
  fontWeight: FW.black, color: C.navy, letterSpacing: '-0.02em',
})

export const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: R.md,
  border: `1.5px solid ${C.borderSolid}`, backgroundColor: C.surface,
  fontSize: T.sm, color: C.text, outline: 'none',
}