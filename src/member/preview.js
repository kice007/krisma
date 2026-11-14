// Données d'exemple pour `?apercu` (développement uniquement) : permet de voir
// l'espace membre sans session ni écriture en base.
const now = Date.now()
const ago = (days, h = 0) => new Date(now - days * 864e5 - h * 36e5).toISOString()

export const PREVIEW_MEMBER = {
  pseudo: 'Awa K.',
  status: 'verified',
  locale: 'fr',
  email: 'awa.kone@gmail.com',
  verified_at: ago(9),
  consent_marketing: false,
  notify_points: true,
  city: { id: 'paris', name: 'Paris', country_code: 'FR', country_name: 'France', admin_area: 'Île-de-France' },
  referral_code: 'AWAK24',
  points: 290,
  pending_points: 20,
  rank: 1248,
  rank_week_ago: 1560,
  breakdown: { signup: 170, referral: 100, shop: 20 },
  top: { threshold: 220, eligible: 2004, members: 12481 },
  referees: [
    { pseudo: 'Mamadou D.', status: 'awarded' },
    { pseudo: 'Fatou S.', status: 'awarded' },
    { pseudo: 'Kevin C.', status: 'pending_email' },
  ],
  shops: [
    { id: '1', name: 'Épicerie Chez Awa', category: 'grocery', city: 'Paris', status: 'validated' },
    { id: '2', name: 'Salon Nappy Queen', category: 'hair_salon', city: 'Saint-Denis', status: 'proposed' },
    { id: '3', name: 'Boucherie Al Baraka', category: 'butcher', city: 'Paris', status: 'duplicate' },
  ],
  history: [
    { kind: 'vote', points: 5, status: 'awarded', created_at: ago(0.5), label: 'Boucherie Al Baraka' },
    { kind: 'shop', points: 20, status: 'pending', created_at: ago(1), label: 'Salon Nappy Queen' },
    { kind: 'referral', points: 50, status: 'awarded', created_at: ago(2), label: 'Mamadou D.' },
    { kind: 'shop', points: 20, status: 'awarded', created_at: ago(3), label: 'Épicerie Chez Awa' },
    { kind: 'referral', points: 50, status: 'awarded', created_at: ago(5), label: 'Fatou S.' },
    { kind: 'signup', points: 170, status: 'awarded', created_at: ago(9, 3), label: null },
  ],
}

const NAMES = [
  ['Mariam D.', 1610, 'Lyon', 24, 12], ['Kofi A.', 1420, 'Montreuil', 21, 10], ['Zaneb E.', 1380, 'Bruxelles', 20, 11],
  ['Amadou B.', 1290, 'Paris', 18, 9], ['Céline N.', 1220, 'Bordeaux', 17, 10], ['Ibrahim K.', 1130, 'Marseille', 16, 8],
  ['Nafissatou S.', 1100, 'Saint-Denis', 15, 9], ['Yann K.', 1040, 'Bruxelles', 15, 6],
]
export const PREVIEW_BOARD = NAMES.map(([pseudo, points, city, referrals, shops], i) => ({ rank: i + 1, pseudo, points, city, referrals, shops, is_me: false }))
export const PREVIEW_AROUND = [
  { rank: 1247, pseudo: 'Josiane M.', points: 290, city: 'Lille', referrals: 2, shops: 1, is_me: false },
  { rank: 1248, pseudo: 'Awa K.', points: 290, city: 'Paris', referrals: 2, shops: 1, is_me: true },
  { rank: 1249, pseudo: 'Bilal T.', points: 290, city: 'Paris', referrals: 2, shops: 1, is_me: false },
]

export const PREVIEW_EXPORT = {
  account: { email: 'awa.kone@gmail.com', created_at: ago(9, 4) },
  profile: {
    pseudo: 'Awa K.', status: 'verified', locale: 'fr', referral_code: 'AWAK24', referrer: null, city_name: 'Paris', country_name: 'France',
    consent_rules_at: ago(9, 4), questionnaire_completed_at: ago(9, 3.5), verified_at: ago(9, 3), consent_marketing: true, consent_marketing_at: ago(9, 4), notify_points: true,
  },
  questionnaire: {
    situation: 'employee', receive_frequency: 'few_per_year', receive_countries: ['CI', 'SN'], send_frequency: 'monthly', send_countries: ['CI'],
    interest_transfers: 'very', local_shop_frequency: 'weekly', local_shop_spend: '100_249', interest_cashback: 'fairly',
    services: ['account_card', 'send_to_africa'], willing_to_pay: 'maybe', usage_intent: 'primary',
  },
  points: PREVIEW_MEMBER.history.slice().reverse(),
  shops: [
    { name: 'Épicerie Chez Awa', category: 'grocery', address: '14 rue Myrha, 75018 Paris', city: 'Paris', status: 'validated', created_at: ago(4) },
    { name: 'Salon Nappy Queen', category: 'hair_salon', address: '8 rue de la République, Saint-Denis', city: 'Saint-Denis', status: 'proposed', created_at: ago(1) },
  ],
  votes: [
    { shop: 'Épicerie Chez Awa', city: 'Paris', created_at: ago(4) },
    { shop: 'Restaurant Le Baobab', city: 'Paris', created_at: ago(2) },
  ],
}

export const PREVIEW_CITIES = [
  { id: 'paris', name: 'Paris', country_code: 'FR', country_name: 'France', lat: 48.8566, lng: 2.3522, shops: 8, partners: 3 },
  { id: 'lyon', name: 'Lyon', country_code: 'FR', country_name: 'France', lat: 45.764, lng: 4.8357, shops: 21, partners: 1 },
  { id: 'bruxelles', name: 'Bruxelles', country_code: 'BE', country_name: 'Belgique', lat: 50.8503, lng: 4.3517, shops: 17, partners: 0 },
  { id: 'montreal', name: 'Montréal', country_code: 'CA', country_name: 'Canada', lat: 45.5019, lng: -73.5674, shops: 9, partners: 0 },
  { id: 'abidjan', name: 'Abidjan', country_code: 'CI', country_name: "Côte d'Ivoire", lat: 5.36, lng: -4.0083, shops: 6, partners: 0 },
]
const S = (id, name, category, address, lat, lng, public_status, votes, extra = {}) => ({ id, name, category, address, lat, lng, public_status, votes, voted: false, mine: false, proposer: 'Mamadou D.', details: null, cashback_rate: null, ...extra })
export const PREVIEW_SHOPS = [
  S('s1', 'Épicerie Chez Awa', 'grocery', '14 rue Myrha, Paris 18e', 48.8867, 2.3541, 'cashback_active', 124, { cashback_rate: 5, voted: true, details: 'Produits ivoiriens et sénégalais, attiéké frais le samedi.' }),
  S('s2', 'Salon Nappy Queen', 'hair_salon', '8 rue de la République, Saint-Denis', 48.9362, 2.3574, 'partner', 98),
  S('s3', 'Restaurant Le Baobab', 'restaurant', '27 rue Oberkampf, Paris 11e', 48.8649, 2.3726, 'contacted', 87),
  S('s4', 'Boucherie Al Baraka', 'butcher', '62 rue de Belleville, Paris 19e', 48.8722, 2.3829, 'validated', 61),
  S('s5', 'Boulangerie Teranga', 'bakery', '3 rue des Pyrénées, Paris 20e', 48.8565, 2.4011, 'proposed', 23, { proposer: 'Awa K.', mine: true }),
  S('s6', 'Épicerie Afro Délices', 'grocery', '41 boulevard Barbès, Paris 18e', 48.8893, 2.3497, 'proposed', 12),
  S('s7', 'Maquis Chez Tantie', 'restaurant', '5 rue Doudeauville, Paris 18e', 48.8879, 2.3554, 'validated', 44),
  S('s8', 'Coiffure Afro Style', 'hair_salon', '19 rue Château-Landon, Paris 10e', 48.8817, 2.3622, 'proposed', 9),
]
