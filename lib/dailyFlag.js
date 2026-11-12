// lib/dailyFlag.js
//
// Drapeau du jour : logique partagée entre le jeu et la carte de la home.
//
// - Un jour = une date du calendrier de Zurich. Le drapeau change à minuit, heure suisse.
// - Le drapeau est tiré dans les pays souverains (entity_type = 'sovereign'), triés par code ISO.
//   Chaque « cycle » de N jours (N = nombre de pays) suit une permutation pseudo-aléatoire
//   différente : aucun pays ne revient avant que tous soient passés.
// - Le calcul est déterministe : tout le monde voit le même drapeau, sans table à remplir.

export const DAILY_EPOCH = '2026-11-10'   // jour n° 1
export const DAILY_MAX_GUESSES = 5
export const DAILY_TZ = 'Europe/Zurich'
const STORAGE_KEY = 'kf-daily-v1'

// 'YYYY-MM-DD' du jour à Zurich
export function zurichDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function keyToUtc(key) {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Index du jour depuis le lancement (0 pour le jour n° 1)
export function dayIndex(key = zurichDayKey()) {
  return Math.round((keyToUtc(key) - keyToUtc(DAILY_EPOCH)) / 86400000)
}

export function dayNumber(key = zurichDayKey()) {
  return dayIndex(key) + 1
}

export function shiftDayKey(key, delta) {
  const d = new Date(keyToUtc(key) + delta * 86400000)
  return d.toISOString().slice(0, 10)
}

// Date (minuit UTC) d'une clé 'YYYY-MM-DD', pour l'affichage avec timeZone: 'UTC'
export function dayKeyToDate(key) {
  return new Date(keyToUtc(key))
}

// Jour jouable : format valide, entre le jour n° 1 et aujourd'hui inclus
export function isPlayableDay(key, todayKey = zurichDayKey()) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key)
    && !Number.isNaN(keyToUtc(key)) && key >= DAILY_EPOCH && key <= todayKey
}

// PRNG déterministe (mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Code ISO du drapeau du jour parmi `isoCodes` (liste des pays souverains)
export function dailyIso(isoCodes, key = zurichDayKey()) {
  const sorted = [...new Set(isoCodes)].sort()
  const n = sorted.length
  if (!n) return null
  const idx = Math.max(0, dayIndex(key))
  const cycle = Math.floor(idx / n)
  const rand = mulberry32(0x4B4E4F57 + cycle * 7919)   // graine différente à chaque cycle
  const perm = [...sorted]
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]]
  }
  return perm[idx % n]
}

// Secondes restantes avant minuit à Zurich
export function secondsToNextDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DAILY_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t) => Number(parts.find(p => p.type === t)?.value || 0)
  return Math.max(0, 86400 - (get('hour') * 3600 + get('minute') * 60 + get('second')))
}

// ── Stockage local (visiteurs, et partie en cours pour tout le monde) ────────
// { days: { 'YYYY-MM-DD': { iso, guesses: [{ code, pct, correct }], revealed: ['r-c', ...], won, done, late } } }
// late = true : jour joué après sa date, depuis les archives
export function readLocal() {
  if (typeof window === 'undefined') return { days: {} }
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return data && typeof data.days === 'object' ? data : { days: {} }
  } catch { return { days: {} } }
}

export function writeLocalDay(key, day) {
  if (typeof window === 'undefined') return
  try {
    const data = readLocal()
    data.days[key] = day
    // Ne garde que les 400 derniers jours
    const keys = Object.keys(data.days).sort()
    for (const k of keys.slice(0, Math.max(0, keys.length - 400))) delete data.days[k]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* mode privé ou quota : la partie reste jouable, sans mémoire */ }
}

// Statistiques à partir d'une liste de jours terminés [{ day, won, guesses, late }]
// Les jours rattrapés plus tard (archives, late = true) donnent une coche dans le
// calendrier mais ne comptent ni dans la série ni dans les statistiques du jour.
export function computeStats(results, todayKey = zurichDayKey()) {
  const done = results.filter(r => r && r.day && !r.late).sort((a, b) => a.day.localeCompare(b.day))
  const played = done.length
  const wins = done.filter(r => r.won).length

  // Série en cours : jours gagnés consécutifs se terminant aujourd'hui (ou hier si aujourd'hui pas encore joué)
  const byDay = new Map(done.map(r => [r.day, r]))
  let cursor = byDay.has(todayKey) ? todayKey : shiftDayKey(todayKey, -1)
  let current = 0
  while (byDay.get(cursor)?.won) { current++; cursor = shiftDayKey(cursor, -1) }

  // Meilleure série
  let best = 0, run = 0, prev = null
  for (const r of done) {
    if (r.won && prev && shiftDayKey(prev, 1) === r.day && run > 0) run++
    else run = r.won ? 1 : 0
    best = Math.max(best, run)
    prev = r.day
  }
  return { played, wins, winRate: played ? Math.round((wins / played) * 100) : 0, current, best }
}

// Texte partagé, sans révéler le pays
export function shareText({ number, guesses, won, locale, dayKey }) {
  const rows = guesses.map(g => {
    if (g.correct) return '🟩🟩🟩🟩🟩'
    const n = Math.max(0, Math.min(4, Math.round((g.pct || 0) / 20)))
    return '🟨'.repeat(n) + '⬜'.repeat(5 - n)
  })
  const score = won ? `${guesses.length}/${DAILY_MAX_GUESSES}` : `X/${DAILY_MAX_GUESSES}`
  const url = `https://knowflags.com/${locale === 'fr' ? 'fr' : 'en'}/games/daily${dayKey ? `?day=${dayKey}` : ''}`
  return `KnowFlags #${number} ${score}\n${rows.join('\n')}\n${url}`
}
