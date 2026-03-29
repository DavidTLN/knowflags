'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

// ── Data ────────────────────────────────────────────────────────────────────
// colors: dominant colors on the flag
// symbols: notable symbols/patterns on the flag
const COUNTRIES = [
  { code: 'af', en: 'Afghanistan',                      fr: 'Afghanistan',                      region: 'Asia',    colors: ['red','black','green','white'],       symbols: ['emblem','mosque'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'al', en: 'Albania',                          fr: 'Albanie',                          region: 'Europe',  colors: ['red','black'],                      symbols: ['eagle'] , ratio: '1:1.4', shape: 'rectangle' },
  { code: 'dz', en: 'Algeria',                          fr: 'Algérie',                          region: 'Africa',  colors: ['green','white','red'],               symbols: ['crescent','star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ad', en: 'Andorra',                          fr: 'Andorre',                          region: 'Europe',  colors: ['blue','yellow','red'],               symbols: ['coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ao', en: 'Angola',                           fr: 'Angola',                           region: 'Africa',  colors: ['red','black'],                       symbols: ['star','gear','machete'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ag', en: 'Antigua and Barbuda',              fr: 'Antigua-et-Barbuda',               region: 'Americas',colors: ['red','black','white','blue','yellow'],symbols: ['sun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ar', en: 'Argentina',                        fr: 'Argentine',                        region: 'Americas',colors: ['blue','white'],                      symbols: ['sun'] , ratio: '9:14', shape: 'rectangle' },
  { code: 'am', en: 'Armenia',                          fr: 'Arménie',                          region: 'Asia',    colors: ['red','blue','orange'],               symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'au', en: 'Australia',                        fr: 'Australie',                        region: 'Oceania', colors: ['blue','red','white'],                symbols: ['stars','cross','union jack'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'at', en: 'Austria',                          fr: 'Autriche',                         region: 'Europe',  colors: ['red','white'],                      symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'az', en: 'Azerbaijan',                       fr: 'Azerbaïdjan',                      region: 'Asia',    colors: ['blue','red','green','white'],        symbols: ['crescent','star'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'bs', en: 'Bahamas',                          fr: 'Bahamas',                          region: 'Americas',colors: ['blue','yellow','black'],             symbols: ['triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'bh', en: 'Bahrain',                          fr: 'Bahreïn',                          region: 'Asia',    colors: ['red','white'],                      symbols: [] , ratio: '3:5', shape: 'rectangle' },
  { code: 'bd', en: 'Bangladesh',                       fr: 'Bangladesh',                       region: 'Asia',    colors: ['green','red'],                      symbols: ['circle'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'bb', en: 'Barbados',                         fr: 'Barbade',                          region: 'Americas',colors: ['blue','yellow','black'],             symbols: ['trident'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'by', en: 'Belarus',                          fr: 'Biélorussie',                      region: 'Europe',  colors: ['red','green','white'],               symbols: ['pattern'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'be', en: 'Belgium',                          fr: 'Belgique',                         region: 'Europe',  colors: ['black','yellow','red'],              symbols: [] , ratio: '13:15', shape: 'rectangle' },
  { code: 'bz', en: 'Belize',                           fr: 'Belize',                           region: 'Americas',colors: ['blue','red','white'],                symbols: ['coat of arms','tree'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'bj', en: 'Benin',                            fr: 'Bénin',                            region: 'Africa',  colors: ['green','yellow','red'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'bt', en: 'Bhutan',                           fr: 'Bhoutan',                          region: 'Asia',    colors: ['orange','yellow','white'],           symbols: ['dragon'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'bo', en: 'Bolivia',                          fr: 'Bolivie',                          region: 'Americas',colors: ['red','yellow','green'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ba', en: 'Bosnia and Herzegovina',           fr: 'Bosnie-Herzégovine',               region: 'Europe',  colors: ['blue','yellow','white'],             symbols: ['stars','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'bw', en: 'Botswana',                         fr: 'Botswana',                         region: 'Africa',  colors: ['blue','black','white'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'br', en: 'Brazil',                           fr: 'Brésil',                           region: 'Americas',colors: ['green','yellow','blue','white'],     symbols: ['stars','globe'] , ratio: '7:10', shape: 'rectangle' },
  { code: 'bn', en: 'Brunei',                           fr: 'Brunéi',                           region: 'Asia',    colors: ['yellow','white','black'],            symbols: ['emblem','crescent'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'bg', en: 'Bulgaria',                         fr: 'Bulgarie',                         region: 'Europe',  colors: ['white','green','red'],               symbols: [] , ratio: '3:5', shape: 'rectangle' },
  { code: 'bf', en: 'Burkina Faso',                     fr: 'Burkina Faso',                     region: 'Africa',  colors: ['red','green','yellow'],              symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'bi', en: 'Burundi',                          fr: 'Burundi',                          region: 'Africa',  colors: ['red','white','green'],               symbols: ['stars'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'kh', en: 'Cambodia',                         fr: 'Cambodge',                         region: 'Asia',    colors: ['blue','red','white'],                symbols: ['temple','angkor wat'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cm', en: 'Cameroon',                         fr: 'Cameroun',                         region: 'Africa',  colors: ['green','red','yellow'],              symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ca', en: 'Canada',                           fr: 'Canada',                           region: 'Americas',colors: ['red','white'],                       symbols: ['maple leaf'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'cv', en: 'Cape Verde',                       fr: 'Cap-Vert',                         region: 'Africa',  colors: ['blue','red','white','yellow'],       symbols: ['stars','circle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cf', en: 'Central African Republic',         fr: 'République centrafricaine',        region: 'Africa',  colors: ['blue','white','green','yellow','red'],symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'td', en: 'Chad',                             fr: 'Tchad',                            region: 'Africa',  colors: ['blue','yellow','red'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cl', en: 'Chile',                            fr: 'Chili',                            region: 'Americas',colors: ['red','white','blue'],                symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cn', en: 'China',                            fr: 'Chine',                            region: 'Asia',    colors: ['red','yellow'],                      symbols: ['stars'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'co', en: 'Colombia',                         fr: 'Colombie',                         region: 'Americas',colors: ['yellow','blue','red'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'km', en: 'Comoros',                          fr: 'Comores',                          region: 'Africa',  colors: ['green','white','blue','yellow','red'],symbols: ['crescent','stars'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'cg', en: 'Congo',                            fr: 'Congo',                            region: 'Africa',  colors: ['green','yellow','red'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cr', en: 'Costa Rica',                       fr: 'Costa Rica',                       region: 'Americas',colors: ['blue','white','red'],                symbols: [] , ratio: '3:5', shape: 'rectangle' },
  { code: 'hr', en: 'Croatia',                          fr: 'Croatie',                          region: 'Europe',  colors: ['red','white','blue'],                symbols: ['coat of arms','checkerboard'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'cu', en: 'Cuba',                             fr: 'Cuba',                             region: 'Americas',colors: ['blue','white','red'],                symbols: ['star','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'cy', en: 'Cyprus',                           fr: 'Chypre',                           region: 'Europe',  colors: ['white','orange','green'],            symbols: ['map','olive branches'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cz', en: 'Czech Republic',                   fr: 'République tchèque',               region: 'Europe',  colors: ['white','red','blue'],                symbols: ['triangle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'dk', en: 'Denmark',                          fr: 'Danemark',                         region: 'Europe',  colors: ['red','white'],                       symbols: ['cross'] , ratio: '28:37', shape: 'rectangle' },
  { code: 'dj', en: 'Djibouti',                         fr: 'Djibouti',                         region: 'Africa',  colors: ['blue','green','white','red'],        symbols: ['star','triangle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'dm', en: 'Dominica',                         fr: 'Dominique',                        region: 'Americas',colors: ['green','yellow','black','white','red','purple'],symbols: ['bird','cross','stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'do', en: 'Dominican Republic',               fr: 'République dominicaine',           region: 'Americas',colors: ['blue','red','white'],                symbols: ['cross','coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'cd', en: 'DR Congo',                         fr: 'RD Congo',                         region: 'Africa',  colors: ['blue','red','yellow'],               symbols: ['star','diagonal'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ec', en: 'Ecuador',                          fr: 'Équateur',                         region: 'Americas',colors: ['yellow','blue','red'],               symbols: ['coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'eg', en: 'Egypt',                            fr: 'Égypte',                           region: 'Africa',  colors: ['red','white','black'],               symbols: ['eagle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'sv', en: 'El Salvador',                      fr: 'Salvador',                         region: 'Americas',colors: ['blue','white'],                      symbols: ['coat of arms'] , ratio: '189:335', shape: 'rectangle' },
  { code: 'gq', en: 'Equatorial Guinea',                fr: 'Guinée équatoriale',               region: 'Africa',  colors: ['green','white','red','blue'],        symbols: ['tree','coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'er', en: 'Eritrea',                          fr: 'Érythrée',                         region: 'Africa',  colors: ['green','blue','red','yellow'],       symbols: ['olive branch','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ee', en: 'Estonia',                          fr: 'Estonie',                          region: 'Europe',  colors: ['blue','black','white'],              symbols: [] , ratio: '7:11', shape: 'rectangle' },
  { code: 'sz', en: 'Eswatini',                         fr: 'Eswatini',                         region: 'Africa',  colors: ['blue','yellow','red','black','white'],symbols: ['shield','spears'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'et', en: 'Ethiopia',                         fr: 'Éthiopie',                         region: 'Africa',  colors: ['green','yellow','red','blue'],       symbols: ['star','pentagram'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'fj', en: 'Fiji',                             fr: 'Fidji',                            region: 'Oceania', colors: ['blue','white','red'],                symbols: ['union jack','coat of arms'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'fi', en: 'Finland',                          fr: 'Finlande',                         region: 'Europe',  colors: ['white','blue'],                      symbols: ['cross'] , ratio: '11:18', shape: 'rectangle' },
  { code: 'fr', en: 'France',                           fr: 'France',                           region: 'Europe',  colors: ['blue','white','red'],                symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ga', en: 'Gabon',                            fr: 'Gabon',                            region: 'Africa',  colors: ['green','yellow','blue'],             symbols: [] , ratio: '3:4', shape: 'rectangle' },
  { code: 'gm', en: 'Gambia',                           fr: 'Gambie',                           region: 'Africa',  colors: ['red','blue','green','white'],        symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ge', en: 'Georgia',                          fr: 'Géorgie',                          region: 'Asia',    colors: ['white','red'],                       symbols: ['cross'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'de', en: 'Germany',                          fr: 'Allemagne',                        region: 'Europe',  colors: ['black','red','yellow'],              symbols: [] , ratio: '3:5', shape: 'rectangle' },
  { code: 'gh', en: 'Ghana',                            fr: 'Ghana',                            region: 'Africa',  colors: ['red','yellow','green','black'],      symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'gr', en: 'Greece',                           fr: 'Grèce',                            region: 'Europe',  colors: ['blue','white'],                      symbols: ['cross','stripes'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'gd', en: 'Grenada',                          fr: 'Grenade',                          region: 'Americas',colors: ['yellow','red','green'],              symbols: ['star','nutmeg'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'gt', en: 'Guatemala',                        fr: 'Guatemala',                        region: 'Americas',colors: ['blue','white'],                      symbols: ['coat of arms','quetzal','rifle','sword'] , ratio: '5:8', shape: 'rectangle' },
  { code: 'gn', en: 'Guinea',                           fr: 'Guinée',                           region: 'Africa',  colors: ['red','yellow','green'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'gw', en: 'Guinea-Bissau',                    fr: 'Guinée-Bissau',                    region: 'Africa',  colors: ['red','yellow','green','black'],      symbols: ['star'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'gy', en: 'Guyana',                           fr: 'Guyana',                           region: 'Americas',colors: ['green','white','yellow','black','red'],symbols: ['triangle','arrow'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'ht', en: 'Haiti',                            fr: 'Haïti',                            region: 'Americas',colors: ['blue','red','white'],                symbols: ['coat of arms','cannon','gun'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'hn', en: 'Honduras',                         fr: 'Honduras',                         region: 'Americas',colors: ['blue','white'],                      symbols: ['stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'hu', en: 'Hungary',                          fr: 'Hongrie',                          region: 'Europe',  colors: ['red','white','green'],               symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'is', en: 'Iceland',                          fr: 'Islande',                          region: 'Europe',  colors: ['blue','white','red'],                symbols: ['cross'] , ratio: '18:25', shape: 'rectangle' },
  { code: 'in', en: 'India',                            fr: 'Inde',                             region: 'Asia',    colors: ['orange','white','green','blue'],     symbols: ['wheel','chakra'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'id', en: 'Indonesia',                        fr: 'Indonésie',                        region: 'Asia',    colors: ['red','white'],                       symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ir', en: 'Iran',                             fr: 'Iran',                             region: 'Asia',    colors: ['green','white','red'],               symbols: ['emblem','crescent','sword'] , ratio: '4:7', shape: 'rectangle' },
  { code: 'iq', en: 'Iraq',                             fr: 'Irak',                             region: 'Asia',    colors: ['red','white','black'],               symbols: ['eagle','text'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ie', en: 'Ireland',                          fr: 'Irlande',                          region: 'Europe',  colors: ['green','white','orange'],            symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'il', en: 'Israel',                           fr: 'Israël',                           region: 'Asia',    colors: ['white','blue'],                      symbols: ['star of david'] , ratio: '8:11', shape: 'rectangle' },
  { code: 'it', en: 'Italy',                            fr: 'Italie',                           region: 'Europe',  colors: ['green','white','red'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ci', en: 'Ivory Coast',                      fr: "Côte d'Ivoire",                    region: 'Africa',  colors: ['orange','white','green'],            symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'jm', en: 'Jamaica',                          fr: 'Jamaïque',                         region: 'Americas',colors: ['black','yellow','green'],            symbols: ['cross'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'jp', en: 'Japan',                            fr: 'Japon',                            region: 'Asia',    colors: ['white','red'],                       symbols: ['circle','sun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'jo', en: 'Jordan',                           fr: 'Jordanie',                         region: 'Asia',    colors: ['black','white','green','red'],       symbols: ['star','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'kz', en: 'Kazakhstan',                       fr: 'Kazakhstan',                       region: 'Asia',    colors: ['blue','yellow'],                     symbols: ['sun','eagle','pattern'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ke', en: 'Kenya',                            fr: 'Kenya',                            region: 'Africa',  colors: ['black','red','green','white'],       symbols: ['shield','spears'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ki', en: 'Kiribati',                         fr: 'Kiribati',                         region: 'Oceania', colors: ['red','yellow','blue','white'],       symbols: ['sun','bird','waves'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'kw', en: 'Kuwait',                           fr: 'Koweït',                           region: 'Asia',    colors: ['green','white','red','black'],       symbols: ['trapezoid'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'kg', en: 'Kyrgyzstan',                       fr: 'Kirghizistan',                     region: 'Asia',    colors: ['red','yellow'],                      symbols: ['sun','tunduk'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'la', en: 'Laos',                             fr: 'Laos',                             region: 'Asia',    colors: ['red','blue','white'],                symbols: ['circle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'lv', en: 'Latvia',                           fr: 'Lettonie',                         region: 'Europe',  colors: ['red','white'],                       symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'lb', en: 'Lebanon',                          fr: 'Liban',                            region: 'Asia',    colors: ['red','white','green'],               symbols: ['cedar tree'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ls', en: 'Lesotho',                          fr: 'Lesotho',                          region: 'Africa',  colors: ['blue','white','green','black'],      symbols: ['hat','mokorotlo'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'lr', en: 'Liberia',                          fr: 'Libéria',                          region: 'Africa',  colors: ['red','white','blue'],                symbols: ['star','stripes'] , ratio: '10:19', shape: 'rectangle' },
  { code: 'ly', en: 'Libya',                            fr: 'Libye',                            region: 'Africa',  colors: ['red','black','green','white'],       symbols: ['crescent','star'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'li', en: 'Liechtenstein',                    fr: 'Liechtenstein',                    region: 'Europe',  colors: ['blue','red','yellow'],               symbols: ['crown'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'lt', en: 'Lithuania',                        fr: 'Lituanie',                         region: 'Europe',  colors: ['yellow','green','red'],              symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'lu', en: 'Luxembourg',                       fr: 'Luxembourg',                       region: 'Europe',  colors: ['red','white','blue'],                symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'mg', en: 'Madagascar',                       fr: 'Madagascar',                       region: 'Africa',  colors: ['white','red','green'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mw', en: 'Malawi',                           fr: 'Malawi',                           region: 'Africa',  colors: ['black','red','green'],               symbols: ['sun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'my', en: 'Malaysia',                         fr: 'Malaisie',                         region: 'Asia',    colors: ['red','white','blue','yellow'],       symbols: ['crescent','star','stripes'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'mv', en: 'Maldives',                         fr: 'Maldives',                         region: 'Asia',    colors: ['red','green','white'],               symbols: ['crescent'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ml', en: 'Mali',                             fr: 'Mali',                             region: 'Africa',  colors: ['green','yellow','red'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mt', en: 'Malta',                            fr: 'Malte',                            region: 'Europe',  colors: ['white','red'],                       symbols: ['cross','george cross'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mh', en: 'Marshall Islands',                 fr: 'Îles Marshall',                    region: 'Oceania', colors: ['blue','white','orange'],             symbols: ['star','diagonal'] , ratio: '10:19', shape: 'rectangle' },
  { code: 'mr', en: 'Mauritania',                       fr: 'Mauritanie',                       region: 'Africa',  colors: ['green','yellow','red'],              symbols: ['crescent','star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mu', en: 'Mauritius',                        fr: 'Maurice',                          region: 'Africa',  colors: ['red','blue','yellow','green'],       symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mx', en: 'Mexico',                           fr: 'Mexique',                          region: 'Americas',colors: ['green','white','red'],               symbols: ['eagle','coat of arms'] , ratio: '4:7', shape: 'rectangle' },
  { code: 'fm', en: 'Micronesia',                       fr: 'Micronésie',                       region: 'Oceania', colors: ['blue','white'],                      symbols: ['stars'] , ratio: '10:19', shape: 'rectangle' },
  { code: 'md', en: 'Moldova',                          fr: 'Moldavie',                         region: 'Europe',  colors: ['blue','yellow','red'],               symbols: ['coat of arms','eagle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'mc', en: 'Monaco',                           fr: 'Monaco',                           region: 'Europe',  colors: ['red','white'],                       symbols: [] , ratio: '4:5', shape: 'rectangle' },
  { code: 'mn', en: 'Mongolia',                         fr: 'Mongolie',                         region: 'Asia',    colors: ['red','blue','yellow'],               symbols: ['soyombo'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'me', en: 'Montenegro',                       fr: 'Monténégro',                       region: 'Europe',  colors: ['red','yellow'],                      symbols: ['eagle','coat of arms'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ma', en: 'Morocco',                          fr: 'Maroc',                            region: 'Africa',  colors: ['red','green'],                       symbols: ['star','pentagram'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mz', en: 'Mozambique',                       fr: 'Mozambique',                       region: 'Africa',  colors: ['green','black','yellow','white','red'],symbols: ['star','book','gun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'mm', en: 'Myanmar',                          fr: 'Myanmar',                          region: 'Asia',    colors: ['yellow','green','red','white'],      symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'na', en: 'Namibia',                          fr: 'Namibie',                          region: 'Africa',  colors: ['blue','red','green','white','yellow'],symbols: ['sun','diagonal'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'nr', en: 'Nauru',                            fr: 'Nauru',                            region: 'Oceania', colors: ['blue','yellow','white'],             symbols: ['star'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'np', en: 'Nepal',                            fr: 'Népal',                            region: 'Asia',    colors: ['red','blue','white'],                symbols: ['moon','sun','pennant'] , ratio: '4:5', shape: 'pennant' },
  { code: 'nl', en: 'Netherlands',                      fr: 'Pays-Bas',                         region: 'Europe',  colors: ['red','white','blue'],                symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'nz', en: 'New Zealand',                      fr: 'Nouvelle-Zélande',                 region: 'Oceania', colors: ['blue','red','white'],                symbols: ['stars','union jack'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ni', en: 'Nicaragua',                        fr: 'Nicaragua',                        region: 'Americas',colors: ['blue','white','purple'],             symbols: ['coat of arms','rainbow'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'ne', en: 'Niger',                            fr: 'Niger',                            region: 'Africa',  colors: ['orange','white','green'],            symbols: ['circle'] , ratio: '6:7', shape: 'rectangle' },
  { code: 'ng', en: 'Nigeria',                          fr: 'Nigéria',                          region: 'Africa',  colors: ['green','white'],                     symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'kp', en: 'North Korea',                      fr: 'Corée du Nord',                    region: 'Asia',    colors: ['red','blue','white'],                symbols: ['star','circle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'mk', en: 'North Macedonia',                  fr: 'Macédoine du Nord',                region: 'Europe',  colors: ['red','yellow'],                      symbols: ['sun'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'no', en: 'Norway',                           fr: 'Norvège',                          region: 'Europe',  colors: ['red','white','blue'],                symbols: ['cross'] , ratio: '8:11', shape: 'rectangle' },
  { code: 'om', en: 'Oman',                             fr: 'Oman',                             region: 'Asia',    colors: ['red','white','green'],               symbols: ['dagger','swords'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'pk', en: 'Pakistan',                         fr: 'Pakistan',                         region: 'Asia',    colors: ['green','white'],                     symbols: ['crescent','star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'pw', en: 'Palau',                            fr: 'Palaos',                           region: 'Oceania', colors: ['blue','yellow'],                     symbols: ['circle'] , ratio: '5:8', shape: 'rectangle' },
  { code: 'ps', en: 'Palestine',                        fr: 'Palestine',                        region: 'Asia',    colors: ['black','white','green','red'],       symbols: ['triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'pa', en: 'Panama',                           fr: 'Panama',                           region: 'Americas',colors: ['white','blue','red'],                symbols: ['stars'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'pg', en: 'Papua New Guinea',                 fr: 'Papouasie-Nouvelle-Guinée',        region: 'Oceania', colors: ['black','red','yellow','white'],      symbols: ['bird of paradise','stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'py', en: 'Paraguay',                         fr: 'Paraguay',                         region: 'Americas',colors: ['red','white','blue'],                symbols: ['star','coat of arms'] , ratio: '3:5', shape: 'rectangle' },
  { code: 'pe', en: 'Peru',                             fr: 'Pérou',                            region: 'Americas',colors: ['red','white'],                       symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ph', en: 'Philippines',                      fr: 'Philippines',                      region: 'Asia',    colors: ['blue','red','white','yellow'],       symbols: ['sun','stars','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'pl', en: 'Poland',                           fr: 'Pologne',                          region: 'Europe',  colors: ['white','red'],                       symbols: [] , ratio: '5:8', shape: 'rectangle' },
  { code: 'pt', en: 'Portugal',                         fr: 'Portugal',                         region: 'Europe',  colors: ['green','red','yellow'],              symbols: ['coat of arms','armillary sphere'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'qa', en: 'Qatar',                            fr: 'Qatar',                            region: 'Asia',    colors: ['maroon','white'],                    symbols: ['serrated band'] , ratio: '11:28', shape: 'rectangle' },
  { code: 'ro', en: 'Romania',                          fr: 'Roumanie',                         region: 'Europe',  colors: ['blue','yellow','red'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ru', en: 'Russia',                           fr: 'Russie',                           region: 'Europe',  colors: ['white','blue','red'],                symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'rw', en: 'Rwanda',                           fr: 'Rwanda',                           region: 'Africa',  colors: ['blue','yellow','green'],             symbols: ['sun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'kn', en: 'Saint Kitts and Nevis',            fr: 'Saint-Kitts-et-Nevis',             region: 'Americas',colors: ['green','yellow','black','red','white'],symbols: ['stars','diagonal'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'lc', en: 'Saint Lucia',                      fr: 'Sainte-Lucie',                     region: 'Americas',colors: ['blue','yellow','black','white'],     symbols: ['triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'vc', en: 'Saint Vincent and the Grenadines', fr: 'Saint-Vincent-et-les-Grenadines',  region: 'Americas',colors: ['blue','yellow','green'],             symbols: ['diamonds'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ws', en: 'Samoa',                            fr: 'Samoa',                            region: 'Oceania', colors: ['red','blue','white'],                symbols: ['stars','cross'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sm', en: 'San Marino',                       fr: 'Saint-Marin',                      region: 'Europe',  colors: ['blue','white'],                      symbols: ['coat of arms','towers'] , ratio: '3:4', shape: 'rectangle' },
  { code: 'st', en: 'Sao Tome and Principe',            fr: 'Sao Tomé-et-Principe',             region: 'Africa',  colors: ['green','yellow','red','black'],      symbols: ['stars','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sa', en: 'Saudi Arabia',                     fr: 'Arabie saoudite',                  region: 'Asia',    colors: ['green','white'],                     symbols: ['sword','text','shahada'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'sn', en: 'Senegal',                          fr: 'Sénégal',                          region: 'Africa',  colors: ['green','yellow','red'],              symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'rs', en: 'Serbia',                           fr: 'Serbie',                           region: 'Europe',  colors: ['red','blue','white'],                symbols: ['coat of arms','eagle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'sc', en: 'Seychelles',                       fr: 'Seychelles',                       region: 'Africa',  colors: ['blue','yellow','red','white','green'],symbols: ['rays'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sl', en: 'Sierra Leone',                     fr: 'Sierra Leone',                     region: 'Africa',  colors: ['green','white','blue'],              symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'sg', en: 'Singapore',                        fr: 'Singapour',                        region: 'Asia',    colors: ['red','white'],                       symbols: ['crescent','stars'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'sk', en: 'Slovakia',                         fr: 'Slovaquie',                        region: 'Europe',  colors: ['white','blue','red'],                symbols: ['cross','coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'si', en: 'Slovenia',                         fr: 'Slovénie',                         region: 'Europe',  colors: ['white','blue','red'],                symbols: ['coat of arms','stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sb', en: 'Solomon Islands',                  fr: 'Îles Salomon',                     region: 'Oceania', colors: ['blue','green','yellow','white'],     symbols: ['stars','diagonal'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'so', en: 'Somalia',                          fr: 'Somalie',                          region: 'Africa',  colors: ['blue','white'],                      symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'za', en: 'South Africa',                     fr: 'Afrique du Sud',                   region: 'Africa',  colors: ['red','green','blue','black','white','yellow'],symbols: ['y-shape','chevron'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'kr', en: 'South Korea',                      fr: 'Corée du Sud',                     region: 'Asia',    colors: ['white','red','blue','black'],        symbols: ['yin yang','trigrams'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ss', en: 'South Sudan',                      fr: 'Soudan du Sud',                    region: 'Africa',  colors: ['black','red','green','white','blue','yellow'],symbols: ['star','triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'es', en: 'Spain',                            fr: 'Espagne',                          region: 'Europe',  colors: ['red','yellow'],                      symbols: ['coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'lk', en: 'Sri Lanka',                        fr: 'Sri Lanka',                        region: 'Asia',    colors: ['maroon','orange','green','yellow'],  symbols: ['lion','sword','bo leaves'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sd', en: 'Sudan',                            fr: 'Soudan',                           region: 'Africa',  colors: ['red','white','black','green'],       symbols: ['triangle'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'sr', en: 'Suriname',                         fr: 'Suriname',                         region: 'Americas',colors: ['green','white','red','yellow'],      symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'se', en: 'Sweden',                           fr: 'Suède',                            region: 'Europe',  colors: ['blue','yellow'],                     symbols: ['cross'] , ratio: '5:8', shape: 'rectangle' },
  { code: 'ch', en: 'Switzerland',                      fr: 'Suisse',                           region: 'Europe',  colors: ['red','white'],                       symbols: ['cross'] , ratio: '1:1', shape: 'square' },
  { code: 'sy', en: 'Syria',                            fr: 'Syrie',                            region: 'Asia',    colors: ['red','white','black','green'],       symbols: ['stars'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tw', en: 'Taiwan',                           fr: 'Taïwan',                           region: 'Asia',    colors: ['red','blue','white'],                symbols: ['sun'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tj', en: 'Tajikistan',                       fr: 'Tadjikistan',                      region: 'Asia',    colors: ['red','white','green'],               symbols: ['crown','stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'tz', en: 'Tanzania',                         fr: 'Tanzanie',                         region: 'Africa',  colors: ['green','yellow','black','blue'],     symbols: ['diagonal'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'th', en: 'Thailand',                         fr: 'Thaïlande',                        region: 'Asia',    colors: ['red','white','blue'],                symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tl', en: 'Timor-Leste',                      fr: 'Timor oriental',                   region: 'Asia',    colors: ['red','yellow','black','white'],      symbols: ['star','triangles'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'tg', en: 'Togo',                             fr: 'Togo',                             region: 'Africa',  colors: ['green','yellow','red','white'],      symbols: ['star'] , ratio: '1:1.618', shape: 'rectangle' },
  { code: 'to', en: 'Tonga',                            fr: 'Tonga',                            region: 'Oceania', colors: ['red','white'],                       symbols: ['cross'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'tt', en: 'Trinidad and Tobago',              fr: 'Trinité-et-Tobago',                region: 'Americas',colors: ['red','black','white'],               symbols: ['diagonal'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tn', en: 'Tunisia',                          fr: 'Tunisie',                          region: 'Africa',  colors: ['red','white'],                       symbols: ['crescent','star','circle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tr', en: 'Turkey',                           fr: 'Turquie',                          region: 'Asia',    colors: ['red','white'],                       symbols: ['crescent','star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tm', en: 'Turkmenistan',                     fr: 'Turkménistan',                     region: 'Asia',    colors: ['green','red','white'],               symbols: ['crescent','stars','carpet pattern'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'tv', en: 'Tuvalu',                           fr: 'Tuvalu',                           region: 'Oceania', colors: ['blue','yellow','white'],             symbols: ['stars','union jack'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ae', en: 'UAE',                              fr: 'Émirats arabes unis',              region: 'Asia',    colors: ['red','green','white','black'],       symbols: [] , ratio: '1:2', shape: 'rectangle' },
  { code: 'ug', en: 'Uganda',                           fr: 'Ouganda',                          region: 'Africa',  colors: ['black','yellow','red','white'],      symbols: ['bird','crested crane'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ua', en: 'Ukraine',                          fr: 'Ukraine',                          region: 'Europe',  colors: ['blue','yellow'],                     symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'gb', en: 'United Kingdom',                   fr: 'Royaume-Uni',                      region: 'Europe',  colors: ['blue','red','white'],                symbols: ['union jack','cross'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'us', en: 'United States',                    fr: 'États-Unis',                       region: 'Americas',colors: ['red','white','blue'],                symbols: ['stars','stripes'] , ratio: '10:19', shape: 'rectangle' },
  { code: 'uy', en: 'Uruguay',                          fr: 'Uruguay',                          region: 'Americas',colors: ['blue','white','yellow'],             symbols: ['sun','stripes'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'uz', en: 'Uzbekistan',                       fr: 'Ouzbékistan',                      region: 'Asia',    colors: ['blue','white','green','red'],        symbols: ['crescent','stars'] , ratio: '1:2', shape: 'rectangle' },
  { code: 'vu', en: 'Vanuatu',                          fr: 'Vanuatu',                          region: 'Oceania', colors: ['red','green','black','yellow'],      symbols: ['boar tusk','triangle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'va', en: 'Vatican City',                     fr: 'Vatican',                          region: 'Europe',  colors: ['yellow','white'],                    symbols: ['coat of arms','keys'] , ratio: '1:1', shape: 'square' },
  { code: 've', en: 'Venezuela',                        fr: 'Venezuela',                        region: 'Americas',colors: ['red','yellow','blue'],               symbols: ['stars','coat of arms'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'vn', en: 'Vietnam',                          fr: 'Viêt Nam',                         region: 'Asia',    colors: ['red','yellow'],                      symbols: ['star'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'ye', en: 'Yemen',                            fr: 'Yémen',                            region: 'Asia',    colors: ['red','white','black'],               symbols: [] , ratio: '2:3', shape: 'rectangle' },
  { code: 'zm', en: 'Zambia',                           fr: 'Zambie',                           region: 'Africa',  colors: ['green','red','black','orange'],      symbols: ['eagle'] , ratio: '2:3', shape: 'rectangle' },
  { code: 'zw', en: 'Zimbabwe',                         fr: 'Zimbabwe',                         region: 'Africa',  colors: ['green','yellow','red','black','white'],symbols: ['bird','star'] , ratio: '1:2', shape: 'rectangle' },
]

const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

const COLOR_OPTIONS = [
  { key: 'red',    label: { en: 'Red',    fr: 'Rouge'  }, hex: '#ef4444' },
  { key: 'blue',   label: { en: 'Blue',   fr: 'Bleu'   }, hex: '#3b82f6' },
  { key: 'green',  label: { en: 'Green',  fr: 'Vert'   }, hex: '#22c55e' },
  { key: 'yellow', label: { en: 'Yellow', fr: 'Jaune'  }, hex: '#eab308' },
  { key: 'white',  label: { en: 'White',  fr: 'Blanc'  }, hex: '#e5e7eb', border: true },
  { key: 'black',  label: { en: 'Black',  fr: 'Noir'   }, hex: '#1f2937' },
  { key: 'orange', label: { en: 'Orange', fr: 'Orange' }, hex: '#f97316' },
  { key: 'purple', label: { en: 'Purple', fr: 'Violet' }, hex: '#7c3aed' },
]

const SYMBOL_OPTIONS = [
  { key: 'star',        label: { en: 'Star',         fr: 'Étoile'     } },
  { key: 'cross',       label: { en: 'Cross',         fr: 'Croix'      } },
  { key: 'crescent',    label: { en: 'Crescent',      fr: 'Croissant'  } },
  { key: 'eagle',       label: { en: 'Eagle',         fr: 'Aigle'      } },
  { key: 'sun',         label: { en: 'Sun',           fr: 'Soleil'     } },
  { key: 'coat of arms',label: { en: 'Coat of Arms',  fr: 'Blason'     } },
  { key: 'stripes',     label: { en: 'Stripes',       fr: 'Rayures'    } },
  { key: 'triangle',    label: { en: 'Triangle',      fr: 'Triangle'   } },
  { key: 'dragon',      label: { en: 'Dragon',        fr: 'Dragon'     } },
  { key: 'union jack',  label: { en: 'Union Jack',    fr: 'Union Jack' } },
  { key: '__weapon',    label: { en: 'Any weapon',    fr: 'Arme (tout type)'  }, special: 'weapon'  },
  { key: '__firearm',   label: { en: 'Firearm',       fr: 'Arme à feu'         }, special: 'firearm' },
  { key: '__blade',     label: { en: 'Blade weapon',  fr: 'Arme blanche'      }, special: 'blade'   },
]

const FIREARM_SYMBOLS = ['gun', 'rifle', 'musket', 'cannon', 'firearms']
const BLADE_SYMBOLS   = ['sword', 'swords', 'dagger', 'machete', 'spear', 'spears', 'trident', 'knife', 'saber']
const ALL_WEAPON_SYMBOLS = [...FIREARM_SYMBOLS, ...BLADE_SYMBOLS]

function matchesSymbolFilter(country, key) {
  if (key === '__weapon')  return country.symbols.some(s => ALL_WEAPON_SYMBOLS.some(w => s.includes(w)))
  if (key === '__firearm') return country.symbols.some(s => FIREARM_SYMBOLS.some(w => s.includes(w)))
  if (key === '__blade')   return country.symbols.some(s => BLADE_SYMBOLS.some(w => s.includes(w)))
  return country.symbols.some(s => s.includes(key))
}

const RATIO_OPTIONS = [
  { key: '2:3',    label: { en: '2:3',    fr: '2:3'    } },
  { key: '1:2',    label: { en: '1:2',    fr: '1:2'    } },
  { key: '3:5',    label: { en: '3:5',    fr: '3:5'    } },
  { key: '1:1',    label: { en: '1:1',    fr: '1:1'    } },
  { key: '3:4',    label: { en: '3:4',    fr: '3:4'    } },
  { key: '4:5',    label: { en: '4:5',    fr: '4:5'    } },
  { key: '4:7',    label: { en: '4:7',    fr: '4:7'    } },
  { key: '5:8',    label: { en: '5:8',    fr: '5:8'    } },
  { key: '6:7',    label: { en: '6:7',    fr: '6:7'    } },
  { key: '7:10',   label: { en: '7:10',   fr: '7:10'   } },
  { key: '7:11',   label: { en: '7:11',   fr: '7:11'   } },
  { key: '8:11',   label: { en: '8:11',   fr: '8:11'   } },
  { key: '9:14',   label: { en: '9:14',   fr: '9:14'   } },
  { key: '10:19',  label: { en: '10:19',  fr: '10:19'  } },
  { key: '11:18',  label: { en: '11:18',  fr: '11:18'  } },
  { key: '11:28',  label: { en: '11:28',  fr: '11:28'  } },
  { key: '18:25',  label: { en: '18:25',  fr: '18:25'  } },
  { key: '28:37',  label: { en: '28:37',  fr: '28:37'  } },
  { key: '1:1.4',  label: { en: '1:1.4',  fr: '1:1.4'  } },
  { key: '189:335',label: { en: '189:335',fr: '189:335' } },
  { key: '4:3',    label: { en: '4:3 (Pennant)', fr: '4:3 (Pennon)' } },
]

const SHAPE_OPTIONS = [
  { key: 'rectangle', label: { en: 'Rectangle', fr: 'Rectangle' } },
  { key: 'square',    label: { en: 'Square',    fr: 'Carré'     } },
  { key: 'pennant',   label: { en: 'Pennant',   fr: 'Pennon'    } },
]

export default function CountryListingPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('az') // az | za
  const [activeRegions, setActiveRegions] = useState([])
  const [activeColors, setActiveColors] = useState([])
  const [activeSymbols, setActiveSymbols] = useState([])
  const [activeRatios, setActiveRatios] = useState([])
  const [activeShapes, setActiveShapes] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openSections, setOpenSections] = useState({})
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))


  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 1024) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  function toggle(arr, setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  const filtered = useMemo(() => {
    let list = [...COUNTRIES]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => getName(c).toLowerCase().includes(q))
    }
    if (activeRegions.length > 0) {
      list = list.filter(c => activeRegions.includes(c.region))
    }
    if (activeColors.length > 0) {
      list = list.filter(c => activeColors.every(col => c.colors.includes(col)))
    }
    if (activeSymbols.length > 0) {
      list = list.filter(c => activeSymbols.every(sym => matchesSymbolFilter(c, sym)))
    }
    if (activeRatios.length > 0) {
      list = list.filter(c => activeRatios.includes(c.ratio))
    }
    if (activeShapes.length > 0) {
      list = list.filter(c => activeShapes.includes(c.shape))
    }

    list.sort((a, b) => {
      const na = getName(a); const nb = getName(b)
      return sortOrder === 'az' ? na.localeCompare(nb) : nb.localeCompare(na)
    })

    return list
  }, [search, activeRegions, activeColors, activeSymbols, activeRatios, activeShapes, sortOrder, locale])

  const hasFilters = activeRegions.length > 0 || activeColors.length > 0 || activeSymbols.length > 0 || activeRatios.length > 0 || activeShapes.length > 0 || search

  function clearAll() {
    setSearch(''); setActiveRegions([]); setActiveColors([]); setActiveSymbols([]); setActiveRatios([]); setActiveShapes([])
  }

  const chipStyle = (active) => ({
    padding: '7px 14px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0',
    backgroundColor: active ? '#0B1F3B' : '#fafafa',
    color: active ? 'white' : '#475569',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  const FilterSection = ({ sectionKey, label, children }) => {
    const isOpen = openSections[sectionKey]
    return (
      <div style={{ marginBottom: '4px', borderBottom: '1px solid #f0f0f0' }}>
        <button
          onClick={() => toggleSection(sectionKey)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#0B1F3B' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {label}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="2,4 7,10 12,4"/>
          </svg>
        </button>
        {isOpen && (
          <div style={{ paddingBottom: '16px' }}>
            {children}
          </div>
        )}
      </div>
    )
  }


  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: "var(--font-body), system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 4px', letterSpacing: '-1px' }}>
            {t('Country Flags', 'Drapeaux des pays')}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            {COUNTRIES.length} {t('countries', 'pays')}
          </p>
        </div>

        {/* ── MOBILE LAYOUT ───────────────────────────────────────────── */}
        {isMobile && (
          <div>

            {/* Sticky filter button */}
            <div style={{ position: 'sticky', top: '60px', zIndex: 40, backgroundColor: '#F4F1E6', paddingBottom: '12px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a country…', 'Rechercher un pays…')}
                    style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '10px', border: '1.5px solid #ddd', backgroundColor: 'white', fontSize: '15px', color: '#0B1F3B', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setFiltersOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', borderRadius: '10px', border: hasFilters ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: hasFilters ? '#0B1F3B' : 'white', color: hasFilters ? 'white' : '#475569', fontWeight: '700', fontSize: '14px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', height: '46px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                  </svg>
                  {t('Filters', 'Filtres')}
                  {hasFilters && (
                    <span style={{ backgroundColor: '#9EB7E5', color: '#0B1F3B', borderRadius: '99px', fontSize: '11px', fontWeight: '900', padding: '1px 7px' }}>
                      {[activeRegions, activeColors, activeSymbols, activeRatios, activeShapes].flat().length}
                    </span>
                  )}
                </button>
              </div>

              {/* Result count + sort inline */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                  <span style={{ fontWeight: '900', color: '#0B1F3B' }}>{filtered.length}</span> {t('countries', 'pays')}
                  {hasFilters && (
                    <button onClick={clearAll} style={{ marginLeft: '10px', fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', padding: 0 }}>
                      {t('Clear', 'Effacer')}
                    </button>
                  )}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setSortOrder('az')} style={{ ...chipStyle(sortOrder === 'az'), padding: '5px 12px', fontSize: '12px' }}>A→Z</button>
                  <button onClick={() => setSortOrder('za')} style={{ ...chipStyle(sortOrder === 'za'), padding: '5px 12px', fontSize: '12px' }}>Z→A</button>
                </div>
              </div>
            </div>

            {/* Side panel overlay */}
            {filtersOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
                {/* Backdrop */}
                <div onClick={() => setFiltersOpen(false)}
                  style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />

                {/* Panel */}
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(85vw, 360px)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.18)' }}>

                  {/* Panel header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0B1F3B' }}>
                        {t('Filters', 'Filtres')}
                      </h2>
                      {hasFilters && (
                        <span style={{ backgroundColor: '#0B1F3B', color: 'white', borderRadius: '99px', fontSize: '11px', fontWeight: '900', padding: '2px 8px' }}>
                          {[activeRegions, activeColors, activeSymbols, activeRatios, activeShapes].flat().length}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setFiltersOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="17" y2="17"/><line x1="17" y1="3" x2="3" y2="17"/>
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable filter content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

                    {/* Regions */}
                    <FilterSection sectionKey="region" label={t('Region', 'Région')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {REGIONS.map(r => (
                          <button key={r} onClick={() => toggle(activeRegions, setActiveRegions, r)} style={chipStyle(activeRegions.includes(r))}>
                            {locale === 'fr' ? REGION_LABELS[r] : r}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Colors */}
                    <FilterSection sectionKey="colors" label={t('Dominant Colors', 'Couleurs dominantes')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {COLOR_OPTIONS.map(c => {
                          const active = activeColors.includes(c.key)
                          return (
                            <button key={c.key} onClick={() => toggle(activeColors, setActiveColors, c.key)}
                              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, flexShrink: 0, border: c.border ? '1px solid #ccc' : 'none' }} />
                              {c.label[locale] || c.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                    {/* Symbols */}
                    <FilterSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {SYMBOL_OPTIONS.map(s => (
                          <button key={s.key} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)} style={chipStyle(activeSymbols.includes(s.key))}>
                            {s.label[locale] || s.label.en}
                          </button>
                        ))}
                      </div>
                    </FilterSection>

                    {/* Ratio */}
                    <FilterSection sectionKey="ratio" label={t('Ratio', 'Ratio')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {RATIO_OPTIONS.map(r => {
                          const active = activeRatios.includes(r.key)
                          const parts = r.key.replace(' (Pennant)','').replace(' (Pennon)','').split(':')
                          const rw = parseFloat(parts[1]); const rh = parseFloat(parts[0])
                          const maxDim = 40
                          const svgW = Math.round(maxDim * (rw / Math.max(rw, rh)))
                          const svgH = Math.round(maxDim * (rh / Math.max(rw, rh)))
                          const isPennant = r.key.includes('4:3')
                          return (
                            <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '52px' }}>
                              <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ display: 'block' }}>
                                {isPennant
                                  ? <polygon points={`1,1 1,${svgH-1} ${svgW-1},${Math.round(svgH/2)}`} fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2" strokeLinejoin="round"/>
                                  : <rect x="0.5" y="0.5" width={svgW-1} height={svgH-1} rx="1.5" fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2"/>
                                }
                              </svg>
                              {r.label[locale] || r.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                    {/* Shape */}
                    <FilterSection sectionKey="shape" label={t('Shape', 'Forme')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {SHAPE_OPTIONS.map(s => {
                          const active = activeShapes.includes(s.key)
                          const fill = active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'
                          const stroke = active ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                          const shapeIcon = {
                            rectangle: <svg viewBox="0 0 36 24" width="36" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="35" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                            square:    <svg viewBox="0 0 24 24" width="24" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="23" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                            pennant:   <svg viewBox="0 0 36 28" width="36" height="28" style={{display:'block'}}><polygon points="1,1 1,27 35,14" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                          }[s.key]
                          return (
                            <button key={s.key} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '64px' }}>
                              {shapeIcon}
                              {s.label[locale] || s.label.en}
                            </button>
                          )
                        })}
                      </div>
                    </FilterSection>

                  </div>

                  {/* Sticky bottom Apply button */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0, backgroundColor: 'white' }}>
                    {hasFilters && (
                      <button onClick={clearAll}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                        </svg>
                        {t('Clear filters', 'Effacer les filtres')}
                      </button>
                    )}
                    <button onClick={() => setFiltersOpen(false)}
                      style={{ width: '100%', padding: '14px', backgroundColor: '#0B1F3B', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>
                      {t('Apply', 'Appliquer')} — {filtered.length} {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Mobile grid — 2 columns */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                <p style={{ fontSize: '15px', fontWeight: '600' }}>{t('No countries match', 'Aucun pays ne correspond')}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {filtered.map(country => (
                  <a key={country.code} href={`/${locale}/countries/${country.code}`}
                    style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ aspectRatio: '3/2', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`https://flagcdn.com/w160/${country.code}.png`} alt={getName(country)} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '5px' }} />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(country)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>{locale === 'fr' ? REGION_LABELS[country.region] : country.region}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

          </div>
        )}


        {/* ── DESKTOP LAYOUT ──────────────────────────────────────────── */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

            <div style={{ width: 'min(340px, 100%)', flexShrink: 0, position: 'sticky', top: '76px', alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px 20px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>

              {/* Results + Clear */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1F3B', color: 'white', fontWeight: '900', fontSize: '20px', borderRadius: '10px', padding: '4px 14px', letterSpacing: '-0.5px', minWidth: '52px' }}>
                    {filtered.length}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                    {filtered.length === 1 ? t('country', 'pays') : t('countries', 'pays')}
                  </span>
                </div>
                {hasFilters && (
                  <button onClick={clearAll}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/>
                    </svg>
                    {t('Clear', 'Effacer')}
                  </button>
                )}
              </div>

              {/* Regions */}
              <FilterSection sectionKey="region" label={t('Region', 'Région')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => toggle(activeRegions, setActiveRegions, r)} style={chipStyle(activeRegions.includes(r))}>
                      {locale === 'fr' ? REGION_LABELS[r] : r}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Colors */}
              <FilterSection sectionKey="colors" label={t('Dominant Colors', 'Couleurs dominantes')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COLOR_OPTIONS.map(c => {
                    const active = activeColors.includes(c.key)
                    return (
                      <button key={c.key} onClick={() => toggle(activeColors, setActiveColors, c.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #e2e8f0', backgroundColor: active ? '#0B1F3B' : '#fafafa', color: active ? 'white' : '#475569', transition: 'all 0.15s' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, flexShrink: 0, border: c.border ? '1px solid #ccc' : 'none' }} />
                        {c.label[locale] || c.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Symbols */}
              <FilterSection sectionKey="symbols" label={t('Symbols', 'Symboles')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SYMBOL_OPTIONS.map(s => (
                    <button key={s.key} onClick={() => toggle(activeSymbols, setActiveSymbols, s.key)} style={chipStyle(activeSymbols.includes(s.key))}>
                      {s.label[locale] || s.label.en}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Ratio */}
              <FilterSection sectionKey="ratio" label={t('Ratio', 'Ratio')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {RATIO_OPTIONS.map(r => {
                    const active = activeRatios.includes(r.key)
                    const parts = r.key.replace(' (Pennant)','').replace(' (Pennon)','').split(':')
                    const rw = parseFloat(parts[1]); const rh = parseFloat(parts[0])
                    const maxDim = 40
                    const svgW = Math.round(maxDim * (rw / Math.max(rw, rh)))
                    const svgH = Math.round(maxDim * (rh / Math.max(rw, rh)))
                    const isPennant = r.key.includes('4:3')
                    return (
                      <button key={r.key} onClick={() => toggle(activeRatios, setActiveRatios, r.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '52px' }}>
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH} style={{ display: 'block' }}>
                          {isPennant
                            ? <polygon points={`1,1 1,${svgH-1} ${svgW-1},${Math.round(svgH/2)}`} fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2" strokeLinejoin="round"/>
                            : <rect x="0.5" y="0.5" width={svgW-1} height={svgH-1} rx="1.5" fill={active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'} stroke={active ? 'rgba(255,255,255,0.8)' : '#94a3b8'} strokeWidth="1.2"/>
                          }
                        </svg>
                        {r.label[locale] || r.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

              {/* Shape */}
              <FilterSection sectionKey="shape" label={t('Shape', 'Forme')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SHAPE_OPTIONS.map(s => {
                    const active = activeShapes.includes(s.key)
                    const fill = active ? 'rgba(255,255,255,0.25)' : '#e2e8f0'
                    const stroke = active ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                    const shapeIcon = {
                      rectangle: <svg viewBox="0 0 36 24" width="36" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="35" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                      square:    <svg viewBox="0 0 24 24" width="24" height="24" style={{display:'block'}}><rect x="0.5" y="0.5" width="23" height="23" rx="2" fill={fill} stroke={stroke} strokeWidth="1.2"/></svg>,
                      pennant:   <svg viewBox="0 0 36 28" width="36" height="28" style={{display:'block'}}><polygon points="1,1 1,27 35,14" fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
                    }[s.key]
                    return (
                      <button key={s.key} onClick={() => toggle(activeShapes, setActiveShapes, s.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: active ? '2px solid #0B1F3B' : '1.5px solid #ddd', backgroundColor: active ? '#0B1F3B' : 'white', color: active ? 'white' : '#64748b', transition: 'all 0.15s', minWidth: '64px' }}>
                        {shapeIcon}
                        {s.label[locale] || s.label.en}
                      </button>
                    )
                  })}
                </div>
              </FilterSection>

            </div>

            {/* Right column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Search + sort */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('Search a country…', 'Rechercher un pays…')}
                    style={{ width: '100%', padding: '11px 16px 11px 40px', borderRadius: '10px', border: '1.5px solid #ddd', backgroundColor: 'white', fontSize: '15px', color: '#0B1F3B', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setSortOrder('az')} style={chipStyle(sortOrder === 'az')}>A → Z</button>
                  <button onClick={() => setSortOrder('za')} style={chipStyle(sortOrder === 'za')}>Z → A</button>
                </div>
              </div>

              {/* Grid — 4 cols */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>{t('No countries match your filters', 'Aucun pays ne correspond aux filtres')}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {filtered.map(country => (
                    <Link key={country.code} href={`/${locale}/countries/${country.code}`}
                      style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={`https://flagcdn.com/w320/${country.code}.png`}
                          alt={getName(country)}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }}
                        />
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getName(country)}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                          {locale === 'fr' ? REGION_LABELS[country.region] : country.region}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  )
}