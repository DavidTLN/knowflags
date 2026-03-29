'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'

// Normalize: strip accents for accent-insensitive search
function normalize(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

import { createClient } from '@/lib/supabase-client'

// ─── Scoring ──────────────────────────────────────────────────────────────────
const GUESS_POINTS = { 1: 100, 2: 75, 3: 50, 4: 35, 5: 20 }
const STREAK_MULTIPLIER = (streak) => {
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 5)  return 1.5
  return 1
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const FLAGS = [
  { en: 'Afghanistan',                      fr: 'Afghanistan',                      code: 'af' },
  { en: 'Albania',                          fr: 'Albanie',                          code: 'al' },
  { en: 'Algeria',                          fr: 'Algérie',                          code: 'dz' },
  { en: 'Andorra',                          fr: 'Andorre',                          code: 'ad' },
  { en: 'Angola',                           fr: 'Angola',                           code: 'ao' },
  { en: 'Antigua and Barbuda',              fr: 'Antigua-et-Barbuda',               code: 'ag' },
  { en: 'Argentina',                        fr: 'Argentine',                        code: 'ar' },
  { en: 'Armenia',                          fr: 'Arménie',                          code: 'am' },
  { en: 'Australia',                        fr: 'Australie',                        code: 'au' },
  { en: 'Austria',                          fr: 'Autriche',                         code: 'at' },
  { en: 'Azerbaijan',                       fr: 'Azerbaïdjan',                      code: 'az' },
  { en: 'Bahamas',                          fr: 'Bahamas',                          code: 'bs' },
  { en: 'Bahrain',                          fr: 'Bahreïn',                          code: 'bh' },
  { en: 'Bangladesh',                       fr: 'Bangladesh',                       code: 'bd' },
  { en: 'Barbados',                         fr: 'Barbade',                          code: 'bb' },
  { en: 'Belarus',                          fr: 'Biélorussie',                      code: 'by' },
  { en: 'Belgium',                          fr: 'Belgique',                         code: 'be' },
  { en: 'Belize',                           fr: 'Belize',                           code: 'bz' },
  { en: 'Benin',                            fr: 'Bénin',                            code: 'bj' },
  { en: 'Bhutan',                           fr: 'Bhoutan',                          code: 'bt' },
  { en: 'Bolivia',                          fr: 'Bolivie',                          code: 'bo' },
  { en: 'Bosnia and Herzegovina',           fr: 'Bosnie-Herzégovine',               code: 'ba' },
  { en: 'Botswana',                         fr: 'Botswana',                         code: 'bw' },
  { en: 'Brazil',                           fr: 'Brésil',                           code: 'br' },
  { en: 'Brunei',                           fr: 'Brunéi',                           code: 'bn' },
  { en: 'Bulgaria',                         fr: 'Bulgarie',                         code: 'bg' },
  { en: 'Burkina Faso',                     fr: 'Burkina Faso',                     code: 'bf' },
  { en: 'Burundi',                          fr: 'Burundi',                          code: 'bi' },
  { en: 'Cambodia',                         fr: 'Cambodge',                         code: 'kh' },
  { en: 'Cameroon',                         fr: 'Cameroun',                         code: 'cm' },
  { en: 'Canada',                           fr: 'Canada',                           code: 'ca' },
  { en: 'Cape Verde',                       fr: 'Cap-Vert',                         code: 'cv' },
  { en: 'Central African Republic',         fr: 'République centrafricaine',        code: 'cf' },
  { en: 'Chad',                             fr: 'Tchad',                            code: 'td' },
  { en: 'Chile',                            fr: 'Chili',                            code: 'cl' },
  { en: 'China',                            fr: 'Chine',                            code: 'cn' },
  { en: 'Colombia',                         fr: 'Colombie',                         code: 'co' },
  { en: 'Comoros',                          fr: 'Comores',                          code: 'km' },
  { en: 'Congo',                            fr: 'Congo',                            code: 'cg' },
  { en: 'Costa Rica',                       fr: 'Costa Rica',                       code: 'cr' },
  { en: 'Croatia',                          fr: 'Croatie',                          code: 'hr' },
  { en: 'Cuba',                             fr: 'Cuba',                             code: 'cu' },
  { en: 'Cyprus',                           fr: 'Chypre',                           code: 'cy' },
  { en: 'Czech Republic',                   fr: 'République tchèque',               code: 'cz' },
  { en: 'Denmark',                          fr: 'Danemark',                         code: 'dk' },
  { en: 'Djibouti',                         fr: 'Djibouti',                         code: 'dj' },
  { en: 'Dominica',                         fr: 'Dominique',                        code: 'dm' },
  { en: 'Dominican Republic',               fr: 'République dominicaine',           code: 'do' },
  { en: 'DR Congo',                         fr: 'RD Congo',                         code: 'cd' },
  { en: 'Ecuador',                          fr: 'Équateur',                         code: 'ec' },
  { en: 'Egypt',                            fr: 'Égypte',                           code: 'eg' },
  { en: 'El Salvador',                      fr: 'Salvador',                         code: 'sv' },
  { en: 'Equatorial Guinea',                fr: 'Guinée équatoriale',               code: 'gq' },
  { en: 'Eritrea',                          fr: 'Érythrée',                         code: 'er' },
  { en: 'Estonia',                          fr: 'Estonie',                          code: 'ee' },
  { en: 'Eswatini',                         fr: 'Eswatini',                         code: 'sz' },
  { en: 'Ethiopia',                         fr: 'Éthiopie',                         code: 'et' },
  { en: 'Fiji',                             fr: 'Fidji',                            code: 'fj' },
  { en: 'Finland',                          fr: 'Finlande',                         code: 'fi' },
  { en: 'France',                           fr: 'France',                           code: 'fr' },
  { en: 'Gabon',                            fr: 'Gabon',                            code: 'ga' },
  { en: 'Gambia',                           fr: 'Gambie',                           code: 'gm' },
  { en: 'Georgia',                          fr: 'Géorgie',                          code: 'ge' },
  { en: 'Germany',                          fr: 'Allemagne',                        code: 'de' },
  { en: 'Ghana',                            fr: 'Ghana',                            code: 'gh' },
  { en: 'Greece',                           fr: 'Grèce',                            code: 'gr' },
  { en: 'Grenada',                          fr: 'Grenade',                          code: 'gd' },
  { en: 'Guatemala',                        fr: 'Guatemala',                        code: 'gt' },
  { en: 'Guinea',                           fr: 'Guinée',                           code: 'gn' },
  { en: 'Guinea-Bissau',                    fr: 'Guinée-Bissau',                    code: 'gw' },
  { en: 'Guyana',                           fr: 'Guyana',                           code: 'gy' },
  { en: 'Haiti',                            fr: 'Haïti',                            code: 'ht' },
  { en: 'Honduras',                         fr: 'Honduras',                         code: 'hn' },
  { en: 'Hungary',                          fr: 'Hongrie',                          code: 'hu' },
  { en: 'Iceland',                          fr: 'Islande',                          code: 'is' },
  { en: 'India',                            fr: 'Inde',                             code: 'in' },
  { en: 'Indonesia',                        fr: 'Indonésie',                        code: 'id' },
  { en: 'Iran',                             fr: 'Iran',                             code: 'ir' },
  { en: 'Iraq',                             fr: 'Irak',                             code: 'iq' },
  { en: 'Ireland',                          fr: 'Irlande',                          code: 'ie' },
  { en: 'Israel',                           fr: 'Israël',                           code: 'il' },
  { en: 'Italy',                            fr: 'Italie',                           code: 'it' },
  { en: 'Ivory Coast',                      fr: "Côte d'Ivoire",                    code: 'ci' },
  { en: 'Jamaica',                          fr: 'Jamaïque',                         code: 'jm' },
  { en: 'Japan',                            fr: 'Japon',                            code: 'jp' },
  { en: 'Jordan',                           fr: 'Jordanie',                         code: 'jo' },
  { en: 'Kazakhstan',                       fr: 'Kazakhstan',                       code: 'kz' },
  { en: 'Kenya',                            fr: 'Kenya',                            code: 'ke' },
  { en: 'Kiribati',                         fr: 'Kiribati',                         code: 'ki' },
  { en: 'Kuwait',                           fr: 'Koweït',                           code: 'kw' },
  { en: 'Kyrgyzstan',                       fr: 'Kirghizistan',                     code: 'kg' },
  { en: 'Laos',                             fr: 'Laos',                             code: 'la' },
  { en: 'Latvia',                           fr: 'Lettonie',                         code: 'lv' },
  { en: 'Lebanon',                          fr: 'Liban',                            code: 'lb' },
  { en: 'Lesotho',                          fr: 'Lesotho',                          code: 'ls' },
  { en: 'Liberia',                          fr: 'Libéria',                          code: 'lr' },
  { en: 'Libya',                            fr: 'Libye',                            code: 'ly' },
  { en: 'Liechtenstein',                    fr: 'Liechtenstein',                    code: 'li' },
  { en: 'Lithuania',                        fr: 'Lituanie',                         code: 'lt' },
  { en: 'Luxembourg',                       fr: 'Luxembourg',                       code: 'lu' },
  { en: 'Madagascar',                       fr: 'Madagascar',                       code: 'mg' },
  { en: 'Malawi',                           fr: 'Malawi',                           code: 'mw' },
  { en: 'Malaysia',                         fr: 'Malaisie',                         code: 'my' },
  { en: 'Maldives',                         fr: 'Maldives',                         code: 'mv' },
  { en: 'Mali',                             fr: 'Mali',                             code: 'ml' },
  { en: 'Malta',                            fr: 'Malte',                            code: 'mt' },
  { en: 'Marshall Islands',                 fr: 'Îles Marshall',                    code: 'mh' },
  { en: 'Mauritania',                       fr: 'Mauritanie',                       code: 'mr' },
  { en: 'Mauritius',                        fr: 'Maurice',                          code: 'mu' },
  { en: 'Mexico',                           fr: 'Mexique',                          code: 'mx' },
  { en: 'Micronesia',                       fr: 'Micronésie',                       code: 'fm' },
  { en: 'Moldova',                          fr: 'Moldavie',                         code: 'md' },
  { en: 'Monaco',                           fr: 'Monaco',                           code: 'mc' },
  { en: 'Mongolia',                         fr: 'Mongolie',                         code: 'mn' },
  { en: 'Montenegro',                       fr: 'Monténégro',                       code: 'me' },
  { en: 'Morocco',                          fr: 'Maroc',                            code: 'ma' },
  { en: 'Mozambique',                       fr: 'Mozambique',                       code: 'mz' },
  { en: 'Myanmar',                          fr: 'Myanmar',                          code: 'mm' },
  { en: 'Namibia',                          fr: 'Namibie',                          code: 'na' },
  { en: 'Nauru',                            fr: 'Nauru',                            code: 'nr' },
  { en: 'Nepal',                            fr: 'Népal',                            code: 'np' },
  { en: 'Netherlands',                      fr: 'Pays-Bas',                         code: 'nl' },
  { en: 'New Zealand',                      fr: 'Nouvelle-Zélande',                 code: 'nz' },
  { en: 'Nicaragua',                        fr: 'Nicaragua',                        code: 'ni' },
  { en: 'Niger',                            fr: 'Niger',                            code: 'ne' },
  { en: 'Nigeria',                          fr: 'Nigéria',                          code: 'ng' },
  { en: 'North Korea',                      fr: 'Corée du Nord',                    code: 'kp' },
  { en: 'North Macedonia',                  fr: 'Macédoine du Nord',                code: 'mk' },
  { en: 'Norway',                           fr: 'Norvège',                          code: 'no' },
  { en: 'Oman',                             fr: 'Oman',                             code: 'om' },
  { en: 'Pakistan',                         fr: 'Pakistan',                         code: 'pk' },
  { en: 'Palau',                            fr: 'Palaos',                           code: 'pw' },
  { en: 'Palestine',                        fr: 'Palestine',                        code: 'ps' },
  { en: 'Panama',                           fr: 'Panama',                           code: 'pa' },
  { en: 'Papua New Guinea',                 fr: 'Papouasie-Nouvelle-Guinée',        code: 'pg' },
  { en: 'Paraguay',                         fr: 'Paraguay',                         code: 'py' },
  { en: 'Peru',                             fr: 'Pérou',                            code: 'pe' },
  { en: 'Philippines',                      fr: 'Philippines',                      code: 'ph' },
  { en: 'Poland',                           fr: 'Pologne',                          code: 'pl' },
  { en: 'Portugal',                         fr: 'Portugal',                         code: 'pt' },
  { en: 'Qatar',                            fr: 'Qatar',                            code: 'qa' },
  { en: 'Romania',                          fr: 'Roumanie',                         code: 'ro' },
  { en: 'Russia',                           fr: 'Russie',                           code: 'ru' },
  { en: 'Rwanda',                           fr: 'Rwanda',                           code: 'rw' },
  { en: 'Saint Kitts and Nevis',            fr: 'Saint-Kitts-et-Nevis',             code: 'kn' },
  { en: 'Saint Lucia',                      fr: 'Sainte-Lucie',                     code: 'lc' },
  { en: 'Saint Vincent and the Grenadines', fr: 'Saint-Vincent-et-les-Grenadines',  code: 'vc' },
  { en: 'Samoa',                            fr: 'Samoa',                            code: 'ws' },
  { en: 'San Marino',                       fr: 'Saint-Marin',                      code: 'sm' },
  { en: 'Sao Tome and Principe',            fr: 'Sao Tomé-et-Principe',             code: 'st' },
  { en: 'Saudi Arabia',                     fr: 'Arabie saoudite',                  code: 'sa' },
  { en: 'Senegal',                          fr: 'Sénégal',                          code: 'sn' },
  { en: 'Serbia',                           fr: 'Serbie',                           code: 'rs' },
  { en: 'Seychelles',                       fr: 'Seychelles',                       code: 'sc' },
  { en: 'Sierra Leone',                     fr: 'Sierra Leone',                     code: 'sl' },
  { en: 'Singapore',                        fr: 'Singapour',                        code: 'sg' },
  { en: 'Slovakia',                         fr: 'Slovaquie',                        code: 'sk' },
  { en: 'Slovenia',                         fr: 'Slovénie',                         code: 'si' },
  { en: 'Solomon Islands',                  fr: 'Îles Salomon',                     code: 'sb' },
  { en: 'Somalia',                          fr: 'Somalie',                          code: 'so' },
  { en: 'South Africa',                     fr: 'Afrique du Sud',                   code: 'za' },
  { en: 'South Korea',                      fr: 'Corée du Sud',                     code: 'kr' },
  { en: 'South Sudan',                      fr: 'Soudan du Sud',                    code: 'ss' },
  { en: 'Spain',                            fr: 'Espagne',                          code: 'es' },
  { en: 'Sri Lanka',                        fr: 'Sri Lanka',                        code: 'lk' },
  { en: 'Sudan',                            fr: 'Soudan',                           code: 'sd' },
  { en: 'Suriname',                         fr: 'Suriname',                         code: 'sr' },
  { en: 'Sweden',                           fr: 'Suède',                            code: 'se' },
  { en: 'Switzerland',                      fr: 'Suisse',                           code: 'ch' },
  { en: 'Syria',                            fr: 'Syrie',                            code: 'sy' },
  { en: 'Taiwan',                           fr: 'Taïwan',                           code: 'tw' },
  { en: 'Tajikistan',                       fr: 'Tadjikistan',                      code: 'tj' },
  { en: 'Tanzania',                         fr: 'Tanzanie',                         code: 'tz' },
  { en: 'Thailand',                         fr: 'Thaïlande',                        code: 'th' },
  { en: 'Timor-Leste',                      fr: 'Timor oriental',                   code: 'tl' },
  { en: 'Togo',                             fr: 'Togo',                             code: 'tg' },
  { en: 'Tonga',                            fr: 'Tonga',                            code: 'to' },
  { en: 'Trinidad and Tobago',              fr: 'Trinité-et-Tobago',                code: 'tt' },
  { en: 'Tunisia',                          fr: 'Tunisie',                          code: 'tn' },
  { en: 'Turkey',                           fr: 'Turquie',                          code: 'tr' },
  { en: 'Turkmenistan',                     fr: 'Turkménistan',                     code: 'tm' },
  { en: 'Tuvalu',                           fr: 'Tuvalu',                           code: 'tv' },
  { en: 'UAE',                              fr: 'Émirats arabes unis',              code: 'ae' },
  { en: 'Uganda',                           fr: 'Ouganda',                          code: 'ug' },
  { en: 'Ukraine',                          fr: 'Ukraine',                          code: 'ua' },
  { en: 'United Kingdom',                   fr: 'Royaume-Uni',                      code: 'gb' },
  { en: 'United States',                    fr: 'États-Unis',                       code: 'us' },
  { en: 'Uruguay',                          fr: 'Uruguay',                          code: 'uy' },
  { en: 'Uzbekistan',                       fr: 'Ouzbékistan',                      code: 'uz' },
  { en: 'Vanuatu',                          fr: 'Vanuatu',                          code: 'vu' },
  { en: 'Vatican City',                     fr: 'Vatican',                          code: 'va' },
  { en: 'Venezuela',                        fr: 'Venezuela',                        code: 've' },
  { en: 'Vietnam',                          fr: 'Viêt Nam',                         code: 'vn' },
  { en: 'Yemen',                            fr: 'Yémen',                            code: 'ye' },
  { en: 'Zambia',                           fr: 'Zambie',                           code: 'zm' },
  { en: 'Zimbabwe',                         fr: 'Zimbabwe',                         code: 'zw' },
]

const MAX_GUESSES = 5
const MAX_LIVES = 3
const TILE_SIZE = 20
const CANVAS_W = 480
const CANVAS_H = 320

export default function FlagReveal() {
  const t = useTranslations('game')
  const locale = useLocale()

  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const inputRef = useRef(null)

  const [target, setTarget] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [input, setInput] = useState('')
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameState, setGameState] = useState('playing') // playing | won | lost | gameover
  const [revealedTiles, setRevealedTiles] = useState(new Set())
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
  const [difficulty, setDifficulty]   = useState(null) // null = setup screen | 'easy' | 'normal'
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(0) // keyboard nav index
  const activeIdxRef = useRef(0)
  const suggestionsRef = useRef([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [user, setUser] = useState(null)
  const [myStats, setMyStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [score, setScore] = useState(0)
  const [lastPts,    setLastPts]    = useState(null)
  const [elapsed,    setElapsed]    = useState(0)       // seconds since game start
  const [showQuitTip,setShowQuitTip]= useState(false)   // tooltip on quit button
  const scoreRef    = useRef(0)
  const timerRef2   = useRef(null)
  const sessionStart= useRef(null)

  const getName = (flag) => flag ? (locale === 'fr' ? flag.fr : flag.en) : ''

  // Inject float-up animation CSS via useEffect (avoids SSR hydration mismatch)
  useEffect(() => {
    if (!document.getElementById('flagreveal-anim')) {
      const style = document.createElement('style')
      style.id = 'flagreveal-anim'
      style.textContent = '@keyframes floatUp { 0% { opacity:1; transform:translateX(-50%) translateY(0); } 100% { opacity:0; transform:translateX(-50%) translateY(-28px); } }'
      document.head.appendChild(style)
    }
  }, [])

  // ── responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── auth + stats ──────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadStats(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadStats(session.user.id)
    })
    loadLeaderboard()
    return () => subscription.unsubscribe()
  }, [])

  async function loadStats(userId) {
    const supabase = createClient()
    const { data } = await supabase
      .from('player_stats')
      .select('streak_current, streak_best, flags_found, games_played')
      .eq('user_id', userId)
      .eq('game', 'flag-reveal')
      .single()
    if (data) setMyStats(data)
  }

  async function loadLeaderboard() {
    const supabase = createClient()
    const { data } = await supabase
      .from('player_stats')
      .select('user_id, streak_best, flags_found, profiles(username)')
      .eq('game', 'flag-reveal')
      .order('streak_best', { ascending: false })
      .limit(5)
    if (data) setLeaderboard(data)
  }

  async function saveStats(won, newStreak) {
    if (!user) return
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('player_stats').select('*').eq('user_id', user.id).eq('game', 'flag-reveal').single()
    if (existing) {
      await supabase.from('player_stats').update({
        game:           'flag-reveal',
        streak_current: won ? newStreak : 0,
        streak_best:    Math.max(existing.streak_best || 0, newStreak),
        flags_found:    won ? (existing.flags_found || 0) + 1 : existing.flags_found,
        games_played:   (existing.games_played || 0) + 1,
        longest_game:   Math.max(existing.longest_game || 0, elapsed),
        updated_at:     new Date().toISOString(),
      }).eq('user_id', user.id).eq('game', 'flag-reveal')
    } else {
      await supabase.from('player_stats').insert({
        user_id:        user.id,
        game:           'flag-reveal',
        streak_current: won ? newStreak : 0,
        streak_best:    won ? newStreak : 0,
        flags_found:    won ? 1 : 0,
        games_played:   1,
        longest_game:   elapsed,
      })
    }
    loadStats(user.id)
    loadLeaderboard()
  }

  async function saveScore(finalScore) {
    if (!user || finalScore === 0) return
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('game_scores')
      .select('best_streak, best_duration')
      .eq('user_id', user.id)
      .eq('mode', 'flag_reveal')
      .single()
    await supabase.from('game_scores').upsert({
      user_id:       user.id,
      mode:          'flag_reveal',
      best_streak:   Math.max(existing?.best_streak ?? 0, finalScore),
      best_duration: Math.max(existing?.best_duration ?? 0, elapsed),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
  }

  function endGame() {
    stopSessionTimer()
    saveScore(scoreRef.current)
    setGameState('gameover')
    saveStats(false, 0)
  }

  function giveUpFlag() {
    // Skip current flag, lose a life
    revealAll()
    const newLives = lives - 1
    setLives(newLives)
    setStreak(0)
    if (newLives <= 0) {
      endGame()
    } else {
      setGameState('lost')
      saveStats(false, 0)
    }
  }

  // ── game ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!difficulty) return // wait for difficulty selection
    startNewFlag()
    startSessionTimer()
    return () => stopSessionTimer()
  }, [difficulty])
  useEffect(() => { if (imageLoaded) drawCanvas() }, [imageLoaded, revealedTiles])

  function startSessionTimer() {
    clearInterval(timerRef2.current)
    sessionStart.current = Date.now()
    timerRef2.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000))
    }, 1000)
  }

  function stopSessionTimer() {
    clearInterval(timerRef2.current)
  }

  function startNewFlag() {
    const random = FLAGS[Math.floor(Math.random() * FLAGS.length)]
    setTarget(random)
    setGuesses([])
    setInput('')
    setRevealedTiles(new Set())
    setGameState('playing')
    setImageLoaded(false)
    setSuggestions([])
    setActiveIdx(0)
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  useEffect(() => {
    if (!target) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = 'https://flagcdn.com/w640/' + target.code + '.png'
    img.onload = () => { imgRef.current = img; setImageLoaded(true) }
  }, [target])

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    const ctx = canvas.getContext('2d')
    const W = CANVAS_W; const H = CANVAS_H
    const cols = Math.ceil(W / TILE_SIZE); const rows = Math.ceil(H / TILE_SIZE)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE_SIZE; const y = r * TILE_SIZE
        if (revealedTiles.has(r + '-' + c)) {
          ctx.drawImage(imgRef.current,
            (x / W) * imgRef.current.naturalWidth, (y / H) * imgRef.current.naturalHeight,
            (TILE_SIZE / W) * imgRef.current.naturalWidth, (TILE_SIZE / H) * imgRef.current.naturalHeight,
            x, y, TILE_SIZE, TILE_SIZE)
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#3a3a3a' : '#2e2e2e'
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        }
      }
    }
  }

  function computeSimilarity(guessCode) {
    return new Promise((resolve) => {
      const W = CANVAS_W; const H = CANVAS_H
      const tC = document.createElement('canvas'); tC.width = W; tC.height = H
      tC.getContext('2d').drawImage(imgRef.current, 0, 0, W, H)
      const tData = tC.getContext('2d').getImageData(0, 0, W, H).data
      const gImg = new Image(); gImg.crossOrigin = 'anonymous'
      gImg.src = 'https://flagcdn.com/w640/' + guessCode + '.png'
      gImg.onload = () => {
        const gC = document.createElement('canvas'); gC.width = W; gC.height = H
        gC.getContext('2d').drawImage(gImg, 0, 0, W, H)
        const gData = gC.getContext('2d').getImageData(0, 0, W, H).data
        const cols = Math.ceil(W / TILE_SIZE); const rows = Math.ceil(H / TILE_SIZE)
        const newRevealed = new Set(revealedTiles)
        let matched = 0; const total = cols * rows

        // Build guess color palette (sample every 8th pixel for speed)
        const guessPalette = []
        for (let i = 0; i < gData.length; i += 32) {
          if (gData[i + 3] > 128) guessPalette.push([gData[i], gData[i+1], gData[i+2]])
        }

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Get target tile center color
            const px = (r * TILE_SIZE + Math.floor(TILE_SIZE / 2)) * W + (c * TILE_SIZE + Math.floor(TILE_SIZE / 2))
            const i = px * 4
            if (tData[i + 3] < 128) continue
            const tColor = [tData[i], tData[i+1], tData[i+2]]

            // Positional similarity for % calculation
            const posDist = Math.sqrt(
              Math.pow(tData[i] - gData[i], 2) +
              Math.pow(tData[i+1] - gData[i+1], 2) +
              Math.pow(tData[i+2] - gData[i+2], 2)
            )
            if (posDist < 80) matched++

            // Reveal: check if tile color exists anywhere in guess flag
            const minDist = Math.min(...guessPalette.map(p =>
              Math.sqrt(Math.pow(tColor[0]-p[0],2) + Math.pow(tColor[1]-p[1],2) + Math.pow(tColor[2]-p[2],2))
            ))
            if (minDist < 80) newRevealed.add(r + '-' + c)
          }
        }
        resolve({ newRevealed, pct: Math.round((matched / total) * 100) })
      }
    })
  }

  function revealAll() {
    const all = new Set()
    for (let r = 0; r < Math.ceil(CANVAS_H/TILE_SIZE); r++)
      for (let c = 0; c < Math.ceil(CANVAS_W/TILE_SIZE); c++)
        all.add(r+'-'+c)
    setRevealedTiles(all)
  }

  function handleInputChange(val) {
    setInput(val)
    if (val.length < 2) {
      setSuggestions([])
      suggestionsRef.current = []
      setActiveIdx(0)
      activeIdxRef.current = 0
      return
    }
    const filtered = FLAGS.filter(f =>
      normalize(getName(f)).includes(normalize(val)) &&
      !guesses.find(g => g.code === f.code)
    ).slice(0, 6)
    setSuggestions(filtered)
    suggestionsRef.current = filtered
    setActiveIdx(0)
    activeIdxRef.current = 0
  }

  function handleKeyDown(e) {
    if (suggestionsRef.current.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(activeIdxRef.current + 1, suggestionsRef.current.length - 1)
      activeIdxRef.current = next
      setActiveIdx(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(activeIdxRef.current - 1, 0)
      activeIdxRef.current = prev
      setActiveIdx(prev)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const flag = suggestionsRef.current[activeIdxRef.current]
      if (flag) handleGuess(flag)
    }
  }

  async function handleGuess(flag) {
    if (gameState !== 'playing') return
    setSuggestions([]); setInput(''); setActiveIdx(0)
    const isCorrect = flag.code === target.code
    const { newRevealed, pct } = await computeSimilarity(flag.code)
    const newGuesses = [...guesses, { ...flag, correct: isCorrect, similarity: pct }]
    setGuesses(newGuesses)

    if (isCorrect) {
      revealAll()
      const newStreak = streak + 1
      setStreak(newStreak)
      setGameState('won')
      // Score: only in Normal mode, not Training
      if (difficulty !== 'easy') {
        const guessCount = newGuesses.length
        const basePts = GUESS_POINTS[guessCount] ?? 10
        const pts = Math.round(basePts * STREAK_MULTIPLIER(newStreak))
        const newScore = scoreRef.current + pts
        scoreRef.current = newScore
        setScore(newScore)
        setLastPts(pts)
        setTimeout(() => setLastPts(null), 1500)
      }
      await saveStats(true, newStreak)
    } else {
      setRevealedTiles(newRevealed)
      if (newGuesses.length >= MAX_GUESSES) {
        // Used all guesses — lose a life
        revealAll()
        const newLives = lives - 1
        setLives(newLives)
        setStreak(0)
        if (newLives <= 0) {
          endGame()
        } else {
          setGameState('lost')
          await saveStats(false, 0)
        }
      }
    }
  }

  const emptyRows = Math.max(0, MAX_GUESSES - guesses.length)

  // ── RENDER ────────────────────────────────────────────────────────────────

  // Lives + streak row — always visible
  const livesRow = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>{t('lives')}</span>
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : '#e2e8f0'}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ))}
      <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
        ⏱ {formatTime(elapsed)}
      </span>
      <span style={{ fontSize: '14px', fontWeight: '800', color: streak > 0 ? '#806D40' : '#cbd5e1', marginLeft: '8px' }}>
        🔥 {streak}
      </span>
      <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginLeft: '8px' }}>
        {difficulty !== 'easy' && (
          <>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1, marginBottom: '3px' }}>
              Score
            </span>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#166534', backgroundColor: '#f0fdf4', border: '2px solid #86efac', borderRadius: '99px', padding: '4px 10px', whiteSpace: 'nowrap', lineHeight: 1 }}>
              {score.toLocaleString()} pts
            </span>
            {lastPts && (
              <span style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                fontSize: '13px', fontWeight: '900', color: '#166534',
                animation: 'floatUp 1.5s ease-out forwards',
                whiteSpace: 'nowrap', pointerEvents: 'none',
                backgroundColor: '#dcfce7', border: '1px solid #86efac',
                borderRadius: '99px', padding: '3px 8px',
              }}>
                +{lastPts} pts
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )

  const canvasBlock = (
    <div style={{ position: 'relative' }}>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        style={{ width: '100%', borderRadius: '10px', border: '2px solid #333', display: 'block', backgroundColor: '#1a1a1a' }} />
      {gameState !== 'playing' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '44px' }}>{gameState === 'won' ? '🎉' : gameState === 'lost' ? '😔' : '💀'}</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: gameState === 'won' ? '#FCD116' : '#ef4444', marginTop: '6px' }}>
              {gameState === 'gameover' ? t('gameOver') : getName(target)}
            </div>
            {(gameState === 'lost' || gameState === 'gameover') && (
              <div style={{ fontSize: '15px', color: '#F4F1E6', marginTop: '4px' }}>{t('itWas')} {getName(target)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const actionButton = (gameState === 'won' || gameState === 'lost') ? (
    <button onClick={startNewFlag} style={{ width: '100%', padding: '14px', backgroundColor: gameState === 'won' ? '#426A5A' : '#0B1F3B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
      {t('nextFlag')}
    </button>
  ) : gameState === 'gameover' ? (
    <button onClick={() => { setLives(MAX_LIVES); setStreak(0); scoreRef.current = 0; setScore(0); setElapsed(0); setDifficulty(null) }} style={{ width: '100%', padding: '14px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
      {t('playAgain')}
    </button>
  ) : gameState === 'playing' ? (
    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
      <button onClick={giveUpFlag} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: '#94a3b8', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
        🏳️ {locale === 'fr' ? 'Passer ce drapeau' : 'Give up this flag'}
      </button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={endGame}
          onMouseEnter={() => setShowQuitTip(true)}
          onMouseLeave={() => setShowQuitTip(false)}
          style={{ padding: '10px 14px', backgroundColor: 'transparent', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          🚪 {locale === 'fr' ? 'Quitter' : 'Quit game'}
        </button>
        {showQuitTip && (
          <div style={{
            position: 'absolute', bottom: '110%', right: 0,
            backgroundColor: '#1e293b', color: 'white',
            fontSize: '12px', padding: '8px 12px', borderRadius: '8px',
            whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}>
            {locale === 'fr'
              ? 'Arrête la partie et sauvegarde ton score'
              : 'Stops the game and saves your current score'}
            <div style={{ position: 'absolute', bottom: '-5px', right: '20px', width: '10px', height: '10px', backgroundColor: '#1e293b', transform: 'rotate(45deg)' }} />
          </div>
        )}
      </div>
    </div>
  ) : null

  // Input — inline JSX to preserve focus
  const inputBlock = (
    <div>
      {livesRow}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={gameState === 'playing' ? t('placeholder') : ''}
          disabled={gameState !== 'playing'}
          autoComplete="off"
          style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '2px solid #ddd', backgroundColor: gameState === 'playing' ? 'white' : '#e2e8f0', color: '#0B1F3B', fontSize: '16px', outline: 'none', boxSizing: 'border-box', cursor: gameState === 'playing' ? 'text' : 'default' }}
        />
        {suggestions.length > 0 && gameState === 'playing' && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '10px', border: '1px solid #C0BDB4', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 20, marginTop: '4px' }}>
            {suggestions.map((f, i) => (
              <button key={f.code}
                onMouseDown={e => { e.preventDefault(); handleGuess(f) }}
                style={{
                  width: '100%', padding: '13px 16px', textAlign: 'left',
                  backgroundColor: i === activeIdx ? '#dbeafe' : 'transparent',
                  border: 'none', borderBottom: '1px solid #f0f0f0',
                  color: '#0B1F3B', cursor: 'pointer', fontSize: '15px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                {getName(f)}
                {i === activeIdx && <span style={{ fontSize: '11px', color: '#9EB7E5' }}>↵</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Guess rows — grey empty slots
  const guessHistory = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {guesses.map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', backgroundColor: g.correct ? '#dcfce7' : '#fee2e2', border: '1px solid ' + (g.correct ? '#86efac' : '#fca5a5') }}>
          <img src={'https://flagcdn.com/w40/' + g.code + '.png'} width="30" height="20" style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#0B1F3B' }}>{getName(g)}</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: g.correct ? '#166534' : '#991b1b' }}>{g.similarity}%</span>
        </div>
      ))}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <div key={'e'+i} style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#C8C5BC', border: '1px solid #C0BDB4', height: '44px' }} />
      ))}
    </div>
  )

  const guessHistoryMobile = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {guesses.map((g, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', backgroundColor: g.correct ? '#dcfce7' : '#fee2e2', border: '1px solid ' + (g.correct ? '#86efac' : '#fca5a5') }}>
          <img src={'https://flagcdn.com/w40/' + g.code + '.png'} width="26" height="17" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(g)}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: g.correct ? '#166534' : '#991b1b' }}>{g.similarity}%</div>
          </div>
        </div>
      ))}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <div key={'e'+i} style={{ padding: '8px 10px', borderRadius: '10px', backgroundColor: '#C8C5BC', border: '1px solid #C0BDB4', height: '42px' }} />
      ))}
    </div>
  )

  const statsBlock = (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #C0BDB4', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0B1F3B' }}>
          {locale === 'fr' ? 'Classement' : 'Leaderboard'}
        </span>
        {user && myStats && (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {locale === 'fr' ? 'Meilleure série' : 'Best streak'}: <strong style={{ color: '#806D40' }}>🔥 {myStats.streak_best || 0}</strong>
          </span>
        )}
      </div>
      {user && myStats && (
        <div style={{ padding: '10px 16px', backgroundColor: '#f8faff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px' }}>
          {[
            { label: locale === 'fr' ? 'Série actuelle' : 'Current streak', value: '🔥 ' + (myStats.streak_current || 0) },
            { label: locale === 'fr' ? 'Drapeaux trouvés' : 'Flags found', value: '🏳️ ' + (myStats.flags_found || 0) },
            { label: locale === 'fr' ? 'Parties' : 'Games', value: '🎮 ' + (myStats.games_played || 0) },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0B1F3B' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {!user && (
        <div style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
          {locale === 'fr' ? 'Connectez-vous pour sauvegarder vos scores' : 'Sign in to save your scores'}
        </div>
      )}
      {leaderboard.length > 0 && leaderboard.map((row, i) => {
        const username = row.profiles?.username || (locale === 'fr' ? 'Anonyme' : 'Anonymous')
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const isMe = user && row.user_id === user.id
        return (
          <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: i < leaderboard.length - 1 ? '1px solid #f0f0f0' : 'none', backgroundColor: isMe ? '#f0f9ff' : 'transparent' }}>
            <span style={{ fontSize: '14px', width: '24px', flexShrink: 0 }}>{medal}</span>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: isMe ? '700' : '500', color: '#0B1F3B' }}>
              {username}{isMe ? (locale === 'fr' ? ' (vous)' : ' (you)') : ''}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#806D40' }}>🔥 {row.streak_best}</span>
          </div>
        )
      })}
    </div>
  )

  const howToPlay = (
    <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #C0BDB4' }}>
      <button onClick={() => setHowToPlayOpen(!howToPlayOpen)}
        style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#0B1F3B', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
        {t('howToPlay')}
        <span style={{ fontSize: '11px', transform: howToPlayOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>
      {howToPlayOpen && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
            {[['🏳️', t('rules.1')], ['🔍', t('rules.2')], ['🔥', t('rules.3')], ['❤️', t('rules.4')]].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── HUD pill component ───────────────────────────────────────────────────
  const hudPill = (icon, value, label, color = '#0B1F3B', bg = 'rgba(255,255,255,0.12)') => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: bg, borderRadius: '12px', padding: '6px 12px', minWidth: '52px' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1, marginBottom: '3px' }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: '900', color: 'white', lineHeight: 1, whiteSpace: 'nowrap' }}>{icon} {value}</span>
    </div>
  )

  // ── SETUP SCREEN ────────────────────────────────────────────────────────
  if (!difficulty) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'var(--font-body)' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏳️</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '30px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px' }}>Flag Reveal</h1>
            <p style={{ margin: 0, color: '#8A8278', fontSize: '15px' }}>
              {locale === 'fr' ? 'Choisis ta difficulté' : 'Choose your difficulty'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                key: 'easy',
                icon: '🎓',
                label: locale === 'fr' ? 'Entraînement' : 'Training',
                desc: locale === 'fr'
                  ? 'Le drapeau du pays est affiché dans la liste de suggestions'
                  : 'The country flag is shown in the suggestion list',
                color: '#426A5A',
                bg: '#f0fdf4',
                border: '#86efac',
              },
              {
                key: 'normal',
                icon: '💪',
                label: locale === 'fr' ? 'Normal' : 'Normal',
                desc: locale === 'fr'
                  ? 'Seul le nom du pays apparaît — pas de drapeau dans les suggestions'
                  : 'Only the country name appears — no flag in suggestions',
                color: '#0B1F3B',
                bg: '#f8f5ed',
                border: '#E2DDD5',
              },
            ].map(d => (
              <button key={d.key} onClick={() => setDifficulty(d.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderRadius: '14px', border: `2px solid ${d.border}`, backgroundColor: d.bg, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <span style={{ fontSize: '32px', flexShrink: 0 }}>{d.icon}</span>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: d.color, marginBottom: '4px' }}>{d.label}</div>
                  <div style={{ fontSize: '13px', color: '#8A8278', lineHeight: 1.5 }}>{d.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '20px', color: d.border, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    // ── MOBILE: Full-screen app layout ─────────────────────────────────────
    return (
      <div style={{ backgroundColor: '#0B1F3B', height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', overflow: 'hidden', position: 'relative' }}>

        {/* Top HUD bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', flexShrink: 0, gap: '8px' }}>
          {/* Lives */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : 'rgba(255,255,255,0.2)'}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ))}
          </div>
          {/* Center: timer */}
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>⏱ {formatTime(elapsed)}</span>
          {/* Score — only in Normal mode */}
          {difficulty !== 'easy' ? (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#4ade80' }}>{score.toLocaleString()} pts</span>
              </div>
              {lastPts && (
                <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '13px', fontWeight: '900', color: '#4ade80', animation: 'floatUp 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                  +{lastPts} pts
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              🎓 {locale === 'fr' ? 'Entraînement' : 'Training'}
            </span>
          )}
        </div>

        {/* Streak bar */}
        {streak > 0 && (
          <div style={{ textAlign: 'center', paddingBottom: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#FEB12F', backgroundColor: 'rgba(254,177,47,0.15)', borderRadius: '99px', padding: '3px 12px' }}>
              🔥 {streak} {locale === 'fr' ? 'série' : 'streak'} ×{STREAK_MULTIPLIER(streak)}
            </span>
          </div>
        )}

        {/* Flag — fills remaining space */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', margin: '0 14px' }}>
          {canvasBlock}
        </div>

        {/* Bottom panel */}
        <div style={{ flexShrink: 0, backgroundColor: '#F4F1E6', borderRadius: '20px 20px 0 0', padding: '16px 14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Input */}
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={gameState === 'playing' ? t('placeholder') : ''}
              disabled={gameState !== 'playing'}
              autoComplete="off"
              style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '2px solid #E2DDD5', backgroundColor: gameState === 'playing' ? 'white' : '#e2e8f0', color: '#0B1F3B', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
            />
            {suggestions.length > 0 && gameState === 'playing' && (
              <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2DDD5', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 20, marginBottom: '4px' }}>
                {suggestions.map((f, i) => (
                  <button key={f.code}
                    onMouseDown={e => { e.preventDefault(); handleGuess(f) }}
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', backgroundColor: i === activeIdx ? '#dbeafe' : 'transparent', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '15px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {difficulty === 'easy' && (
                      <img src={'https://flagcdn.com/w40/' + f.code + '.png'} width="28" height="18" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                    )}
                    {getName(f)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guess history — horizontal compact chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {guesses.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 9px', borderRadius: '99px', backgroundColor: g.correct ? '#dcfce7' : '#fee2e2', border: '1px solid ' + (g.correct ? '#86efac' : '#fca5a5') }}>
                <img src={'https://flagcdn.com/w40/' + g.code + '.png'} width="20" height="13" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: g.correct ? '#166534' : '#991b1b' }}>{g.similarity}%</span>
              </div>
            ))}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <div key={'e'+i} style={{ width: '42px', height: '30px', borderRadius: '99px', backgroundColor: '#E2DDD5' }} />
            ))}
          </div>

          {/* Action buttons */}
          {actionButton}
        </div>

      </div>
    )
  }

  // ── DESKTOP layout ──────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0B1F3B', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>
              🏳️ {t('title')}
            </h1>
            <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '99px', backgroundColor: difficulty === 'easy' ? 'rgba(74,222,128,0.15)' : 'rgba(254,177,47,0.15)', color: difficulty === 'easy' ? '#4ade80' : '#FEB12F', border: `1px solid ${difficulty === 'easy' ? 'rgba(74,222,128,0.3)' : 'rgba(254,177,47,0.3)'}` }}>
              {difficulty === 'easy' ? (locale === 'fr' ? '🎓 Entraînement' : '🎓 Training') : (locale === 'fr' ? '💪 Normal' : '💪 Normal')}
            </span>
          </div>
          {/* HUD pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Lives */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{locale === 'fr' ? 'Vies' : 'Lives'}</div>
              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < lives ? '#ef4444' : 'rgba(255,255,255,0.15)'}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ))}
              </div>
            </div>
            {/* Timer */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Time</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: 'white', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</div>
            </div>
            {/* Streak */}
            <div style={{ backgroundColor: streak > 0 ? 'rgba(254,177,47,0.15)' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: streak > 0 ? '1px solid rgba(254,177,47,0.3)' : 'none' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: streak > 0 ? 'rgba(254,177,47,0.7)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Streak</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : 'rgba(255,255,255,0.3)' }}>🔥 {streak}</div>
            </div>
            {/* Score — only in Normal mode */}
            {difficulty !== 'easy' && (
              <div style={{ position: 'relative', backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.25)' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', whiteSpace: 'nowrap' }}>{score.toLocaleString()} pts</div>
                {lastPts && (
                  <span style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '14px', fontWeight: '900', color: '#4ade80', animation: 'floatUp 1.5s ease-out forwards', whiteSpace: 'nowrap', pointerEvents: 'none', backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: '99px', padding: '2px 8px' }}>
                    +{lastPts} pts
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main content: flag + sidebar */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* Left: flag */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {canvasBlock}
            {/* Action buttons below flag */}
            <div style={{ marginTop: '12px' }}>
              {actionButton}
            </div>
            {/* Leaderboard / stats */}
            <div style={{ marginTop: '16px' }}>
              {statsBlock}
            </div>
          </div>

          {/* Right sidebar: dark card */}
          <div style={{ width: '300px', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Input */}
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={gameState === 'playing' ? t('placeholder') : ''}
                disabled={gameState !== 'playing'}
                autoComplete="off"
                style={{ width: '100%', padding: '13px 16px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.15)', backgroundColor: gameState === 'playing' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)', color: '#0B1F3B', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
              {suggestions.length > 0 && gameState === 'playing' && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2DDD5', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 20, marginTop: '4px' }}>
                  {suggestions.map((f, i) => (
                    <button key={f.code}
                      onMouseDown={e => { e.preventDefault(); handleGuess(f) }}
                      style={{ width: '100%', padding: '11px 14px', textAlign: 'left', backgroundColor: i === activeIdx ? '#dbeafe' : 'transparent', border: 'none', borderBottom: '1px solid #f0f0f0', fontSize: '14px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {difficulty === 'easy' && (
                        <img src={'https://flagcdn.com/w40/' + f.code + '.png'} width="28" height="18" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                      )}
                      {getName(f)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Guess history */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {guesses.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', backgroundColor: g.correct ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.12)', border: '1px solid ' + (g.correct ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)') }}>
                  <img src={'https://flagcdn.com/w40/' + g.code + '.png'} width="30" height="20" style={{ borderRadius: '3px', objectFit: 'cover', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(g)}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: g.correct ? '#4ade80' : '#f87171' }}>{g.similarity}%</span>
                </div>
              ))}
              {Array.from({ length: emptyRows }).map((_, i) => (
                <div key={'e'+i} style={{ padding: '9px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', height: '42px' }} />
              ))}
            </div>

            {/* How to play */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setHowToPlayOpen(!howToPlayOpen)}
                style={{ width: '100%', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {t('howToPlay')}
                <span style={{ fontSize: '10px', transform: howToPlayOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block', opacity: 0.6 }}>▼</span>
              </button>
              {howToPlayOpen && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[['🏳️', t('rules.1')], ['🔍', t('rules.2')], ['🔥', t('rules.3')], ['❤️', t('rules.4')]].map(([icon, text], i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span>{icon}</span>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}