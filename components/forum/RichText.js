'use client'

import { useMemo } from 'react'
import { sanitizeHtml } from '@/components/forum/sanitize'

// Affiche du HTML utilisateur de façon SÛRE : on assainit avant le rendu.
// Les styles ciblent les balises produites par l'éditeur pour rester
// cohérents avec le design KnowFlags.
export default function RichText({ html, style }) {
  const clean = useMemo(() => sanitizeHtml(html || ''), [html])

  return (
    <div
      className="forum-richtext"
      style={{ fontSize: '14px', lineHeight: 1.7, color: '#0F1923', wordBreak: 'break-word', ...style }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}