'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'

// Same data as CountriesPage — in production you'd import from a shared file
const COUNTRIES = [
  { code: 'af', en: 'Afghanistan',                      fr: 'Afghanistan',                      region: 'Asia',    capital: { en: 'Kabul',            fr: 'Kaboul'          }, colors: ['red','black','green','white'],          symbols: ['emblem','mosque'] },
  { code: 'al', en: 'Albania',                          fr: 'Albanie',                          region: 'Europe',  capital: { en: 'Tirana',           fr: 'Tirana'          }, colors: ['red','black'],                          symbols: ['eagle'] },
  { code: 'dz', en: 'Algeria',                          fr: 'Algérie',                          region: 'Africa',  capital: { en: 'Algiers',          fr: 'Alger'           }, colors: ['green','white','red'],                  symbols: ['crescent','star'] },
  { code: 'ad', en: 'Andorra',                          fr: 'Andorre',                          region: 'Europe',  capital: { en: 'Andorra la Vella', fr: 'Andorre-la-Vieille'}, colors: ['blue','yellow','red'],                symbols: ['coat of arms'] },
  { code: 'ao', en: 'Angola',                           fr: 'Angola',                           region: 'Africa',  capital: { en: 'Luanda',           fr: 'Luanda'          }, colors: ['red','black'],                          symbols: ['star','gear','machete'] },
  { code: 'ag', en: 'Antigua and Barbuda',              fr: 'Antigua-et-Barbuda',               region: 'Americas',capital: { en: "Saint John's",     fr: 'Saint-Jean'      }, colors: ['red','black','white','blue','yellow'],  symbols: ['sun'] },
  { code: 'ar', en: 'Argentina',                        fr: 'Argentine',                        region: 'Americas',capital: { en: 'Buenos Aires',     fr: 'Buenos Aires'    }, colors: ['blue','white'],                         symbols: ['sun'] },
  { code: 'am', en: 'Armenia',                          fr: 'Arménie',                          region: 'Asia',    capital: { en: 'Yerevan',          fr: 'Erevan'          }, colors: ['red','blue','orange'],                  symbols: [] },
  { code: 'au', en: 'Australia',                        fr: 'Australie',                        region: 'Oceania', capital: { en: 'Canberra',         fr: 'Canberra'        }, colors: ['blue','red','white'],                   symbols: ['stars','cross','union jack'] },
  { code: 'at', en: 'Austria',                          fr: 'Autriche',                         region: 'Europe',  capital: { en: 'Vienna',           fr: 'Vienne'          }, colors: ['red','white'],                          symbols: [] },
  { code: 'az', en: 'Azerbaijan',                       fr: 'Azerbaïdjan',                      region: 'Asia',    capital: { en: 'Baku',             fr: 'Bakou'           }, colors: ['blue','red','green','white'],            symbols: ['crescent','star'] },
  { code: 'bs', en: 'Bahamas',                          fr: 'Bahamas',                          region: 'Americas',capital: { en: 'Nassau',           fr: 'Nassau'          }, colors: ['blue','yellow','black'],                symbols: ['triangle'] },
  { code: 'bh', en: 'Bahrain',                          fr: 'Bahreïn',                          region: 'Asia',    capital: { en: 'Manama',           fr: 'Manama'          }, colors: ['red','white'],                          symbols: [] },
  { code: 'bd', en: 'Bangladesh',                       fr: 'Bangladesh',                       region: 'Asia',    capital: { en: 'Dhaka',            fr: 'Dacca'           }, colors: ['green','red'],                          symbols: ['circle'] },
  { code: 'bb', en: 'Barbados',                         fr: 'Barbade',                          region: 'Americas',capital: { en: 'Bridgetown',       fr: 'Bridgetown'      }, colors: ['blue','yellow','black'],                symbols: ['trident'] },
  { code: 'by', en: 'Belarus',                          fr: 'Biélorussie',                      region: 'Europe',  capital: { en: 'Minsk',            fr: 'Minsk'           }, colors: ['red','green','white'],                  symbols: ['pattern'] },
  { code: 'be', en: 'Belgium',                          fr: 'Belgique',                         region: 'Europe',  capital: { en: 'Brussels',         fr: 'Bruxelles'       }, colors: ['black','yellow','red'],                 symbols: [] },
  { code: 'bz', en: 'Belize',                           fr: 'Belize',                           region: 'Americas',capital: { en: 'Belmopan',         fr: 'Belmopan'        }, colors: ['blue','red','white'],                   symbols: ['coat of arms','tree'] },
  { code: 'bj', en: 'Benin',                            fr: 'Bénin',                            region: 'Africa',  capital: { en: 'Porto-Novo',       fr: 'Porto-Novo'      }, colors: ['green','yellow','red'],                 symbols: [] },
  { code: 'bt', en: 'Bhutan',                           fr: 'Bhoutan',                          region: 'Asia',    capital: { en: 'Thimphu',          fr: 'Thimphu'         }, colors: ['orange','yellow','white'],              symbols: ['dragon'] },
  { code: 'bo', en: 'Bolivia',                          fr: 'Bolivie',                          region: 'Americas',capital: { en: 'Sucre',            fr: 'Sucre'           }, colors: ['red','yellow','green'],                 symbols: [] },
  { code: 'ba', en: 'Bosnia and Herzegovina',           fr: 'Bosnie-Herzégovine',               region: 'Europe',  capital: { en: 'Sarajevo',         fr: 'Sarajevo'        }, colors: ['blue','yellow','white'],                symbols: ['stars','triangle'] },
  { code: 'bw', en: 'Botswana',                         fr: 'Botswana',                         region: 'Africa',  capital: { en: 'Gaborone',         fr: 'Gaborone'        }, colors: ['blue','black','white'],                 symbols: [] },
  { code: 'br', en: 'Brazil',                           fr: 'Brésil',                           region: 'Americas',capital: { en: 'Brasília',         fr: 'Brasília'        }, colors: ['green','yellow','blue','white'],        symbols: ['stars','globe'] },
  { code: 'bn', en: 'Brunei',                           fr: 'Brunéi',                           region: 'Asia',    capital: { en: 'Bandar Seri Begawan',fr:'Bandar Seri Begawan'}, colors: ['yellow','white','black'],            symbols: ['emblem','crescent'] },
  { code: 'bg', en: 'Bulgaria',                         fr: 'Bulgarie',                         region: 'Europe',  capital: { en: 'Sofia',            fr: 'Sofia'           }, colors: ['white','green','red'],                  symbols: [] },
  { code: 'bf', en: 'Burkina Faso',                     fr: 'Burkina Faso',                     region: 'Africa',  capital: { en: 'Ouagadougou',      fr: 'Ouagadougou'     }, colors: ['red','green','yellow'],                 symbols: ['star'] },
  { code: 'bi', en: 'Burundi',                          fr: 'Burundi',                          region: 'Africa',  capital: { en: 'Gitega',           fr: 'Gitega'          }, colors: ['red','white','green'],                  symbols: ['stars'] },
  { code: 'kh', en: 'Cambodia',                         fr: 'Cambodge',                         region: 'Asia',    capital: { en: 'Phnom Penh',       fr: 'Phnom Penh'      }, colors: ['blue','red','white'],                   symbols: ['temple','angkor wat'] },
  { code: 'cm', en: 'Cameroon',                         fr: 'Cameroun',                         region: 'Africa',  capital: { en: 'Yaoundé',          fr: 'Yaoundé'         }, colors: ['green','red','yellow'],                 symbols: ['star'] },
  { code: 'ca', en: 'Canada',                           fr: 'Canada',                           region: 'Americas',capital: { en: 'Ottawa',           fr: 'Ottawa'          }, colors: ['red','white'],                          symbols: ['maple leaf'] },
  { code: 'cv', en: 'Cape Verde',                       fr: 'Cap-Vert',                         region: 'Africa',  capital: { en: 'Praia',            fr: 'Praia'           }, colors: ['blue','red','white','yellow'],          symbols: ['stars','circle'] },
  { code: 'cf', en: 'Central African Republic',         fr: 'République centrafricaine',        region: 'Africa',  capital: { en: 'Bangui',           fr: 'Bangui'          }, colors: ['blue','white','green','yellow','red'],  symbols: ['star'] },
  { code: 'td', en: 'Chad',                             fr: 'Tchad',                            region: 'Africa',  capital: { en: "N'Djamena",        fr: "N'Djaména"       }, colors: ['blue','yellow','red'],                  symbols: [] },
  { code: 'cl', en: 'Chile',                            fr: 'Chili',                            region: 'Americas',capital: { en: 'Santiago',         fr: 'Santiago'        }, colors: ['red','white','blue'],                   symbols: ['star'] },
  { code: 'cn', en: 'China',                            fr: 'Chine',                            region: 'Asia',    capital: { en: 'Beijing',          fr: 'Pékin'           }, colors: ['red','yellow'],                         symbols: ['stars'] },
  { code: 'co', en: 'Colombia',                         fr: 'Colombie',                         region: 'Americas',capital: { en: 'Bogotá',           fr: 'Bogotá'          }, colors: ['yellow','blue','red'],                  symbols: [] },
  { code: 'km', en: 'Comoros',                          fr: 'Comores',                          region: 'Africa',  capital: { en: 'Moroni',           fr: 'Moroni'          }, colors: ['green','white','blue','yellow','red'],  symbols: ['crescent','stars'] },
  { code: 'cg', en: 'Congo',                            fr: 'Congo',                            region: 'Africa',  capital: { en: 'Brazzaville',      fr: 'Brazzaville'     }, colors: ['green','yellow','red'],                 symbols: [] },
  { code: 'cr', en: 'Costa Rica',                       fr: 'Costa Rica',                       region: 'Americas',capital: { en: 'San José',         fr: 'San José'        }, colors: ['blue','white','red'],                   symbols: [] },
  { code: 'hr', en: 'Croatia',                          fr: 'Croatie',                          region: 'Europe',  capital: { en: 'Zagreb',           fr: 'Zagreb'          }, colors: ['red','white','blue'],                   symbols: ['coat of arms','checkerboard'] },
  { code: 'cu', en: 'Cuba',                             fr: 'Cuba',                             region: 'Americas',capital: { en: 'Havana',           fr: 'La Havane'       }, colors: ['blue','white','red'],                   symbols: ['star','triangle'] },
  { code: 'cy', en: 'Cyprus',                           fr: 'Chypre',                           region: 'Europe',  capital: { en: 'Nicosia',          fr: 'Nicosie'         }, colors: ['white','orange','green'],               symbols: ['map','olive branches'] },
  { code: 'cz', en: 'Czech Republic',                   fr: 'République tchèque',               region: 'Europe',  capital: { en: 'Prague',           fr: 'Prague'          }, colors: ['white','red','blue'],                   symbols: ['triangle'] },
  { code: 'dk', en: 'Denmark',                          fr: 'Danemark',                         region: 'Europe',  capital: { en: 'Copenhagen',       fr: 'Copenhague'      }, colors: ['red','white'],                          symbols: ['cross'] },
  { code: 'dj', en: 'Djibouti',                         fr: 'Djibouti',                         region: 'Africa',  capital: { en: 'Djibouti City',    fr: 'Djibouti'        }, colors: ['blue','green','white','red'],           symbols: ['star','triangle'] },
  { code: 'dm', en: 'Dominica',                         fr: 'Dominique',                        region: 'Americas',capital: { en: 'Roseau',           fr: 'Roseau'          }, colors: ['green','yellow','black','white','red'], symbols: ['bird','cross','stars'] },
  { code: 'do', en: 'Dominican Republic',               fr: 'République dominicaine',           region: 'Americas',capital: { en: 'Santo Domingo',    fr: 'Saint-Domingue'  }, colors: ['blue','red','white'],                   symbols: ['cross','coat of arms'] },
  { code: 'cd', en: 'DR Congo',                         fr: 'RD Congo',                         region: 'Africa',  capital: { en: 'Kinshasa',         fr: 'Kinshasa'        }, colors: ['blue','red','yellow'],                  symbols: ['star','diagonal'] },
  { code: 'ec', en: 'Ecuador',                          fr: 'Équateur',                         region: 'Americas',capital: { en: 'Quito',            fr: 'Quito'           }, colors: ['yellow','blue','red'],                  symbols: ['coat of arms'] },
  { code: 'eg', en: 'Egypt',                            fr: 'Égypte',                           region: 'Africa',  capital: { en: 'Cairo',            fr: 'Le Caire'        }, colors: ['red','white','black'],                  symbols: ['eagle'] },
  { code: 'sv', en: 'El Salvador',                      fr: 'Salvador',                         region: 'Americas',capital: { en: 'San Salvador',     fr: 'San Salvador'    }, colors: ['blue','white'],                         symbols: ['coat of arms'] },
  { code: 'gq', en: 'Equatorial Guinea',                fr: 'Guinée équatoriale',               region: 'Africa',  capital: { en: 'Malabo',           fr: 'Malabo'          }, colors: ['green','white','red','blue'],           symbols: ['tree','coat of arms'] },
  { code: 'er', en: 'Eritrea',                          fr: 'Érythrée',                         region: 'Africa',  capital: { en: 'Asmara',           fr: 'Asmara'          }, colors: ['green','blue','red','yellow'],          symbols: ['olive branch','triangle'] },
  { code: 'ee', en: 'Estonia',                          fr: 'Estonie',                          region: 'Europe',  capital: { en: 'Tallinn',          fr: 'Tallinn'         }, colors: ['blue','black','white'],                 symbols: [] },
  { code: 'sz', en: 'Eswatini',                         fr: 'Eswatini',                         region: 'Africa',  capital: { en: 'Mbabane',          fr: 'Mbabane'         }, colors: ['blue','yellow','red','black','white'],  symbols: ['shield','spears'] },
  { code: 'et', en: 'Ethiopia',                         fr: 'Éthiopie',                         region: 'Africa',  capital: { en: 'Addis Ababa',      fr: 'Addis-Abeba'     }, colors: ['green','yellow','red','blue'],          symbols: ['star','pentagram'] },
  { code: 'fj', en: 'Fiji',                             fr: 'Fidji',                            region: 'Oceania', capital: { en: 'Suva',             fr: 'Suva'            }, colors: ['blue','white','red'],                   symbols: ['union jack','coat of arms'] },
  { code: 'fi', en: 'Finland',                          fr: 'Finlande',                         region: 'Europe',  capital: { en: 'Helsinki',         fr: 'Helsinki'        }, colors: ['white','blue'],                         symbols: ['cross'] },
  { code: 'fr', en: 'France',                           fr: 'France',                           region: 'Europe',  capital: { en: 'Paris',            fr: 'Paris'           }, colors: ['blue','white','red'],                   symbols: [] },
  { code: 'ga', en: 'Gabon',                            fr: 'Gabon',                            region: 'Africa',  capital: { en: 'Libreville',       fr: 'Libreville'      }, colors: ['green','yellow','blue'],                symbols: [] },
  { code: 'gm', en: 'Gambia',                           fr: 'Gambie',                           region: 'Africa',  capital: { en: 'Banjul',           fr: 'Banjul'          }, colors: ['red','blue','green','white'],           symbols: [] },
  { code: 'ge', en: 'Georgia',                          fr: 'Géorgie',                          region: 'Asia',    capital: { en: 'Tbilisi',          fr: 'Tbilissi'        }, colors: ['white','red'],                          symbols: ['cross'] },
  { code: 'de', en: 'Germany',                          fr: 'Allemagne',                        region: 'Europe',  capital: { en: 'Berlin',           fr: 'Berlin'          }, colors: ['black','red','yellow'],                 symbols: [] },
  { code: 'gh', en: 'Ghana',                            fr: 'Ghana',                            region: 'Africa',  capital: { en: 'Accra',            fr: 'Accra'           }, colors: ['red','yellow','green','black'],         symbols: ['star'] },
  { code: 'gr', en: 'Greece',                           fr: 'Grèce',                            region: 'Europe',  capital: { en: 'Athens',           fr: 'Athènes'         }, colors: ['blue','white'],                         symbols: ['cross','stripes'] },
  { code: 'gd', en: 'Grenada',                          fr: 'Grenade',                          region: 'Americas',capital: { en: "Saint George's",   fr: 'Saint-George'    }, colors: ['yellow','red','green'],                 symbols: ['star','nutmeg'] },
  { code: 'gt', en: 'Guatemala',                        fr: 'Guatemala',                        region: 'Americas',capital: { en: 'Guatemala City',   fr: 'Guatemala'       }, colors: ['blue','white'],                         symbols: ['coat of arms','quetzal'] },
  { code: 'gn', en: 'Guinea',                           fr: 'Guinée',                           region: 'Africa',  capital: { en: 'Conakry',          fr: 'Conakry'         }, colors: ['red','yellow','green'],                 symbols: [] },
  { code: 'gw', en: 'Guinea-Bissau',                    fr: 'Guinée-Bissau',                    region: 'Africa',  capital: { en: 'Bissau',           fr: 'Bissau'          }, colors: ['red','yellow','green','black'],         symbols: ['star'] },
  { code: 'gy', en: 'Guyana',                           fr: 'Guyana',                           region: 'Americas',capital: { en: 'Georgetown',       fr: 'Georgetown'      }, colors: ['green','white','yellow','black','red'], symbols: ['triangle','arrow'] },
  { code: 'ht', en: 'Haiti',                            fr: 'Haïti',                            region: 'Americas',capital: { en: 'Port-au-Prince',   fr: 'Port-au-Prince'  }, colors: ['blue','red','white'],                   symbols: ['coat of arms'] },
  { code: 'hn', en: 'Honduras',                         fr: 'Honduras',                         region: 'Americas',capital: { en: 'Tegucigalpa',      fr: 'Tegucigalpa'     }, colors: ['blue','white'],                         symbols: ['stars'] },
  { code: 'hu', en: 'Hungary',                          fr: 'Hongrie',                          region: 'Europe',  capital: { en: 'Budapest',         fr: 'Budapest'        }, colors: ['red','white','green'],                  symbols: [] },
  { code: 'is', en: 'Iceland',                          fr: 'Islande',                          region: 'Europe',  capital: { en: 'Reykjavík',        fr: 'Reykjavik'       }, colors: ['blue','white','red'],                   symbols: ['cross'] },
  { code: 'in', en: 'India',                            fr: 'Inde',                             region: 'Asia',    capital: { en: 'New Delhi',        fr: 'New Delhi'       }, colors: ['orange','white','green','blue'],        symbols: ['wheel','chakra'] },
  { code: 'id', en: 'Indonesia',                        fr: 'Indonésie',                        region: 'Asia',    capital: { en: 'Jakarta',          fr: 'Jakarta'         }, colors: ['red','white'],                          symbols: [] },
  { code: 'ir', en: 'Iran',                             fr: 'Iran',                             region: 'Asia',    capital: { en: 'Tehran',           fr: 'Téhéran'         }, colors: ['green','white','red'],                  symbols: ['emblem','crescent','sword'] },
  { code: 'iq', en: 'Iraq',                             fr: 'Irak',                             region: 'Asia',    capital: { en: 'Baghdad',          fr: 'Bagdad'          }, colors: ['red','white','black'],                  symbols: ['eagle','text'] },
  { code: 'ie', en: 'Ireland',                          fr: 'Irlande',                          region: 'Europe',  capital: { en: 'Dublin',           fr: 'Dublin'          }, colors: ['green','white','orange'],               symbols: [] },
  { code: 'il', en: 'Israel',                           fr: 'Israël',                           region: 'Asia',    capital: { en: 'Jerusalem',        fr: 'Jérusalem'       }, colors: ['white','blue'],                         symbols: ['star of david'] },
  { code: 'it', en: 'Italy',                            fr: 'Italie',                           region: 'Europe',  capital: { en: 'Rome',             fr: 'Rome'            }, colors: ['green','white','red'],                  symbols: [] },
  { code: 'ci', en: 'Ivory Coast',                      fr: "Côte d'Ivoire",                    region: 'Africa',  capital: { en: 'Yamoussoukro',     fr: 'Yamoussoukro'    }, colors: ['orange','white','green'],               symbols: [] },
  { code: 'jm', en: 'Jamaica',                          fr: 'Jamaïque',                         region: 'Americas',capital: { en: 'Kingston',         fr: 'Kingston'        }, colors: ['black','yellow','green'],               symbols: ['cross'] },
  { code: 'jp', en: 'Japan',                            fr: 'Japon',                            region: 'Asia',    capital: { en: 'Tokyo',            fr: 'Tokyo'           }, colors: ['white','red'],                          symbols: ['circle','sun'] },
  { code: 'jo', en: 'Jordan',                           fr: 'Jordanie',                         region: 'Asia',    capital: { en: 'Amman',            fr: 'Amman'           }, colors: ['black','white','green','red'],          symbols: ['star','triangle'] },
  { code: 'kz', en: 'Kazakhstan',                       fr: 'Kazakhstan',                       region: 'Asia',    capital: { en: 'Astana',           fr: 'Astana'          }, colors: ['blue','yellow'],                        symbols: ['sun','eagle','pattern'] },
  { code: 'ke', en: 'Kenya',                            fr: 'Kenya',                            region: 'Africa',  capital: { en: 'Nairobi',          fr: 'Nairobi'         }, colors: ['black','red','green','white'],          symbols: ['shield','spears'] },
  { code: 'ki', en: 'Kiribati',                         fr: 'Kiribati',                         region: 'Oceania', capital: { en: 'South Tarawa',     fr: 'Tarawa-Sud'      }, colors: ['red','yellow','blue','white'],          symbols: ['sun','bird','waves'] },
  { code: 'kw', en: 'Kuwait',                           fr: 'Koweït',                           region: 'Asia',    capital: { en: 'Kuwait City',      fr: 'Koweït'          }, colors: ['green','white','red','black'],          symbols: ['trapezoid'] },
  { code: 'kg', en: 'Kyrgyzstan',                       fr: 'Kirghizistan',                     region: 'Asia',    capital: { en: 'Bishkek',          fr: 'Bichkek'         }, colors: ['red','yellow'],                         symbols: ['sun','tunduk'] },
  { code: 'la', en: 'Laos',                             fr: 'Laos',                             region: 'Asia',    capital: { en: 'Vientiane',        fr: 'Vientiane'       }, colors: ['red','blue','white'],                   symbols: ['circle'] },
  { code: 'lv', en: 'Latvia',                           fr: 'Lettonie',                         region: 'Europe',  capital: { en: 'Riga',             fr: 'Riga'            }, colors: ['red','white'],                          symbols: [] },
  { code: 'lb', en: 'Lebanon',                          fr: 'Liban',                            region: 'Asia',    capital: { en: 'Beirut',           fr: 'Beyrouth'        }, colors: ['red','white','green'],                  symbols: ['cedar tree'] },
  { code: 'ls', en: 'Lesotho',                          fr: 'Lesotho',                          region: 'Africa',  capital: { en: 'Maseru',           fr: 'Maseru'          }, colors: ['blue','white','green','black'],         symbols: ['hat','mokorotlo'] },
  { code: 'lr', en: 'Liberia',                          fr: 'Libéria',                          region: 'Africa',  capital: { en: 'Monrovia',         fr: 'Monrovia'        }, colors: ['red','white','blue'],                   symbols: ['star','stripes'] },
  { code: 'ly', en: 'Libya',                            fr: 'Libye',                            region: 'Africa',  capital: { en: 'Tripoli',          fr: 'Tripoli'         }, colors: ['red','black','green','white'],          symbols: ['crescent','star'] },
  { code: 'li', en: 'Liechtenstein',                    fr: 'Liechtenstein',                    region: 'Europe',  capital: { en: 'Vaduz',            fr: 'Vaduz'           }, colors: ['blue','red','yellow'],                  symbols: ['crown'] },
  { code: 'lt', en: 'Lithuania',                        fr: 'Lituanie',                         region: 'Europe',  capital: { en: 'Vilnius',          fr: 'Vilnius'         }, colors: ['yellow','green','red'],                 symbols: [] },
  { code: 'lu', en: 'Luxembourg',                       fr: 'Luxembourg',                       region: 'Europe',  capital: { en: 'Luxembourg City',  fr: 'Luxembourg'      }, colors: ['red','white','blue'],                   symbols: [] },
  { code: 'mg', en: 'Madagascar',                       fr: 'Madagascar',                       region: 'Africa',  capital: { en: 'Antananarivo',     fr: 'Antananarivo'    }, colors: ['white','red','green'],                  symbols: [] },
  { code: 'mw', en: 'Malawi',                           fr: 'Malawi',                           region: 'Africa',  capital: { en: 'Lilongwe',         fr: 'Lilongwe'        }, colors: ['black','red','green'],                  symbols: ['sun'] },
  { code: 'my', en: 'Malaysia',                         fr: 'Malaisie',                         region: 'Asia',    capital: { en: 'Kuala Lumpur',     fr: 'Kuala Lumpur'    }, colors: ['red','white','blue','yellow'],          symbols: ['crescent','star','stripes'] },
  { code: 'mv', en: 'Maldives',                         fr: 'Maldives',                         region: 'Asia',    capital: { en: 'Malé',             fr: 'Malé'            }, colors: ['red','green','white'],                  symbols: ['crescent'] },
  { code: 'ml', en: 'Mali',                             fr: 'Mali',                             region: 'Africa',  capital: { en: 'Bamako',           fr: 'Bamako'          }, colors: ['green','yellow','red'],                 symbols: [] },
  { code: 'mt', en: 'Malta',                            fr: 'Malte',                            region: 'Europe',  capital: { en: 'Valletta',         fr: 'La Valette'      }, colors: ['white','red'],                          symbols: ['cross','george cross'] },
  { code: 'mh', en: 'Marshall Islands',                 fr: 'Îles Marshall',                    region: 'Oceania', capital: { en: 'Majuro',           fr: 'Majuro'          }, colors: ['blue','white','orange'],                symbols: ['star','diagonal'] },
  { code: 'mr', en: 'Mauritania',                       fr: 'Mauritanie',                       region: 'Africa',  capital: { en: 'Nouakchott',       fr: 'Nouakchott'      }, colors: ['green','yellow','red'],                 symbols: ['crescent','star'] },
  { code: 'mu', en: 'Mauritius',                        fr: 'Maurice',                          region: 'Africa',  capital: { en: 'Port Louis',       fr: 'Port-Louis'      }, colors: ['red','blue','yellow','green'],          symbols: [] },
  { code: 'mx', en: 'Mexico',                           fr: 'Mexique',                          region: 'Americas',capital: { en: 'Mexico City',      fr: 'Mexico'          }, colors: ['green','white','red'],                  symbols: ['eagle','coat of arms'] },
  { code: 'fm', en: 'Micronesia',                       fr: 'Micronésie',                       region: 'Oceania', capital: { en: 'Palikir',          fr: 'Palikir'         }, colors: ['blue','white'],                         symbols: ['stars'] },
  { code: 'md', en: 'Moldova',                          fr: 'Moldavie',                         region: 'Europe',  capital: { en: 'Chișinău',         fr: 'Chișinău'        }, colors: ['blue','yellow','red'],                  symbols: ['coat of arms','eagle'] },
  { code: 'mc', en: 'Monaco',                           fr: 'Monaco',                           region: 'Europe',  capital: { en: 'Monaco',           fr: 'Monaco'          }, colors: ['red','white'],                          symbols: [] },
  { code: 'mn', en: 'Mongolia',                         fr: 'Mongolie',                         region: 'Asia',    capital: { en: 'Ulaanbaatar',      fr: 'Oulan-Bator'     }, colors: ['red','blue','yellow'],                  symbols: ['soyombo'] },
  { code: 'me', en: 'Montenegro',                       fr: 'Monténégro',                       region: 'Europe',  capital: { en: 'Podgorica',        fr: 'Podgorica'       }, colors: ['red','yellow'],                         symbols: ['eagle','coat of arms'] },
  { code: 'ma', en: 'Morocco',                          fr: 'Maroc',                            region: 'Africa',  capital: { en: 'Rabat',            fr: 'Rabat'           }, colors: ['red','green'],                          symbols: ['star','pentagram'] },
  { code: 'mz', en: 'Mozambique',                       fr: 'Mozambique',                       region: 'Africa',  capital: { en: 'Maputo',           fr: 'Maputo'          }, colors: ['green','black','yellow','white','red'], symbols: ['star','book','gun'] },
  { code: 'mm', en: 'Myanmar',                          fr: 'Myanmar',                          region: 'Asia',    capital: { en: 'Naypyidaw',        fr: 'Naypyidaw'       }, colors: ['yellow','green','red','white'],         symbols: ['star'] },
  { code: 'na', en: 'Namibia',                          fr: 'Namibie',                          region: 'Africa',  capital: { en: 'Windhoek',         fr: 'Windhoek'        }, colors: ['blue','red','green','white','yellow'],  symbols: ['sun','diagonal'] },
  { code: 'nr', en: 'Nauru',                            fr: 'Nauru',                            region: 'Oceania', capital: { en: 'Yaren',            fr: 'Yaren'           }, colors: ['blue','yellow','white'],                symbols: ['star'] },
  { code: 'np', en: 'Nepal',                            fr: 'Népal',                            region: 'Asia',    capital: { en: 'Kathmandu',        fr: 'Katmandou'       }, colors: ['red','blue','white'],                   symbols: ['moon','sun','pennant'] },
  { code: 'nl', en: 'Netherlands',                      fr: 'Pays-Bas',                         region: 'Europe',  capital: { en: 'Amsterdam',        fr: 'Amsterdam'       }, colors: ['red','white','blue'],                   symbols: [] },
  { code: 'nz', en: 'New Zealand',                      fr: 'Nouvelle-Zélande',                 region: 'Oceania', capital: { en: 'Wellington',       fr: 'Wellington'      }, colors: ['blue','red','white'],                   symbols: ['stars','union jack'] },
  { code: 'ni', en: 'Nicaragua',                        fr: 'Nicaragua',                        region: 'Americas',capital: { en: 'Managua',          fr: 'Managua'         }, colors: ['blue','white'],                         symbols: ['coat of arms'] },
  { code: 'ne', en: 'Niger',                            fr: 'Niger',                            region: 'Africa',  capital: { en: 'Niamey',           fr: 'Niamey'          }, colors: ['orange','white','green'],               symbols: ['circle'] },
  { code: 'ng', en: 'Nigeria',                          fr: 'Nigéria',                          region: 'Africa',  capital: { en: 'Abuja',            fr: 'Abuja'           }, colors: ['green','white'],                        symbols: [] },
  { code: 'kp', en: 'North Korea',                      fr: 'Corée du Nord',                    region: 'Asia',    capital: { en: 'Pyongyang',        fr: 'Pyongyang'       }, colors: ['red','blue','white'],                   symbols: ['star','circle'] },
  { code: 'mk', en: 'North Macedonia',                  fr: 'Macédoine du Nord',                region: 'Europe',  capital: { en: 'Skopje',           fr: 'Skopje'          }, colors: ['red','yellow'],                         symbols: ['sun'] },
  { code: 'no', en: 'Norway',                           fr: 'Norvège',                          region: 'Europe',  capital: { en: 'Oslo',             fr: 'Oslo'            }, colors: ['red','white','blue'],                   symbols: ['cross'] },
  { code: 'om', en: 'Oman',                             fr: 'Oman',                             region: 'Asia',    capital: { en: 'Muscat',           fr: 'Mascate'         }, colors: ['red','white','green'],                  symbols: ['dagger','swords'] },
  { code: 'pk', en: 'Pakistan',                         fr: 'Pakistan',                         region: 'Asia',    capital: { en: 'Islamabad',        fr: 'Islamabad'       }, colors: ['green','white'],                        symbols: ['crescent','star'] },
  { code: 'pw', en: 'Palau',                            fr: 'Palaos',                           region: 'Oceania', capital: { en: 'Ngerulmud',        fr: 'Ngerulmud'       }, colors: ['blue','yellow'],                        symbols: ['circle'] },
  { code: 'ps', en: 'Palestine',                        fr: 'Palestine',                        region: 'Asia',    capital: { en: 'Ramallah',         fr: 'Ramallah'        }, colors: ['black','white','green','red'],          symbols: ['triangle'] },
  { code: 'pa', en: 'Panama',                           fr: 'Panama',                           region: 'Americas',capital: { en: 'Panama City',      fr: 'Panama'          }, colors: ['white','blue','red'],                   symbols: ['stars'] },
  { code: 'pg', en: 'Papua New Guinea',                 fr: 'Papouasie-Nouvelle-Guinée',        region: 'Oceania', capital: { en: 'Port Moresby',     fr: 'Port Moresby'    }, colors: ['black','red','yellow','white'],         symbols: ['bird of paradise','stars'] },
  { code: 'py', en: 'Paraguay',                         fr: 'Paraguay',                         region: 'Americas',capital: { en: 'Asunción',         fr: 'Asunción'        }, colors: ['red','white','blue'],                   symbols: ['star','coat of arms'] },
  { code: 'pe', en: 'Peru',                             fr: 'Pérou',                            region: 'Americas',capital: { en: 'Lima',             fr: 'Lima'            }, colors: ['red','white'],                          symbols: [] },
  { code: 'ph', en: 'Philippines',                      fr: 'Philippines',                      region: 'Asia',    capital: { en: 'Manila',           fr: 'Manille'         }, colors: ['blue','red','white','yellow'],          symbols: ['sun','stars','triangle'] },
  { code: 'pl', en: 'Poland',                           fr: 'Pologne',                          region: 'Europe',  capital: { en: 'Warsaw',           fr: 'Varsovie'        }, colors: ['white','red'],                          symbols: [] },
  { code: 'pt', en: 'Portugal',                         fr: 'Portugal',                         region: 'Europe',  capital: { en: 'Lisbon',           fr: 'Lisbonne'        }, colors: ['green','red','yellow'],                 symbols: ['coat of arms','armillary sphere'] },
  { code: 'qa', en: 'Qatar',                            fr: 'Qatar',                            region: 'Asia',    capital: { en: 'Doha',             fr: 'Doha'            }, colors: ['maroon','white'],                       symbols: ['serrated band'] },
  { code: 'ro', en: 'Romania',                          fr: 'Roumanie',                         region: 'Europe',  capital: { en: 'Bucharest',        fr: 'Bucarest'        }, colors: ['blue','yellow','red'],                  symbols: [] },
  { code: 'ru', en: 'Russia',                           fr: 'Russie',                           region: 'Europe',  capital: { en: 'Moscow',           fr: 'Moscou'          }, colors: ['white','blue','red'],                   symbols: [] },
  { code: 'rw', en: 'Rwanda',                           fr: 'Rwanda',                           region: 'Africa',  capital: { en: 'Kigali',           fr: 'Kigali'          }, colors: ['blue','yellow','green'],                symbols: ['sun'] },
  { code: 'kn', en: 'Saint Kitts and Nevis',            fr: 'Saint-Kitts-et-Nevis',             region: 'Americas',capital: { en: 'Basseterre',       fr: 'Basseterre'      }, colors: ['green','yellow','black','red','white'], symbols: ['stars','diagonal'] },
  { code: 'lc', en: 'Saint Lucia',                      fr: 'Sainte-Lucie',                     region: 'Americas',capital: { en: 'Castries',         fr: 'Castries'        }, colors: ['blue','yellow','black','white'],        symbols: ['triangle'] },
  { code: 'vc', en: 'Saint Vincent and the Grenadines', fr: 'Saint-Vincent-et-les-Grenadines',  region: 'Americas',capital: { en: 'Kingstown',        fr: 'Kingstown'       }, colors: ['blue','yellow','green'],                symbols: ['diamonds'] },
  { code: 'ws', en: 'Samoa',                            fr: 'Samoa',                            region: 'Oceania', capital: { en: 'Apia',             fr: 'Apia'            }, colors: ['red','blue','white'],                   symbols: ['stars','cross'] },
  { code: 'sm', en: 'San Marino',                       fr: 'Saint-Marin',                      region: 'Europe',  capital: { en: 'San Marino City',  fr: 'Saint-Marin'     }, colors: ['blue','white'],                         symbols: ['coat of arms','towers'] },
  { code: 'st', en: 'Sao Tome and Principe',            fr: 'Sao Tomé-et-Principe',             region: 'Africa',  capital: { en: 'São Tomé',         fr: 'São Tomé'        }, colors: ['green','yellow','red','black'],         symbols: ['stars','triangle'] },
  { code: 'sa', en: 'Saudi Arabia',                     fr: 'Arabie saoudite',                  region: 'Asia',    capital: { en: 'Riyadh',           fr: 'Riyad'           }, colors: ['green','white'],                        symbols: ['sword','text','shahada'] },
  { code: 'sn', en: 'Senegal',                          fr: 'Sénégal',                          region: 'Africa',  capital: { en: 'Dakar',            fr: 'Dakar'           }, colors: ['green','yellow','red'],                 symbols: ['star'] },
  { code: 'rs', en: 'Serbia',                           fr: 'Serbie',                           region: 'Europe',  capital: { en: 'Belgrade',         fr: 'Belgrade'        }, colors: ['red','blue','white'],                   symbols: ['coat of arms','eagle'] },
  { code: 'sc', en: 'Seychelles',                       fr: 'Seychelles',                       region: 'Africa',  capital: { en: 'Victoria',         fr: 'Victoria'        }, colors: ['blue','yellow','red','white','green'],  symbols: ['rays'] },
  { code: 'sl', en: 'Sierra Leone',                     fr: 'Sierra Leone',                     region: 'Africa',  capital: { en: 'Freetown',         fr: 'Freetown'        }, colors: ['green','white','blue'],                 symbols: [] },
  { code: 'sg', en: 'Singapore',                        fr: 'Singapour',                        region: 'Asia',    capital: { en: 'Singapore',        fr: 'Singapour'       }, colors: ['red','white'],                          symbols: ['crescent','stars'] },
  { code: 'sk', en: 'Slovakia',                         fr: 'Slovaquie',                        region: 'Europe',  capital: { en: 'Bratislava',       fr: 'Bratislava'      }, colors: ['white','blue','red'],                   symbols: ['cross','coat of arms'] },
  { code: 'si', en: 'Slovenia',                         fr: 'Slovénie',                         region: 'Europe',  capital: { en: 'Ljubljana',        fr: 'Ljubljana'       }, colors: ['white','blue','red'],                   symbols: ['coat of arms','stars'] },
  { code: 'sb', en: 'Solomon Islands',                  fr: 'Îles Salomon',                     region: 'Oceania', capital: { en: 'Honiara',          fr: 'Honiara'         }, colors: ['blue','green','yellow','white'],        symbols: ['stars','diagonal'] },
  { code: 'so', en: 'Somalia',                          fr: 'Somalie',                          region: 'Africa',  capital: { en: 'Mogadishu',        fr: 'Mogadiscio'      }, colors: ['blue','white'],                         symbols: ['star'] },
  { code: 'za', en: 'South Africa',                     fr: 'Afrique du Sud',                   region: 'Africa',  capital: { en: 'Pretoria',         fr: 'Pretoria'        }, colors: ['red','green','blue','black','white','yellow'], symbols: ['y-shape','chevron'] },
  { code: 'kr', en: 'South Korea',                      fr: 'Corée du Sud',                     region: 'Asia',    capital: { en: 'Seoul',            fr: 'Séoul'           }, colors: ['white','red','blue','black'],           symbols: ['yin yang','trigrams'] },
  { code: 'ss', en: 'South Sudan',                      fr: 'Soudan du Sud',                    region: 'Africa',  capital: { en: 'Juba',             fr: 'Djouba'          }, colors: ['black','red','green','white','blue','yellow'], symbols: ['star','triangle'] },
  { code: 'es', en: 'Spain',                            fr: 'Espagne',                          region: 'Europe',  capital: { en: 'Madrid',           fr: 'Madrid'          }, colors: ['red','yellow'],                         symbols: ['coat of arms'] },
  { code: 'lk', en: 'Sri Lanka',                        fr: 'Sri Lanka',                        region: 'Asia',    capital: { en: 'Sri Jayawardenepura Kotte', fr: 'Sri Jayawardenepura Kotte' }, colors: ['maroon','orange','green','yellow'], symbols: ['lion','bo leaves'] },
  { code: 'sd', en: 'Sudan',                            fr: 'Soudan',                           region: 'Africa',  capital: { en: 'Khartoum',         fr: 'Khartoum'        }, colors: ['red','white','black','green'],          symbols: ['triangle'] },
  { code: 'sr', en: 'Suriname',                         fr: 'Suriname',                         region: 'Americas',capital: { en: 'Paramaribo',       fr: 'Paramaribo'      }, colors: ['green','white','red','yellow'],         symbols: ['star'] },
  { code: 'se', en: 'Sweden',                           fr: 'Suède',                            region: 'Europe',  capital: { en: 'Stockholm',        fr: 'Stockholm'       }, colors: ['blue','yellow'],                        symbols: ['cross'] },
  { code: 'ch', en: 'Switzerland',                      fr: 'Suisse',                           region: 'Europe',  capital: { en: 'Bern',             fr: 'Berne'           }, colors: ['red','white'],                          symbols: ['cross'] },
  { code: 'sy', en: 'Syria',                            fr: 'Syrie',                            region: 'Asia',    capital: { en: 'Damascus',         fr: 'Damas'           }, colors: ['red','white','black','green'],          symbols: ['stars'] },
  { code: 'tw', en: 'Taiwan',                           fr: 'Taïwan',                           region: 'Asia',    capital: { en: 'Taipei',           fr: 'Taipei'          }, colors: ['red','blue','white'],                   symbols: ['sun'] },
  { code: 'tj', en: 'Tajikistan',                       fr: 'Tadjikistan',                      region: 'Asia',    capital: { en: 'Dushanbe',         fr: 'Douchanbé'       }, colors: ['red','white','green'],                  symbols: ['crown','stars'] },
  { code: 'tz', en: 'Tanzania',                         fr: 'Tanzanie',                         region: 'Africa',  capital: { en: 'Dodoma',           fr: 'Dodoma'          }, colors: ['green','yellow','black','blue'],        symbols: ['diagonal'] },
  { code: 'th', en: 'Thailand',                         fr: 'Thaïlande',                        region: 'Asia',    capital: { en: 'Bangkok',          fr: 'Bangkok'         }, colors: ['red','white','blue'],                   symbols: [] },
  { code: 'tl', en: 'Timor-Leste',                      fr: 'Timor oriental',                   region: 'Asia',    capital: { en: 'Dili',             fr: 'Dili'            }, colors: ['red','yellow','black','white'],         symbols: ['star','triangles'] },
  { code: 'tg', en: 'Togo',                             fr: 'Togo',                             region: 'Africa',  capital: { en: 'Lomé',             fr: 'Lomé'            }, colors: ['green','yellow','red','white'],         symbols: ['star'] },
  { code: 'to', en: 'Tonga',                            fr: 'Tonga',                            region: 'Oceania', capital: { en: "Nuku'alofa",       fr: "Nuku'alofa"      }, colors: ['red','white'],                          symbols: ['cross'] },
  { code: 'tt', en: 'Trinidad and Tobago',              fr: 'Trinité-et-Tobago',                region: 'Americas',capital: { en: 'Port of Spain',    fr: 'Port-d\'Espagne' }, colors: ['red','black','white'],                  symbols: ['diagonal'] },
  { code: 'tn', en: 'Tunisia',                          fr: 'Tunisie',                          region: 'Africa',  capital: { en: 'Tunis',            fr: 'Tunis'           }, colors: ['red','white'],                          symbols: ['crescent','star','circle'] },
  { code: 'tr', en: 'Turkey',                           fr: 'Turquie',                          region: 'Asia',    capital: { en: 'Ankara',           fr: 'Ankara'          }, colors: ['red','white'],                          symbols: ['crescent','star'] },
  { code: 'tm', en: 'Turkmenistan',                     fr: 'Turkménistan',                     region: 'Asia',    capital: { en: 'Ashgabat',         fr: 'Achgabat'        }, colors: ['green','red','white'],                  symbols: ['crescent','stars','carpet pattern'] },
  { code: 'tv', en: 'Tuvalu',                           fr: 'Tuvalu',                           region: 'Oceania', capital: { en: 'Funafuti',         fr: 'Funafuti'        }, colors: ['blue','yellow','white'],                symbols: ['stars','union jack'] },
  { code: 'ae', en: 'UAE',                              fr: 'Émirats arabes unis',              region: 'Asia',    capital: { en: 'Abu Dhabi',        fr: 'Abou Dabi'       }, colors: ['red','green','white','black'],          symbols: [] },
  { code: 'ug', en: 'Uganda',                           fr: 'Ouganda',                          region: 'Africa',  capital: { en: 'Kampala',          fr: 'Kampala'         }, colors: ['black','yellow','red','white'],         symbols: ['bird','crested crane'] },
  { code: 'ua', en: 'Ukraine',                          fr: 'Ukraine',                          region: 'Europe',  capital: { en: 'Kyiv',             fr: 'Kiev'            }, colors: ['blue','yellow'],                        symbols: [] },
  { code: 'gb', en: 'United Kingdom',                   fr: 'Royaume-Uni',                      region: 'Europe',  capital: { en: 'London',           fr: 'Londres'         }, colors: ['blue','red','white'],                   symbols: ['union jack','cross'] },
  { code: 'us', en: 'United States',                    fr: 'États-Unis',                       region: 'Americas',capital: { en: 'Washington D.C.',  fr: 'Washington'      }, colors: ['red','white','blue'],                   symbols: ['stars','stripes'] },
  { code: 'uy', en: 'Uruguay',                          fr: 'Uruguay',                          region: 'Americas',capital: { en: 'Montevideo',       fr: 'Montevideo'      }, colors: ['blue','white','yellow'],                symbols: ['sun','stripes'] },
  { code: 'uz', en: 'Uzbekistan',                       fr: 'Ouzbékistan',                      region: 'Asia',    capital: { en: 'Tashkent',         fr: 'Tachkent'        }, colors: ['blue','white','green','red'],           symbols: ['crescent','stars'] },
  { code: 'vu', en: 'Vanuatu',                          fr: 'Vanuatu',                          region: 'Oceania', capital: { en: 'Port Vila',        fr: 'Port-Vila'       }, colors: ['red','green','black','yellow'],         symbols: ['boar tusk','triangle'] },
  { code: 'va', en: 'Vatican City',                     fr: 'Vatican',                          region: 'Europe',  capital: { en: 'Vatican City',     fr: 'Vatican'         }, colors: ['yellow','white'],                       symbols: ['coat of arms','keys'] },
  { code: 've', en: 'Venezuela',                        fr: 'Venezuela',                        region: 'Americas',capital: { en: 'Caracas',          fr: 'Caracas'         }, colors: ['red','yellow','blue'],                  symbols: ['stars','coat of arms'] },
  { code: 'vn', en: 'Vietnam',                          fr: 'Viêt Nam',                         region: 'Asia',    capital: { en: 'Hanoi',            fr: 'Hanoï'           }, colors: ['red','yellow'],                         symbols: ['star'] },
  { code: 'ye', en: 'Yemen',                            fr: 'Yémen',                            region: 'Asia',    capital: { en: "Sana'a",           fr: 'Sanaa'           }, colors: ['red','white','black'],                  symbols: [] },
  { code: 'zm', en: 'Zambia',                           fr: 'Zambie',                           region: 'Africa',  capital: { en: 'Lusaka',           fr: 'Lusaka'          }, colors: ['green','red','black','orange'],         symbols: ['eagle'] },
  { code: 'zw', en: 'Zimbabwe',                         fr: 'Zimbabwe',                         region: 'Africa',  capital: { en: 'Harare',           fr: 'Harare'          }, colors: ['green','yellow','red','black','white'], symbols: ['bird','star'] },
]

const REGION_LABELS = { Africa: 'Afrique', Americas: 'Amériques', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }

export default function CountryDetailPage() {
  const { code } = useParams()
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en

  const country = COUNTRIES.find(c => c.code === code)
  if (!country) {
    return (
      <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏳️</div>
          <h1 style={{ color: '#0B1F3B', fontWeight: '900', fontSize: '24px' }}>{t('Country not found', 'Pays introuvable')}</h1>
          <Link href={`/${locale}/countries`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            ← {t('Back to all countries', 'Retour aux pays')}
          </Link>
        </div>
      </div>
    )
  }

  const name = locale === 'fr' ? country.fr : country.en
  const capital = country.capital ? (locale === 'fr' ? country.capital.fr : country.capital.en) : '—'
  const region = locale === 'fr' ? REGION_LABELS[country.region] : country.region

  // Related: same region, excluding current
  const related = COUNTRIES.filter(c => c.region === country.region && c.code !== country.code)
    .sort(() => Math.random() - 0.5).slice(0, 6)

  const COLOR_HEX = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', white: '#e5e7eb', black: '#1f2937', orange: '#f97316', maroon: '#7f1d1d' }

  return (
    <div style={{ backgroundColor: '#F4F1E6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: '#94a3b8' }}>
          <Link href={`/${locale}/countries`} style={{ color: '#9EB7E5', textDecoration: 'none', fontWeight: '600' }}>
            {t('Country Flags', 'Drapeaux · Pays')}
          </Link>
          <span>›</span>
          <span style={{ color: '#64748b', fontWeight: '500' }}>{name}</span>
        </div>

        {/* Hero: flag + info */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '40px' }}>

          {/* Flag */}
          <div style={{ flex: '0 0 auto', width: 'min(400px, 100%)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0' }}>
            <img
              src={`https://flagcdn.com/w640/${country.code}.png`}
              alt={name}
              style={{ width: '100%', display: 'block', aspectRatio: '3/2', objectFit: 'contain', backgroundColor: '#f0ede4', padding: '12px' }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 4px', letterSpacing: '-1px' }}>
              {name}
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '15px', color: '#64748b' }}>{region}</p>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: t('Capital', 'Capitale'), value: capital, icon: '🏙️' },
                { label: t('Region', 'Région'), value: region, icon: '🌍' },
                { label: t('ISO Code', 'Code ISO'), value: country.code.toUpperCase(), icon: '🔤' },
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0B1F3B' }}>{item.icon} {item.value}</p>
                </div>
              ))}
            </div>

            {/* Colors */}
            {country.colors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Flag Colors', 'Couleurs du drapeau')}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {country.colors.map(c => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'white', borderRadius: '99px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#0B1F3B', fontWeight: '600' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR_HEX[c] || '#ccc', border: c === 'white' ? '1px solid #ccc' : 'none', flexShrink: 0 }} />
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbols */}
            {country.symbols.length > 0 && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Symbols', 'Symboles')}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {country.symbols.map(s => (
                    <span key={s} style={{ padding: '4px 12px', backgroundColor: '#0B1F3B', color: 'white', borderRadius: '99px', fontSize: '12px', fontWeight: '600' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Play games CTA */}
        <div style={{ backgroundColor: '#0B1F3B', borderRadius: '16px', padding: '24px 28px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '900', color: 'white' }}>
              {t('Test your knowledge!', 'Testez vos connaissances !')}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#9EB7E5' }}>
              {t('Can you recognize this flag in Flag Reveal?', 'Reconnaîtrez-vous ce drapeau dans Flag Reveal ?')}
            </p>
          </div>
          <Link href={`/${locale}/games/flag-reveal`}
            style={{ backgroundColor: '#9EB7E5', color: '#0B1F3B', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '15px', flexShrink: 0 }}>
            🏳️ {t('Play Flag Reveal', 'Jouer à Flag Reveal')}
          </Link>
        </div>

        {/* Related countries */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0B1F3B', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              {t(`More from ${region}`, `Autres pays — ${region}`)}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {related.map(c => {
                const cName = locale === 'fr' ? c.fr : c.en
                return (
                  <Link key={c.code} href={`/${locale}/countries/${c.code}`}
                    style={{ textDecoration: 'none', display: 'block', backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ aspectRatio: '3/2', overflow: 'hidden', backgroundColor: '#f0ede4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`https://flagcdn.com/w160/${c.code}.png`} alt={cName} loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '6px' }} />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0B1F3B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cName}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}