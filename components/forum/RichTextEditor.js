'use client'

import { useRef, useState, useEffect } from 'react'
import { sanitizeHtml } from '@/components/forum/sanitize'

const C = {
  navy: '#16324F', bg: '#F4F1E6', bgAlt: '#FAFAF7', surface: '#FFFFFF',
  border: 'rgba(22,50,79,0.12)', borderSolid: '#E2DDD5',
  text: '#0F1923', muted: '#6B7280', light: '#9CA3AF',
}

// Petites icônes de barre d'outils (SVG line)
function TbIcon({ name }) {
  const p = {
    bold:       <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />,
    italic:     <><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></>,
    underline:  <><path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="21" x2="20" y2="21" /></>,
    strike:     <><line x1="4" y1="12" x2="20" y2="12" /><path d="M7 6a4 3 0 0 1 6-1M17 18a4 3 0 0 1-6 1" /></>,
    h3:         <><path d="M4 6v12M12 6v12M4 12h8" /><path d="M16 10a2 2 0 1 1 2 2 2 2 0 0 1-2 2" /></>,
    ul:         <><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" /></>,
    ol:         <><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><path d="M4 6h1v4M4 10h2" /><path d="M4 15h2v1H4v1h2" /></>,
    quote:      <><path d="M6 17h3l2-4V7H5v6h3zM14 17h3l2-4V7h-6v6h3z" /></>,
    code:       <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
    link:       <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
    clear:      <><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" /></>,
  }[name]
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
}

function Btn({ icon, title, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      type="button" title={title}
      onMouseDown={e => { e.preventDefault() /* garde la sélection */ }}
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: '32px', height: '32px', borderRadius: '7px', border: 'none',
        backgroundColor: h ? '#EEF2F7' : 'transparent', color: C.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <TbIcon name={icon} />
    </button>
  )
}

function Sep() {
  return <span style={{ width: '1px', height: '20px', backgroundColor: C.border, margin: '0 2px', flexShrink: 0 }} />
}

// Éditeur WYSIWYG basé sur contentEditable + commandes natives.
// onChange reçoit le HTML ASSAINI à chaque frappe.
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 140 }) {
  const ref = useRef(null)
  const [empty, setEmpty] = useState(!value)

  // Initialise le contenu une seule fois (contentEditable non contrôlé)
  useEffect(() => {
    if (ref.current && value && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
      setEmpty(!ref.current.textContent.trim())
    }
  }, []) // eslint-disable-line

  function exec(cmd, arg) {
    document.execCommand(cmd, false, arg)
    ref.current?.focus()
    emit()
  }

  function emit() {
    if (!ref.current) return
    const html = sanitizeHtml(ref.current.innerHTML)
    setEmpty(!ref.current.textContent.trim())
    onChange?.(html)
  }

  function addLink() {
    const url = window.prompt('URL du lien :', 'https://')
    if (!url) return
    // execCommand createLink sur la sélection courante
    document.execCommand('createLink', false, url)
    // forcer target/rel via emit->sanitize (le sanitizer les ajoute)
    ref.current?.focus()
    emit()
  }

  const tb = { display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap', padding: '6px 8px', borderBottom: `1px solid ${C.border}`, backgroundColor: C.bgAlt }

  return (
    <div style={{ border: `1.5px solid ${C.borderSolid}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: C.surface }}>
      {/* Barre d'outils */}
      <div style={tb}>
        <Btn icon="bold" title="Gras" onClick={() => exec('bold')} />
        <Btn icon="italic" title="Italique" onClick={() => exec('italic')} />
        <Btn icon="underline" title="Souligné" onClick={() => exec('underline')} />
        <Btn icon="strike" title="Barré" onClick={() => exec('strikeThrough')} />
        <Sep />
        <Btn icon="h3" title="Titre" onClick={() => exec('formatBlock', 'H3')} />
        <Btn icon="quote" title="Citation" onClick={() => exec('formatBlock', 'BLOCKQUOTE')} />
        <Btn icon="code" title="Code" onClick={() => exec('formatBlock', 'PRE')} />
        <Sep />
        <Btn icon="ul" title="Liste à puces" onClick={() => exec('insertUnorderedList')} />
        <Btn icon="ol" title="Liste numérotée" onClick={() => exec('insertOrderedList')} />
        <Sep />
        <Btn icon="link" title="Lien" onClick={addLink} />
        <Btn icon="clear" title="Effacer la mise en forme" onClick={() => exec('removeFormat')} />
      </div>

      {/* Zone éditable */}
      <div style={{ position: 'relative' }}>
        {empty && (
          <span style={{ position: 'absolute', top: '12px', left: '14px', color: C.light, fontSize: '14px', pointerEvents: 'none' }}>
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          style={{
            minHeight: `${minHeight}px`, padding: '12px 14px', outline: 'none',
            fontSize: '14px', lineHeight: 1.7, color: C.text, fontFamily: 'inherit',
          }}
          className="forum-editor"
        />
      </div>

      {/* styles du contenu édité (listes, citations, code) */}
      <style>{`
        .forum-editor:focus { outline: none; }
        .forum-editor ul, .forum-editor ol { padding-left: 22px; margin: 8px 0; }
        .forum-editor blockquote { border-left: 3px solid ${C.border}; margin: 8px 0; padding: 2px 0 2px 14px; color: ${C.muted}; }
        .forum-editor pre { background: ${C.bgAlt}; border: 1px solid ${C.border}; border-radius: 8px; padding: 10px 12px; overflow-x: auto; font-family: monospace; font-size: 13px; }
        .forum-editor h3 { font-size: 17px; font-weight: 800; color: ${C.navy}; margin: 12px 0 6px; }
        .forum-editor a { color: #2563EB; text-decoration: underline; }
      `}</style>
    </div>
  )
}