'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'

// ─── Data ─────────────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'af', en: 'Afghanistan',           fr: 'Afghanistan',           capital: 'Kabul',          region: 'Asia' },
  { code: 'al', en: 'Albania',               fr: 'Albanie',               capital: 'Tirana',         region: 'Europe' },
  { code: 'dz', en: 'Algeria',               fr: 'Algérie',               capital: 'Algiers',        region: 'Africa' },
  { code: 'ad', en: 'Andorra',               fr: 'Andorre',               capital: 'Andorra la Vella',region: 'Europe' },
  { code: 'ao', en: 'Angola',                fr: 'Angola',                capital: 'Luanda',         region: 'Africa' },
  { code: 'ag', en: 'Antigua and Barbuda',   fr: 'Antigua-et-Barbuda',    capital: "Saint John's",   region: 'Americas' },
  { code: 'ar', en: 'Argentina',             fr: 'Argentine',             capital: 'Buenos Aires',   region: 'Americas' },
  { code: 'am', en: 'Armenia',               fr: 'Arménie',               capital: 'Yerevan',        region: 'Asia' },
  { code: 'au', en: 'Australia',             fr: 'Australie',             capital: 'Canberra',       region: 'Oceania' },
  { code: 'at', en: 'Austria',               fr: 'Autriche',              capital: 'Vienna',         region: 'Europe' },
  { code: 'az', en: 'Azerbaijan',            fr: 'Azerbaïdjan',           capital: 'Baku',           region: 'Asia' },
  { code: 'bs', en: 'Bahamas',               fr: 'Bahamas',               capital: 'Nassau',         region: 'Americas' },
  { code: 'bh', en: 'Bahrain',               fr: 'Bahreïn',               capital: 'Manama',         region: 'Asia' },
  { code: 'bd', en: 'Bangladesh',            fr: 'Bangladesh',            capital: 'Dhaka',          region: 'Asia' },
  { code: 'bb', en: 'Barbados',              fr: 'Barbade',               capital: 'Bridgetown',     region: 'Americas' },
  { code: 'by', en: 'Belarus',               fr: 'Biélorussie',           capital: 'Minsk',          region: 'Europe' },
  { code: 'be', en: 'Belgium',               fr: 'Belgique',              capital: 'Brussels',       region: 'Europe' },
  { code: 'bz', en: 'Belize',                fr: 'Belize',                capital: 'Belmopan',       region: 'Americas' },
  { code: 'bj', en: 'Benin',                 fr: 'Bénin',                 capital: 'Porto-Novo',     region: 'Africa' },
  { code: 'bt', en: 'Bhutan',                fr: 'Bhoutan',               capital: 'Thimphu',        region: 'Asia' },
  { code: 'bo', en: 'Bolivia',               fr: 'Bolivie',               capital: 'Sucre',          region: 'Americas' },
  { code: 'ba', en: 'Bosnia and Herzegovina',fr: 'Bosnie-Herzégovine',    capital: 'Sarajevo',       region: 'Europe' },
  { code: 'bw', en: 'Botswana',              fr: 'Botswana',              capital: 'Gaborone',       region: 'Africa' },
  { code: 'br', en: 'Brazil',                fr: 'Brésil',                capital: 'Brasília',       region: 'Americas' },
  { code: 'bn', en: 'Brunei',                fr: 'Brunéi',                capital: 'Bandar Seri Begawan', region: 'Asia' },
  { code: 'bg', en: 'Bulgaria',              fr: 'Bulgarie',              capital: 'Sofia',          region: 'Europe' },
  { code: 'bf', en: 'Burkina Faso',          fr: 'Burkina Faso',          capital: 'Ouagadougou',    region: 'Africa' },
  { code: 'bi', en: 'Burundi',               fr: 'Burundi',               capital: 'Gitega',         region: 'Africa' },
  { code: 'cv', en: 'Cape Verde',            fr: 'Cap-Vert',              capital: 'Praia',          region: 'Africa' },
  { code: 'kh', en: 'Cambodia',              fr: 'Cambodge',              capital: 'Phnom Penh',     region: 'Asia' },
  { code: 'cm', en: 'Cameroon',              fr: 'Cameroun',              capital: 'Yaoundé',        region: 'Africa' },
  { code: 'ca', en: 'Canada',                fr: 'Canada',                capital: 'Ottawa',         region: 'Americas' },
  { code: 'cf', en: 'Central African Republic', fr: 'RCA',               capital: 'Bangui',         region: 'Africa' },
  { code: 'td', en: 'Chad',                  fr: 'Tchad',                 capital: "N'Djamena",      region: 'Africa' },
  { code: 'cl', en: 'Chile',                 fr: 'Chili',                 capital: 'Santiago',       region: 'Americas' },
  { code: 'cn', en: 'China',                 fr: 'Chine',                 capital: 'Beijing',        region: 'Asia' },
  { code: 'co', en: 'Colombia',              fr: 'Colombie',              capital: 'Bogotá',         region: 'Americas' },
  { code: 'km', en: 'Comoros',               fr: 'Comores',               capital: 'Moroni',         region: 'Africa' },
  { code: 'cg', en: 'Congo',                 fr: 'Congo',                 capital: 'Brazzaville',    region: 'Africa' },
  { code: 'cd', en: 'DR Congo',              fr: 'RDC',                   capital: 'Kinshasa',       region: 'Africa' },
  { code: 'cr', en: 'Costa Rica',            fr: 'Costa Rica',            capital: 'San José',       region: 'Americas' },
  { code: 'hr', en: 'Croatia',               fr: 'Croatie',               capital: 'Zagreb',         region: 'Europe' },
  { code: 'cu', en: 'Cuba',                  fr: 'Cuba',                  capital: 'Havana',         region: 'Americas' },
  { code: 'cy', en: 'Cyprus',                fr: 'Chypre',                capital: 'Nicosia',        region: 'Europe' },
  { code: 'cz', en: 'Czechia',               fr: 'Tchéquie',              capital: 'Prague',         region: 'Europe' },
  { code: 'dk', en: 'Denmark',               fr: 'Danemark',              capital: 'Copenhagen',     region: 'Europe' },
  { code: 'dj', en: 'Djibouti',              fr: 'Djibouti',              capital: 'Djibouti',       region: 'Africa' },
  { code: 'dm', en: 'Dominica',              fr: 'Dominique',             capital: 'Roseau',         region: 'Americas' },
  { code: 'do', en: 'Dominican Republic',    fr: 'Rép. dominicaine',      capital: 'Santo Domingo',  region: 'Americas' },
  { code: 'ec', en: 'Ecuador',               fr: 'Équateur',              capital: 'Quito',          region: 'Americas' },
  { code: 'eg', en: 'Egypt',                 fr: 'Égypte',                capital: 'Cairo',          region: 'Africa' },
  { code: 'sv', en: 'El Salvador',           fr: 'Salvador',              capital: 'San Salvador',   region: 'Americas' },
  { code: 'gq', en: 'Equatorial Guinea',     fr: 'Guinée équatoriale',    capital: 'Malabo',         region: 'Africa' },
  { code: 'er', en: 'Eritrea',               fr: 'Érythrée',              capital: 'Asmara',         region: 'Africa' },
  { code: 'ee', en: 'Estonia',               fr: 'Estonie',               capital: 'Tallinn',        region: 'Europe' },
  { code: 'sz', en: 'Eswatini',              fr: 'Eswatini',              capital: 'Mbabane',        region: 'Africa' },
  { code: 'et', en: 'Ethiopia',              fr: 'Éthiopie',              capital: 'Addis Ababa',    region: 'Africa' },
  { code: 'fj', en: 'Fiji',                  fr: 'Fidji',                 capital: 'Suva',           region: 'Oceania' },
  { code: 'fi', en: 'Finland',               fr: 'Finlande',              capital: 'Helsinki',       region: 'Europe' },
  { code: 'fr', en: 'France',                fr: 'France',                capital: 'Paris',          region: 'Europe' },
  { code: 'ga', en: 'Gabon',                 fr: 'Gabon',                 capital: 'Libreville',     region: 'Africa' },
  { code: 'gm', en: 'Gambia',                fr: 'Gambie',                capital: 'Banjul',         region: 'Africa' },
  { code: 'ge', en: 'Georgia',               fr: 'Géorgie',               capital: 'Tbilisi',        region: 'Asia' },
  { code: 'de', en: 'Germany',               fr: 'Allemagne',             capital: 'Berlin',         region: 'Europe' },
  { code: 'gh', en: 'Ghana',                 fr: 'Ghana',                 capital: 'Accra',          region: 'Africa' },
  { code: 'gr', en: 'Greece',                fr: 'Grèce',                 capital: 'Athens',         region: 'Europe' },
  { code: 'gd', en: 'Grenada',               fr: 'Grenade',               capital: "Saint George's", region: 'Americas' },
  { code: 'gt', en: 'Guatemala',             fr: 'Guatemala',             capital: 'Guatemala City', region: 'Americas' },
  { code: 'gn', en: 'Guinea',                fr: 'Guinée',                capital: 'Conakry',        region: 'Africa' },
  { code: 'gw', en: 'Guinea-Bissau',         fr: 'Guinée-Bissau',         capital: 'Bissau',         region: 'Africa' },
  { code: 'gy', en: 'Guyana',                fr: 'Guyana',                capital: 'Georgetown',     region: 'Americas' },
  { code: 'ht', en: 'Haiti',                 fr: 'Haïti',                 capital: 'Port-au-Prince', region: 'Americas' },
  { code: 'hn', en: 'Honduras',              fr: 'Honduras',              capital: 'Tegucigalpa',    region: 'Americas' },
  { code: 'hu', en: 'Hungary',               fr: 'Hongrie',               capital: 'Budapest',       region: 'Europe' },
  { code: 'is', en: 'Iceland',               fr: 'Islande',               capital: 'Reykjavik',      region: 'Europe' },
  { code: 'in', en: 'India',                 fr: 'Inde',                  capital: 'New Delhi',      region: 'Asia' },
  { code: 'id', en: 'Indonesia',             fr: 'Indonésie',             capital: 'Jakarta',        region: 'Asia' },
  { code: 'ir', en: 'Iran',                  fr: 'Iran',                  capital: 'Tehran',         region: 'Asia' },
  { code: 'iq', en: 'Iraq',                  fr: 'Irak',                  capital: 'Baghdad',        region: 'Asia' },
  { code: 'ie', en: 'Ireland',               fr: 'Irlande',               capital: 'Dublin',         region: 'Europe' },
  { code: 'il', en: 'Israel',                fr: 'Israël',                capital: 'Jerusalem',      region: 'Asia' },
  { code: 'it', en: 'Italy',                 fr: 'Italie',                capital: 'Rome',           region: 'Europe' },
  { code: 'jm', en: 'Jamaica',               fr: 'Jamaïque',              capital: 'Kingston',       region: 'Americas' },
  { code: 'jp', en: 'Japan',                 fr: 'Japon',                 capital: 'Tokyo',          region: 'Asia' },
  { code: 'jo', en: 'Jordan',                fr: 'Jordanie',              capital: 'Amman',          region: 'Asia' },
  { code: 'kz', en: 'Kazakhstan',            fr: 'Kazakhstan',            capital: 'Astana',         region: 'Asia' },
  { code: 'ke', en: 'Kenya',                 fr: 'Kenya',                 capital: 'Nairobi',        region: 'Africa' },
  { code: 'ki', en: 'Kiribati',              fr: 'Kiribati',              capital: 'South Tarawa',   region: 'Oceania' },
  { code: 'kw', en: 'Kuwait',                fr: 'Koweït',                capital: 'Kuwait City',    region: 'Asia' },
  { code: 'kg', en: 'Kyrgyzstan',            fr: 'Kirghizistan',          capital: 'Bishkek',        region: 'Asia' },
  { code: 'la', en: 'Laos',                  fr: 'Laos',                  capital: 'Vientiane',      region: 'Asia' },
  { code: 'lv', en: 'Latvia',                fr: 'Lettonie',              capital: 'Riga',           region: 'Europe' },
  { code: 'lb', en: 'Lebanon',               fr: 'Liban',                 capital: 'Beirut',         region: 'Asia' },
  { code: 'ls', en: 'Lesotho',               fr: 'Lesotho',               capital: 'Maseru',         region: 'Africa' },
  { code: 'lr', en: 'Liberia',               fr: 'Liberia',               capital: 'Monrovia',       region: 'Africa' },
  { code: 'ly', en: 'Libya',                 fr: 'Libye',                 capital: 'Tripoli',        region: 'Africa' },
  { code: 'li', en: 'Liechtenstein',         fr: 'Liechtenstein',         capital: 'Vaduz',          region: 'Europe' },
  { code: 'lt', en: 'Lithuania',             fr: 'Lituanie',              capital: 'Vilnius',        region: 'Europe' },
  { code: 'lu', en: 'Luxembourg',            fr: 'Luxembourg',            capital: 'Luxembourg City',region: 'Europe' },
  { code: 'mg', en: 'Madagascar',            fr: 'Madagascar',            capital: 'Antananarivo',   region: 'Africa' },
  { code: 'mw', en: 'Malawi',                fr: 'Malawi',                capital: 'Lilongwe',       region: 'Africa' },
  { code: 'my', en: 'Malaysia',              fr: 'Malaisie',              capital: 'Kuala Lumpur',   region: 'Asia' },
  { code: 'mv', en: 'Maldives',              fr: 'Maldives',              capital: 'Malé',           region: 'Asia' },
  { code: 'ml', en: 'Mali',                  fr: 'Mali',                  capital: 'Bamako',         region: 'Africa' },
  { code: 'mt', en: 'Malta',                 fr: 'Malte',                 capital: 'Valletta',       region: 'Europe' },
  { code: 'mh', en: 'Marshall Islands',      fr: 'Îles Marshall',         capital: 'Majuro',         region: 'Oceania' },
  { code: 'mr', en: 'Mauritania',            fr: 'Mauritanie',            capital: 'Nouakchott',     region: 'Africa' },
  { code: 'mu', en: 'Mauritius',             fr: 'Maurice',               capital: 'Port Louis',     region: 'Africa' },
  { code: 'mx', en: 'Mexico',                fr: 'Mexique',               capital: 'Mexico City',    region: 'Americas' },
  { code: 'fm', en: 'Micronesia',            fr: 'Micronésie',            capital: 'Palikir',        region: 'Oceania' },
  { code: 'md', en: 'Moldova',               fr: 'Moldavie',              capital: 'Chișinău',       region: 'Europe' },
  { code: 'mc', en: 'Monaco',                fr: 'Monaco',                capital: 'Monaco',         region: 'Europe' },
  { code: 'mn', en: 'Mongolia',              fr: 'Mongolie',              capital: 'Ulaanbaatar',    region: 'Asia' },
  { code: 'me', en: 'Montenegro',            fr: 'Monténégro',            capital: 'Podgorica',      region: 'Europe' },
  { code: 'ma', en: 'Morocco',               fr: 'Maroc',                 capital: 'Rabat',          region: 'Africa' },
  { code: 'mz', en: 'Mozambique',            fr: 'Mozambique',            capital: 'Maputo',         region: 'Africa' },
  { code: 'mm', en: 'Myanmar',               fr: 'Myanmar',               capital: 'Naypyidaw',      region: 'Asia' },
  { code: 'na', en: 'Namibia',               fr: 'Namibie',               capital: 'Windhoek',       region: 'Africa' },
  { code: 'nr', en: 'Nauru',                 fr: 'Nauru',                 capital: 'Yaren',          region: 'Oceania' },
  { code: 'np', en: 'Nepal',                 fr: 'Népal',                 capital: 'Kathmandu',      region: 'Asia' },
  { code: 'nl', en: 'Netherlands',           fr: 'Pays-Bas',              capital: 'Amsterdam',      region: 'Europe' },
  { code: 'nz', en: 'New Zealand',           fr: 'Nouvelle-Zélande',      capital: 'Wellington',     region: 'Oceania' },
  { code: 'ni', en: 'Nicaragua',             fr: 'Nicaragua',             capital: 'Managua',        region: 'Americas' },
  { code: 'ne', en: 'Niger',                 fr: 'Niger',                 capital: 'Niamey',         region: 'Africa' },
  { code: 'ng', en: 'Nigeria',               fr: 'Nigéria',               capital: 'Abuja',          region: 'Africa' },
  { code: 'mk', en: 'North Macedonia',       fr: 'Macédoine du Nord',     capital: 'Skopje',         region: 'Europe' },
  { code: 'no', en: 'Norway',                fr: 'Norvège',               capital: 'Oslo',           region: 'Europe' },
  { code: 'om', en: 'Oman',                  fr: 'Oman',                  capital: 'Muscat',         region: 'Asia' },
  { code: 'pk', en: 'Pakistan',              fr: 'Pakistan',              capital: 'Islamabad',      region: 'Asia' },
  { code: 'pw', en: 'Palau',                 fr: 'Palaos',                capital: 'Ngerulmud',      region: 'Oceania' },
  { code: 'pa', en: 'Panama',                fr: 'Panama',                capital: 'Panama City',    region: 'Americas' },
  { code: 'pg', en: 'Papua New Guinea',      fr: 'PNG',                   capital: 'Port Moresby',   region: 'Oceania' },
  { code: 'py', en: 'Paraguay',              fr: 'Paraguay',              capital: 'Asunción',       region: 'Americas' },
  { code: 'pe', en: 'Peru',                  fr: 'Pérou',                 capital: 'Lima',           region: 'Americas' },
  { code: 'ph', en: 'Philippines',           fr: 'Philippines',           capital: 'Manila',         region: 'Asia' },
  { code: 'pl', en: 'Poland',                fr: 'Pologne',               capital: 'Warsaw',         region: 'Europe' },
  { code: 'pt', en: 'Portugal',              fr: 'Portugal',              capital: 'Lisbon',         region: 'Europe' },
  { code: 'qa', en: 'Qatar',                 fr: 'Qatar',                 capital: 'Doha',           region: 'Asia' },
  { code: 'ro', en: 'Romania',               fr: 'Roumanie',              capital: 'Bucharest',      region: 'Europe' },
  { code: 'ru', en: 'Russia',                fr: 'Russie',                capital: 'Moscow',         region: 'Europe' },
  { code: 'rw', en: 'Rwanda',                fr: 'Rwanda',                capital: 'Kigali',         region: 'Africa' },
  { code: 'kn', en: 'Saint Kitts and Nevis', fr: 'Saint-Kitts',           capital: 'Basseterre',     region: 'Americas' },
  { code: 'lc', en: 'Saint Lucia',           fr: 'Sainte-Lucie',          capital: 'Castries',       region: 'Americas' },
  { code: 'vc', en: 'Saint Vincent',         fr: 'Saint-Vincent',         capital: 'Kingstown',      region: 'Americas' },
  { code: 'ws', en: 'Samoa',                 fr: 'Samoa',                 capital: 'Apia',           region: 'Oceania' },
  { code: 'sm', en: 'San Marino',            fr: 'Saint-Marin',           capital: 'San Marino',     region: 'Europe' },
  { code: 'st', en: 'São Tomé and Príncipe', fr: 'Sao Tomé',              capital: 'São Tomé',       region: 'Africa' },
  { code: 'sa', en: 'Saudi Arabia',          fr: 'Arabie Saoudite',       capital: 'Riyadh',         region: 'Asia' },
  { code: 'sn', en: 'Senegal',               fr: 'Sénégal',               capital: 'Dakar',          region: 'Africa' },
  { code: 'rs', en: 'Serbia',                fr: 'Serbie',                capital: 'Belgrade',       region: 'Europe' },
  { code: 'sc', en: 'Seychelles',            fr: 'Seychelles',            capital: 'Victoria',       region: 'Africa' },
  { code: 'sl', en: 'Sierra Leone',          fr: 'Sierra Leone',          capital: 'Freetown',       region: 'Africa' },
  { code: 'sg', en: 'Singapore',             fr: 'Singapour',             capital: 'Singapore',      region: 'Asia' },
  { code: 'sk', en: 'Slovakia',              fr: 'Slovaquie',             capital: 'Bratislava',     region: 'Europe' },
  { code: 'si', en: 'Slovenia',              fr: 'Slovénie',              capital: 'Ljubljana',      region: 'Europe' },
  { code: 'sb', en: 'Solomon Islands',       fr: 'Îles Salomon',          capital: 'Honiara',        region: 'Oceania' },
  { code: 'so', en: 'Somalia',               fr: 'Somalie',               capital: 'Mogadishu',      region: 'Africa' },
  { code: 'za', en: 'South Africa',          fr: 'Afrique du Sud',        capital: 'Pretoria',       region: 'Africa' },
  { code: 'ss', en: 'South Sudan',           fr: 'Soudan du Sud',         capital: 'Juba',           region: 'Africa' },
  { code: 'es', en: 'Spain',                 fr: 'Espagne',               capital: 'Madrid',         region: 'Europe' },
  { code: 'lk', en: 'Sri Lanka',             fr: 'Sri Lanka',             capital: 'Sri Jayawardenepura Kotte', region: 'Asia' },
  { code: 'sd', en: 'Sudan',                 fr: 'Soudan',                capital: 'Khartoum',       region: 'Africa' },
  { code: 'sr', en: 'Suriname',              fr: 'Suriname',              capital: 'Paramaribo',     region: 'Americas' },
  { code: 'se', en: 'Sweden',                fr: 'Suède',                 capital: 'Stockholm',      region: 'Europe' },
  { code: 'ch', en: 'Switzerland',           fr: 'Suisse',                capital: 'Bern',           region: 'Europe' },
  { code: 'sy', en: 'Syria',                 fr: 'Syrie',                 capital: 'Damascus',       region: 'Asia' },
  { code: 'tw', en: 'Taiwan',                fr: 'Taïwan',                capital: 'Taipei',         region: 'Asia' },
  { code: 'tj', en: 'Tajikistan',            fr: 'Tadjikistan',           capital: 'Dushanbe',       region: 'Asia' },
  { code: 'tz', en: 'Tanzania',              fr: 'Tanzanie',              capital: 'Dodoma',         region: 'Africa' },
  { code: 'th', en: 'Thailand',              fr: 'Thaïlande',             capital: 'Bangkok',        region: 'Asia' },
  { code: 'tl', en: 'Timor-Leste',           fr: 'Timor-Leste',           capital: 'Dili',           region: 'Asia' },
  { code: 'tg', en: 'Togo',                  fr: 'Togo',                  capital: 'Lomé',           region: 'Africa' },
  { code: 'to', en: 'Tonga',                 fr: 'Tonga',                 capital: "Nuku'alofa",     region: 'Oceania' },
  { code: 'tt', en: 'Trinidad and Tobago',   fr: 'Trinité-et-Tobago',     capital: 'Port of Spain',  region: 'Americas' },
  { code: 'tn', en: 'Tunisia',               fr: 'Tunisie',               capital: 'Tunis',          region: 'Africa' },
  { code: 'tr', en: 'Turkey',                fr: 'Turquie',               capital: 'Ankara',         region: 'Asia' },
  { code: 'tm', en: 'Turkmenistan',          fr: 'Turkménistan',          capital: 'Ashgabat',       region: 'Asia' },
  { code: 'tv', en: 'Tuvalu',                fr: 'Tuvalu',                capital: 'Funafuti',       region: 'Oceania' },
  { code: 'ug', en: 'Uganda',                fr: 'Ouganda',               capital: 'Kampala',        region: 'Africa' },
  { code: 'ua', en: 'Ukraine',               fr: 'Ukraine',               capital: 'Kyiv',           region: 'Europe' },
  { code: 'ae', en: 'UAE',                   fr: 'Émirats arabes unis',   capital: 'Abu Dhabi',      region: 'Asia' },
  { code: 'gb', en: 'United Kingdom',        fr: 'Royaume-Uni',           capital: 'London',         region: 'Europe' },
  { code: 'us', en: 'United States',         fr: 'États-Unis',            capital: 'Washington D.C.',region: 'Americas' },
  { code: 'uy', en: 'Uruguay',               fr: 'Uruguay',               capital: 'Montevideo',     region: 'Americas' },
  { code: 'uz', en: 'Uzbekistan',            fr: 'Ouzbékistan',           capital: 'Tashkent',       region: 'Asia' },
  { code: 'vu', en: 'Vanuatu',               fr: 'Vanuatu',               capital: 'Port Vila',      region: 'Oceania' },
  { code: 've', en: 'Venezuela',             fr: 'Venezuela',             capital: 'Caracas',        region: 'Americas' },
  { code: 'vn', en: 'Vietnam',               fr: 'Vietnam',               capital: 'Hanoi',          region: 'Asia' },
  { code: 'ye', en: 'Yemen',                 fr: 'Yémen',                 capital: "Sana'a",         region: 'Asia' },
  { code: 'zm', en: 'Zambia',                fr: 'Zambie',                capital: 'Lusaka',         region: 'Africa' },
  { code: 'zw', en: 'Zimbabwe',              fr: 'Zimbabwe',              capital: 'Harare',         region: 'Africa' },
]

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_LIVES     = 3
const POINTS_CORRECT  = 50
const POINTS_TIMER_BONUS = 2
const STREAK_MULTIPLIER = (streak) => {
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 5)  return 1.5
  return 1
}
const TIMER_SECONDS = 15
const SCREEN        = { SETUP: 'setup', PLAYING: 'playing', GAME_OVER: 'gameover' }
const REGIONS = [
  { key: 'Africa',   en: 'Africa',   fr: 'Afrique'   },
  { key: 'Americas', en: 'Americas', fr: 'Amériques' },
  { key: 'Asia',     en: 'Asia',     fr: 'Asie'      },
  { key: 'Europe',   en: 'Europe',   fr: 'Europe'    },
  { key: 'Oceania',  en: 'Oceania',  fr: 'Océanie'   },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// questionMode: 'flag' | 'capital-flag' | 'name' | 'both'
// answerMode:   'mcq'  | 'type' | 'both'
// Note: 'capital-flag' always forces aMode='mcq' (pick a flag image)
function buildQuestion(pool, questionMode, answerMode) {
  const qMode = questionMode === 'both'
    ? (['flag', 'capital-flag', 'name'][Math.floor(Math.random() * 3)])
    : questionMode
  // capital-flag mode: show capital, pick the flag → always MCQ
  const forcedAMode = qMode === 'capital-flag' ? 'mcq' : null
  const aMode = forcedAMode ?? (answerMode === 'both'
    ? (Math.random() > 0.5 ? 'mcq' : 'type')
    : answerMode)

  const shuffled  = shuffle(pool)
  const correct   = shuffled[0]
  const distractors = shuffle(shuffled.slice(1)).slice(0, 3)
  const options   = shuffle([correct, ...distractors])
  return { correct, options, qMode, aMode }
}

// ─── Supabase score key per mode combo ───────────────────────────────────────
function scoreKey(questionMode, answerMode) {
  return `capital_city_${questionMode}_${answerMode}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CapitalCity() {
  const locale    = useLocale()
  const t         = (en, fr) => locale === 'fr' ? fr : en

  // Setup
  const [screen,       setScreen]       = useState(SCREEN.SETUP)
  const [questionMode, setQuestionMode] = useState('flag')   // flag | name | both
  const [answerMode,   setAnswerMode]   = useState('mcq')    // mcq  | type | both
  const [regionFilter, setRegionFilter] = useState([])
  const [isMobile,     setIsMobile]     = useState(false)

  // Game state
  const [lives,      setLives]      = useState(MAX_LIVES)
  const [streak,     setStreak]     = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [lastPoints, setLastPoints] = useState(null)
  const [question,   setQuestion]   = useState(null)
  const [answered,   setAnswered]   = useState(null)  // null | { correct, selected, isCorrect }
  const [history,    setHistory]    = useState([])
  const [timer,      setTimer]      = useState(TIMER_SECONDS)
  const [typeInput,  setTypeInput]  = useState('')
  const [typeResult, setTypeResult] = useState(null)  // null | 'correct' | 'wrong'
  const [score,      setScore]      = useState(0)
  const [bestScore,  setBestScore]  = useState(0)
  const scoreRef = useRef(0)

  // Supabase
  const [user,       setUser]       = useState(null)
  const [bestScores, setBestScores] = useState({})

  const timerRef  = useRef(null)
  const livesRef  = useRef(MAX_LIVES)
  const streakRef = useRef(0)
  const inputRef  = useRef(null)

  // ── Auth & best scores ──────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await loadBestScores(supabase, u.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      const u = s?.user ?? null
      setUser(u)
      if (u) await loadBestScores(createClient(), u.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadBestScores(supabase, userId) {
    const { data } = await supabase
      .from('game_scores')
      .select('mode, best_streak')
      .eq('user_id', userId)
      .like('mode', 'capital_city_%')
    if (data) {
      const map = {}
      data.forEach(row => { map[row.mode] = row.best_streak })
      setBestScores(map)
    }
  }

  async function saveBestScore(newStreak) {
    if (!user) return
    const key = scoreKey(questionMode, answerMode)
    const prev = bestScores[key] ?? 0
    if (newStreak <= prev) return
    const supabase = createClient()
    await supabase.from('game_scores').upsert({
      user_id:     user.id,
      mode:        key,
      best_streak: newStreak,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,mode' })
    setBestScores(prev => ({ ...prev, [key]: newStreak }))
  }

  // ── Resize ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Pool ────────────────────────────────────────────────────────────────────
  const getPool = useCallback(() => {
    const base = regionFilter.length > 0
      ? COUNTRIES.filter(c => regionFilter.includes(c.region))
      : COUNTRIES
    return base.length >= 4 ? base : COUNTRIES
  }, [regionFilter])

  const getName = (c) => locale === 'fr' ? c.fr : c.en

  // ── Question builder ────────────────────────────────────────────────────────
  const makeNextQuestion = useCallback(() => {
    const q = buildQuestion(getPool(), questionMode, answerMode)
    setQuestion(q)
    setAnswered(null)
    setTypeInput('')
    setTypeResult(null)
    setTimer(TIMER_SECONDS)
    scoreRef.current = 0
    setScore(0)
    setBestScore(0)
  }, [getPool, questionMode, answerMode])

  // ── Start ───────────────────────────────────────────────────────────────────
  function startGame() {
    livesRef.current  = MAX_LIVES
    streakRef.current = 0
    setLives(MAX_LIVES)
    setStreak(0)
    setBestStreak(0)
    setScore(0)
    setLastPoints(null)
    setHistory([])
    setScreen(SCREEN.PLAYING)
    const q = buildQuestion(getPool(), questionMode, answerMode)
    setQuestion(q)
    setAnswered(null)
    setTypeInput('')
    setTypeResult(null)
    setTimer(TIMER_SECONDS)
    scoreRef.current = 0
    setScore(0)
    setBestScore(0)
  }

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== SCREEN.PLAYING || answered !== null || !question) return
    if (timer <= 0) { handleAnswer(null); return }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timer, screen, answered, question])

  // ── Handle answer ───────────────────────────────────────────────────────────
  function handleAnswer(selected) {
    clearTimeout(timerRef.current)
    const isCorrect = selected !== null && selected.code === question.correct.code

    setAnswered({ selected, correct: question.correct, isCorrect })
    setHistory(prev => [...prev, { question, selected, isCorrect }])

    if (isCorrect) {
      const ns = streakRef.current + 1
      streakRef.current = ns
      setStreak(ns)
      setBestStreak(prev => {
        const nb = Math.max(prev, ns)
        return nb
      })
      const multiplier = Math.max(1, ns)
      const timerBonus = timer * 10
      const pts = Math.round((500 + timerBonus) * multiplier)
      const newScore = scoreRef.current + pts
      scoreRef.current = newScore
      setScore(newScore)
      setBestScore(b => Math.max(b, newScore))
      setLastPoints({ pts, multiplier })
      setTimeout(() => setLastPoints(null), 1500)
    } else {
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setTimeout(async () => {
          const finalBest = Math.max(bestStreak, streakRef.current)
          await saveBestScore(finalBest)
          setScreen(SCREEN.GAME_OVER)
        }, 2000)
        return
      }
    }

    setTimeout(() => makeNextQuestion(), 1800)
  }

  // ── Type answer submit ───────────────────────────────────────────────────────
  function handleTypeSubmit() {
    if (answered !== null || typeResult !== null) return
    const input     = typeInput.trim().toLowerCase()
    const correct   = question.correct.capital.toLowerCase()
    const isCorrect = input === correct ||
      correct.includes(input) && input.length >= 3

    setTypeResult(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      handleAnswer(question.correct)
    } else {
      // show correct answer briefly then move on
      setAnswered({ selected: null, correct: question.correct, isCorrect: false })
      clearTimeout(timerRef.current)
      setHistory(prev => [...prev, { question, selected: null, isCorrect: false }])
      streakRef.current = 0
      setStreak(0)
      const nl = livesRef.current - 1
      livesRef.current = nl
      setLives(nl)
      if (nl <= 0) {
        setTimeout(async () => {
          await saveBestScore(bestStreak)
          setScreen(SCREEN.GAME_OVER)
        }, 1200)
        return
      }
      setTimeout(() => makeNextQuestion(), 2000)
    }
  }

  // ── Colours ─────────────────────────────────────────────────────────────────
  const C = {
    navy: '#0B1F3B', blue: '#9EB7E5', cream: '#F4F1E6',
    green: '#426A5A', gold: '#FEB12F', red: '#C0392B',
    border: '#E2DDD5', muted: '#8A8278',
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SETUP SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === SCREEN.SETUP) {
    const currentBest = bestScores[scoreKey(questionMode, answerMode)] ?? 0

    return (
      <div style={{ backgroundColor: C.cream, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏙️</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: '900', color: C.navy, letterSpacing: '-1px' }}>
              {t('Capital City', 'Capitale')}
            </h1>
            <p style={{ margin: 0, color: C.muted, fontSize: '15px' }}>
              {t('3 lives · infinite questions · beat your streak', '3 vies · questions infinies · bats ton record')}
            </p>
          </div>

          {/* Question mode */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '20px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Question mode', 'Mode de question')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'flag',         icon: '🏳️', label: t('Flag → Capital',         'Drapeau → Capitale'),         desc: t('See a flag, find the capital',          'Voir un drapeau, trouver la capitale') },
                { key: 'capital-flag', icon: '🏙️', label: t('Capital → Flag',          'Capitale → Drapeau'),         desc: t('See a capital city, find the flag',     'Voir une capitale, trouver le drapeau') },
                { key: 'name',  icon: '🗺️', label: t('Country → Capital',     'Pays → Capitale'),           desc: t('See a country name, find the capital', 'Voir un pays, trouver la capitale') },
                { key: 'both',  icon: '🔀', label: t('Mixed',                  'Mixte'),                     desc: t('Both question types randomly',         'Les deux types en alternance') },
              ].map(m => (
                <button key={m.key} onClick={() => setQuestionMode(m.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: questionMode === m.key ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: questionMode === m.key ? C.navy : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: questionMode === m.key ? 'white' : C.navy }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: questionMode === m.key ? 'rgba(255,255,255,0.6)' : C.muted, marginTop: '1px' }}>{m.desc}</div>
                  </div>
                  {questionMode === m.key && (
                    <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill={C.blue}/>
                      <polyline points="3.5,8 6.5,11 12.5,5" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Answer mode */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '20px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Answer mode', 'Mode de réponse')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'mcq',  icon: '☑️', label: t('Multiple choice', 'Choix multiple'), desc: t('Pick from 4 options',       'Choisir parmi 4 options') },
                { key: 'type', icon: '⌨️', label: t('Type the answer',  'Taper la réponse'), desc: t('Type the capital city name', 'Taper le nom de la capitale') },
                { key: 'both', icon: '🔀', label: t('Mixed',            'Mixte'),             desc: t('Both answer types randomly', 'Les deux modes en alternance') },
              ].map(m => (
                <button key={m.key} onClick={() => setAnswerMode(m.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: answerMode === m.key ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: answerMode === m.key ? C.navy : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: answerMode === m.key ? 'white' : C.navy }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: answerMode === m.key ? 'rgba(255,255,255,0.6)' : C.muted, marginTop: '1px' }}>{m.desc}</div>
                  </div>
                  {answerMode === m.key && (
                    <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill={C.blue}/>
                      <polyline points="3.5,8 6.5,11 12.5,5" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Region filter */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '20px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('Region (optional)', 'Région (optionnel)')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {REGIONS.map(r => {
                const active = regionFilter.includes(r.key)
                return (
                  <button key={r.key} onClick={() => setRegionFilter(prev => active ? prev.filter(x => x !== r.key) : [...prev, r.key])}
                    style={{ padding: '7px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: active ? `2px solid ${C.navy}` : `1.5px solid ${C.border}`, backgroundColor: active ? C.navy : 'white', color: active ? 'white' : C.navy, transition: 'all 0.15s' }}>
                    {locale === 'fr' ? r.fr : r.en}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Best score for this combo */}
          {user && currentBest > 0 && (
            <div style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#854d0e' }}>{t('Your best streak', 'Votre meilleure série')}</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#92400e' }}>{currentBest}</div>
              </div>
            </div>
          )}
          {!user && (
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', fontSize: '13px', color: '#0369a1' }}>
              <Link href={`/${locale}/auth/login`} style={{ color: '#0369a1', fontWeight: '700' }}>
                {t('Log in', 'Se connecter')}
              </Link>
              {t(' to save your best scores.', ' pour sauvegarder vos meilleurs scores.')}
            </div>
          )}

          <button onClick={startGame}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: C.navy, color: 'white', fontSize: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', letterSpacing: '-0.3px' }}>
            {t('Start Game', 'Lancer le jeu')} →
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYING SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === SCREEN.PLAYING && question) {
    const isAnswered = answered !== null
    const timerPct   = (timer / TIMER_SECONDS) * 100
    const timerColor = timer > 8 ? '#4ade80' : timer > 4 ? '#FEB12F' : '#f87171'
    const isCapitalFlag = question.qMode === 'capital-flag'

    const questionLabel = (
      <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {question.qMode === 'flag'
          ? t('What is the capital of this country?', 'Quelle est la capitale de ce pays ?')
          : question.qMode === 'capital-flag'
          ? t('Which flag belongs to this capital?', 'Quel drapeau correspond à cette capitale ?')
          : t('What is the capital of…', 'Quelle est la capitale de…')}
      </p>
    )

    const timerBar = (
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '100%', width: `${timerPct}%`, backgroundColor: timerColor, borderRadius: '99px', transition: 'width 1s linear, background-color 0.3s' }} />
      </div>
    )

    const hud = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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
        <div style={{ backgroundColor: streak > 0 ? 'rgba(254,177,47,0.15)' : 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: streak > 0 ? '1px solid rgba(254,177,47,0.3)' : 'none' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: streak > 0 ? 'rgba(254,177,47,0.7)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Streak</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: streak > 0 ? '#FEB12F' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>🔥 {streak}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', border: '1px solid rgba(74,222,128,0.25)' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Score</div>
          <div style={{ fontSize: '16px', fontWeight: '900', color: '#4ade80', lineHeight: 1, whiteSpace: 'nowrap' }}>{score.toLocaleString()} pts</div>
        </div>
        <button onClick={() => setScreen(SCREEN.SETUP)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', borderRadius: '8px', padding: '6px 10px' }}>✕</button>
      </div>
    )

    const stimulus = (
      <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        {question.qMode === 'flag' ? (
          <img src={`https://flagcdn.com/w640/${question.correct.code}.png`} alt="flag"
            style={{ maxWidth: '280px', width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'block' }} />
        ) : question.qMode === 'capital-flag' ? (
          <div style={{ fontSize: isMobile ? '28px' : '34px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', textAlign: 'center' }}>
            {question.correct.capital}
          </div>
        ) : (
          <div style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '900', color: 'white', letterSpacing: '-1px', textAlign: 'center' }}>
            {getName(question.correct)}
          </div>
        )}
      </div>
    )

    const answerArea = (
      <>
        {question.aMode === 'mcq' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {question.options.map((opt, i) => {
              const isCorrectOpt = opt.code === question.correct.code
              const isSelected = answered?.selected?.code === opt.code
              let bg = 'rgba(255,255,255,0.06)', border = '1.5px solid rgba(255,255,255,0.12)', color = 'white'
              if (isAnswered) {
                if (isCorrectOpt)    { bg = 'rgba(74,222,128,0.15)'; border = '2px solid #4ade80'; color = '#4ade80' }
                else if (isSelected) { bg = 'rgba(248,113,113,0.15)'; border = '2px solid #f87171'; color = '#f87171' }
                else                 { bg = 'rgba(255,255,255,0.03)'; color = 'rgba(255,255,255,0.3)' }
              }
              return (
                <button key={i} onClick={() => !isAnswered && handleAnswer(opt)} disabled={isAnswered}
                  style={{ padding: isCapitalFlag ? '10px' : '14px 12px', borderRadius: '12px', border, backgroundColor: bg, color, fontSize: '14px', fontWeight: '700', cursor: isAnswered ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'center', lineHeight: 1.3 }}>
                  {isCapitalFlag ? (
                    <div>
                      <div style={{ width: '100%', aspectRatio: '3/2', overflow: 'hidden', borderRadius: '6px', marginBottom: isAnswered ? '8px' : '0', backgroundColor: '#1a2a40' }}>
                        <img src={`https://flagcdn.com/w320/${opt.code}.png`} alt={getName(opt)}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                      </div>
                      {isAnswered && (
                        <div style={{ fontSize: '12px', fontWeight: '700', color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getName(opt)}
                        </div>
                      )}
                    </div>
                  ) : opt.capital}
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input ref={inputRef} type="text" value={typeInput}
                onChange={e => setTypeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isAnswered && handleTypeSubmit()}
                placeholder={t('Type the capital city…', 'Tapez la capitale…')}
                disabled={isAnswered} autoFocus
                style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: `2px solid ${typeResult === 'correct' ? '#4ade80' : typeResult === 'wrong' ? '#f87171' : 'rgba(255,255,255,0.15)'}`, fontSize: '15px', outline: 'none', backgroundColor: typeResult === 'correct' ? 'rgba(74,222,128,0.1)' : typeResult === 'wrong' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: '600' }} />
              <button onClick={handleTypeSubmit} disabled={isAnswered || !typeInput.trim()}
                style={{ padding: '14px 20px', borderRadius: '12px', backgroundColor: '#9EB7E5', color: '#0B1F3B', border: 'none', fontSize: '14px', fontWeight: '800', cursor: isAnswered || !typeInput.trim() ? 'not-allowed' : 'pointer', opacity: isAnswered || !typeInput.trim() ? 0.5 : 1 }}>
                {t('Go', 'OK')}
              </button>
            </div>
            {isAnswered && !answered?.isCorrect && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', fontSize: '14px', color: '#f87171', fontWeight: '700' }}>
                {t('Correct answer: ', 'Bonne réponse : ')}<strong>{question.correct.capital}</strong>
              </div>
            )}
          </div>
        )}
        {isAnswered && answered.isCorrect && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>
            ✓ {t('Correct!', 'Correct !')} 🔥 {streakRef.current}
          </div>
        )}
      </>
    )

    if (isMobile) {
      return (
        <div style={{ backgroundColor: '#0B1F3B', minHeight: '100dvh', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', padding: '16px 14px 24px' }}>
          {hud}
          {timerBar}
          {questionLabel}
          {stimulus}
          {answerArea}
        </div>
      )
    }

    return (
      <div style={{ backgroundColor: '#0B1F3B', minHeight: '100vh', fontFamily: 'var(--font-body)', padding: '24px 24px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>
              🏙️ {t('Capital City', 'Capitale')}
            </h1>
            {hud}
          </div>
          {timerBar}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {stimulus}
            </div>
            <div style={{ width: '320px', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {questionLabel}
              {answerArea}
            </div>
          </div>
        </div>
      </div>
    )
  }}