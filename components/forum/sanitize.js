'use client'

// Assainisseur HTML maison — allow-list stricte, sans dépendance.
// But : neutraliser toute tentative de XSS dans le contenu des messages.
// On ne garde QUE des balises de mise en forme sûres, et on retire tout
// attribut dangereux (on*, style, etc.). Les liens sont forcés en
// rel="nofollow noopener" + target="_blank" et limités à http/https/mailto.

const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE',
  'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE',
  'H3', 'H4', 'BR', 'P', 'SPAN', 'DIV',
])

// Attributs autorisés par balise (tout le reste est supprimé)
const ALLOWED_ATTRS = {
  A: ['href'],
}

function isSafeUrl(url) {
  if (!url) return false
  const u = url.trim().toLowerCase()
  // Autoriser uniquement http(s), mailto et les liens relatifs simples
  return u.startsWith('http://') || u.startsWith('https://') || u.startsWith('mailto:') || u.startsWith('/')
}

function cleanNode(node, doc) {
  // Élément
  if (node.nodeType === 1) {
    const tag = node.tagName

    // Balise non autorisée : on la remplace par son contenu (unwrap)
    if (!ALLOWED_TAGS.has(tag)) {
      const frag = doc.createDocumentFragment()
      while (node.firstChild) frag.appendChild(node.firstChild)
      // nettoyer récursivement les enfants remontés
      const kids = Array.from(frag.childNodes)
      kids.forEach(k => cleanNode(k, doc))
      node.replaceWith(frag)
      return
    }

    // Nettoyer les attributs : ne garder que ceux explicitement autorisés
    const allowed = ALLOWED_ATTRS[tag] || []
    Array.from(node.attributes).forEach(attr => {
      const nm = attr.name.toLowerCase()
      if (!allowed.includes(nm)) {
        node.removeAttribute(attr.name)
      }
    })

    // Cas des liens : valider l'URL et forcer les attributs de sécurité
    if (tag === 'A') {
      const href = node.getAttribute('href')
      if (!isSafeUrl(href)) {
        // lien dangereux -> on le déballe en texte
        const frag = doc.createDocumentFragment()
        while (node.firstChild) frag.appendChild(node.firstChild)
        node.replaceWith(frag)
        return
      }
      node.setAttribute('rel', 'nofollow noopener noreferrer')
      node.setAttribute('target', '_blank')
    }

    // Nettoyer récursivement les enfants
    Array.from(node.childNodes).forEach(child => cleanNode(child, doc))
    return
  }

  // Texte : on garde tel quel. Commentaires / autres : on supprime.
  if (node.nodeType !== 3) {
    node.remove()
  }
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return ''
  // Parser dans un document isolé (les <script> ne s'exécutent pas ici)
  const doc = new DOMParser().parseFromString(`<div>${dirty}</div>`, 'text/html')
  const root = doc.body.firstChild
  if (!root) return ''
  Array.from(root.childNodes).forEach(n => cleanNode(n, doc))
  return root.innerHTML
}

// Version "texte brut" : retire tout le HTML (utile pour les extraits/titres)
export function stripHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return ''
  const doc = new DOMParser().parseFromString(dirty, 'text/html')
  return (doc.body.textContent || '').trim()
}