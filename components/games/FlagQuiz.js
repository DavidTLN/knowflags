'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'

// ─── Data ────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'af', en: 'Afghanistan',              fr: 'Afghanistan',              region: 'Asia' },
  { code: 'al', en: 'Albania',                  fr: 'Albanie',                  region: 'Europe' },
  { code: 'dz', en: 'Algeria',                  fr: 'Algérie',                  region: 'Africa' },
  { code: 'ad', en: 'Andorra',                  fr: 'Andorre',                  region: 'Europe' },
  { code: 'ao', en: 'Angola',                   fr: 'Angola',                   region: 'Africa' },
  { code: 'ag', en: 'Antigua and Barbuda',      fr: 'Antigua-et-Barbuda',       region: 'Americas' },
  { code: 'ar', en: 'Argentina',                fr: 'Argentine',                region: 'Americas' },
  { code: 'am', en: 'Armenia',                  fr: 'Arménie',                  region: 'Asia' },
  { code: 'au', en: 'Australia',                fr: 'Australie',                region: 'Oceania' },
  { code: 'at', en: 'Austria',                  fr: 'Autriche',                 region: 'Europe' },
  { code: 'az', en: 'Azerbaijan',               fr: 'Azerbaïdjan',              region: 'Asia' },
  { code: 'bs', en: 'Bahamas',                  fr: 'Bahamas',                  region: 'Americas' },
  { code: 'bh', en: 'Bahrain',                  fr: 'Bahreïn',                  region: 'Asia' },
  { code: 'bd', en: 'Bangladesh',               fr: 'Bangladesh',               region: 'Asia' },
  { code: 'bb', en: 'Barbados',                 fr: 'Barbade',                  region: 'Americas' },
  { code: 'by', en: 'Belarus',                  fr: 'Biélorussie',              region: 'Europe' },
  { code: 'be', en: 'Belgium',                  fr: 'Belgique',                 region: 'Europe' },
  { code: 'bz', en: 'Belize',                   fr: 'Belize',                   region: 'Americas' },
  { code: 'bj', en: 'Benin',                    fr: 'Bénin',                    region: 'Africa' },
  { code: 'bt', en: 'Bhutan',                   fr: 'Bhoutan',                  region: 'Asia' },
  { code: 'bo', en: 'Bolivia',                  fr: 'Bolivie',                  region: 'Americas' },
  { code: 'ba', en: 'Bosnia and Herzegovina',   fr: 'Bosnie-Herzégovine',       region: 'Europe' },
  { code: 'bw', en: 'Botswana',                 fr: 'Botswana',                 region: 'Africa' },
  { code: 'br', en: 'Brazil',                   fr: 'Brésil',                   region: 'Americas' },
  { code: 'bn', en: 'Brunei',                   fr: 'Brunéi',                   region: 'Asia' },
  { code: 'bg', en: 'Bulgaria',                 fr: 'Bulgarie',                 region: 'Europe' },
  { code: 'bf', en: 'Burkina Faso',             fr: 'Burkina Faso',             region: 'Africa' },
  { code: 'bi', en: 'Burundi',                  fr: 'Burundi',                  region: 'Africa' },
  { code: 'kh', en: 'Cambodia',                 fr: 'Cambodge',                 region: 'Asia' },
  { code: 'cm', en: 'Cameroon',                 fr: 'Cameroun',                 region: 'Africa' },
  { code: 'ca', en: 'Canada',                   fr: 'Canada',                   region: 'Americas' },
  { code: 'cv', en: 'Cape Verde',               fr: 'Cap-Vert',                 region: 'Africa' },
  { code: 'cf', en: 'Central African Republic', fr: 'République centrafricaine',region: 'Africa' },
  { code: 'td', en: 'Chad',                     fr: 'Tchad',                    region: 'Africa' },
  { code: 'cl', en: 'Chile',                    fr: 'Chili',                    region: 'Americas' },
  { code: 'cn', en: 'China',                    fr: 'Chine',                    region: 'Asia' },
  { code: 'co', en: 'Colombia',                 fr: 'Colombie',                 region: 'Americas' },
  { code: 'km', en: 'Comoros',                  fr: 'Comores',                  region: 'Africa' },
  { code: 'cg', en: 'Congo',                    fr: 'Congo',                    region: 'Africa' },
  { code: 'cr', en: 'Costa Rica',               fr: 'Costa Rica',               region: 'Americas' },
  { code: 'hr', en: 'Croatia',                  fr: 'Croatie',                  region: 'Europe' },
  { code: 'cu', en: 'Cuba',                     fr: 'Cuba',                     region: 'Americas' },
  { code: 'cy', en: 'Cyprus',                   fr: 'Chypre',                   region: 'Europe' },
  { code: 'cz', en: 'Czech Republic',           fr: 'République tchèque',       region: 'Europe' },
  { code: 'dk', en: 'Denmark',                  fr: 'Danemark',                 region: 'Europe' },
  { code: 'dj', en: 'Djibouti',                 fr: 'Djibouti',                 region: 'Africa' },
  { code: 'dm', en: 'Dominica',                 fr: 'Dominique',                region: 'Americas' },
  { code: 'do', en: 'Dominican Republic',       fr: 'République dominicaine',   region: 'Americas' },
  { code: 'cd', en: 'DR Congo',                 fr: 'RD Congo',                 region: 'Africa' },
  { code: 'ec', en: 'Ecuador',                  fr: 'Équateur',                 region: 'Americas' },
  { code: 'eg', en: 'Egypt',                    fr: 'Égypte',                   region: 'Africa' },
  { code: 'sv', en: 'El Salvador',              fr: 'Salvador',                 region: 'Americas' },
  { code: 'gq', en: 'Equatorial Guinea',        fr: 'Guinée équatoriale',       region: 'Africa' },
  { code: 'er', en: 'Eritrea',                  fr: 'Érythrée',                 region: 'Africa' },
  { code: 'ee', en: 'Estonia',                  fr: 'Estonie',                  region: 'Europe' },
  { code: 'sz', en: 'Eswatini',                 fr: 'Eswatini',                 region: 'Africa' },
  { code: 'et', en: 'Ethiopia',                 fr: 'Éthiopie',                 region: 'Africa' },
  { code: 'fj', en: 'Fiji',                     fr: 'Fidji',                    region: 'Oceania' },
  { code: 'fi', en: 'Finland',                  fr: 'Finlande',                 region: 'Europe' },
  { code: 'fr', en: 'France',                   fr: 'France',                   region: 'Europe' },
  { code: 'ga', en: 'Gabon',                    fr: 'Gabon',                    region: 'Africa' },
  { code: 'gm', en: 'Gambia',                   fr: 'Gambie',                   region: 'Africa' },
  { code: 'ge', en: 'Georgia',                  fr: 'Géorgie',                  region: 'Asia' },
  { code: 'de', en: 'Germany',                  fr: 'Allemagne',                region: 'Europe' },
  { code: 'gh', en: 'Ghana',                    fr: 'Ghana',                    region: 'Africa' },
  { code: 'gr', en: 'Greece',                   fr: 'Grèce',                    region: 'Europe' },
  { code: 'gd', en: 'Grenada',                  fr: 'Grenade',                  region: 'Americas' },
  { code: 'gt', en: 'Guatemala',                fr: 'Guatemala',                region: 'Americas' },
  { code: 'gn', en: 'Guinea',                   fr: 'Guinée',                   region: 'Africa' },
  { code: 'gw', en: 'Guinea-Bissau',            fr: 'Guinée-Bissau',            region: 'Africa' },
  { code: 'gy', en: 'Guyana',                   fr: 'Guyana',                   region: 'Americas' },
  { code: 'ht', en: 'Haiti',                    fr: 'Haïti',                    region: 'Americas' },
  { code: 'hn', en: 'Honduras',                 fr: 'Honduras',                 region: 'Americas' },
  { code: 'hu', en: 'Hungary',                  fr: 'Hongrie',                  region: 'Europe' },
  { code: 'is', en: 'Iceland',                  fr: 'Islande',                  region: 'Europe' },
  { code: 'in', en: 'India',                    fr: 'Inde',                     region: 'Asia' },
  { code: 'id', en: 'Indonesia',                fr: 'Indonésie',                region: 'Asia' },
  { code: 'ir', en: 'Iran',                     fr: 'Iran',                     region: 'Asia' },
  { code: 'iq', en: 'Iraq',                     fr: 'Irak',                     region: 'Asia' },
  { code: 'ie', en: 'Ireland',                  fr: 'Irlande',                  region: 'Europe' },
  { code: 'il', en: 'Israel',                   fr: 'Israël',                   region: 'Asia' },
  { code: 'it', en: 'Italy',                    fr: 'Italie',                   region: 'Europe' },
  { code: 'ci', en: 'Ivory Coast',              fr: "Côte d'Ivoire",            region: 'Africa' },
  { code: 'jm', en: 'Jamaica',                  fr: 'Jamaïque',                 region: 'Americas' },
  { code: 'jp', en: 'Japan',                    fr: 'Japon',                    region: 'Asia' },
  { code: 'jo', en: 'Jordan',                   fr: 'Jordanie',                 region: 'Asia' },
  { code: 'kz', en: 'Kazakhstan',               fr: 'Kazakhstan',               region: 'Asia' },
  { code: 'ke', en: 'Kenya',                    fr: 'Kenya',                    region: 'Africa' },
  { code: 'ki', en: 'Kiribati',                 fr: 'Kiribati',                 region: 'Oceania' },
  { code: 'kw', en: 'Kuwait',                   fr: 'Koweït',                   region: 'Asia' },
  { code: 'kg', en: 'Kyrgyzstan',               fr: 'Kirghizistan',             region: 'Asia' },
  { code: 'la', en: 'Laos',                     fr: 'Laos',                     region: 'Asia' },
  { code: 'lv', en: 'Latvia',                   fr: 'Lettonie',                 region: 'Europe' },
  { code: 'lb', en: 'Lebanon',                  fr: 'Liban',                    region: 'Asia' },
  { code: 'ls', en: 'Lesotho',                  fr: 'Lesotho',                  region: 'Africa' },
  { code: 'lr', en: 'Liberia',                  fr: 'Libéria',                  region: 'Africa' },
  { code: 'ly', en: 'Libya',                    fr: 'Libye',                    region: 'Africa' },
  { code: 'li', en: 'Liechtenstein',            fr: 'Liechtenstein',            region: 'Europe' },
  { code: 'lt', en: 'Lithuania',                fr: 'Lituanie',                 region: 'Europe' },
  { code: 'lu', en: 'Luxembourg',               fr: 'Luxembourg',               region: 'Europe' },
  { code: 'mg', en: 'Madagascar',               fr: 'Madagascar',               region: 'Africa' },
  { code: 'mw', en: 'Malawi',                   fr: 'Malawi',                   region: 'Africa' },
  { code: 'my', en: 'Malaysia',                 fr: 'Malaisie',                 region: 'Asia' },
  { code: 'mv', en: 'Maldives',                 fr: 'Maldives',                 region: 'Asia' },
  { code: 'ml', en: 'Mali',                     fr: 'Mali',                     region: 'Africa' },
  { code: 'mt', en: 'Malta',                    fr: 'Malte',                    region: 'Europe' },
  { code: 'mh', en: 'Marshall Islands',         fr: 'Îles Marshall',            region: 'Oceania' },
  { code: 'mr', en: 'Mauritania',               fr: 'Mauritanie',               region: 'Africa' },
  { code: 'mu', en: 'Mauritius',                fr: 'Maurice',                  region: 'Africa' },
  { code: 'mx', en: 'Mexico',                   fr: 'Mexique',                  region: 'Americas' },
  { code: 'fm', en: 'Micronesia',               fr: 'Micronésie',               region: 'Oceania' },
  { code: 'md', en: 'Moldova',                  fr: 'Moldavie',                 region: 'Europe' },
  { code: 'mc', en: 'Monaco',                   fr: 'Monaco',                   region: 'Europe' },
  { code: 'mn', en: 'Mongolia',                 fr: 'Mongolie',                 region: 'Asia' },
  { code: 'me', en: 'Montenegro',               fr: 'Monténégro',               region: 'Europe' },
  { code: 'ma', en: 'Morocco',                  fr: 'Maroc',                    region: 'Africa' },
  { code: 'mz', en: 'Mozambique',               fr: 'Mozambique',               region: 'Africa' },
  { code: 'mm', en: 'Myanmar',                  fr: 'Myanmar',                  region: 'Asia' },
  { code: 'na', en: 'Namibia',                  fr: 'Namibie',                  region: 'Africa' },
  { code: 'nr', en: 'Nauru',                    fr: 'Nauru',                    region: 'Oceania' },
  { code: 'np', en: 'Nepal',                    fr: 'Népal',                    region: 'Asia' },
  { code: 'nl', en: 'Netherlands',              fr: 'Pays-Bas',                 region: 'Europe' },
  { code: 'nz', en: 'New Zealand',              fr: 'Nouvelle-Zélande',         region: 'Oceania' },
  { code: 'ni', en: 'Nicaragua',                fr: 'Nicaragua',                region: 'Americas' },
  { code: 'ne', en: 'Niger',                    fr: 'Niger',                    region: 'Africa' },
  { code: 'ng', en: 'Nigeria',                  fr: 'Nigeria',                  region: 'Africa' },
  { code: 'kp', en: 'North Korea',              fr: 'Corée du Nord',            region: 'Asia' },
  { code: 'mk', en: 'North Macedonia',          fr: 'Macédoine du Nord',        region: 'Europe' },
  { code: 'no', en: 'Norway',                   fr: 'Norvège',                  region: 'Europe' },
  { code: 'om', en: 'Oman',                     fr: 'Oman',                     region: 'Asia' },
  { code: 'pk', en: 'Pakistan',                 fr: 'Pakistan',                 region: 'Asia' },
  { code: 'pw', en: 'Palau',                    fr: 'Palaos',                   region: 'Oceania' },
  { code: 'pa', en: 'Panama',                   fr: 'Panama',                   region: 'Americas' },
  { code: 'pg', en: 'Papua New Guinea',         fr: 'Papouasie-Nouvelle-Guinée',region: 'Oceania' },
  { code: 'py', en: 'Paraguay',                 fr: 'Paraguay',                 region: 'Americas' },
  { code: 'pe', en: 'Peru',                     fr: 'Pérou',                    region: 'Americas' },
  { code: 'ph', en: 'Philippines',              fr: 'Philippines',              region: 'Asia' },
  { code: 'pl', en: 'Poland',                   fr: 'Pologne',                  region: 'Europe' },
  { code: 'pt', en: 'Portugal',                 fr: 'Portugal',                 region: 'Europe' },
  { code: 'qa', en: 'Qatar',                    fr: 'Qatar',                    region: 'Asia' },
  { code: 'ro', en: 'Romania',                  fr: 'Roumanie',                 region: 'Europe' },
  { code: 'ru', en: 'Russia',                   fr: 'Russie',                   region: 'Europe' },
  { code: 'rw', en: 'Rwanda',                   fr: 'Rwanda',                   region: 'Africa' },
  { code: 'kn', en: 'Saint Kitts and Nevis',    fr: 'Saint-Kitts-et-Nevis',     region: 'Americas' },
  { code: 'lc', en: 'Saint Lucia',              fr: 'Sainte-Lucie',             region: 'Americas' },
  { code: 'vc', en: 'Saint Vincent',            fr: 'Saint-Vincent',            region: 'Americas' },
  { code: 'ws', en: 'Samoa',                    fr: 'Samoa',                    region: 'Oceania' },
  { code: 'sm', en: 'San Marino',               fr: 'Saint-Marin',              region: 'Europe' },
  { code: 'st', en: 'São Tomé and Príncipe',    fr: 'Sao Tomé-et-Principe',     region: 'Africa' },
  { code: 'sa', en: 'Saudi Arabia',             fr: 'Arabie saoudite',          region: 'Asia' },
  { code: 'sn', en: 'Senegal',                  fr: 'Sénégal',                  region: 'Africa' },
  { code: 'rs', en: 'Serbia',                   fr: 'Serbie',                   region: 'Europe' },
  { code: 'sc', en: 'Seychelles',               fr: 'Seychelles',               region: 'Africa' },
  { code: 'sl', en: 'Sierra Leone',             fr: 'Sierra Leone',             region: 'Africa' },
  { code: 'sg', en: 'Singapore',                fr: 'Singapour',                region: 'Asia' },
  { code: 'sk', en: 'Slovakia',                 fr: 'Slovaquie',                region: 'Europe' },
  { code: 'si', en: 'Slovenia',                 fr: 'Slovénie',                 region: 'Europe' },
  { code: 'sb', en: 'Solomon Islands',          fr: 'Îles Salomon',             region: 'Oceania' },
  { code: 'so', en: 'Somalia',                  fr: 'Somalie',                  region: 'Africa' },
  { code: 'za', en: 'South Africa',             fr: 'Afrique du Sud',           region: 'Africa' },
  { code: 'ss', en: 'South Sudan',              fr: 'Soudan du Sud',            region: 'Africa' },
  { code: 'es', en: 'Spain',                    fr: 'Espagne',                  region: 'Europe' },
  { code: 'lk', en: 'Sri Lanka',                fr: 'Sri Lanka',                region: 'Asia' },
  { code: 'sd', en: 'Sudan',                    fr: 'Soudan',                   region: 'Africa' },
  { code: 'sr', en: 'Suriname',                 fr: 'Suriname',                 region: 'Americas' },
  { code: 'se', en: 'Sweden',                   fr: 'Suède',                    region: 'Europe' },
  { code: 'ch', en: 'Switzerland',              fr: 'Suisse',                   region: 'Europe' },
  { code: 'sy', en: 'Syria',                    fr: 'Syrie',                    region: 'Asia' },
  { code: 'tw', en: 'Taiwan',                   fr: 'Taïwan',                   region: 'Asia' },
  { code: 'tj', en: 'Tajikistan',               fr: 'Tadjikistan',              region: 'Asia' },
  { code: 'tz', en: 'Tanzania',                 fr: 'Tanzanie',                 region: 'Africa' },
  { code: 'th', en: 'Thailand',                 fr: 'Thaïlande',                region: 'Asia' },
  { code: 'tl', en: 'Timor-Leste',              fr: 'Timor oriental',           region: 'Asia' },
  { code: 'tg', en: 'Togo',                     fr: 'Togo',                     region: 'Africa' },
  { code: 'to', en: 'Tonga',                    fr: 'Tonga',                    region: 'Oceania' },
  { code: 'tt', en: 'Trinidad and Tobago',      fr: 'Trinité-et-Tobago',        region: 'Americas' },
  { code: 'tn', en: 'Tunisia',                  fr: 'Tunisie',                  region: 'Africa' },
  { code: 'tr', en: 'Turkey',                   fr: 'Turquie',                  region: 'Europe' },
  { code: 'tm', en: 'Turkmenistan',             fr: 'Turkménistan',             region: 'Asia' },
  { code: 'tv', en: 'Tuvalu',                   fr: 'Tuvalu',                   region: 'Oceania' },
  { code: 'ug', en: 'Uganda',                   fr: 'Ouganda',                  region: 'Africa' },
  { code: 'ua', en: 'Ukraine',                  fr: 'Ukraine',                  region: 'Europe' },
  { code: 'ae', en: 'United Arab Emirates',     fr: 'Émirats arabes unis',      region: 'Asia' },
  { code: 'gb', en: 'United Kingdom',           fr: 'Royaume-Uni',              region: 'Europe' },
  { code: 'us', en: 'United States',            fr: 'États-Unis',               region: 'Americas' },
  { code: 'uy', en: 'Uruguay',                  fr: 'Uruguay',                  region: 'Americas' },
  { code: 'uz', en: 'Uzbekistan',               fr: 'Ouzbékistan',              region: 'Asia' },
  { code: 'vu', en: 'Vanuatu',                  fr: 'Vanuatu',                  region: 'Oceania' },
  { code: 'va', en: 'Vatican City',             fr: 'Vatican',                  region: 'Europe' },
  { code: 've', en: 'Venezuela',                fr: 'Venezuela',                region: 'Americas' },
  { code: 'vn', en: 'Vietnam',                  fr: 'Vietnam',                  region: 'Asia' },
  { code: 'ye', en: 'Yemen',                    fr: 'Yémen',                    region: 'Asia' },
  { code: 'zm', en: 'Zambia',                   fr: 'Zambie',                   region: 'Africa' },
  { code: 'zw', en: 'Zimbabwe',                 fr: 'Zimbabwe',                 region: 'Africa' },
]

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }
const MAX_LIVES = 3
const TIMER_SECONDS = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestion(pool, mode) {
  const shuffled = shuffle(pool)
  const correct = shuffled[0]
  const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
  const options = shuffle([correct, ...distractors])
  return { correct, options, mode }
}

const SCREEN = { SETUP: 'setup', PLAYING: 'playing', GAME_OVER: 'gameover' }

export default function FlagQuiz() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [screen, setScreen] = useState(SCREEN.SETUP)
  const [mode, setMode] = useState('name')
  const [regionFilter, setRegionFilter] = useState([])
  const [isMobile, setIsMobile] = useState(true)

  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [question, setQuestion] = useState(null)
  const [answered, setAnswered] = useState(null)
  const [history, setHistory] = useState([])
  const [timer, setTimer] = useState(TIMER_SECONDS)
  const [availableH, setAvailableH] = useState(600)
  const timerRef = useRef(null)
  const livesRef = useRef(MAX_LIVES)
  const streakRef = useRef(0)

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 640)
      const header = document.querySelector('header, nav[data-header], [data-site-header]')
      const headerH = header ? header.offsetHeight : 60
      setAvailableH(window.innerHeight - headerH)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  const getPool = useCallback(() => {
    const base = regionFilter.length > 0 ? COUNTRIES.filter(c => regionFilter.includes(c.region)) : COUNTRIES
    return base.length >= 4 ? base : COUNTRIES
  }, [regionFilter])

  const pickMode = useCallback(() => {
    if (mode === 'both') return Math.random() > 0.5 ? 'name' : 'flag'
    return mode
  }, [mode])

  const makeNextQuestion = useCallback(() => {
    const pool = getPool()
    const q = buildQuestion(pool, pickMode())
    setQuestion(q)
    setAnswered(null)
    setTimer(TIMER_SECONDS)
  }, [getPool, pickMode])

  function startGame() {
    livesRef.current = MAX_LIVES
    streakRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setBestStreak(0)
    setHistory([])
    setScreen(SCREEN.PLAYING)
    const pool = getPool()
    const q = buildQuestion(pool, pickMode())
    setQuestion(q)
    setAnswered(null)
    setTimer(TIMER_SECONDS)
  }

  // Timer
  useEffect(() => {
    if (screen !== SCREEN.PLAYING || answered !== null || !question) return
    if (timer <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timer, screen, answered, question])

  function handleAnswer(selected) {
    clearTimeout(timerRef.current)
    const isCorrect = selected && selected.code === question.correct.code

    setAnswered({ selected, correct: question.correct })
    setHistory(prev => [...prev, { question, selected, isCorrect }])

    if (isCorrect) {
      const ns = streakRef.current + 1
      streakRef.current = ns
      setStreak(ns)
      setBestStreak(prev => Math.max(prev, ns))
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setTimeout(() => setScreen(SCREEN.GAME_OVER), 1400)
        return
      }
    }
    setTimeout(() => makeNextQuestion(), isCorrect ? 800 : 1400)
  }

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (screen === SCREEN.SETUP) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body)", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🎯</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: '900', color: '#0B1F3B', letterSpacing: '-1px' }}>
              {t('Flag Quiz', 'Quiz Drapeaux')}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
              {t('3 lives · infinite questions · beat your streak', '3 vies · questions infinies · bats ton record')}
            </p>
          </div>

          {/* Mode */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Game mode', 'Mode de jeu')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'name', icon: '🏳️', label: t('Flag → Country', 'Drapeau → Pays'), desc: t('See a flag, find the country', 'Voir un drapeau, trouver le pays') },
                { key: 'flag', icon: '🗺️', label: t('Country → Flag', 'Pays → Drapeau'), desc: t('See a country name, find the flag', 'Voir un pays, trouver le drapeau') },
                { key: 'both', icon: '🔀', label: t('Mixed', 'Mixte'), desc: t('Both modes alternating randomly', 'Les deux modes en alternance') },
              ].map(m => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: mode === m.key ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: mode === m.key ? '#0B1F3B' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: mode === m.key ? 'white' : '#0B1F3B' }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: mode === m.key ? 'rgba(255,255,255,0.6)' : '#94a3b8', marginTop: '1px' }}>{m.desc}</div>
                  </div>
                  {mode === m.key && (
                    <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#9EB7E5"/>
                      <polyline points="3.5,8 6.5,11 12.5,5" stroke="#0B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('Region', 'Région')}
              </p>
              {regionFilter.length > 0 && (
                <button onClick={() => setRegionFilter([])} style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                  {t('All', 'Tout')}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {REGIONS.map(r => {
                const active = regionFilter.includes(r)
                return (
                  <button key={r} onClick={() => setRegionFilter(prev => active ? prev.filter(x => x !== r) : [...prev, r])}
                    style={{ padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                    {t(r, REGION_LABELS[r])}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={startGame}
            style={{ width: '100%', padding: '16px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Start Quiz', 'Lancer le quiz')} →
          </button>
        </div>
      </div>
    )
  }

  // ─── PLAYING SCREEN ────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING && question) {
    const { correct, options, mode: qMode } = question
    const isAnswered = answered !== null
    const timerPct = (timer / TIMER_SECONDS) * 100
    const timerColor = timer > 6 ? '#426A5A' : timer > 3 ? '#806D40' : '#dc2626'
    const isCorrectAnswer = answered?.selected?.code === correct.code

    return (
      <div style={{
        backgroundColor: '#F4F1E6',
        height: availableH + 'px',
        maxHeight: availableH + 'px',
        overflow: 'hidden',
        fontFamily: "var(--font-body)",
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '520px',
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '12px 14px 14px' : '24px 32px 24px',
          minHeight: 0,
          boxSizing: 'border-box',
        }}>

          {/* ── Top bar: lives + streak + timer count ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: isMobile ? '8px' : '12px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginRight: '2px' }}>{t('lives', 'vies')}</span>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 24 24"
                fill={i < lives ? '#ef4444' : '#e2e8f0'}
                stroke={i < lives ? '#ef4444' : '#e2e8f0'} strokeWidth="1">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '900', color: streak > 0 ? '#806D40' : '#cbd5e1' }}>
              🔥 {streak}
            </span>
          </div>

          {/* ── Timer bar ── */}
          <div style={{ height: '5px', backgroundColor: '#ddd9d0', borderRadius: '3px', overflow: 'hidden', marginBottom: isMobile ? '8px' : '12px', flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, transition: 'width 1s linear, background-color 0.3s', borderRadius: '3px' }} />
          </div>

          {/* ── Question label + timer count ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '8px' : '12px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {qMode === 'name' ? t('Which country?', 'Quel pays ?') : t('Which flag?', 'Quel drapeau ?')}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '900', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
              {timer}s
            </span>
          </div>

          {/* ── Stimulus ── */}
          <div style={{ flex: isMobile ? '0 0 auto' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, marginBottom: isMobile ? '12px' : '16px' }}>
            {qMode === 'name' ? (
              <div style={{ width: '100%', maxWidth: '360px', aspectRatio: '3/2', backgroundColor: '#e8e4d9', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', boxShadow: '0 6px 24px rgba(0,0,0,0.10)' }}>
                <img
                  src={`https://flagcdn.com/w640/${correct.code}.png`}
                  alt="?"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ backgroundColor: '#0B1F3B', borderRadius: '18px', padding: '22px 36px', boxShadow: '0 6px 24px rgba(11,31,59,0.20)' }}>
                <span style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                  {getName(correct)}
                </span>
              </div>
            )}
          </div>

          {/* ── Feedback banner ── */}
          {isAnswered && (
            <div style={{ marginBottom: isMobile ? '8px' : '12px', padding: '9px 14px', borderRadius: '10px', backgroundColor: isCorrectAnswer ? '#dcfce7' : '#fee2e2', textAlign: 'center', flexShrink: 0 }}>
              {answered.selected === null ? (
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#dc2626' }}>
                  ⏱ {t("Time's up!", 'Temps écoulé !')} — {getName(correct)}
                </span>
              ) : isCorrectAnswer ? (
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#15803d' }}>
                  ✓ {t('Correct!', 'Correct !')} {streak > 1 ? `🔥 ×${streak}` : ''}
                </span>
              ) : (
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#dc2626' }}>
                  ✗ {t('It was', "C'était")} {getName(correct)}
                </span>
              )}
            </div>
          )}

          {/* ── Options — anchored at bottom, never scroll ── */}
          {qMode === 'name' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '7px' : '8px', flexShrink: 0 }}>
              {options.map((opt, idx) => {
                const isCorrectOpt = opt.code === correct.code
                const isSelected = answered?.selected?.code === opt.code
                let bg = 'white', borderColor = '#ddd9d0', color = '#0B1F3B', opacity = 1
                if (isAnswered) {
                  if (isCorrectOpt) { bg = '#dcfce7'; borderColor = '#16a34a'; color = '#15803d' }
                  else if (isSelected) { bg = '#fee2e2'; borderColor = '#dc2626'; color = '#dc2626' }
                  else { opacity = 0.38 }
                }
                return (
                  <button key={opt.code}
                    onClick={() => !isAnswered && handleAnswer(opt)}
                    disabled={isAnswered}
                    style={{
                      padding: '13px 14px',
                      borderRadius: '12px',
                      border: `2px solid ${borderColor}`,
                      backgroundColor: bg,
                      color,
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: isAnswered ? 'default' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      opacity,
                      transition: 'all 0.10s',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      userSelect: 'none',
                    }}>
                    {/* A B C D badge */}
                    <span style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '900',
                      backgroundColor: isAnswered && isCorrectOpt ? '#16a34a' : isAnswered && isSelected ? '#dc2626' : '#0B1F3B',
                      color: 'white',
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ flex: 1 }}>{getName(opt)}</span>
                    {isAnswered && isCorrectOpt && <span style={{ fontSize: '15px' }}>✓</span>}
                    {isAnswered && isSelected && !isCorrectOpt && <span style={{ fontSize: '15px' }}>✗</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
              {options.map(opt => {
                const isCorrectOpt = opt.code === correct.code
                const isSelected = answered?.selected?.code === opt.code
                let borderColor = '#ddd9d0', borderWidth = '2px', overlayBg = 'transparent'
                if (isAnswered) {
                  if (isCorrectOpt) { borderColor = '#16a34a'; borderWidth = '3px' }
                  else if (isSelected) { borderColor = '#dc2626'; borderWidth = '3px' }
                  else { overlayBg = 'rgba(244,241,230,0.65)' }
                }
                return (
                  <button key={opt.code}
                    onClick={() => !isAnswered && handleAnswer(opt)}
                    disabled={isAnswered}
                    style={{
                      position: 'relative', aspectRatio: '3/2', borderRadius: '12px',
                      border: `${borderWidth} solid ${borderColor}`, overflow: 'hidden',
                      cursor: isAnswered ? 'default' : 'pointer', padding: 0,
                      backgroundColor: '#e8e4d9', transition: 'all 0.10s',
                      WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
                    }}>
                    <img src={`https://flagcdn.com/w320/${opt.code}.png`} alt={getName(opt)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }} />
                    {isAnswered && overlayBg !== 'transparent' && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayBg }} />
                    )}
                    {/* Name label */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 7px', background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)', borderRadius: '0 0 10px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{getName(opt)}</span>
                    </div>
                    {isAnswered && (isCorrectOpt || isSelected) && (
                      <div style={{ position: 'absolute', top: '7px', right: '7px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: isCorrectOpt ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>{isCorrectOpt ? '✓' : '✗'}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

        </div>
      </div>
    )
  }

  // ─── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (screen === SCREEN.GAME_OVER) {
    const total = history.length
    const correct = history.filter(h => h.isCorrect).length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const wrong = history.filter(h => !h.isCorrect)

    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body)", padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '🎯' : '💪'}</div>
            <h2 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '900', color: '#0B1F3B' }}>
              {t('Game Over', 'Partie terminée')}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {total} {t('questions', 'questions')}
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: t('Correct', 'Corrects'), value: correct, color: '#426A5A', bg: '#f0fdf4' },
              { label: t('Best streak', 'Meilleure série'), value: `🔥 ${bestStreak}`, color: '#806D40', bg: '#fefce8' },
              { label: t('Score', 'Score'), value: `${pct}%`, color: '#0B1F3B', bg: 'white' },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: s.bg, borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Wrong answers */}
          {wrong.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('Missed', 'Manqués')} ({wrong.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wrong.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                    <img src={`https://flagcdn.com/w80/${h.question.correct.code}.png`} alt=""
                      style={{ width: '44px', height: '30px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#e8e4d9', flexShrink: 0, padding: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0B1F3B' }}>{getName(h.question.correct)}</div>
                      <div style={{ fontSize: '11px', color: h.selected ? '#dc2626' : '#f59e0b', marginTop: '1px' }}>
                        {h.selected ? `${t('You said:', 'Ta réponse :')} ${getName(h.selected)}` : `⏱ ${t('No answer', 'Temps écoulé')}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={startGame}
              style={{ width: '100%', padding: '15px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' }}>
              {t('Play Again', 'Rejouer')} 🔄
            </button>
            <button onClick={() => setScreen(SCREEN.SETUP)}
              style={{ width: '100%', padding: '13px', backgroundColor: 'white', color: '#0B1F3B', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              {t('Change settings', 'Modifier les réglages')}
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}