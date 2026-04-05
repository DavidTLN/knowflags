'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const COUNTRIES = [
  { id: 4,   code: 'af', en: 'Afghanistan',     fr: 'Afghanistan',        area: 652230   },
  { id: 8,   code: 'al', en: 'Albania',          fr: 'Albanie',            area: 28748    },
  { id: 12,  code: 'dz', en: 'Algeria',          fr: 'Algérie',            area: 2381741  },
  { id: 24,  code: 'ao', en: 'Angola',           fr: 'Angola',             area: 1246700  },
  { id: 32,  code: 'ar', en: 'Argentina',        fr: 'Argentine',          area: 2780400  },
  { id: 36,  code: 'au', en: 'Australia',        fr: 'Australie',          area: 7692024  },
  { id: 40,  code: 'at', en: 'Austria',          fr: 'Autriche',           area: 83871    },
  { id: 50,  code: 'bd', en: 'Bangladesh',       fr: 'Bangladesh',         area: 147570   },
  { id: 56,  code: 'be', en: 'Belgium',          fr: 'Belgique',           area: 30528    },
  { id: 64,  code: 'bt', en: 'Bhutan',           fr: 'Bhoutan',            area: 38394    },
  { id: 68,  code: 'bo', en: 'Bolivia',          fr: 'Bolivie',            area: 1098581  },
  { id: 76,  code: 'br', en: 'Brazil',           fr: 'Brésil',             area: 8515767  },
  { id: 96,  code: 'bn', en: 'Brunei',           fr: 'Brunei',             area: 5765     },
  { id: 100, code: 'bg', en: 'Bulgaria',         fr: 'Bulgarie',           area: 110879   },
  { id: 104, code: 'mm', en: 'Myanmar',          fr: 'Myanmar',            area: 676578   },
  { id: 116, code: 'kh', en: 'Cambodia',         fr: 'Cambodge',           area: 181035   },
  { id: 120, code: 'cm', en: 'Cameroon',         fr: 'Cameroun',           area: 475442   },
  { id: 124, code: 'ca', en: 'Canada',           fr: 'Canada',             area: 9984670  },
  { id: 144, code: 'lk', en: 'Sri Lanka',        fr: 'Sri Lanka',          area: 65610    },
  { id: 152, code: 'cl', en: 'Chile',            fr: 'Chili',              area: 756102   },
  { id: 156, code: 'cn', en: 'China',            fr: 'Chine',              area: 9596960  },
  { id: 170, code: 'co', en: 'Colombia',         fr: 'Colombie',           area: 1141748  },
  { id: 178, code: 'cg', en: 'Congo',            fr: 'Congo',              area: 342000   },
  { id: 180, code: 'cd', en: 'DR Congo',         fr: 'RD Congo',           area: 2344858  },
  { id: 188, code: 'cr', en: 'Costa Rica',       fr: 'Costa Rica',         area: 51100    },
  { id: 191, code: 'hr', en: 'Croatia',          fr: 'Croatie',            area: 56594    },
  { id: 192, code: 'cu', en: 'Cuba',             fr: 'Cuba',               area: 109884   },
  { id: 196, code: 'cy', en: 'Cyprus',           fr: 'Chypre',             area: 9251     },
  { id: 203, code: 'cz', en: 'Czechia',          fr: 'Tchéquie',           area: 78867    },
  { id: 204, code: 'bj', en: 'Benin',            fr: 'Bénin',              area: 114763   },
  { id: 208, code: 'dk', en: 'Denmark',          fr: 'Danemark',           area: 42924    },
  { id: 218, code: 'ec', en: 'Ecuador',          fr: 'Équateur',           area: 283561   },
  { id: 231, code: 'et', en: 'Ethiopia',         fr: 'Éthiopie',           area: 1104300  },
  { id: 232, code: 'er', en: 'Eritrea',          fr: 'Érythrée',           area: 117600   },
  { id: 233, code: 'ee', en: 'Estonia',          fr: 'Estonie',            area: 45228    },
  { id: 246, code: 'fi', en: 'Finland',          fr: 'Finlande',           area: 338145   },
  { id: 250, code: 'fr', en: 'France',           fr: 'France',             area: 551695   },
  { id: 266, code: 'ga', en: 'Gabon',            fr: 'Gabon',              area: 267668   },
  { id: 276, code: 'de', en: 'Germany',          fr: 'Allemagne',          area: 357114   },
  { id: 288, code: 'gh', en: 'Ghana',            fr: 'Ghana',              area: 238533   },
  { id: 300, code: 'gr', en: 'Greece',           fr: 'Grèce',              area: 131957   },
  { id: 320, code: 'gt', en: 'Guatemala',        fr: 'Guatemala',          area: 108889   },
  { id: 324, code: 'gn', en: 'Guinea',           fr: 'Guinée',             area: 245857   },
  { id: 332, code: 'ht', en: 'Haiti',            fr: 'Haïti',              area: 27750    },
  { id: 340, code: 'hn', en: 'Honduras',         fr: 'Honduras',           area: 112492   },
  { id: 348, code: 'hu', en: 'Hungary',          fr: 'Hongrie',            area: 93028    },
  { id: 356, code: 'in', en: 'India',            fr: 'Inde',               area: 3287263  },
  { id: 360, code: 'id', en: 'Indonesia',        fr: 'Indonésie',          area: 1904569  },
  { id: 364, code: 'ir', en: 'Iran',             fr: 'Iran',               area: 1648195  },
  { id: 368, code: 'iq', en: 'Iraq',             fr: 'Irak',               area: 438317   },
  { id: 372, code: 'ie', en: 'Ireland',          fr: 'Irlande',            area: 70273    },
  { id: 376, code: 'il', en: 'Israel',           fr: 'Israël',             area: 20770    },
  { id: 380, code: 'it', en: 'Italy',            fr: 'Italie',             area: 301340   },
  { id: 388, code: 'jm', en: 'Jamaica',          fr: 'Jamaïque',           area: 10991    },
  { id: 392, code: 'jp', en: 'Japan',            fr: 'Japon',              area: 377930   },
  { id: 398, code: 'kz', en: 'Kazakhstan',       fr: 'Kazakhstan',         area: 2724900  },
  { id: 400, code: 'jo', en: 'Jordan',           fr: 'Jordanie',           area: 89342    },
  { id: 404, code: 'ke', en: 'Kenya',            fr: 'Kenya',              area: 580367   },
  { id: 408, code: 'kp', en: 'North Korea',      fr: 'Corée du Nord',      area: 120538   },
  { id: 410, code: 'kr', en: 'South Korea',      fr: 'Corée du Sud',       area: 100210   },
  { id: 414, code: 'kw', en: 'Kuwait',           fr: 'Koweït',             area: 17818    },
  { id: 418, code: 'la', en: 'Laos',             fr: 'Laos',               area: 236800   },
  { id: 422, code: 'lb', en: 'Lebanon',          fr: 'Liban',              area: 10452    },
  { id: 426, code: 'ls', en: 'Lesotho',          fr: 'Lesotho',            area: 30355    },
  { id: 430, code: 'lr', en: 'Liberia',          fr: 'Liberia',            area: 111369   },
  { id: 434, code: 'ly', en: 'Libya',            fr: 'Libye',              area: 1759540  },
  { id: 440, code: 'lt', en: 'Lithuania',        fr: 'Lituanie',           area: 65300    },
  { id: 442, code: 'lu', en: 'Luxembourg',       fr: 'Luxembourg',         area: 2586     },
  { id: 450, code: 'mg', en: 'Madagascar',       fr: 'Madagascar',         area: 587041   },
  { id: 454, code: 'mw', en: 'Malawi',           fr: 'Malawi',             area: 118484   },
  { id: 458, code: 'my', en: 'Malaysia',         fr: 'Malaisie',           area: 329847   },
  { id: 462, code: 'mv', en: 'Maldives',         fr: 'Maldives',           area: 298      },
  { id: 466, code: 'ml', en: 'Mali',             fr: 'Mali',               area: 1240192  },
  { id: 478, code: 'mr', en: 'Mauritania',       fr: 'Mauritanie',         area: 1030700  },
  { id: 484, code: 'mx', en: 'Mexico',           fr: 'Mexique',            area: 1964375  },
  { id: 496, code: 'mn', en: 'Mongolia',         fr: 'Mongolie',           area: 1564110  },
  { id: 498, code: 'md', en: 'Moldova',          fr: 'Moldavie',           area: 33846    },
  { id: 504, code: 'ma', en: 'Morocco',          fr: 'Maroc',              area: 446550   },
  { id: 508, code: 'mz', en: 'Mozambique',       fr: 'Mozambique',         area: 801590   },
  { id: 516, code: 'na', en: 'Namibia',          fr: 'Namibie',            area: 824292   },
  { id: 524, code: 'np', en: 'Nepal',            fr: 'Népal',              area: 147181   },
  { id: 528, code: 'nl', en: 'Netherlands',      fr: 'Pays-Bas',           area: 41543    },
  { id: 554, code: 'nz', en: 'New Zealand',      fr: 'Nouvelle-Zélande',   area: 270467   },
  { id: 558, code: 'ni', en: 'Nicaragua',        fr: 'Nicaragua',          area: 130375   },
  { id: 562, code: 'ne', en: 'Niger',            fr: 'Niger',              area: 1267000  },
  { id: 566, code: 'ng', en: 'Nigeria',          fr: 'Nigéria',            area: 923768   },
  { id: 578, code: 'no', en: 'Norway',           fr: 'Norvège',            area: 385207   },
  { id: 586, code: 'pk', en: 'Pakistan',         fr: 'Pakistan',           area: 881913   },
  { id: 591, code: 'pa', en: 'Panama',           fr: 'Panama',             area: 75417    },
  { id: 598, code: 'pg', en: 'Papua New Guinea', fr: 'PNG',                area: 462840   },
  { id: 600, code: 'py', en: 'Paraguay',         fr: 'Paraguay',           area: 406752   },
  { id: 604, code: 'pe', en: 'Peru',             fr: 'Pérou',              area: 1285216  },
  { id: 608, code: 'ph', en: 'Philippines',      fr: 'Philippines',        area: 300000   },
  { id: 616, code: 'pl', en: 'Poland',           fr: 'Pologne',            area: 312696   },
  { id: 620, code: 'pt', en: 'Portugal',         fr: 'Portugal',           area: 92212    },
  { id: 634, code: 'qa', en: 'Qatar',            fr: 'Qatar',              area: 11586    },
  { id: 642, code: 'ro', en: 'Romania',          fr: 'Roumanie',           area: 238397   },
  { id: 643, code: 'ru', en: 'Russia',           fr: 'Russie',             area: 17098242 },
  { id: 646, code: 'rw', en: 'Rwanda',           fr: 'Rwanda',             area: 26338    },
  { id: 682, code: 'sa', en: 'Saudi Arabia',     fr: 'Arabie Saoudite',    area: 2149690  },
  { id: 686, code: 'sn', en: 'Senegal',          fr: 'Sénégal',            area: 196722   },
  { id: 694, code: 'sl', en: 'Sierra Leone',     fr: 'Sierra Leone',       area: 71740    },
  { id: 703, code: 'sk', en: 'Slovakia',         fr: 'Slovaquie',          area: 49035    },
  { id: 704, code: 'vn', en: 'Vietnam',          fr: 'Vietnam',            area: 331212   },
  { id: 706, code: 'so', en: 'Somalia',          fr: 'Somalie',            area: 637657   },
  { id: 710, code: 'za', en: 'South Africa',     fr: 'Afrique du Sud',     area: 1219090  },
  { id: 716, code: 'zw', en: 'Zimbabwe',         fr: 'Zimbabwe',           area: 390757   },
  { id: 724, code: 'es', en: 'Spain',            fr: 'Espagne',            area: 505990   },
  { id: 729, code: 'sd', en: 'Sudan',            fr: 'Soudan',             area: 1861484  },
  { id: 740, code: 'sr', en: 'Suriname',         fr: 'Suriname',           area: 163820   },
  { id: 752, code: 'se', en: 'Sweden',           fr: 'Suède',              area: 450295   },
  { id: 756, code: 'ch', en: 'Switzerland',      fr: 'Suisse',             area: 41285    },
  { id: 760, code: 'sy', en: 'Syria',            fr: 'Syrie',              area: 185180   },
  { id: 764, code: 'th', en: 'Thailand',         fr: 'Thaïlande',          area: 513120   },
  { id: 784, code: 'ae', en: 'UAE',              fr: 'Émirats arabes unis',area: 83600    },
  { id: 788, code: 'tn', en: 'Tunisia',          fr: 'Tunisie',            area: 163610   },
  { id: 792, code: 'tr', en: 'Turkey',           fr: 'Turquie',            area: 783562   },
  { id: 800, code: 'ug', en: 'Uganda',           fr: 'Ouganda',            area: 241550   },
  { id: 804, code: 'ua', en: 'Ukraine',          fr: 'Ukraine',            area: 603550   },
  { id: 818, code: 'eg', en: 'Egypt',            fr: 'Égypte',             area: 1002450  },
  { id: 826, code: 'gb', en: 'United Kingdom',   fr: 'Royaume-Uni',        area: 242495   },
  { id: 834, code: 'tz', en: 'Tanzania',         fr: 'Tanzanie',           area: 945087   },
  { id: 840, code: 'us', en: 'United States',    fr: 'États-Unis',         area: 9833517  },
  { id: 854, code: 'bf', en: 'Burkina Faso',     fr: 'Burkina Faso',       area: 274222   },
  { id: 858, code: 'uy', en: 'Uruguay',          fr: 'Uruguay',            area: 176215   },
  { id: 860, code: 'uz', en: 'Uzbekistan',       fr: 'Ouzbékistan',        area: 448978   },
  { id: 862, code: 've', en: 'Venezuela',        fr: 'Venezuela',          area: 912050   },
  { id: 887, code: 'ye', en: 'Yemen',            fr: 'Yémen',              area: 527968   },
  { id: 894, code: 'zm', en: 'Zambia',           fr: 'Zambie',             area: 752612   },
  { id: 20,  code: 'ad', en: 'Andorra',               fr: 'Andorre',                area: 468     },
  { id: 31,  code: 'az', en: 'Azerbaijan',            fr: 'Azerbaïdjan',            area: 86600   },
  { id: 48,  code: 'bh', en: 'Bahrain',               fr: 'Bahreïn',                area: 765     },
  { id: 51,  code: 'am', en: 'Armenia',               fr: 'Arménie',                area: 29743   },
  { id: 70,  code: 'ba', en: 'Bosnia & Herzegovina',  fr: 'Bosnie-Herzégovine',     area: 51197   },
  { id: 72,  code: 'bw', en: 'Botswana',              fr: 'Botswana',               area: 581730  },
  { id: 84,  code: 'bz', en: 'Belize',                fr: 'Belize',                 area: 22966   },
  { id: 90,  code: 'sb', en: 'Solomon Islands',       fr: 'Îles Salomon',           area: 28896   },
  { id: 108, code: 'bi', en: 'Burundi',               fr: 'Burundi',                area: 27834   },
  { id: 112, code: 'by', en: 'Belarus',               fr: 'Biélorussie',            area: 207600  },
  { id: 132, code: 'cv', en: 'Cabo Verde',            fr: 'Cap-Vert',               area: 4033    },
  { id: 140, code: 'cf', en: 'Central African Rep.',  fr: 'Rép. centrafricaine',    area: 622984  },
  { id: 148, code: 'td', en: 'Chad',                  fr: 'Tchad',                  area: 1284000 },
  { id: 158, code: 'tw', en: 'Taiwan',                fr: 'Taïwan',                 area: 36193   },
  { id: 174, code: 'km', en: 'Comoros',               fr: 'Comores',                area: 1862    },
  { id: 214, code: 'do', en: 'Dominican Republic',    fr: 'Rép. dominicaine',       area: 48671   },
  { id: 222, code: 'sv', en: 'El Salvador',           fr: 'Salvador',               area: 21041   },
  { id: 226, code: 'gq', en: 'Equatorial Guinea',     fr: 'Guinée équatoriale',     area: 28051   },
  { id: 242, code: 'fj', en: 'Fiji',                  fr: 'Fidji',                  area: 18274   },
  { id: 262, code: 'dj', en: 'Djibouti',              fr: 'Djibouti',               area: 23200   },
  { id: 268, code: 'ge', en: 'Georgia',               fr: 'Géorgie',                area: 69700   },
  { id: 270, code: 'gm', en: 'Gambia',                fr: 'Gambie',                 area: 11295   },
  { id: 275, code: 'ps', en: 'Palestine',             fr: 'Palestine',              area: 6020    },
  { id: 328, code: 'gy', en: 'Guyana',                fr: 'Guyana',                 area: 214969  },
  { id: 352, code: 'is', en: 'Iceland',               fr: 'Islande',                area: 103000  },
  { id: 417, code: 'kg', en: 'Kyrgyzstan',            fr: 'Kirghizistan',           area: 199951  },
  { id: 428, code: 'lv', en: 'Latvia',                fr: 'Lettonie',               area: 64589   },
  { id: 470, code: 'mt', en: 'Malta',                 fr: 'Malte',                  area: 316     },
  { id: 480, code: 'mu', en: 'Mauritius',             fr: 'Maurice',                area: 2040    },
  { id: 499, code: 'me', en: 'Montenegro',            fr: 'Monténégro',             area: 13812   },
  { id: 512, code: 'om', en: 'Oman',                  fr: 'Oman',                   area: 309500  },
  { id: 548, code: 'vu', en: 'Vanuatu',               fr: 'Vanuatu',                area: 12189   },
  { id: 624, code: 'gw', en: 'Guinea-Bissau',         fr: 'Guinée-Bissau',          area: 36125   },
  { id: 626, code: 'tl', en: 'Timor-Leste',           fr: 'Timor oriental',         area: 14874   },
  { id: 678, code: 'st', en: 'São Tomé & Príncipe',   fr: 'Sao Tomé-et-Príncipe',   area: 964     },
  { id: 688, code: 'rs', en: 'Serbia',                fr: 'Serbie',                 area: 77474   },
  { id: 690, code: 'sc', en: 'Seychelles',            fr: 'Seychelles',             area: 455     },
  { id: 702, code: 'sg', en: 'Singapore',             fr: 'Singapour',              area: 728     },
  { id: 705, code: 'si', en: 'Slovenia',              fr: 'Slovénie',               area: 20273   },
  { id: 728, code: 'ss', en: 'South Sudan',           fr: 'Soudan du Sud',          area: 619745  },
  { id: 748, code: 'sz', en: 'Eswatini',              fr: 'Eswatini',               area: 17364   },
  { id: 762, code: 'tj', en: 'Tajikistan',            fr: 'Tadjikistan',            area: 143100  },
  { id: 768, code: 'tg', en: 'Togo',                  fr: 'Togo',                   area: 56785   },
  { id: 776, code: 'to', en: 'Tonga',                 fr: 'Tonga',                  area: 747     },
  { id: 780, code: 'tt', en: 'Trinidad & Tobago',     fr: 'Trinité-et-Tobago',      area: 5130    },
  { id: 795, code: 'tm', en: 'Turkmenistan',          fr: 'Turkménistan',           area: 488100  },
  { id: 807, code: 'mk', en: 'North Macedonia',       fr: 'Macédoine du Nord',      area: 25713   },
  { id: 882, code: 'ws', en: 'Samoa',                 fr: 'Samoa',                  area: 2831    },
  { id: 384, code: 'ci', en: "Côte d'Ivoire",    fr: "Côte d'Ivoire",      area: 322463   },
]

const COLORS = ['#E63946','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4','#FF5722','#3F51B5']

function formatArea(km2) {
  if (km2 >= 1000000) return `${(km2/1000000).toFixed(2)}M km²`
  return `${km2.toLocaleString()} km²`
}
function mercatorScale(latOrig, latDest) {
  const r = Math.PI / 180
  const co = Math.cos(latOrig * r)
  const cd = Math.cos(Math.max(-75, Math.min(75, latDest)) * r)
  return cd === 0 ? 1 : co / cd
}

// ── Build a D3 projection matching the current Leaflet view ─────────────────
function buildProj(map) {
  const sz = map.getSize()
  const c  = map.getCenter()
  const z  = map.getZoom()
  return d3.geoMercator()
    .scale((256 / (2 * Math.PI)) * Math.pow(2, z))
    .center([c.lng, c.lat])
    .translate([sz.x / 2, sz.y / 2])
}

export default function TrueSizeMap() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const wrapRef    = useRef(null)  // outer wrapper div
  const mapDivRef  = useRef(null)  // leaflet target
  const canvasRef  = useRef(null)  // drawing canvas
  const mapRef     = useRef(null)
  const topoRef    = useRef(null)
  const featuresRef = useRef(null) // cached topojson features

  // drag state in a single ref — never triggers re-render
  const drag = useRef({ on: false, id: null, x: 0, y: 0 })

  const [loaded, setLoaded]     = useState(false)
  const [overlays, setOverlays] = useState([])
  const ovRef = useRef([])
  ovRef.current = overlays

  const [search, setSearch]           = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const colorIdx = useRef(0)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutStep, setTutStep]         = useState(0)

  const sortedCountries = [...COUNTRIES]
    .filter((c, i, a) => a.findIndex(x => x.id === c.id) === i)
    .sort((a, b) => (locale === 'fr' ? a.fr : a.en).localeCompare(locale === 'fr' ? b.fr : b.en))

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = useCallback((forcedOverlays) => {
    const canvas = canvasRef.current
    const map    = mapRef.current
    if (!canvas || !map || !featuresRef.current) return

    // Size from canvas parent div (most reliable — same element)
    const parent = canvas.parentElement
    const W = parent ? parent.clientWidth  : map.getSize().x
    const H = parent ? parent.clientHeight : map.getSize().y
    if (!W || !H) return

    console.log('[draw sizing] parent:', parent?.tagName, 'W:', W, 'H:', H, 'canvas parent rect:', parent?.getBoundingClientRect().width)

    canvas.width  = W
    canvas.height = H
    canvas.style.width  = W + 'px'
    canvas.style.height = H + 'px'

    const ctx  = canvas.getContext('2d')
    const proj = buildProj(map)
    ctx.clearRect(0, 0, W, H)
    // TEST: draw red rect to confirm canvas is visible
    ctx.fillStyle = 'rgba(255,0,0,0.5)'
    ctx.fillRect(10, 10, 200, 100)
    ctx.fillStyle = 'black'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('CANVAS VISIBLE', 20, 60)

    const ovList = forcedOverlays || ovRef.current
    if (ovList.length === 0) return
    console.log('[TrueSize] draw W:', W, 'H:', H, 'overlays:', ovList.length)

    ovList.forEach(ov => {
      console.log('[draw forEach] ov:', ov.meta.en, 'destLon:', ov.destLon, 'destLat:', ov.destLat)
      const feature = featuresRef.current.find(f => parseInt(f.id) === ov.meta.id)
      if (!feature) { console.warn('[TrueSize] feature not found for id:', ov.meta.id); return }

      const sc = mercatorScale(ov.origLat, ov.destLat)
      const [ox, oy] = proj([ov.origLon, ov.origLat])
      const [dx, dy] = proj([ov.destLon, ov.destLat])
      const tx = dx - ox * sc
      const ty = dy - oy * sc
      console.log('[draw proj] ox:', ox.toFixed(0), 'oy:', oy.toFixed(0), 'tx:', tx.toFixed(0), 'ty:', ty.toFixed(0), 'sc:', sc.toFixed(3))

      const pathGen = d3.geoPath().projection(proj).context(ctx)

      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(sc, sc)

      ctx.beginPath()
      pathGen(feature)
      ctx.globalAlpha = 0.55
      ctx.fillStyle   = ov.color
      ctx.fill()

      ctx.beginPath()
      pathGen(feature)
      ctx.globalAlpha = 0.9
      ctx.strokeStyle = ov.color
      ctx.lineWidth   = 1.5 / sc
      ctx.stroke()

      ctx.restore()

      // label at centroid (screen coords)
      const [cx, cy] = proj([ov.origLon, ov.origLat])
      const lx = tx + cx * sc
      const ly = ty + cy * sc
      ctx.globalAlpha  = 1
      ctx.font         = '800 12px sans-serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth    = 3
      ctx.strokeStyle  = 'rgba(0,0,0,0.65)'
      ctx.strokeText(locale === 'fr' ? ov.meta.fr : ov.meta.en, lx, ly)
      ctx.fillStyle = 'white'
      ctx.fillText(locale === 'fr' ? ov.meta.fr : ov.meta.en, lx, ly)
    })
  }, [locale])

  // Store draw in ref so map event listeners always call latest version
  const drawRef = useRef(draw)
  useEffect(() => { drawRef.current = draw }, [draw])

  useEffect(() => {
    if (!loaded) return
    console.log('[useEffect] overlays changed, drawing', overlays.length)
    const t = setTimeout(() => draw(overlays), 50)
    return () => clearTimeout(t)
  }, [overlays, loaded, draw])

  // ── Hit test ────────────────────────────────────────────────────────────────
  const hitTest = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    const map    = mapRef.current
    if (!canvas || !map || !featuresRef.current || !ovRef.current.length) return null

    const rect = canvas.getBoundingClientRect()
    const px   = clientX - rect.left
    const py   = clientY - rect.top
    const proj = buildProj(map)

    // offscreen canvas for hit testing
    const off    = document.createElement('canvas')
    off.width    = canvas.width
    off.height   = canvas.height
    const ctx2   = off.getContext('2d')
    const pathGen = d3.geoPath().projection(proj).context(ctx2)

    for (let i = ovRef.current.length - 1; i >= 0; i--) {
      const ov      = ovRef.current[i]
      const feature = featuresRef.current.find(f => parseInt(f.id) === ov.meta.id)
      if (!feature) continue

      const sc = mercatorScale(ov.origLat, ov.destLat)
      const [ox, oy] = proj([ov.origLon, ov.origLat])
      const [dx2, dy2] = proj([ov.destLon, ov.destLat])
      const tx = dx2 - ox * sc
      const ty = dy2 - oy * sc

      ctx2.save()
      ctx2.translate(tx, ty)
      ctx2.scale(sc, sc)
      ctx2.beginPath()
      pathGen(feature)
      ctx2.restore()

      if (ctx2.isPointInPath(px, py)) return ov.id
    }
    return null
  }, [])

  // ── Pointer events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return
    const canvas = canvasRef.current
    const map    = mapRef.current
    if (!canvas || !map) return

    // canvas starts transparent; becomes opaque to events only when hovering a shape
    canvas.style.pointerEvents = 'none'

    // Track mouse globally to update cursor & enable canvas on hover
    const onDocMove = (e) => {
      if (drag.current.on) return
      if (!ovRef.current.length) { canvas.style.pointerEvents = 'none'; return }
      const id = hitTest(e.clientX, e.clientY)
      if (id !== null) {
        canvas.style.pointerEvents = 'auto'
        canvas.style.cursor = 'grab'
      } else {
        canvas.style.pointerEvents = 'none'
      }
    }

    const onDown = (e) => {
      const id = hitTest(e.clientX, e.clientY)
      if (id === null) return
      e.preventDefault()
      canvas.setPointerCapture(e.pointerId)
      drag.current = { on: true, id, x: e.clientX, y: e.clientY }
      canvas.style.cursor = 'grabbing'
      map.dragging.disable()
      map.scrollWheelZoom.disable()
    }

    const onMove = (e) => {
      if (!drag.current.on) return
      e.preventDefault()
      const proj = buildProj(map)
      const ov   = ovRef.current.find(o => o.id === drag.current.id)
      if (!ov) return

      const [curPx, curPy] = proj([ov.destLon, ov.destLat])
      const nc = proj.invert([curPx + e.clientX - drag.current.x, curPy + e.clientY - drag.current.y])
      if (!nc) return
      drag.current.x = e.clientX
      drag.current.y = e.clientY

      setOverlays(prev => prev.map(o => o.id === drag.current.id
        ? { ...o, destLon: nc[0], destLat: Math.max(-75, Math.min(75, nc[1])) }
        : o
      ))
    }

    const onUp = (e) => {
      if (!drag.current.on) return
      drag.current.on = false
      try { canvas.releasePointerCapture(e.pointerId) } catch (_) {}
      map.dragging.enable()
      map.scrollWheelZoom.enable()
      canvas.style.cursor = 'default'
      // Check if still over a shape
      const id = hitTest(e.clientX, e.clientY)
      canvas.style.pointerEvents = id !== null ? 'auto' : 'none'
      if (id !== null) canvas.style.cursor = 'grab'
    }

    document.addEventListener('mousemove', onDocMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup',   onUp)
    canvas.addEventListener('pointercancel', onUp)

    return () => {
      document.removeEventListener('mousemove', onDocMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup',   onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [loaded, hitTest])

  // ── Init Leaflet ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return
    import('leaflet').then(Lmod => {
      const Lf = Lmod.default || Lmod
      if (!mapDivRef.current || mapRef.current) return

      // Clear any previous Leaflet instance on the div
      if (mapDivRef.current._leaflet_id) {
        mapDivRef.current._leaflet_id = null
      }

      delete Lf.Icon.Default.prototype._getIconUrl
      Lf.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' })

      const map = Lf.map(mapDivRef.current, {
        center: [20, 0], zoom: 2, minZoom: 1, maxZoom: 14, zoomControl: false,
      })
      mapRef.current = map

      // Use locale-aware tile URL
      const tileUrl = locale === 'fr'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      Lf.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map)

      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(r => r.json())
        .then(world => {
          topoRef.current = world
          featuresRef.current = topojson.feature(world, world.objects.countries).features
          setLoaded(true)
          // Force initial canvas size after Leaflet renders
          setTimeout(() => {
            const c = canvasRef.current
            if (!c) return
            const sz = map.getSize()
            if (sz.x > 0) { c.width = sz.x; c.height = sz.y; c.style.width = sz.x+'px'; c.style.height = sz.y+'px' }
          }, 200)
        })

      map.on('moveend zoomend', () => requestAnimationFrame(() => drawRef.current()))
      map.on('move zoom',       () => requestAnimationFrame(() => drawRef.current()))
    })
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [draw])

  // ── Country management ───────────────────────────────────────────────────────
  const addCountry = useCallback((meta) => {
    console.log('[addCountry] called with', meta?.en, 'featuresRef:', !!featuresRef.current)
    if (!featuresRef.current) return
    if (ovRef.current.find(o => o.meta.id === meta.id)) {
      setSearch(''); setShowDropdown(false); setSuggestions([]); return
    }
    const feature = featuresRef.current.find(f => parseInt(f.id) === meta.id)
    if (!feature) return
    const [origLon, origLat] = d3.geoCentroid(feature)
    const newOverlay = {
      id: Date.now(), meta, origLon, origLat, destLon: origLon, destLat: origLat,
      color: COLORS[colorIdx.current++ % COLORS.length],
    }
    const nextOverlays = [...ovRef.current, newOverlay]
    setOverlays(nextOverlays)
    setSearch(''); setShowDropdown(false); setSuggestions([])
    // Draw immediately with the new list (bypasses React state delay)
    console.log('[addCountry] calling draw with', nextOverlays.length, 'overlays')
    requestAnimationFrame(() => drawRef.current(nextOverlays))
  }, [])

  const removeOverlay = useCallback((id) => setOverlays(p => p.filter(o => o.id !== id)), [])
  const resetOverlay  = useCallback((id) => setOverlays(p => p.map(o => o.id === id ? { ...o, destLon: o.origLon, destLat: o.origLat } : o)), [])

  // Search / dropdown
  useEffect(() => {
    if (!search.trim()) {
      console.log('[suggestions] showing all', sortedCountries.length, 'countries')
      setSuggestions(sortedCountries)
    } else {
      const q = search.toLowerCase()
      const filtered = sortedCountries.filter(c => (locale === 'fr' ? c.fr : c.en).toLowerCase().includes(q))
      console.log('[suggestions] filtered:', filtered.length)
      setSuggestions(filtered)
    }
  }, [search, locale])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div style={{ flexShrink: 0, backgroundColor: 'white', borderBottom: '1px solid #E2DDD5', padding: '8px 16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', zIndex: 1000, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0B1F3B', flexShrink: 0 }}>
            🌍 {t('True Size Map', 'Vraie Taille des Pays')}
          </span>

          {/* Search + dropdown */}
          <div style={{ position: 'relative', flex: '0 0 240px' }}>
            <input
              type="text"
              value={search}
              placeholder={t('Search or browse countries...', 'Rechercher ou parcourir...')}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => { 
                console.log('[input focus] suggestions:', suggestions.length, 'loaded:', loaded)
                setShowDropdown(true) 
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && suggestions.length > 0) { e.preventDefault(); addCountry(suggestions[0]) }
                if (e.key === 'Escape') setShowDropdown(false)
              }}
              style={{ width: '100%', padding: '7px 12px', borderRadius: '8px', border: '2px solid #E2DDD5', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8F7F4' }}
              onMouseEnter={e => e.target.style.borderColor = '#9EB7E5'}
              onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = '#E2DDD5' }}
            />
            {showDropdown && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '10px', border: '1px solid #E2DDD5', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 2000, maxHeight: '320px', overflowY: 'auto' }}>
                {suggestions.map(s => (
                  <button key={s.id}
                    onMouseDown={e => { e.preventDefault(); console.log('[btn click]', s.en); addCountry(s) }}
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', borderBottom: '1px solid #F4F1E6', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '600', color: '#0B1F3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F4F1E6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <img src={`https://flagcdn.com/w40/${s.code}.png`} width="18" height="12" style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }} />
                    {locale === 'fr' ? s.fr : s.en}
                    <span style={{ fontSize: '10px', color: '#8A8278', marginLeft: 'auto' }}>{formatArea(s.area)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setTutStep(0); setShowTutorial(true) }}
            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#9EB7E5', padding: '0', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
            {t('How to use?', 'Comment ça marche ?')}
          </button>

          {/* Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            {overlays.map(o => {
              const sc  = mercatorScale(o.origLat, o.destLat)
              const pct = Math.round((1/sc - 1) * 100)
              return (
                <div key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 5px', borderRadius: '99px', backgroundColor: o.color + '18', border: `1.5px solid ${o.color}` }}>
                  <img src={`https://flagcdn.com/w40/${o.meta.code}.png`} width="16" height="11" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0B1F3B' }}>{locale === 'fr' ? o.meta.fr : o.meta.en}</span>
                  <span style={{ fontSize: '10px', color: '#8A8278' }}>{formatArea(o.meta.area)}</span>
                  {pct !== 0 && <span style={{ fontSize: '10px', fontWeight: '700', color: pct > 0 ? '#4CAF50' : '#E63946' }}>{pct > 0 ? `+${pct}%` : `${pct}%`}</span>}
                  <button onClick={() => resetOverlay(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EB7E5', fontSize: '13px', padding: '0 1px', lineHeight: 1 }}>↺</button>
                  <button onClick={() => removeOverlay(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0', lineHeight: 1 }}>×</button>
                </div>
              )
            })}
            {overlays.length > 1 && (
              <button onClick={() => setOverlays([])} style={{ padding: '3px 10px', backgroundColor: '#F4F1E6', border: '1px solid #E2DDD5', borderRadius: '99px', fontSize: '11px', fontWeight: '600', color: '#8A8278', cursor: 'pointer' }}>
                {t('Clear all', 'Tout effacer')}
              </button>
            )}
          </div>
        </div>

        {/* ── Map area ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }} />

          {/* Zoom buttons */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[{l:'+',a:()=>mapRef.current?.zoomIn()},{l:'−',a:()=>mapRef.current?.zoomOut()},{l:'⌂',a:()=>mapRef.current?.setView([20,0],2)}].map(({l,a}) => (
              <button key={l} onClick={a} style={{ width: 34, height: 34, backgroundColor: 'white', border: '1px solid #E2DDD5', borderRadius: 8, fontSize: l==='⌂'?16:20, fontWeight: 700, cursor: 'pointer', color: '#0B1F3B', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l}</button>
            ))}
          </div>

          {loaded && overlays.length === 0 && (
            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(11,31,59,0.85)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '10px 18px', color: 'white', fontSize: 13, zIndex: 999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {t('Click the search bar → pick a country → drag to compare', 'Cliquez la recherche → choisissez un pays → glissez pour comparer')}
            </div>
          )}
        </div>
      </div>

      {/* Tutorial */}
      {showTutorial && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#0B1F3B', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>🌍 {t('True Size Map', 'Vraie Taille des Pays')}</span>
              <button onClick={() => setShowTutorial(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '28px 28px 20px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
              {tutStep === 0 && (<>
                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#0B1F3B', textAlign: 'center' }}>{t('Browse or search countries', 'Parcourez ou cherchez un pays')}</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>{t('Click the search bar to see all countries, or type to filter. Press Enter to add the first result.', 'Cliquez la barre de recherche pour voir tous les pays, ou tapez pour filtrer.')}</p>
                <div style={{ flex: 1, backgroundColor: '#F8F7F4', borderRadius: 14, padding: 16 }}>
                  <div style={{ backgroundColor: 'white', borderRadius: 10, padding: '10px 14px', border: '2px solid #9EB7E5', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: '#94a3b8' }}>🔍</span><span style={{ fontSize: 14, color: '#94a3b8' }}>{t('Search or browse...', 'Rechercher ou parcourir...')}</span>
                  </div>
                  {[{code:'gl',name:t('Greenland','Groenland')},{code:'fr',name:t('France','France')},{code:'in',name:t('India','Inde')}].map((item,i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, backgroundColor: i===0?'#EEF4FF':'transparent' }}>
                      <img src={`https://flagcdn.com/w40/${item.code}.png`} width="22" height="15" style={{ borderRadius: 3, objectFit: 'cover' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1F3B' }}>{item.name}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>...{t('130+ countries', '130+ pays')}</div>
                </div>
              </>)}
              {tutStep === 1 && (<>
                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#0B1F3B', textAlign: 'center' }}>{t('Drag and compare', 'Glissez et comparez')}</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>{t('Hover a country shape, then drag it anywhere. Moving toward the equator reveals its true size!', 'Survolez une forme, puis glissez-la. Vers l\u2019équateur = vraie taille !')}</p>
                <div style={{ flex: 1, backgroundColor: '#1a2f4a', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('Greenland vs Africa', 'Groenland vs Afrique')}</span>
                  </div>
                  <svg viewBox="0 0 200 170" style={{ width: '100%', maxWidth: 200 }}>
                    <path d="M80 20 Q105 15 125 25 Q145 35 148 55 Q152 75 145 95 Q140 115 135 130 Q125 150 110 158 Q95 165 82 158 Q68 150 60 135 Q50 118 48 98 Q44 75 50 55 Q58 35 80 20Z" fill="#E63946" fillOpacity="0.65" stroke="#E63946" strokeWidth="2"/>
                    <path d="M88 68 Q96 63 104 66 Q110 70 111 77 Q112 85 106 90 Q99 95 91 92 Q84 88 83 80 Q82 72 88 68Z" fill="#4CAF50" fillOpacity="0.85" stroke="#4CAF50" strokeWidth="1.5"/>
                    <text x="100" y="112" textAnchor="middle" fill="white" fontSize="9" fontWeight="800">{t('AFRICA','AFRIQUE')}</text>
                  </svg>
                </div>
              </>)}
              {tutStep === 2 && (<>
                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#0B1F3B', textAlign: 'center' }}>{t('The Mercator effect', 'L\u2019effet Mercator')}</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>{t('Countries near the poles look much bigger than they really are. The chip shows the % difference!', 'Les pays proches des pôles semblent plus grands. Le badge montre la différence en % !')}</p>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                  {[{flag:'ru',name:t('Russia at 60°N','Russie à 60°N'),size:'100%',label:t('On map','Sur la carte'),color:'#E63946'},{flag:'ru',name:t('Russia at equator','Russie à l\u2019équateur'),size:'52%',label:t('True size','Vraie taille'),color:'#4CAF50'}].map((item,i) => (
                    <div key={i} style={{ backgroundColor: '#F8F7F4', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={`https://flagcdn.com/w40/${item.flag}.png`} width="28" height="19" style={{ borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0B1F3B', marginBottom: 4 }}>{item.name}</div>
                        <div style={{ height: 8, borderRadius: 99, backgroundColor: item.color, width: item.size, opacity: 0.7 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
            <div style={{ padding: '12px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F0EEE8' }}>
              <button onClick={() => tutStep > 0 && setTutStep(s => s-1)} disabled={tutStep===0}
                style={{ padding: '10px 18px', backgroundColor: tutStep===0?'#F0EEE8':'#0B1F3B', color: tutStep===0?'#94a3b8':'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: tutStep===0?'default':'pointer' }}>
                {t('Previous','Précédent')}
              </button>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{tutStep+1} / 3</span>
              {tutStep < 2
                ? <button onClick={() => setTutStep(s=>s+1)} style={{ padding: '10px 18px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('Next','Suivant')}</button>
                : <button onClick={() => setShowTutorial(false)} style={{ padding: '10px 18px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{t('Start!','Explorer !')}</button>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}