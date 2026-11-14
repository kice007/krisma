// Référencement (SEO) et moteurs génératifs (GEO) : une seule source pour
// - les balises mises à jour dans le navigateur à chaque page (useSeo.jsx),
// - les pages HTML statiques générées à la compilation (scripts/seo-build.mjs),
//   lisibles par les robots qui n'exécutent pas JavaScript (IA, réseaux sociaux).
// Fichier sans JSX ni dépendance : il est aussi importé par Node.

export const SITE = {
  url: 'https://www.krisma.io',
  name: 'KRISMA',
  locale: { fr: 'fr_FR', en: 'en_GB' },
  logo: 'https://www.krisma.io/icons/icon-512.png',
  email: 'contact@krisma.io',
}

// Pages publiques indexées (ordre du sitemap). Les autres sont en noindex.
export const PAGES = [
  {
    path: '/',
    image: '/og/og-landing.png',
    priority: '1.0',
    fr: {
      title: 'KRISMA — Le compte et la carte entre l’Europe et l’Afrique',
      description:
        'KRISMA prépare un compte européen, une carte et des transferts entre l’Europe et l’Afrique pour les étudiants et la diaspora africaine, avec du cashback chez les commerces partenaires. Rejoins la liste d’attente.',
    },
    en: {
      title: 'KRISMA — The account and card between Europe and Africa',
      description:
        'KRISMA is building a European account, a card and transfers between Europe and Africa for students and the African diaspora, with cashback at partner shops. Join the waitlist.',
    },
  },
  {
    path: '/waitlist',
    image: '/og/og-waitlist.png',
    priority: '0.9',
    fr: {
      title: 'Liste d’attente KRISMA — Les 2 000 premiers seront récompensés',
      description:
        'Inscris-toi en 2 minutes sur la liste d’attente KRISMA, gagne des points (+170 à l’inscription, +50 par parrainage, +20 par commerce, +5 par vote) et entre dans le top 2 000 récompensé.',
    },
    en: {
      title: 'KRISMA waitlist — The first 2,000 will be rewarded',
      description:
        'Join the KRISMA waitlist in 2 minutes, earn points (+170 on sign-up, +50 per referral, +20 per shop, +5 per vote) and reach the rewarded top 2,000.',
    },
  },
  {
    path: '/carte',
    image: '/og/og-waitlist.png',
    priority: '0.7',
    fr: {
      title: 'KRISMA Map — Les commerces proposés par la communauté',
      description:
        'Épiceries, boucheries, salons de coiffure, restaurants : la carte des commerces de proximité proposés et soutenus par les membres KRISMA, ville par ville, en vue du cashback KRISMA Partners.',
    },
    en: {
      title: 'KRISMA Map — Shops suggested by the community',
      description:
        'Grocers, butchers, hair salons, restaurants: the map of local shops suggested and supported by KRISMA members, city by city, ahead of KRISMA Partners cashback.',
    },
  },
  {
    path: '/classement',
    image: '/og/og-waitlist.png',
    priority: '0.6',
    fr: {
      title: 'Classement de la liste d’attente KRISMA',
      description: 'Le classement en direct des membres de la liste d’attente KRISMA. Les 2 000 premiers à la clôture de la campagne seront récompensés.',
    },
    en: {
      title: 'KRISMA waitlist leaderboard',
      description: 'The live leaderboard of KRISMA waitlist members. The top 2,000 when the campaign closes will be rewarded.',
    },
  },
  {
    path: '/reglement',
    image: '/og/og-waitlist.png',
    priority: '0.4',
    fr: {
      title: 'Règles de la campagne liste d’attente KRISMA',
      description: 'Règlement de la campagne : points, parrainage, KRISMA Map, classement et égalités, récompenses, données personnelles.',
    },
    en: {
      title: 'KRISMA waitlist campaign rules',
      description: 'Campaign rules: points, referrals, KRISMA Map, leaderboard and ties, rewards, personal data.',
    },
  },
]

// Pages privées ou d'étape : titre seulement, jamais indexées.
const PRIVATE = [
  ['/waitlist/', { fr: 'Inscription — KRISMA', en: 'Sign-up — KRISMA' }],
  ['/connexion', { fr: 'Connexion — KRISMA', en: 'Log in — KRISMA' }],
  ['/espace/points', { fr: 'Mes points — KRISMA', en: 'My points — KRISMA' }],
  ['/espace/profil', { fr: 'Mon profil — KRISMA', en: 'My profile — KRISMA' }],
  ['/espace', { fr: 'Mon espace — KRISMA', en: 'My space — KRISMA' }],
  ['/admin', { fr: 'Administration — KRISMA', en: 'Admin — KRISMA' }],
]

export function pageFor(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/'
  const pub = PAGES.find((x) => x.path === p)
  if (pub) return { ...pub, index: true }
  const priv = PRIVATE.find(([prefix]) => p.startsWith(prefix))
  if (priv) return { path: p, image: PAGES[0].image, index: false, fr: { title: priv[1].fr, description: PAGES[0].fr.description }, en: { title: priv[1].en, description: PAGES[0].en.description } }
  return { ...PAGES[0], index: true }
}

// FAQ de la landing (même contenu que la section FAQ de src/i18n.jsx).
export const LANDING_FAQ = {
  fr: [
    ['Quand KRISMA sera-t-il disponible ?', "KRISMA est en préparation et les services présentés ne sont pas encore disponibles. Rejoignez la liste d'attente pour être prévenu du lancement."],
    ['Comment pourrai-je ouvrir un compte ?', "Les modalités d'ouverture seront précisées avant le lancement. Les inscrits à la liste d'attente seront informés en premier."],
    ['Quels pays seront couverts au lancement ?', "La liste n'est pas encore arrêtée. Rejoignez la liste d'attente pour être informé en premier."],
    ['KRISMA est-elle une banque ?', 'KRISMA est une fintech en phase de développement. Nous avançons avec des partenaires réglementés pour proposer une solution fiable, sécurisée et conforme.'],
    ['Combien coûtera KRISMA ?', "L'offre envisagée est de 4,99 € par mois, avec 3 premiers mois gratuits. Ce tarif est indicatif et susceptible d'évoluer avant le lancement."],
  ],
  en: [
    ['When will KRISMA be available?', 'KRISMA is in preparation and the services shown are not available yet. Join the waitlist to hear about the launch.'],
    ['How will I open an account?', 'Account opening details will be shared before launch. People on the waitlist will be told first.'],
    ['Which countries will be covered at launch?', "The list isn't final yet. Join the waitlist to be the first to know."],
    ['Is KRISMA a bank?', 'KRISMA is a fintech in development. We are working with regulated partners to offer a reliable, secure and compliant solution.'],
    ['How much will KRISMA cost?', 'The planned offer is €4.99 per month, with the first 3 months free. This price is indicative and may change before launch.'],
  ],
}
