'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

const ORGANISATIONS = [
  {
    key: 'un',
    en: 'United Nations', fr: 'Nations Unies',
    acronym: 'UN', acronymFr: 'ONU',
    color: '#009EDB', accent: 'rgba(0,158,219,0.12)',
    founded: 1945, members: 193,
    headquartersEn: 'New York, USA', headquartersFr: 'New York, États-Unis',
    descEn: 'The primary international organisation maintaining peace, security, and cooperation between nations.',
    descFr: "L'organisation internationale principale pour le maintien de la paix, la sécurité et la coopération.",
    tagEn: 'Peace & Security', tagFr: 'Paix & Sécurité',
  },
  {
    key: 'eu',
    en: 'European Union', fr: 'Union Européenne',
    acronym: 'EU', acronymFr: 'UE',
    color: '#003399', accent: 'rgba(0,51,153,0.10)',
    founded: 1993, members: 27,
    headquartersEn: 'Brussels, Belgium', headquartersFr: 'Bruxelles, Belgique',
    descEn: 'A political and economic union of European countries with shared governance and open borders.',
    descFr: 'Union politique et économique de pays européens avec une gouvernance partagée et des frontières ouvertes.',
    tagEn: 'Political & Economic', tagFr: 'Politique & Économique',
  },
  {
    key: 'nato',
    en: 'NATO', fr: 'OTAN',
    acronym: 'NATO', acronymFr: 'OTAN',
    color: '#1F3C6E', accent: 'rgba(31,60,110,0.10)',
    founded: 1949, members: 32,
    headquartersEn: 'Brussels, Belgium', headquartersFr: 'Bruxelles, Belgique',
    descEn: 'A military alliance committed to the collective defence and security of its member states.',
    descFr: 'Une alliance militaire engagée dans la défense collective et la sécurité de ses États membres.',
    tagEn: 'Defence Alliance', tagFr: 'Alliance Défense',
  },
  {
    key: 'au',
    en: 'African Union', fr: 'Union Africaine',
    acronym: 'AU', acronymFr: 'UA',
    color: '#00732F', accent: 'rgba(0,115,47,0.10)',
    founded: 2002, members: 55,
    headquartersEn: 'Addis Ababa, Ethiopia', headquartersFr: 'Addis-Abeba, Éthiopie',
    descEn: 'A continental union promoting solidarity, sovereignty and integration across African nations.',
    descFr: "Une union continentale promouvant la solidarité, la souveraineté et l'intégration des nations africaines.",
    tagEn: 'Continental Union', tagFr: 'Union Continentale',
  },
  {
    key: 'asean',
    en: 'ASEAN', fr: 'ASEAN',
    acronym: 'ASEAN', acronymFr: 'ASEAN',
    color: '#1E3A5F', accent: 'rgba(30,58,95,0.10)',
    founded: 1967, members: 10,
    headquartersEn: 'Jakarta, Indonesia', headquartersFr: 'Jakarta, Indonésie',
    descEn: 'A regional organisation promoting economic growth, social progress and stability in Southeast Asia.',
    descFr: "Une organisation régionale promouvant la croissance économique et la stabilité en Asie du Sud-Est.",
    tagEn: 'Regional Union', tagFr: 'Union Régionale',
  },
  {
    key: 'arab-league',
    en: 'Arab League', fr: 'Ligue Arabe',
    acronym: 'AL', acronymFr: 'LA',
    color: '#006233', accent: 'rgba(0,98,51,0.10)',
    founded: 1945, members: 22,
    headquartersEn: 'Cairo, Egypt', headquartersFr: 'Le Caire, Égypte',
    descEn: 'A regional organisation of Arab states in and around North Africa, the Horn of Africa, and Arabia.',
    descFr: "Organisation régionale des États arabes d'Afrique du Nord et du Moyen-Orient.",
    tagEn: 'Regional Union', tagFr: 'Union Régionale',
  },
  {
    key: 'commonwealth',
    en: 'Commonwealth of Nations', fr: 'Commonwealth des Nations',
    acronym: 'CW', acronymFr: 'CW',
    color: '#003F87', accent: 'rgba(0,63,135,0.10)',
    founded: 1931, members: 56,
    headquartersEn: 'London, UK', headquartersFr: 'Londres, Royaume-Uni',
    descEn: 'A political association of 56 member states, mostly former territories of the British Empire.',
    descFr: "Association politique de 56 États membres, principalement d'anciens territoires de l'Empire britannique.",
    tagEn: 'Political & Economic', tagFr: 'Politique & Économique',
  },
  {
    key: 'francophonie',
    en: 'Organisation internationale de la Francophonie', fr: 'Organisation internationale de la Francophonie',
    acronym: 'OIF', acronymFr: 'OIF',
    color: '#0072CE', accent: 'rgba(0,114,206,0.10)',
    founded: 1970, members: 88,
    headquartersEn: 'Paris, France', headquartersFr: 'Paris, France',
    descEn: 'An international organisation representing countries and regions where French is an official or customary language.',
    descFr: "Organisation internationale représentant les pays et régions où le français est langue officielle ou d'usage.",
    tagEn: 'Education & Culture', tagFr: 'Éducation & Culture',
  },
  {
    key: 'cplp',
    en: 'Community of Portuguese Language Countries', fr: 'Communauté des Pays de Langue Portugaise',
    acronym: 'CPLP', acronymFr: 'CPLP',
    color: '#006600', accent: 'rgba(0,102,0,0.10)',
    founded: 1996, members: 9,
    headquartersEn: 'Lisbon, Portugal', headquartersFr: 'Lisbonne, Portugal',
    descEn: 'An international organisation of Portuguese-speaking countries across four continents.',
    descFr: "Organisation internationale des pays lusophones répartis sur quatre continents.",
    tagEn: 'Education & Culture', tagFr: 'Éducation & Culture',
  },
  {
    key: 'mercosur',
    en: 'Mercosur', fr: 'Mercosur',
    acronym: 'MERCOSUR', acronymFr: 'MERCOSUR',
    color: '#003087', accent: 'rgba(0,48,135,0.10)',
    founded: 1991, members: 7,
    headquartersEn: 'Montevideo, Uruguay', headquartersFr: 'Montevideo, Uruguay',
    descEn: 'A South American trade bloc promoting free movement of goods, people, and currency.',
    descFr: "Bloc commercial sud-américain promouvant la libre circulation des biens, des personnes et des devises.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'unasur',
    en: 'Union of South American Nations', fr: 'Union des Nations Sud-Américaines',
    acronym: 'UNASUR', acronymFr: 'UNASUR',
    color: '#FFD100', accent: 'rgba(255,209,0,0.10)',
    founded: 2008, members: 12,
    headquartersEn: 'Quito, Ecuador', headquartersFr: 'Quito, Équateur',
    descEn: 'A regional organisation integrating South American nations politically and economically.',
    descFr: "Organisation régionale intégrant politiquement et économiquement les nations sud-américaines.",
    tagEn: 'Regional Union', tagFr: 'Union Régionale',
  },
  {
    key: 'andean',
    en: 'Andean Community', fr: 'Communauté Andine',
    acronym: 'CAN', acronymFr: 'CAN',
    color: '#C8102E', accent: 'rgba(200,16,46,0.10)',
    founded: 1969, members: 4,
    headquartersEn: 'Lima, Peru', headquartersFr: 'Lima, Pérou',
    descEn: 'A South American trade bloc promoting integration among Andean nations: Bolivia, Colombia, Ecuador, Peru.',
    descFr: "Bloc commercial sud-américain promouvant l'intégration des nations andines.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'eac',
    en: 'East African Community', fr: "Communauté de l\u2019Afrique de l\u2019Est",
    acronym: 'EAC', acronymFr: 'CAE',
    color: '#009A44', accent: 'rgba(0,154,68,0.10)',
    founded: 2000, members: 8,
    headquartersEn: 'Arusha, Tanzania', headquartersFr: 'Arusha, Tanzanie',
    descEn: 'A regional intergovernmental organisation of East African countries promoting integration and development.',
    descFr: "Organisation intergouvernementale régionale des pays d’Afrique de l’Est promouvant l’intégration.",
    tagEn: 'Continental Union', tagFr: 'Union Continentale',
  },
  {
    key: 'uemoa',
    en: 'West African Economic and Monetary Union', fr: 'Union Économique et Monétaire Ouest-Africaine',
    acronym: 'WAEMU', acronymFr: 'UEMOA',
    color: '#009A44', accent: 'rgba(0,154,68,0.10)',
    founded: 1994, members: 8,
    headquartersEn: 'Ouagadougou, Burkina Faso', headquartersFr: 'Ouagadougou, Burkina Faso',
    descEn: 'An organisation of eight West African states promoting economic integration and a common currency (CFA franc).',
    descFr: "Organisation de huit États ouest-africains promouvant l'intégration économique et le franc CFA.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'benelux',
    en: 'Benelux Union', fr: 'Union Benelux',
    acronym: 'BENELUX', acronymFr: 'BENELUX',
    color: '#003DA5', accent: 'rgba(0,61,165,0.10)',
    founded: 1944, members: 3,
    headquartersEn: 'Brussels, Belgium', headquartersFr: 'Bruxelles, Belgique',
    descEn: 'A political and economic union of Belgium, Netherlands and Luxembourg.',
    descFr: "Union politique et économique de la Belgique, des Pays-Bas et du Luxembourg.",
    tagEn: 'Regional Union', tagFr: 'Union Régionale',
  },
  {
    key: 'nordic',
    en: 'Nordic Council', fr: 'Conseil Nordique',
    acronym: 'NC', acronymFr: 'CN',
    color: '#003F87', accent: 'rgba(0,63,135,0.10)',
    founded: 1952, members: 5,
    headquartersEn: 'Copenhagen, Denmark', headquartersFr: 'Copenhague, Danemark',
    descEn: 'A forum for parliamentary cooperation between the Nordic countries: Denmark, Finland, Iceland, Norway, Sweden.',
    descFr: "Forum de coopération parlementaire entre les pays nordiques : Danemark, Finlande, Islande, Norvège, Suède.",
    tagEn: 'Regional Union', tagFr: 'Union Régionale',
  },
  {
    key: 'esa',
    en: 'European Space Agency', fr: 'Agence Spatiale Européenne',
    acronym: 'ESA', acronymFr: 'ASE',
    color: '#003247', accent: 'rgba(0,50,71,0.10)',
    founded: 1975, members: 22,
    headquartersEn: 'Paris, France', headquartersFr: 'Paris, France',
    descEn: 'An intergovernmental organisation dedicated to the exploration of space with 22 member states.',
    descFr: "Organisation intergouvernementale dédiée à l'exploration spatiale avec 22 États membres.",
    tagEn: 'Science & Technology', tagFr: 'Science & Technologie',
  },
  {
    key: 'imo',
    en: 'International Maritime Organization', fr: 'Organisation Maritime Internationale',
    acronym: 'IMO', acronymFr: 'OMI',
    color: '#003087', accent: 'rgba(0,48,135,0.10)',
    founded: 1948, members: 175,
    headquartersEn: 'London, UK', headquartersFr: 'Londres, Royaume-Uni',
    descEn: 'A UN specialised agency responsible for regulating shipping and preventing marine pollution.',
    descFr: "Agence spécialisée de l'ONU responsable de la réglementation du transport maritime.",
    tagEn: 'Transport', tagFr: 'Transport',
  },
  {
    key: 'icc',
    en: 'International Criminal Court', fr: 'Cour Pénale Internationale',
    acronym: 'ICC', acronymFr: 'CPI',
    color: '#1B365D', accent: 'rgba(27,54,93,0.10)',
    founded: 2002, members: 124,
    headquartersEn: 'The Hague, Netherlands', headquartersFr: 'La Haye, Pays-Bas',
    descEn: 'The only permanent international court with jurisdiction to prosecute individuals for genocide, war crimes and crimes against humanity.',
    descFr: "La seule cour internationale permanente chargée de poursuivre les crimes de guerre, génocides et crimes contre l'humanité.",
    tagEn: 'Justice & Law', tagFr: 'Justice & Droit',
  },
  {
    key: 'interpol',
    en: 'Interpol', fr: 'Interpol',
    acronym: 'INTERPOL', acronymFr: 'INTERPOL',
    color: '#003087', accent: 'rgba(0,48,135,0.10)',
    founded: 1923, members: 196,
    headquartersEn: 'Lyon, France', headquartersFr: 'Lyon, France',
    descEn: "The world's largest international police organisation, facilitating worldwide police cooperation.",
    descFr: "La plus grande organisation internationale de police au monde, facilitant la coopération policière mondiale.",
    tagEn: 'Justice & Law', tagFr: 'Justice & Droit',
  },
  {
    key: 'imf',
    en: 'International Monetary Fund', fr: 'Fonds Monétaire International',
    acronym: 'IMF', acronymFr: 'FMI',
    color: '#009CDE', accent: 'rgba(0,156,222,0.10)',
    founded: 1944, members: 190,
    headquartersEn: 'Washington D.C., USA', headquartersFr: 'Washington D.C., États-Unis',
    descEn: 'An international financial institution providing loans, economic surveillance, and technical assistance to member countries.',
    descFr: "Institution financière internationale accordant des prêts et une assistance technique aux pays membres.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'ilo',
    en: 'International Labour Organization', fr: 'Organisation Internationale du Travail',
    acronym: 'ILO', acronymFr: 'OIT',
    color: '#00B5E2', accent: 'rgba(0,181,226,0.10)',
    founded: 1919, members: 187,
    headquartersEn: 'Geneva, Switzerland', headquartersFr: 'Genève, Suisse',
    descEn: 'A UN agency setting international labour standards and promoting decent work and social protection.',
    descFr: "Agence de l'ONU établissant les normes internationales du travail et promouvant le travail décent.",
    tagEn: 'Social', tagFr: 'Social',
  },
  {
    key: 'oecd',
    en: 'OECD', fr: 'OCDE',
    acronym: 'OECD', acronymFr: 'OCDE',
    color: '#003189', accent: 'rgba(0,49,137,0.10)',
    founded: 1961, members: 38,
    headquartersEn: 'Paris, France', headquartersFr: 'Paris, France',
    descEn: 'An international organisation working to build better policies for better lives through economic analysis and cooperation.',
    descFr: "Organisation internationale travaillant à de meilleures politiques grâce à l'analyse économique et la coopération.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'wto',
    en: 'World Trade Organization', fr: 'Organisation Mondiale du Commerce',
    acronym: 'WTO', acronymFr: 'OMC',
    color: '#1A6DAF', accent: 'rgba(26,109,175,0.10)',
    founded: 1995, members: 164,
    headquartersEn: 'Geneva, Switzerland', headquartersFr: 'Genève, Suisse',
    descEn: 'The only global organisation dealing with the rules of trade between nations.',
    descFr: "La seule organisation mondiale traitant des règles du commerce entre les nations.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
  {
    key: 'unesco',
    en: 'UNESCO', fr: 'UNESCO',
    acronym: 'UNESCO', acronymFr: 'UNESCO',
    color: '#5B93C7', accent: 'rgba(91,147,199,0.12)',
    founded: 1945, members: 194,
    headquartersEn: 'Paris, France', headquartersFr: 'Paris, France',
    descEn: 'Promotes international collaboration in education, sciences, and culture.',
    descFr: "Promeut la coopération internationale en matière d'éducation, de sciences et de culture.",
    tagEn: 'Education & Culture', tagFr: 'Éducation & Culture',
  },
  {
    key: 'who',
    en: 'World Health Organization', fr: 'Organisation Mondiale de la Santé',
    acronym: 'WHO', acronymFr: 'OMS',
    color: '#008DC9', accent: 'rgba(0,141,201,0.10)',
    founded: 1948, members: 194,
    headquartersEn: 'Geneva, Switzerland', headquartersFr: 'Genève, Suisse',
    descEn: 'The United Nations agency directing international health and providing health leadership globally.',
    descFr: "L'agence des Nations Unies dirigeant la santé internationale et fournissant un leadership mondial.",
    tagEn: 'Health', tagFr: 'Santé',
  },
  {
    key: 'uefa',
    en: 'UEFA', fr: 'UEFA',
    acronym: 'UEFA', acronymFr: 'UEFA',
    color: '#0B3D8C', accent: 'rgba(11,61,140,0.10)',
    founded: 1954, members: 55,
    headquartersEn: 'Nyon, Switzerland', headquartersFr: 'Nyon, Suisse',
    descEn: 'The governing body of European football, organising the Champions League and Euro championship.',
    descFr: "L'organe directeur du football européen, organisant la Ligue des Champions et l'Euro.",
    tagEn: 'Sports', tagFr: 'Sports',
  },
  {
    key: 'fifa',
    en: 'FIFA', fr: 'FIFA',
    acronym: 'FIFA', acronymFr: 'FIFA',
    color: '#326295', accent: 'rgba(50,98,149,0.10)',
    founded: 1904, members: 211,
    headquartersEn: 'Zurich, Switzerland', headquartersFr: 'Zurich, Suisse',
    descEn: 'The international governing body of association football worldwide.',
    descFr: "L'instance internationale dirigeante du football dans le monde.",
    tagEn: 'Sports', tagFr: 'Sports',
  },
  {
    key: 'ioc',
    en: 'International Olympic Committee', fr: 'Comité International Olympique',
    acronym: 'IOC', acronymFr: 'CIO',
    color: '#000000', accent: 'rgba(0,0,0,0.06)',
    founded: 1894, members: 206,
    headquartersEn: 'Lausanne, Switzerland', headquartersFr: 'Lausanne, Suisse',
    descEn: 'The guardian of the Olympic Games and the leader of the Olympic Movement worldwide.',
    descFr: "Le gardien des Jeux Olympiques et le leader du Mouvement olympique mondial.",
    tagEn: 'Sports', tagFr: 'Sports',
  },
  {
    key: 'g20',
    en: 'G20', fr: 'G20',
    acronym: 'G20', acronymFr: 'G20',
    color: '#8B4513', accent: 'rgba(139,69,19,0.10)',
    founded: 1999, members: 20,
    headquartersEn: 'Rotating presidency', headquartersFr: 'Présidence tournante',
    descEn: "A forum of 19 countries and the EU, representing the world's major economies.",
    descFr: "Forum de 19 pays et l'UE, représentant les principales économies mondiales.",
    tagEn: 'Trade & Economy', tagFr: 'Commerce & Économie',
  },
]

const CATEGORIES = {
  all: { en: 'All', fr: 'Toutes' },
  'Peace & Security': { en: 'Peace & Security', fr: 'Paix & Sécurité' },
  'Political & Economic': { en: 'Political & Economic', fr: 'Politique & Économique' },
  'Defence Alliance': { en: 'Defence Alliance', fr: 'Alliance Défense' },
  Sports: { en: 'Sports', fr: 'Sports' },
  'Continental Union': { en: 'Continental Union', fr: 'Union Continentale' },
  'Regional Union': { en: 'Regional Union', fr: 'Union Régionale' },
  'Education & Culture': { en: 'Education & Culture', fr: 'Éducation & Culture' },
  Health: { en: 'Health', fr: 'Santé' },
  'Trade & Economy': { en: 'Trade & Economy', fr: 'Commerce & Économie' },
  'Justice & Law': { en: 'Justice & Law', fr: 'Justice & Droit' },
  'Science & Technology': { en: 'Science & Technology', fr: 'Science & Technologie' },
  Transport: { en: 'Transport', fr: 'Transport' },
  Social: { en: 'Social', fr: 'Social' },
}

export default function OrganisationsPage() {
  const locale = useLocale()
  const t = (en, fr) => locale === 'fr' ? fr : en
  const [activeTag, setActiveTag] = useState('all')

  const filtered = activeTag === 'all'
    ? ORGANISATIONS
    : ORGANISATIONS.filter(o => (locale === 'fr' ? o.tagFr : o.tagEn) === (locale === 'fr' ? CATEGORIES[activeTag]?.fr : activeTag))

  // Unique tags present in data
  const tags = ['all', ...Array.from(new Set(ORGANISATIONS.map(o => o.tagEn)))]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F4', paddingTop: '60px', fontFamily: 'var(--font-body)' }}>

      {/* ── Hero header ── */}
      <div style={{ backgroundColor: '#0B1F3B', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Link href={`/${locale}/countries`}
              style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: '500' }}>
              {t('Flags', 'Drapeaux')}
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>›</span>
            <span style={{ fontSize: '13px', color: '#9EB7E5', fontWeight: '600' }}>
              {t('Organisations', 'Organisations')}
            </span>
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>
            {t('Organisation Flags', 'Drapeaux des Organisations')}
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.6)', maxWidth: '520px', lineHeight: 1.6 }}>
            {t(
              'Explore flags of major international organisations — from global bodies to regional alliances and sporting federations.',
              'Explorez les drapeaux des grandes organisations internationales — des instances mondiales aux alliances régionales et fédérations sportives.'
            )}
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '28px' }}>
            {[
              { n: ORGANISATIONS.length, label: t('Organisations', 'Organisations') },
              { n: '1894', label: t('Oldest founded', 'Plus ancienne') },
              { n: '211', label: t('Max members', 'Max membres') },
            ].map(({ n, label }) => (
              <div key={label}>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#9EB7E5', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter tags ── */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2DDD5', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '4px', overflowX: 'auto', padding: '10px 0' }}>
          {tags.map(tag => {
            const label = tag === 'all' ? t('All', 'Toutes') : (locale === 'fr' ? (CATEGORIES[tag]?.fr ?? tag) : tag)
            const isActive = activeTag === tag
            return (
              <button key={tag} onClick={() => setActiveTag(tag)}
                style={{
                  padding: '6px 14px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
                  backgroundColor: isActive ? '#0B1F3B' : '#F4F1E6',
                  color: isActive ? 'white' : '#555',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {filtered.map(org => (
            <OrgCard key={org.key} org={org} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

function OrgCard({ org, locale, t }) {
  const [hovered, setHovered] = useState(false)
  const name = locale === 'fr' ? org.fr : org.en
  const acronym = locale === 'fr' ? org.acronymFr : org.acronym
  const desc = locale === 'fr' ? org.descFr : org.descEn
  const hq = locale === 'fr' ? org.headquartersFr : org.headquartersEn
  const tag = locale === 'fr' ? org.tagFr : org.tagEn

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.13), 0 0 0 2px ${org.color}40`
          : '0 2px 12px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s, transform 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Color band + flag ── */}
      <div style={{
        background: `linear-gradient(135deg, ${org.color}22 0%, ${org.color}0a 100%)`,
        borderBottom: `3px solid ${org.color}30`,
        padding: '28px 28px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Flag */}
        <div style={{
          width: '90px', height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          backgroundColor: `${org.color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src={`/flags/organisations/${org.key}.svg`}
            alt={`${name} flag`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement.innerHTML =
                `<span style="font-size:13px;font-weight:900;color:${org.color};padding:4px;text-align:center">${acronym}</span>`
            }}
          />
        </div>

        {/* Acronym badge + tag */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            fontSize: '13px', fontWeight: '900', letterSpacing: '0.05em',
            color: org.color,
            backgroundColor: `${org.color}18`,
            border: `1.5px solid ${org.color}30`,
            borderRadius: '8px',
            padding: '3px 10px',
          }}>
            {acronym}
          </span>
          <span style={{
            fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            backgroundColor: '#F4F1E6',
            borderRadius: '6px',
            padding: '2px 8px',
          }}>
            {tag}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#0B1F3B', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
            {name}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
            {desc}
          </p>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F0EEE8' }}>
          <MetaItem icon="📅" label={t('Founded', 'Fondée')} value={org.founded} />
          <MetaItem icon="🌐" label={t('Members', 'Membres')} value={org.members} />
          <MetaItem icon="📍" label={t('HQ', 'Siège')} value={hq} />
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{value}</div>
      </div>
    </div>
  )
}