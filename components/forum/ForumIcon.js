'use client'

// Jeu d'icônes SVG (line) pour le forum. Aucune emoji (règle KnowFlags).
// Chaque catégorie stocke un nom d'icône ; on le mappe ici vers un tracé SVG.
// Icônes neutres, épaisseur 2, coins arrondis, héritent de currentColor.

const PATHS = {
  flag:            <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  world:           <><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  messages:        <><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.7A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" /></>,
  palette:         <><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" /><path d="M12 21a2 2 0 0 1 0-4 1.5 1.5 0 0 0 0-3h1a5 5 0 0 0 0-10" /></>,
  history:         <><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l3 2" /></>,
  'map-2':         <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" /></>,
  'building-monument': <><line x1="3" y1="21" x2="21" y2="21" /><path d="M6 21V10h12v11" /><path d="M9 10 12 3l3 7" /><line x1="10" y1="14" x2="14" y2="14" /></>,
  'device-gamepad-2': <><path d="M6 12h4M8 10v4" /><line x1="15" y1="11" x2="15.01" y2="11" /><line x1="18" y1="13" x2="18.01" y2="13" /><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.6l-.7 7A3 3 0 0 0 5 19a3 3 0 0 0 2.4-1.2l.9-1.2a2 2 0 0 1 1.6-.8h4.2a2 2 0 0 1 1.6.8l.9 1.2A3 3 0 0 0 19 19a3 3 0 0 0 3-3.4l-.7-7A4 4 0 0 0 17.32 5z" /></>,
  bulb:            <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></>,
  pin:             <><path d="M9 4h6l-1 7 4 3v2H6v-2l4-3z" /><line x1="12" y1="16" x2="12" y2="22" /></>,
  search:          <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  plus:            <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  chevronRight:    <><path d="M9 6l6 6-6 6" /></>,
}

export default function ForumIcon({ name, size = 20, style }) {
  const path = PATHS[name] || PATHS.messages
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={style} aria-hidden="true"
    >
      {path}
    </svg>
  )
}