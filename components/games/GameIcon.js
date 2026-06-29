'use client'

// Crisp SVG line icons for game UI (replaces emoji chrome for a native feel).
// Usage: <GameIcon name="heart" size={16} color="#D62828" filled />

const PATHS = {
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.84a5.5 5.5 0 0 0 0-7.55z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </>
  ),
  close: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  flame: (
    <path d="M12 2c1.5 3 4.5 4.5 4.5 8.5a4.5 4.5 0 0 1-9 0c0-1.2.4-2.2 1-3 .2 1 .8 1.7 1.6 1.7.9 0 1.4-.7 1.4-1.9 0-2-1.5-3.3-1.5-4.8 0 0 1-.5 2-.5z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <path d="M8.5 21h7M9.5 21v-3h5v3" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 1 1.7l.1.5h5l.1-.5c.1-.7.5-1.3 1-1.7A6 6 0 0 0 12 3z" />
    </>
  ),
  check: <polyline points="4 12.5 9.5 18 20 6" />,
  wrong: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  thumbUp: (
    <path d="M7 10v10H4V10h3zm0 0l4-7c1.2 0 2 .9 2 2v3h4.5c1 0 1.7.9 1.5 1.9l-1.3 6c-.2.9-1 1.6-2 1.6H7" />
  ),
  thumbDown: (
    <path d="M17 14V4h3v10h-3zm0 0l-4 7c-1.2 0-2-.9-2-2v-3H6.5c-1 0-1.7-.9-1.5-1.9l1.3-6c.2-.9 1-1.6 2-1.6H17" />
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
  ),
  refresh: (
    <>
      <polyline points="21 4 21 9 16 9" />
      <path d="M20 13a8 8 0 1 1-2.3-5.7L21 9" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  bucket: (
    <>
      <path d="M5 4l9 9-7 7a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8z" />
      <path d="M5 4l2.5-2.5" />
      <path d="M19 13c1.2 1.8 2 3 2 4a2 2 0 0 1-4 0c0-1 .8-2.2 2-4z" />
    </>
  ),
  brush: (
    <>
      <path d="M14 4l6 6-7.5 7.5a3 3 0 0 1-2 .9H7l-2 2-2-2 2-2v-1.4a3 3 0 0 1 .9-2z" />
      <line x1="11" y1="7" x2="17" y2="13" />
    </>
  ),
  eraser: (
    <>
      <path d="M4 14.5l7-7a2 2 0 0 1 2.8 0l3.7 3.7a2 2 0 0 1 0 2.8L15 20H8z" />
      <line x1="9" y1="20" x2="20" y2="20" />
      <line x1="8" y1="11" x2="14" y2="17" />
    </>
  ),
  undo: (
    <>
      <polyline points="9 7 4 12 9 17" />
      <path d="M4 12h11a5 5 0 0 1 0 10h-1" />
    </>
  ),
}

export default function GameIcon({ name, size = 18, color = 'currentColor', strokeWidth = 2, filled = false, style }) {
  const path = PATHS[name]
  if (!path) return null
  const solid = filled && (name === 'heart' || name === 'flame' || name === 'sparkle' || name === 'pin' || name === 'thumbUp' || name === 'thumbDown')
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={solid ? color : 'none'}
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}