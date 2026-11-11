// Données d'exemple pour `?apercu` (développement uniquement) : permet de voir
// l'espace membre sans session ni écriture en base.
const now = Date.now()
const ago = (days, h = 0) => new Date(now - days * 864e5 - h * 36e5).toISOString()

export const PREVIEW_MEMBER = {
  pseudo: 'awa_k',
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
    { pseudo: 'mamadou_d', status: 'awarded' },
    { pseudo: 'fatou.s', status: 'awarded' },
    { pseudo: 'kev_ci', status: 'pending_email' },
  ],
  shops: [
    { id: '1', name: 'Épicerie Chez Awa', category: 'grocery', city: 'Paris', status: 'validated' },
    { id: '2', name: 'Salon Nappy Queen', category: 'hair_salon', city: 'Saint-Denis', status: 'proposed' },
    { id: '3', name: 'Boucherie Al Baraka', category: 'butcher', city: 'Paris', status: 'duplicate' },
  ],
  history: [
    { kind: 'shop', points: 20, status: 'pending', created_at: ago(1), label: 'Salon Nappy Queen' },
    { kind: 'referral', points: 50, status: 'awarded', created_at: ago(2), label: 'mamadou_d' },
    { kind: 'shop', points: 20, status: 'awarded', created_at: ago(3), label: 'Épicerie Chez Awa' },
    { kind: 'referral', points: 50, status: 'awarded', created_at: ago(5), label: 'fatou.s' },
    { kind: 'signup', points: 170, status: 'awarded', created_at: ago(9, 3), label: null },
  ],
}

const NAMES = [
  ['mariam.dk', 1610, 'Lyon', 24, 12], ['kofi_paris', 1420, 'Montreuil', 21, 10], ['zaneb_', 1380, 'Bruxelles', 20, 11],
  ['amadou_bk', 1290, 'Paris', 18, 9], ['celine.n', 1220, 'Bordeaux', 17, 10], ['ibra_225', 1130, 'Marseille', 16, 8],
  ['nafi.sow', 1100, 'Saint-Denis', 15, 9], ['yann_ko', 1040, 'Bruxelles', 15, 6],
]
export const PREVIEW_BOARD = NAMES.map(([pseudo, points, city, referrals, shops], i) => ({ rank: i + 1, pseudo, points, city, referrals, shops, is_me: false }))
export const PREVIEW_AROUND = [
  { rank: 1247, pseudo: 'josiane_m', points: 290, city: 'Lille', referrals: 2, shops: 1, is_me: false },
  { rank: 1248, pseudo: 'awa_k', points: 290, city: 'Paris', referrals: 2, shops: 1, is_me: true },
  { rank: 1249, pseudo: 'bilal.t', points: 290, city: 'Paris', referrals: 2, shops: 1, is_me: false },
]
