// Données d'exemple de l'administration (mode `?apercu`, développement uniquement).
const now = Date.now()
const ago = (h) => new Date(now - h * 36e5).toISOString()

// Campagne de 9 jours : l'axe commence à gauche, les jours à venir sont vides.
const daily = Array.from({ length: 30 }, (_, i) => {
  const future = i > 8
  const total = future ? 0 : Math.round(220 + i * 40 + Math.sin(i) * 30)
  return { day: new Date(now - (8 - i) * 864e5).toISOString().slice(0, 10), total, referred: Math.round(total * (0.25 + i / 60)), future }
})

const members = [
  ['Awa K.', 'awa.kone@gmail.com', 'Paris', 'FR', 'verified', 290, 2, []],
  ['Mariam D.', 'm.diakite@outlook.fr', 'Lyon', 'FR', 'verified', 1610, 26, []],
  ['Kevin C.', 'kevin.c@gmail.com', 'Saint-Denis', 'FR', 'questionnaire_done', 0, 0, []],
  ['Promo T.', 'x7k2@tempmail.io', 'Paris', 'FR', 'suspended', 0, 14, ['disposable_email', 'shared_ip', 'suspended_points']],
  ['ibra_225', 'ibrahima.t@yahoo.fr', 'Marseille', 'FR', 'verified', 1130, 16, []],
  ['ana.b', 'ana.b@gmail.com', 'Bruxelles', 'BE', 'draft', 0, 0, []],
  ['yann_ko', 'yann.k@proton.me', 'Bruxelles', 'BE', 'verified', 1040, 15, []],
  ['test1234', 'test1234@mailinator.com', 'Paris', 'FR', 'suspended', 0, 0, ['disposable_email']],
  ['celine.n', 'celine.n@gmail.com', 'Bordeaux', 'FR', 'verified', 1220, 17, []],
].map(([pseudo, email, city, country_code, status, points, referrals, flags], i) => ({ id: `m${i}`, pseudo, email, city, country_code, status, points, referrals, suspended_points: flags.includes('suspended_points') ? 700 : 0, created_at: ago(i * 30), flags, total: 9 }))

const shops = [
  { id: 's1', name: 'Restaurant Chez Tantie Rose', category: 'restaurant', address: '52 rue de Belleville, 75020 Paris', lat: 48.8722, lng: 2.3829, status: 'proposed', proposer: 'Awa K.', proposer_city: 'Paris', created_at: ago(2), details: 'Cuisine ivoirienne, ouvert tous les soirs' },
  { id: 's2', name: 'Salon Nappy Queen', category: 'hair_salon', address: '8 rue de la République, Saint-Denis', lat: 48.9362, lng: 2.3574, status: 'proposed', proposer: 'Awa K.', proposer_city: 'Paris', created_at: ago(5) },
  { id: 's3', name: 'Épicerie chez awa', category: 'grocery', address: '14 rue Myrha, Paris 18e', lat: 48.8868, lng: 2.3542, status: 'proposed', proposer: 'Kevin C.', proposer_city: 'Saint-Denis', created_at: ago(6), dup_id: 's9', dup_name: 'Épicerie Chez Awa', dup_address: '14 rue Myrha, Paris 18e', dup_distance: 12 },
  { id: 's4', name: 'Boucherie Halal Barbès', category: 'butcher', address: '3 boulevard Barbès, Paris 18e', lat: 48.8846, lng: 2.3497, status: 'proposed', proposer: 'Mamadou D.', proposer_city: 'Paris', created_at: ago(26) },
  { id: 's9', name: 'Épicerie Chez Awa', category: 'grocery', address: '14 rue Myrha, Paris 18e', lat: 48.8867, lng: 2.3541, status: 'cashback_active', partner_public: true, cashback_rate: 5, proposer: 'Mamadou D.', proposer_city: 'Paris', created_at: ago(240) },
].map((s) => ({ partner_public: false, cashback_rate: null, review_note: null, city: s.address.includes('Saint-Denis') ? 'Saint-Denis' : 'Paris', city_id: 'paris', country_name: 'France', proposer_id: 'm0', votes: 12, duplicate_of: null, dup_id: null, total: 5, ...s }))

const points = [
  [ago(1), 'Awa K.', 'signup', null, 170, 'awarded', null],
  [ago(1.2), 'Mamadou D.', 'referral', 'Awa K.', 50, 'awarded', null],
  [ago(1.6), 'Awa K.', 'shop', 'Épicerie Chez Awa', 20, 'awarded', 'ivan'],
  [ago(2.5), 'Promo T.', 'referral', 'x91', 50, 'suspended', null],
  [ago(3), 'Promo T.', 'referral', 'k2', 50, 'suspended', null],
  [ago(20), 'test_b', 'signup', null, 170, 'revoked', 'ivan'],
  [ago(21), 'Mariam D.', 'shop', 'Afro Market Lyon', 20, 'awarded', 'ivan'],
  [ago(22), 'ibra_225', 'referral', 'sekou.d', 50, 'awarded', null],
].map(([created_at, member, kind, label, pts, status, actor], i) => ({ id: i + 1, created_at, user_id: 'm0', member, kind, label, points: pts, status, reason: status === 'revoked' ? 'Compte en double' : null, actor, changed_at: created_at, total: 8 }))

export const PREVIEW = {
  my_staff_role: 'super_admin',
  admin_shop_counts: { all: 1842, review: 37, duplicates: 6 },
  admin_overview: {
    registrations: 14920, registrations_week: 612, verified: 12481, questionnaire_done: 13612, referrals_validated: 4306, shops_proposed: 1842, shops_to_review: 37, points_suspended: 1840,
    top: { threshold: 220, eligible: 2012, members: 12481 }, daily,
    cities: [['Paris', 3912], ['Lyon', 1104], ['Bruxelles', 986], ['Marseille', 812], ['Montréal', 640], ['Abidjan', 598], ['Londres', 520]].map(([name, m]) => ({ name, members: m })),
    answers: { total: 12481, transfers_interested: 9735, cashback_interested: 8862, pay_yes: 4244, pay_maybe: 5117, usage_primary: 3619, usage_secondary: 6490 },
  },
  admin_city_stats: [['Paris', 'FR', 3912], ['Lyon', 'FR', 1104], ['Bruxelles', 'BE', 986], ['Abidjan', 'CI', 598]].map(([city, cc, m], i) => ({ city_id: `c${i}`, city, country_code: cc, members: m, shops_proposed: Math.round(m / 8), shops_validated: Math.round(m / 20), votes: m * 2, partners: 3 - i > 0 ? 3 - i : 0, cashback_active: i === 0 ? 2 : 0, top_category: 'grocery' })),
  admin_list_members: (a) => (a.p_flagged ? members.filter((m) => m.flags.length || m.status === 'suspended') : members),
  admin_member_detail: () => ({
    id: 'm3', pseudo: 'Promo T.', status: 'suspended', email: 'x7k2@tempmail.io', created_at: ago(30), verified_at: ago(29), suspension_reason: 'Fraude au parrainage', consent_marketing: false,
    city: { name: 'Paris', country_name: 'France' }, referrer: null, referral_code: 'PROMO26', flags: ['disposable_email', 'shared_ip', 'suspended_points'], same_ip: 14, points: 0, points_suspended: 700,
    questionnaire: { situation: 'other', receive_frequency: 'never', receive_countries: [], send_frequency: 'never', send_countries: [], interest_transfers: 'very', local_shop_frequency: 'daily', local_shop_spend: 'gte_500', interest_cashback: 'very', services: ['all'], willing_to_pay: 'yes', usage_intent: 'primary' },
    events: points.filter((p) => p.member === 'Promo T.'),
    referees: [['x91', 'verified'], ['k2', 'verified'], ['zz77', 'questionnaire_done']].map(([pseudo, status]) => ({ pseudo, status, email: `${pseudo}@tempmail.io`, flags: ['disposable_email', 'shared_ip'] })),
    shops: [],
  }),
  admin_list_shops: (a) => (a.p_tab === 'duplicates' ? shops.filter((s) => s.dup_id) : a.p_tab === 'review' ? shops.filter((s) => s.status === 'proposed') : shops),
  admin_list_points: (a) => (a.p_status ? points.filter((p) => p.status === a.p_status) : points),
  admin_points_summary: { awarded: 2784300, suspended: 1840, suspended_users: 9, revoked_month: 312, pending: 740, top: { threshold: 220, eligible: 2012, members: 12481 } },
  admin_questionnaire_stats: {
    situation: { student: 3120, employee: 5240, entrepreneur: 1890, job_seeker: 1460, other: 771 },
    receive_frequency: { several_per_month: 1240, monthly: 3360, few_per_year: 4120, rarely: 2210, never: 1551 },
    send_frequency: { several_per_month: 2810, monthly: 5120, few_per_year: 2900, rarely: 980, never: 671 },
    interest_transfers: { very: 6120, fairly: 3615, slightly: 1520, not_at_all: 410, unsure: 816 },
    local_shop_frequency: { daily: 2100, several_per_week: 4890, weekly: 3510, few_per_month: 1520, rarely_never: 461 },
    local_shop_spend: { lt_50: 1610, '50_99': 3120, '100_249': 4870, '250_499': 2110, gte_500: 520, unknown: 251 },
    interest_cashback: { very: 5120, fairly: 3742, slightly: 2010, not_at_all: 690, unsure: 919 },
    services: { account_card: 6210, send_to_africa: 7810, receive_from_africa: 4120, cashback: 5630, all: 3120 },
    willing_to_pay: { yes: 4244, maybe: 5117, no: 3120 },
    usage_intent: { primary: 3619, secondary: 6490, unsure: 2372 },
    receive_countries: { CI: 4210, SN: 2310, ML: 1820, CM: 1340, CD: 890 },
    send_countries: { CI: 5120, SN: 2780, ML: 2120, CM: 1610, BF: 940 },
  },
  admin_list_team: {
    members: [
      { user_id: 'u1', email: 'ivan@krisma.io', name: 'ivan', role: 'super_admin', granted_by: null, last_sign_in_at: ago(0.1), me: true },
      { user_id: 'u2', email: 'mariam@krisma.io', name: 'mariam', role: 'admin', granted_by: 'ivan', last_sign_in_at: ago(5) },
      { user_id: 'u3', email: 'yao@krisma.io', name: 'yao', role: 'moderator', granted_by: 'ivan', last_sign_in_at: ago(30) },
    ],
    invites: [{ email: 'fatou@krisma.io', role: 'moderator', invited_by: 'mariam', created_at: ago(2) }],
  },
  admin_list_audit: [
    { created_at: ago(2), actor: 'mariam', action: 'user_suspend', target: 'Promo T.', details: { reason: 'Fraude au parrainage' } },
    { created_at: ago(2.1), actor: 'mariam', action: 'points_revoked', target: 'Promo T.', details: { reason: 'Fraude confirmée' } },
    { created_at: ago(26), actor: 'ivan', action: 'team_grant', target: 'yao', details: { role: 'moderator', email: 'yao@krisma.io' } },
    { created_at: ago(27), actor: 'yao', action: 'shop_validate', target: 'Épicerie Chez Awa', details: {} },
  ],
}
