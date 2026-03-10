'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

// ── Countries ──────────────────────────────────────────────────────────────────
const ALL_COUNTRIES = [
  // EUROPE
  { code: 'al', en: 'Albania',                  fr: 'Albanie',            continent: 'europe',           population: 2842321,    medianAge: 36.9, official: true },
  { code: 'ad', en: 'Andorra',                  fr: 'Andorre',            continent: 'europe',           population: 77543,      medianAge: 44.0, official: true },
  { code: 'at', en: 'Austria',                  fr: 'Autriche',           continent: 'europe',           population: 9042000,    medianAge: 44.5, official: true },
  { code: 'by', en: 'Belarus',                  fr: 'Biélorussie',        continent: 'europe',           population: 9449323,    medianAge: 40.2, official: true },
  { code: 'be', en: 'Belgium',                  fr: 'Belgique',           continent: 'europe',           population: 11589623,   medianAge: 41.5, official: true },
  { code: 'ba', en: 'Bosnia',                   fr: 'Bosnie',             continent: 'europe',           population: 3280819,    medianAge: 43.1, official: true },
  { code: 'bg', en: 'Bulgaria',                 fr: 'Bulgarie',           continent: 'europe',           population: 6520314,    medianAge: 44.2, official: true },
  { code: 'hr', en: 'Croatia',                  fr: 'Croatie',            continent: 'europe',           population: 4047200,    medianAge: 44.3, official: true },
  { code: 'cy', en: 'Cyprus',                   fr: 'Chypre',             continent: 'europe',           population: 1207359,    medianAge: 37.2, official: true },
  { code: 'cz', en: 'Czechia',                  fr: 'Tchéquie',           continent: 'europe',           population: 10708981,   medianAge: 43.0, official: true },
  { code: 'dk', en: 'Denmark',                  fr: 'Danemark',           continent: 'europe',           population: 5831404,    medianAge: 42.3, official: true },
  { code: 'ee', en: 'Estonia',                  fr: 'Estonie',            continent: 'europe',           population: 1331057,    medianAge: 43.5, official: true },
  { code: 'fi', en: 'Finland',                  fr: 'Finlande',           continent: 'europe',           population: 5540720,    medianAge: 43.1, official: true },
  { code: 'fr', en: 'France',                   fr: 'France',             continent: 'europe',           population: 67391582,   medianAge: 41.7, official: true },
  { code: 'de', en: 'Germany',                  fr: 'Allemagne',          continent: 'europe',           population: 83783942,   medianAge: 45.7, official: true },
  { code: 'gr', en: 'Greece',                   fr: 'Grèce',              continent: 'europe',           population: 10715000,   medianAge: 45.4, official: true },
  { code: 'hu', en: 'Hungary',                  fr: 'Hongrie',            continent: 'europe',           population: 9749763,    medianAge: 43.2, official: true },
  { code: 'is', en: 'Iceland',                  fr: 'Islande',            continent: 'europe',           population: 341243,     medianAge: 37.2, official: true },
  { code: 'ie', en: 'Ireland',                  fr: 'Irlande',            continent: 'europe',           population: 4937786,    medianAge: 37.8, official: true },
  { code: 'it', en: 'Italy',                    fr: 'Italie',             continent: 'europe',           population: 60461826,   medianAge: 47.3, official: true },
  { code: 'xk', en: 'Kosovo',                   fr: 'Kosovo',             continent: 'europe',           population: 1810366,    medianAge: 30.0, official: false },
  { code: 'lv', en: 'Latvia',                   fr: 'Lettonie',           continent: 'europe',           population: 1886198,    medianAge: 44.4, official: true },
  { code: 'li', en: 'Liechtenstein',            fr: 'Liechtenstein',      continent: 'europe',           population: 38128,      medianAge: 43.5, official: true },
  { code: 'lt', en: 'Lithuania',                fr: 'Lituanie',           continent: 'europe',           population: 2722289,    medianAge: 44.5, official: true },
  { code: 'lu', en: 'Luxembourg',               fr: 'Luxembourg',         continent: 'europe',           population: 625978,     medianAge: 39.3, official: true },
  { code: 'mt', en: 'Malta',                    fr: 'Malte',              continent: 'europe',           population: 441543,     medianAge: 41.5, official: true },
  { code: 'md', en: 'Moldova',                  fr: 'Moldavie',           continent: 'europe',           population: 4033963,    medianAge: 38.5, official: true },
  { code: 'mc', en: 'Monaco',                   fr: 'Monaco',             continent: 'europe',           population: 39242,      medianAge: 55.4, official: true },
  { code: 'me', en: 'Montenegro',               fr: 'Monténégro',         continent: 'europe',           population: 628066,     medianAge: 38.9, official: true },
  { code: 'nl', en: 'Netherlands',              fr: 'Pays-Bas',           continent: 'europe',           population: 17134872,   medianAge: 42.8, official: true },
  { code: 'mk', en: 'North Macedonia',          fr: 'Macédoine du Nord',  continent: 'europe',           population: 2083459,    medianAge: 38.4, official: true },
  { code: 'no', en: 'Norway',                   fr: 'Norvège',            continent: 'europe',           population: 5421241,    medianAge: 39.5, official: true },
  { code: 'pl', en: 'Poland',                   fr: 'Pologne',            continent: 'europe',           population: 37950802,   medianAge: 42.3, official: true },
  { code: 'pt', en: 'Portugal',                 fr: 'Portugal',           continent: 'europe',           population: 10196709,   medianAge: 44.6, official: true },
  { code: 'ro', en: 'Romania',                  fr: 'Roumanie',           continent: 'europe',           population: 19237691,   medianAge: 42.5, official: true },
  { code: 'ru', en: 'Russia',                   fr: 'Russie',             continent: 'europe',           population: 145934462,  medianAge: 39.6, official: true },
  { code: 'sm', en: 'San Marino',               fr: 'Saint-Marin',        continent: 'europe',           population: 33931,      medianAge: 45.2, official: true },
  { code: 'rs', en: 'Serbia',                   fr: 'Serbie',             continent: 'europe',           population: 8737371,    medianAge: 43.2, official: true },
  { code: 'sk', en: 'Slovakia',                 fr: 'Slovaquie',          continent: 'europe',           population: 5459642,    medianAge: 41.3, official: true },
  { code: 'si', en: 'Slovenia',                 fr: 'Slovénie',           continent: 'europe',           population: 2078938,    medianAge: 44.5, official: true },
  { code: 'es', en: 'Spain',                    fr: 'Espagne',            continent: 'europe',           population: 46754778,   medianAge: 44.9, official: true },
  { code: 'se', en: 'Sweden',                   fr: 'Suède',              continent: 'europe',           population: 10099265,   medianAge: 41.1, official: true },
  { code: 'ch', en: 'Switzerland',              fr: 'Suisse',             continent: 'europe',           population: 8654622,    medianAge: 43.1, official: true },
  { code: 'ua', en: 'Ukraine',                  fr: 'Ukraine',            continent: 'europe',           population: 43733762,   medianAge: 41.4, official: true },
  { code: 'gb', en: 'United Kingdom',           fr: 'Royaume-Uni',        continent: 'europe',           population: 67886011,   medianAge: 40.5, official: true },
  { code: 'va', en: 'Vatican',                  fr: 'Vatican',            continent: 'europe',           population: 801,        medianAge: 55.0, official: true },

  // AFRICA
  { code: 'dz', en: 'Algeria',                  fr: 'Algérie',            continent: 'africa',           population: 43851044,   medianAge: 28.5, official: true },
  { code: 'ao', en: 'Angola',                   fr: 'Angola',             continent: 'africa',           population: 32866272,   medianAge: 16.8, official: true },
  { code: 'bj', en: 'Benin',                    fr: 'Bénin',              continent: 'africa',           population: 12123200,   medianAge: 18.2, official: true },
  { code: 'bw', en: 'Botswana',                 fr: 'Botswana',           continent: 'africa',           population: 2351627,    medianAge: 25.8, official: true },
  { code: 'bf', en: 'Burkina Faso',             fr: 'Burkina Faso',       continent: 'africa',           population: 21510181,   medianAge: 17.6, official: true },
  { code: 'bi', en: 'Burundi',                  fr: 'Burundi',            continent: 'africa',           population: 11890781,   medianAge: 17.5, official: true },
  { code: 'cv', en: 'Cape Verde',               fr: 'Cap-Vert',           continent: 'africa',           population: 555987,     medianAge: 26.8, official: true },
  { code: 'cm', en: 'Cameroon',                 fr: 'Cameroun',           continent: 'africa',           population: 26545863,   medianAge: 18.5, official: true },
  { code: 'cf', en: 'Central African Republic', fr: 'RCA',                continent: 'africa',           population: 4829767,    medianAge: 18.4, official: true },
  { code: 'td', en: 'Chad',                     fr: 'Tchad',              continent: 'africa',           population: 16425864,   medianAge: 17.0, official: true },
  { code: 'km', en: 'Comoros',                  fr: 'Comores',            continent: 'africa',           population: 869601,     medianAge: 19.9, official: true },
  { code: 'cg', en: 'Congo',                    fr: 'Congo',              continent: 'africa',           population: 5518087,    medianAge: 19.5, official: true },
  { code: 'cd', en: 'DR Congo',                 fr: 'RDC',                continent: 'africa',           population: 89561403,   medianAge: 16.7, official: true },
  { code: 'ci', en: "Côte d'Ivoire",            fr: "Côte d'Ivoire",      continent: 'africa',           population: 26378274,   medianAge: 18.7, official: true },
  { code: 'dj', en: 'Djibouti',                 fr: 'Djibouti',           continent: 'africa',           population: 988000,     medianAge: 24.2, official: true },
  { code: 'eg', en: 'Egypt',                    fr: 'Égypte',             continent: 'africa',           population: 102334404,  medianAge: 25.3, official: true },
  { code: 'gq', en: 'Equatorial Guinea',        fr: 'Guinée équatoriale', continent: 'africa',           population: 1402985,    medianAge: 21.8, official: true },
  { code: 'er', en: 'Eritrea',                  fr: 'Érythrée',           continent: 'africa',           population: 3546421,    medianAge: 19.2, official: true },
  { code: 'sz', en: 'Eswatini',                 fr: 'Eswatini',           continent: 'africa',           population: 1160164,    medianAge: 21.5, official: true },
  { code: 'et', en: 'Ethiopia',                 fr: 'Éthiopie',           continent: 'africa',           population: 114963588,  medianAge: 19.8, official: true },
  { code: 'ga', en: 'Gabon',                    fr: 'Gabon',              continent: 'africa',           population: 2225734,    medianAge: 22.8, official: true },
  { code: 'gm', en: 'Gambia',                   fr: 'Gambie',             continent: 'africa',           population: 2416668,    medianAge: 17.8, official: true },
  { code: 'gh', en: 'Ghana',                    fr: 'Ghana',              continent: 'africa',           population: 31072940,   medianAge: 21.5, official: true },
  { code: 'gn', en: 'Guinea',                   fr: 'Guinée',             continent: 'africa',           population: 13132795,   medianAge: 18.8, official: true },
  { code: 'gw', en: 'Guinea-Bissau',            fr: 'Guinée-Bissau',      continent: 'africa',           population: 1968001,    medianAge: 19.5, official: true },
  { code: 'ke', en: 'Kenya',                    fr: 'Kenya',              continent: 'africa',           population: 53771296,   medianAge: 20.1, official: true },
  { code: 'ls', en: 'Lesotho',                  fr: 'Lesotho',            continent: 'africa',           population: 2142249,    medianAge: 24.7, official: true },
  { code: 'lr', en: 'Liberia',                  fr: 'Liberia',            continent: 'africa',           population: 5057681,    medianAge: 19.0, official: true },
  { code: 'ly', en: 'Libya',                    fr: 'Libye',              continent: 'africa',           population: 6871292,    medianAge: 29.0, official: true },
  { code: 'mg', en: 'Madagascar',               fr: 'Madagascar',         continent: 'africa',           population: 27691018,   medianAge: 19.6, official: true },
  { code: 'mw', en: 'Malawi',                   fr: 'Malawi',             continent: 'africa',           population: 19129952,   medianAge: 17.4, official: true },
  { code: 'ml', en: 'Mali',                     fr: 'Mali',               continent: 'africa',           population: 20250833,   medianAge: 16.3, official: true },
  { code: 'mr', en: 'Mauritania',               fr: 'Mauritanie',         continent: 'africa',           population: 4649658,    medianAge: 20.3, official: true },
  { code: 'mu', en: 'Mauritius',                fr: 'Maurice',            continent: 'africa',           population: 1271768,    medianAge: 36.3, official: true },
  { code: 'ma', en: 'Morocco',                  fr: 'Maroc',              continent: 'africa',           population: 36910560,   medianAge: 29.3, official: true },
  { code: 'mz', en: 'Mozambique',               fr: 'Mozambique',         continent: 'africa',           population: 31255435,   medianAge: 17.6, official: true },
  { code: 'na', en: 'Namibia',                  fr: 'Namibie',            continent: 'africa',           population: 2540905,    medianAge: 21.5, official: true },
  { code: 'ne', en: 'Niger',                    fr: 'Niger',              continent: 'africa',           population: 24206644,   medianAge: 15.0, official: true },
  { code: 'ng', en: 'Nigeria',                  fr: 'Nigéria',            continent: 'africa',           population: 206139589,  medianAge: 18.4, official: true },
  { code: 'rw', en: 'Rwanda',                   fr: 'Rwanda',             continent: 'africa',           population: 12952218,   medianAge: 20.2, official: true },
  { code: 'st', en: 'São Tomé',                 fr: 'Sao Tomé',           continent: 'africa',           population: 219159,     medianAge: 18.7, official: true },
  { code: 'sn', en: 'Senegal',                  fr: 'Sénégal',            continent: 'africa',           population: 16743927,   medianAge: 18.7, official: true },
  { code: 'sc', en: 'Seychelles',               fr: 'Seychelles',         continent: 'africa',           population: 98347,      medianAge: 36.2, official: true },
  { code: 'sl', en: 'Sierra Leone',             fr: 'Sierra Leone',       continent: 'africa',           population: 7976983,    medianAge: 19.1, official: true },
  { code: 'so', en: 'Somalia',                  fr: 'Somalie',            continent: 'africa',           population: 15893222,   medianAge: 17.7, official: true },
  { code: 'za', en: 'South Africa',             fr: 'Afrique du Sud',     continent: 'africa',           population: 59308690,   medianAge: 27.6, official: true },
  { code: 'ss', en: 'South Sudan',              fr: 'Soudan du Sud',      continent: 'africa',           population: 11193725,   medianAge: 18.6, official: true },
  { code: 'sd', en: 'Sudan',                    fr: 'Soudan',             continent: 'africa',           population: 43849260,   medianAge: 19.7, official: true },
  { code: 'tz', en: 'Tanzania',                 fr: 'Tanzanie',           continent: 'africa',           population: 59734218,   medianAge: 17.7, official: true },
  { code: 'tg', en: 'Togo',                     fr: 'Togo',               continent: 'africa',           population: 8278724,    medianAge: 19.8, official: true },
  { code: 'tn', en: 'Tunisia',                  fr: 'Tunisie',            continent: 'africa',           population: 11818619,   medianAge: 32.7, official: true },
  { code: 'ug', en: 'Uganda',                   fr: 'Ouganda',            continent: 'africa',           population: 45741007,   medianAge: 16.7, official: true },
  { code: 'zm', en: 'Zambia',                   fr: 'Zambie',             continent: 'africa',           population: 18383955,   medianAge: 17.0, official: true },
  { code: 'zw', en: 'Zimbabwe',                 fr: 'Zimbabwe',           continent: 'africa',           population: 14862924,   medianAge: 20.0, official: true },

  // ASIA
  { code: 'af', en: 'Afghanistan',              fr: 'Afghanistan',        continent: 'asia',             population: 38928346,   medianAge: 18.4, official: true },
  { code: 'am', en: 'Armenia',                  fr: 'Arménie',            continent: 'asia',             population: 2963243,    medianAge: 37.0, official: true },
  { code: 'az', en: 'Azerbaijan',               fr: 'Azerbaïdjan',        continent: 'asia',             population: 10139177,   medianAge: 32.4, official: true },
  { code: 'bh', en: 'Bahrain',                  fr: 'Bahreïn',            continent: 'asia',             population: 1701575,    medianAge: 32.8, official: true },
  { code: 'bd', en: 'Bangladesh',               fr: 'Bangladesh',         continent: 'asia',             population: 164689383,  medianAge: 27.9, official: true },
  { code: 'bt', en: 'Bhutan',                   fr: 'Bhoutan',            continent: 'asia',             population: 771608,     medianAge: 28.1, official: true },
  { code: 'bn', en: 'Brunei',                   fr: 'Brunei',             continent: 'asia',             population: 437479,     medianAge: 31.0, official: true },
  { code: 'kh', en: 'Cambodia',                 fr: 'Cambodge',           continent: 'asia',             population: 16718965,   medianAge: 26.4, official: true },
  { code: 'cn', en: 'China',                    fr: 'Chine',              continent: 'asia',             population: 1439323776, medianAge: 38.4, official: true },
  { code: 'ge', en: 'Georgia',                  fr: 'Géorgie',            continent: 'asia',             population: 3989167,    medianAge: 38.3, official: true },
  { code: 'in', en: 'India',                    fr: 'Inde',               continent: 'asia',             population: 1380004385, medianAge: 28.4, official: true },
  { code: 'id', en: 'Indonesia',                fr: 'Indonésie',          continent: 'asia',             population: 273523615,  medianAge: 30.2, official: true },
  { code: 'ir', en: 'Iran',                     fr: 'Iran',               continent: 'asia',             population: 83992949,   medianAge: 32.0, official: true },
  { code: 'iq', en: 'Iraq',                     fr: 'Irak',               continent: 'asia',             population: 40222493,   medianAge: 20.9, official: true },
  { code: 'il', en: 'Israel',                   fr: 'Israël',             continent: 'asia',             population: 8655535,    medianAge: 30.4, official: true },
  { code: 'jp', en: 'Japan',                    fr: 'Japon',              continent: 'asia',             population: 126476461,  medianAge: 48.4, official: true },
  { code: 'jo', en: 'Jordan',                   fr: 'Jordanie',           continent: 'asia',             population: 10203134,   medianAge: 23.4, official: true },
  { code: 'kz', en: 'Kazakhstan',               fr: 'Kazakhstan',         continent: 'asia',             population: 18776707,   medianAge: 30.9, official: true },
  { code: 'kw', en: 'Kuwait',                   fr: 'Koweït',             continent: 'asia',             population: 4270571,    medianAge: 33.7, official: true },
  { code: 'kg', en: 'Kyrgyzstan',               fr: 'Kirghizistan',       continent: 'asia',             population: 6524195,    medianAge: 26.1, official: true },
  { code: 'la', en: 'Laos',                     fr: 'Laos',               continent: 'asia',             population: 7275560,    medianAge: 24.4, official: true },
  { code: 'lb', en: 'Lebanon',                  fr: 'Liban',              continent: 'asia',             population: 6825445,    medianAge: 29.6, official: true },
  { code: 'my', en: 'Malaysia',                 fr: 'Malaisie',           continent: 'asia',             population: 32365999,   medianAge: 29.2, official: true },
  { code: 'mv', en: 'Maldives',                 fr: 'Maldives',           continent: 'asia',             population: 540544,     medianAge: 29.1, official: true },
  { code: 'mn', en: 'Mongolia',                 fr: 'Mongolie',           continent: 'asia',             population: 3278290,    medianAge: 28.6, official: true },
  { code: 'mm', en: 'Myanmar',                  fr: 'Myanmar',            continent: 'asia',             population: 54409800,   medianAge: 29.1, official: true },
  { code: 'np', en: 'Nepal',                    fr: 'Népal',              continent: 'asia',             population: 29136808,   medianAge: 24.6, official: true },
  { code: 'kp', en: 'North Korea',              fr: 'Corée du Nord',      continent: 'asia',             population: 25778816,   medianAge: 34.6, official: true },
  { code: 'om', en: 'Oman',                     fr: 'Oman',               continent: 'asia',             population: 4974986,    medianAge: 30.5, official: true },
  { code: 'pk', en: 'Pakistan',                 fr: 'Pakistan',           continent: 'asia',             population: 220892340,  medianAge: 22.8, official: true },
  { code: 'ps', en: 'Palestine',                fr: 'Palestine',          continent: 'asia',             population: 5101414,    medianAge: 19.7, official: false },
  { code: 'ph', en: 'Philippines',              fr: 'Philippines',        continent: 'asia',             population: 109581078,  medianAge: 25.7, official: true },
  { code: 'qa', en: 'Qatar',                    fr: 'Qatar',              continent: 'asia',             population: 2881053,    medianAge: 33.7, official: true },
  { code: 'sa', en: 'Saudi Arabia',             fr: 'Arabie Saoudite',    continent: 'asia',             population: 34813871,   medianAge: 30.7, official: true },
  { code: 'sg', en: 'Singapore',                fr: 'Singapour',          continent: 'asia',             population: 5850342,    medianAge: 42.2, official: true },
  { code: 'kr', en: 'South Korea',              fr: 'Corée du Sud',       continent: 'asia',             population: 51269185,   medianAge: 43.7, official: true },
  { code: 'lk', en: 'Sri Lanka',                fr: 'Sri Lanka',          continent: 'asia',             population: 21413249,   medianAge: 33.7, official: true },
  { code: 'sy', en: 'Syria',                    fr: 'Syrie',              continent: 'asia',             population: 17500658,   medianAge: 22.0, official: true },
  { code: 'tw', en: 'Taiwan',                   fr: 'Taïwan',             continent: 'asia',             population: 23816775,   medianAge: 42.7, official: false },
  { code: 'tj', en: 'Tajikistan',               fr: 'Tadjikistan',        continent: 'asia',             population: 9537645,    medianAge: 22.4, official: true },
  { code: 'th', en: 'Thailand',                 fr: 'Thaïlande',          continent: 'asia',             population: 69799978,   medianAge: 40.1, official: true },
  { code: 'tl', en: 'Timor-Leste',              fr: 'Timor-Leste',        continent: 'asia',             population: 1318445,    medianAge: 19.7, official: true },
  { code: 'tr', en: 'Turkey',                   fr: 'Turquie',            continent: 'asia',             population: 84339067,   medianAge: 31.5, official: true },
  { code: 'tm', en: 'Turkmenistan',             fr: 'Turkménistan',       continent: 'asia',             population: 6031200,    medianAge: 27.5, official: true },
  { code: 'ae', en: 'UAE',                      fr: 'Émirats arabes unis',continent: 'asia',             population: 9890402,    medianAge: 33.5, official: true },
  { code: 'uz', en: 'Uzbekistan',               fr: 'Ouzbékistan',        continent: 'asia',             population: 33469203,   medianAge: 28.2, official: true },
  { code: 'vn', en: 'Vietnam',                  fr: 'Vietnam',            continent: 'asia',             population: 97338579,   medianAge: 30.5, official: true },
  { code: 'ye', en: 'Yemen',                    fr: 'Yémen',              continent: 'asia',             population: 29825964,   medianAge: 19.5, official: true },

  // NORTH AMERICAS
  { code: 'ca', en: 'Canada',                   fr: 'Canada',             continent: 'north-americas',   population: 37742154,   medianAge: 41.1, official: true },
  { code: 'us', en: 'United States',            fr: 'États-Unis',         continent: 'north-americas',   population: 331002651,  medianAge: 38.5, official: true },
  { code: 'mx', en: 'Mexico',                   fr: 'Mexique',            continent: 'north-americas',   population: 128932753,  medianAge: 29.2, official: true },
  { code: 'gl', en: 'Greenland',                fr: 'Groenland',          continent: 'north-americas',   population: 56367,      medianAge: 34.3, official: false },

  // CENTRAL AMERICAS
  { code: 'bz', en: 'Belize',                   fr: 'Belize',             continent: 'central-americas', population: 397628,     medianAge: 25.3, official: true },
  { code: 'gt', en: 'Guatemala',                fr: 'Guatemala',          continent: 'central-americas', population: 17915568,   medianAge: 22.8, official: true },
  { code: 'hn', en: 'Honduras',                 fr: 'Honduras',           continent: 'central-americas', population: 9904607,    medianAge: 23.9, official: true },
  { code: 'sv', en: 'El Salvador',              fr: 'Salvador',           continent: 'central-americas', population: 6486205,    medianAge: 27.9, official: true },
  { code: 'ni', en: 'Nicaragua',                fr: 'Nicaragua',          continent: 'central-americas', population: 6624554,    medianAge: 27.3, official: true },
  { code: 'cr', en: 'Costa Rica',               fr: 'Costa Rica',         continent: 'central-americas', population: 5094118,    medianAge: 32.6, official: true },
  { code: 'pa', en: 'Panama',                   fr: 'Panama',             continent: 'central-americas', population: 4314767,    medianAge: 29.6, official: true },
  { code: 'cu', en: 'Cuba',                     fr: 'Cuba',               continent: 'central-americas', population: 11326616,   medianAge: 42.1, official: true },
  { code: 'jm', en: 'Jamaica',                  fr: 'Jamaïque',           continent: 'central-americas', population: 2961167,    medianAge: 30.5, official: true },
  { code: 'ht', en: 'Haiti',                    fr: 'Haïti',              continent: 'central-americas', population: 11402528,   medianAge: 23.6, official: true },
  { code: 'do', en: 'Dominican Republic',       fr: 'Rép. dominicaine',   continent: 'central-americas', population: 10847910,   medianAge: 27.9, official: true },
  { code: 'ag', en: 'Antigua & Barbuda',        fr: 'Antigua-et-Barbuda', continent: 'central-americas', population: 97929,      medianAge: 32.1, official: true },
  { code: 'bs', en: 'Bahamas',                  fr: 'Bahamas',            continent: 'central-americas', population: 393244,     medianAge: 34.4, official: true },
  { code: 'bb', en: 'Barbados',                 fr: 'Barbade',            continent: 'central-americas', population: 287375,     medianAge: 40.6, official: true },
  { code: 'dm', en: 'Dominica',                 fr: 'Dominique',          continent: 'central-americas', population: 71986,      medianAge: 33.5, official: true },
  { code: 'gd', en: 'Grenada',                  fr: 'Grenade',            continent: 'central-americas', population: 112523,     medianAge: 32.4, official: true },
  { code: 'kn', en: 'Saint Kitts & Nevis',      fr: 'Saint-Kitts',        continent: 'central-americas', population: 53199,      medianAge: 35.5, official: true },
  { code: 'lc', en: 'Saint Lucia',              fr: 'Sainte-Lucie',       continent: 'central-americas', population: 183627,     medianAge: 34.9, official: true },
  { code: 'vc', en: 'Saint Vincent',            fr: 'Saint-Vincent',      continent: 'central-americas', population: 110940,     medianAge: 32.0, official: true },
  { code: 'tt', en: 'Trinidad & Tobago',        fr: 'Trinité-et-Tobago',  continent: 'central-americas', population: 1399488,    medianAge: 36.4, official: true },

  // SOUTH AMERICAS
  { code: 'co', en: 'Colombia',                 fr: 'Colombie',           continent: 'south-americas',   population: 50882891,   medianAge: 30.8, official: true },
  { code: 've', en: 'Venezuela',                fr: 'Venezuela',          continent: 'south-americas',   population: 28435943,   medianAge: 29.1, official: true },
  { code: 'gy', en: 'Guyana',                   fr: 'Guyana',             continent: 'south-americas',   population: 786552,     medianAge: 26.4, official: true },
  { code: 'sr', en: 'Suriname',                 fr: 'Suriname',           continent: 'south-americas',   population: 586632,     medianAge: 29.4, official: true },
  { code: 'br', en: 'Brazil',                   fr: 'Brésil',             continent: 'south-americas',   population: 212559417,  medianAge: 33.5, official: true },
  { code: 'ec', en: 'Ecuador',                  fr: 'Équateur',           continent: 'south-americas',   population: 17643054,   medianAge: 28.4, official: true },
  { code: 'pe', en: 'Peru',                     fr: 'Pérou',              continent: 'south-americas',   population: 32971854,   medianAge: 29.1, official: true },
  { code: 'bo', en: 'Bolivia',                  fr: 'Bolivie',            continent: 'south-americas',   population: 11673021,   medianAge: 25.3, official: true },
  { code: 'py', en: 'Paraguay',                 fr: 'Paraguay',           continent: 'south-americas',   population: 7132538,    medianAge: 28.2, official: true },
  { code: 'ar', en: 'Argentina',                fr: 'Argentine',          continent: 'south-americas',   population: 45195774,   medianAge: 31.7, official: true },
  { code: 'cl', en: 'Chile',                    fr: 'Chili',              continent: 'south-americas',   population: 19116201,   medianAge: 35.0, official: true },
  { code: 'uy', en: 'Uruguay',                  fr: 'Uruguay',            continent: 'south-americas',   population: 3473730,    medianAge: 35.6, official: true },

  // OCEANIA
  { code: 'au', en: 'Australia',                fr: 'Australie',          continent: 'oceania',          population: 25499884,   medianAge: 37.9, official: true },
  { code: 'fj', en: 'Fiji',                     fr: 'Fidji',              continent: 'oceania',          population: 896445,     medianAge: 28.6, official: true },
  { code: 'ki', en: 'Kiribati',                 fr: 'Kiribati',           continent: 'oceania',          population: 119449,     medianAge: 22.9, official: true },
  { code: 'mh', en: 'Marshall Islands',         fr: 'Îles Marshall',      continent: 'oceania',          population: 59190,      medianAge: 23.8, official: true },
  { code: 'fm', en: 'Micronesia',               fr: 'Micronésie',         continent: 'oceania',          population: 548914,     medianAge: 23.5, official: true },
  { code: 'nr', en: 'Nauru',                    fr: 'Nauru',              continent: 'oceania',          population: 10824,      medianAge: 27.0, official: true },
  { code: 'nz', en: 'New Zealand',              fr: 'Nouvelle-Zélande',   continent: 'oceania',          population: 4822233,    medianAge: 37.9, official: true },
  { code: 'pw', en: 'Palau',                    fr: 'Palaos',             continent: 'oceania',          population: 18094,      medianAge: 33.0, official: true },
  { code: 'pg', en: 'Papua New Guinea',         fr: 'PNG',                continent: 'oceania',          population: 8947000,    medianAge: 22.0, official: true },
  { code: 'ws', en: 'Samoa',                    fr: 'Samoa',              continent: 'oceania',          population: 198414,     medianAge: 21.8, official: true },
  { code: 'sb', en: 'Solomon Islands',          fr: 'Îles Salomon',       continent: 'oceania',          population: 686884,     medianAge: 20.1, official: true },
  { code: 'to', en: 'Tonga',                    fr: 'Tonga',              continent: 'oceania',          population: 105695,     medianAge: 22.1, official: true },
  { code: 'tv', en: 'Tuvalu',                   fr: 'Tuvalu',             continent: 'oceania',          population: 11792,      medianAge: 26.6, official: true },
  { code: 'vu', en: 'Vanuatu',                  fr: 'Vanuatu',            continent: 'oceania',          population: 307145,     medianAge: 22.0, official: true },
]

// ── Config ─────────────────────────────────────────────────────────────────────
const CONTINENT_META = {
  'europe':           { en: 'Europe',           fr: 'Europe',             color: '#1a3a6b', accent: '#4a7fd4', light: '#e8f0fa', svg: '/europe.svg',
    descEn: "The cradle of Western civilization, home to rich history, diverse cultures, and the world's oldest democracies.",
    descFr: "Berceau de la civilisation occidentale, riche en histoire et cultures diverses." },
  'africa':           { en: 'Africa',           fr: 'Afrique',            color: '#6b2a1a', accent: '#e07840', light: '#fdf0e8', svg: '/africa.svg',
    descEn: "The world's second-largest continent, birthplace of humanity with extraordinary biodiversity.",
    descFr: "Le deuxième plus grand continent, berceau de l'humanité et foyer d'une biodiversité extraordinaire." },
  'asia':             { en: 'Asia',             fr: 'Asie',               color: '#1a5c3a', accent: '#4ab870', light: '#e8f8ee', svg: '/asia.svg',
    descEn: "The largest continent by area and population, home to ancient civilizations and fast-growing economies.",
    descFr: "Le plus grand continent, berceau de civilisations anciennes et d'économies en plein essor." },
  'north-americas':   { en: 'North America',   fr: 'Amérique du Nord',   color: '#3b0764', accent: '#a855d4', light: '#f5e8fd', svg: '/north-america.svg',
    descEn: "Canada and the United States — vast landscapes, multicultural societies, and economic powerhouses.",
    descFr: "Le Canada et les États-Unis — vastes paysages, sociétés multiculturelles et puissances économiques." },
  'central-americas': { en: 'Central America', fr: 'Amérique centrale',  color: '#581c87', accent: '#c084fc', light: '#f3e8ff', svg: '/central-america.svg',
    descEn: "A vibrant region of diverse cultures, tropical landscapes, and Caribbean island nations.",
    descFr: "Une région vibrante de cultures diverses, paysages tropicaux et nations insulaires des Caraïbes." },
  'south-americas':   { en: 'South America',   fr: 'Amérique du Sud',    color: '#4a044e', accent: '#e879f9', light: '#fdf4ff', svg: '/south-america.svg',
    descEn: "From the Amazon rainforest to the Andes, a continent of remarkable natural and cultural diversity.",
    descFr: "De la forêt amazonienne aux Andes, un continent d'une remarquable diversité naturelle et culturelle." },
  'oceania':          { en: 'Oceania',          fr: 'Océanie',            color: '#1a4a6b', accent: '#38b2d4', light: '#e8f6fc', svg: '/oceania.svg',
    descEn: "A vast oceanic region encompassing Australia, Melanesia, Micronesia, and Polynesia.",
    descFr: "Une vaste région océanique englobant l'Australie, la Mélanésie, la Micronésie et la Polynésie." },
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatPop(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

// ── CountryCard ────────────────────────────────────────────────────────────────
function CountryCard({ country, locale, accentColor }) {
  const [hovered, setHovered] = useState(false)
  const name = locale === 'fr' ? country.fr : country.en
  return (
    <Link href={`/${locale}/countries/${country.code}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden',
          border: `2px solid ${hovered ? accentColor : '#e5e0d0'}`,
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered ? `0 8px 24px ${accentColor}33` : 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ width: '100%', aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f8f5ed' }}>
          <img src={`https://flagcdn.com/w320/${country.code}.png`} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0B1F3B', marginBottom: '4px' }}>{name}</div>
          <div style={{ fontSize: '11px', color: '#888', display: 'flex', gap: '8px' }}>
            <span>{formatPop(country.population)}</span>
            <span>·</span>
            <span>{country.medianAge} {locale === 'fr' ? 'ans' : 'yr'}</span>
          </div>
          {!country.official && (
            <span style={{
              display: 'inline-block', marginTop: '5px', fontSize: '10px',
              padding: '2px 6px', borderRadius: '4px',
              backgroundColor: '#f5e8fd', color: '#5c1a6b', fontWeight: '600',
            }}>
              {locale === 'fr' ? 'Non-officiel' : 'Non-official'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── StatsBar ───────────────────────────────────────────────────────────────────
function StatsBar({ countries, meta, locale }) {
  const official   = countries.filter(c => c.official).length
  const unofficial = countries.filter(c => !c.official).length
  const totalPop   = countries.reduce((s, c) => s + c.population, 0)
  const avgAge     = (countries.reduce((s, c) => s + c.medianAge, 0) / countries.length).toFixed(1)
  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e0d0' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: locale === 'fr' ? 'Population totale' : 'Total Population', value: formatPop(totalPop) },
          { label: locale === 'fr' ? 'Pays officiels'    : 'Official Countries', value: official },
          { label: locale === 'fr' ? 'Non-officiels'     : 'Non-official', value: unofficial },
          { label: locale === 'fr' ? 'Âge médian moyen'  : 'Avg. Median Age', value: avgAge + (locale === 'fr' ? ' ans' : ' yr') },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 24px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid #e5e0d0' : 'none',
          }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: meta.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CountriesGrid ──────────────────────────────────────────────────────────────
function CountriesGrid({ countries, locale, accentColor, search, filter }) {
  const filtered = useMemo(() => {
    let list = countries
    if (filter === 'official')   list = list.filter(c => c.official)
    if (filter === 'unofficial') list = list.filter(c => !c.official)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.en.toLowerCase().includes(q) || c.fr.toLowerCase().includes(q))
    }
    return list.sort((a, b) =>
      (locale === 'fr' ? a.fr : a.en).localeCompare(locale === 'fr' ? b.fr : b.en)
    )
  }, [countries, filter, search, locale])

  if (filtered.length === 0) return (
    <div style={{ color: '#aaa', fontSize: '14px', padding: '20px 0' }}>
      {locale === 'fr' ? 'Aucun pays trouvé.' : 'No countries found.'}
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
      {filtered.map(c => <CountryCard key={c.code} country={c} locale={locale} accentColor={accentColor} />)}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ContinentPage({ slug }) {
  const locale = useLocale()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  const meta      = CONTINENT_META[slug]
  const countries = useMemo(() => ALL_COUNTRIES.filter(c => c.continent === slug), [slug])

  if (!meta) return (
    <div style={{ padding: '80px 24px', textAlign: 'center', color: '#888' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0B1F3B' }}>Continent not found</div>
      <Link href={`/${locale}`} style={{ color: '#4a7fd4', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>
        ← {locale === 'fr' ? "Retour à l'accueil" : 'Back to home'}
      </Link>
    </div>
  )

  const title = locale === 'fr' ? meta.fr : meta.en
  const desc  = locale === 'fr' ? meta.descFr : meta.descEn

  return (
    <main style={{ backgroundColor: '#F4F1E6', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.accent}bb 100%)`,
        padding: '48px 24px 40px', color: '#fff',
      }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '48px' }}>
          <div style={{ flex: 1 }}>
            <Link href={`/${locale}`} style={{
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '14px',
              display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px',
            }}>
              ← {locale === 'fr' ? 'Accueil' : 'Home'}
            </Link>
            <h1 style={{ fontSize: '52px', fontWeight: '900', margin: '0 0 12px', letterSpacing: '-1px' }}>{title}</h1>
            <p style={{ fontSize: '16px', opacity: 0.85, maxWidth: '540px', lineHeight: '1.65', margin: 0 }}>{desc}</p>
          </div>
          <div style={{ width: '180px', flexShrink: 0, opacity: 0.3 }}>
            <img src={meta.svg} alt={title} style={{ width: '100%', filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar countries={countries} meta={meta} locale={locale} />

      {/* Controls */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={locale === 'fr' ? 'Rechercher un pays...' : 'Search a country...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '2px solid #e5e0d0',
              fontSize: '14px', outline: 'none', flex: '1', minWidth: '200px', backgroundColor: '#fff',
            }}
          />
          {['all', 'official', 'unofficial'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
              border: `2px solid ${filter === f ? meta.accent : '#e5e0d0'}`,
              backgroundColor: filter === f ? meta.light : '#fff',
              color: filter === f ? meta.color : '#666',
              fontWeight: filter === f ? '700' : '400',
              fontSize: '13px', transition: 'all 0.15s ease',
            }}>
              {f === 'all'      ? (locale === 'fr' ? 'Tous'          : 'All') :
               f === 'official' ? (locale === 'fr' ? 'Officiels'     : 'Official') :
                                  (locale === 'fr' ? 'Non-officiels' : 'Non-official')}
            </button>
          ))}
        </div>
      </div>

      {/* Countries */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px 60px' }}>
        <CountriesGrid
          countries={countries}
          locale={locale}
          accentColor={meta.accent}
          search={search}
          filter={filter}
        />
      </div>
    </main>
  )
}