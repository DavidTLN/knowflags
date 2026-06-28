// French labels for flag colors & symbols (DB stores English tokens).
// Used by the country detail "Symbolism" section.

export const COLOR_FR = {
  red: 'Rouge', blue: 'Bleu', green: 'Vert', yellow: 'Jaune',
  white: 'Blanc', black: 'Noir', orange: 'Orange', purple: 'Violet',
  maroon: 'Bordeaux', gold: 'Or', brown: 'Marron', pink: 'Rose',
}

export const SYMBOL_FR = {
  'angkor wat': 'Angkor Vat',
  'animals': 'Animaux',
  'armillary sphere': 'Sphère armillaire',
  'arrow': 'Flèche',
  'axe': 'Hache',
  'band': 'Bande',
  'bayonet': 'Baïonnette',
  'bible': 'Bible',
  'bird': 'Oiseau',
  'bird of paradise': 'Oiseau de paradis',
  'boar tusk': 'Défense de sanglier',
  'book': 'Livre',
  'cannon': 'Canon',
  'cedar': 'Cèdre',
  'circle': 'Cercle',
  'coat of arms': 'Armoiries',
  'condor': 'Condor',
  'crane': 'Grue',
  'crescent': 'Croissant',
  'crested crane': 'Grue couronnée',
  'cross': 'Croix',
  'crosses': 'Croix',
  'crown': 'Couronne',
  'dagger': 'Poignard',
  'diamonds': 'Losanges',
  'dragon': 'Dragon',
  'eagle': 'Aigle',
  'emblem': 'Emblème',
  'fern': 'Fougère',
  'gear': 'Engrenage',
  'hat': 'Chapeau',
  'hoe': 'Houe',
  'horse': 'Cheval',
  'keys': 'Clés',
  'khanjar': 'Khandjar',
  'lance': 'Lance',
  'laurel': 'Laurier',
  'leaves': 'Feuilles',
  'liberty cap': 'Bonnet phrygien',
  'lion': 'Lion',
  'llama': 'Lama',
  'machete': 'Machette',
  'map': 'Carte',
  'maple leaf': 'Feuille d\u2019érable',
  'moon': 'Lune',
  'mosque': 'Mosquée',
  'mountain': 'Montagne',
  'musket': 'Mousquet',
  'namele leaf': 'Feuille de namele',
  'nutmeg': 'Noix de muscade',
  'olive branch': 'Branche d\u2019olivier',
  'olive branches': 'Branches d\u2019olivier',
  'palm': 'Palmier',
  'parrot': 'Perroquet',
  'pattern': 'Motif',
  'phoenix': 'Phénix',
  'quetzal': 'Quetzal',
  'rainbow': 'Arc-en-ciel',
  'rifle': 'Fusil',
  'scroll': 'Parchemin',
  'shahada': 'Chahada',
  'shield': 'Bouclier',
  'ship': 'Navire',
  'snake': 'Serpent',
  'soyombo': 'Soyombo',
  'spear': 'Javelot',
  'star': 'Étoile',
  'star of david': 'Étoile de David',
  'sun': 'Soleil',
  'sword': 'Épée',
  'tiara': 'Tiare',
  'tools': 'Outils',
  'tree': 'Arbre',
  'triangle': 'Triangle',
  'trident': 'Trident',
  'tunduk': 'Tunduk',
  'tusk': 'Défense',
  'union jack': 'Union Jack',
  'volcano': 'Volcan',
  'waves': 'Vagues',
  'wheel': 'Roue',
  'wreath': 'Guirlande',
}

function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

export function labelColor(value, locale) {
  if (!value) return ''
  const key = String(value).toLowerCase()
  if (locale === 'fr' && COLOR_FR[key]) return COLOR_FR[key]
  return capFirst(key)
}

export function labelSymbol(value, locale) {
  if (!value) return ''
  const key = String(value).toLowerCase()
  if (locale === 'fr' && SYMBOL_FR[key]) return SYMBOL_FR[key]
  return capFirst(key)
}

export const SHAPE_LABELS = {
  rectangle: { en: 'Rectangular', fr: 'Rectangulaire' },
  square:    { en: 'Square', fr: 'Carrée' },
  pennant:   { en: 'Pennant (non-rectangular)', fr: 'Fanion (non rectangulaire)' },
}

export function labelShape(value, locale) {
  if (!value) return ''
  const key = String(value).toLowerCase()
  const m = SHAPE_LABELS[key]
  if (m) return locale === 'fr' ? m.fr : m.en
  return capFirst(key)
}