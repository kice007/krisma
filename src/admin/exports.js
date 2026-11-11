// Exports Excel de l'administration (réservés aux admins côté base).
import { rpc, supabase } from '../lib/supabase'
import { TEXT, countryName } from '../waitlist/text'
import { MEMBER_STATUS } from './ui'

const q = TEXT.fr.q
const opt = (list, code) => (code ? (list.find(([c]) => c === code) || [null, code])[1] : '')
const day = () => new Date().toISOString().slice(0, 10)
const d = (iso) => (iso ? new Date(iso) : null)

async function save(sheets, name) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const head = (value) => ({ value, fontWeight: 'bold', backgroundColor: '#F4F4F4' })
  const cell = (value) => (value instanceof Date ? { value, type: Date, format: 'dd/mm/yyyy hh:mm' } : { value: value ?? '', type: typeof value === 'number' ? Number : String })
  await writeXlsxFile(
    sheets.map((s) => ({
      sheet: s.sheet,
      columns: s.head.map((_, i) => ({ width: s.widths?.[i] || 18 })),
      data: [s.head.map(head), ...s.rows.map((r) => r.map(cell))],
    })),
  ).toFile(`${name}-${day()}.xlsx`)
}

export async function exportOverview(o) {
  const a = o.answers
  const stats = await rpc('admin_questionnaire_stats')
  const qRows = []
  const add = (label, list, key) => Object.entries(stats[key] || {}).forEach(([code, n]) => qRows.push([label, opt(list, code) || code, n]))
  add('Q2 Situation', q.situation.options, 'situation')
  add('Q3 Réception', q.frequency, 'receive_frequency')
  add('Q4 Envoi', q.frequency, 'send_frequency')
  add('Q5 Transferts', q.interest, 'interest_transfers')
  add('Q6 Fréquence commerces', q.shopFrequency.options, 'local_shop_frequency')
  add('Q7 Dépense', q.shopSpend.options, 'local_shop_spend')
  add('Q8 Cashback', q.interest, 'interest_cashback')
  add('Q9 Services', q.services.options, 'services')
  add('Q10 4,99 €/mois', q.pay.options, 'willing_to_pay')
  add('Q11 Usage', q.usage.options, 'usage_intent')
  Object.entries(stats.receive_countries || {}).forEach(([c, n]) => qRows.push(['Q3 Pays (réception)', countryName(c, 'fr'), n]))
  Object.entries(stats.send_countries || {}).forEach(([c, n]) => qRows.push(['Q4 Pays (envoi)', countryName(c, 'fr'), n]))
  await save(
    [
      {
        sheet: 'Indicateurs',
        head: ['Indicateur', 'Valeur'],
        widths: [36, 14],
        rows: [
          ['Inscriptions', o.registrations],
          ['Inscriptions (7 derniers jours)', o.registrations_week],
          ['E-mails vérifiés', o.verified],
          ['Questionnaires terminés', o.questionnaire_done],
          ['Parrainages validés', o.referrals_validated],
          ['Commerces proposés', o.shops_proposed],
          ['Commerces à vérifier', o.shops_to_review],
          ['Points suspendus', o.points_suspended],
          ['Seuil du top 2 000 (pts)', o.top?.threshold ?? 0],
          ['Membres éligibles (ex æquo compris)', o.top?.eligible ?? 0],
          ['Réponses au questionnaire', a.total],
        ],
      },
      { sheet: 'Inscriptions par jour', head: ['Jour', 'Inscrits', 'Via parrainage'], widths: [14, 12, 16], rows: o.daily.map((x) => [x.day, x.total, x.referred]) },
      { sheet: 'Villes', head: ['Ville', 'Membres vérifiés'], widths: [24, 18], rows: o.cities.map((c) => [c.name, c.members]) },
      { sheet: 'Questionnaire', head: ['Question', 'Réponse', 'Membres'], widths: [24, 40, 12], rows: qRows },
    ],
    'krisma-vue-ensemble',
  )
}

export async function exportMembers() {
  const { data, error } = await supabase.rpc('admin_export_members')
  if (error) throw error
  const list = (arr, options) => (arr || []).map((c) => (options ? opt(options, c) : countryName(c, 'fr'))).join(', ')
  await save(
    [
      {
        sheet: 'Membres',
        head: ['Pseudo', 'E-mail', 'Statut', 'Ville', 'Pays', 'Points', 'Filleuls', 'Inscrit le', 'Validé le', 'Actualités', 'Parrain', 'Situation', 'Reçoit', 'Pays (réception)', 'Envoie', 'Pays (envoi)', 'Transferts', 'Fréquence commerces', 'Dépense', 'Cashback', 'Services', '4,99 €/mois', 'Usage'],
        widths: [16, 28, 16, 16, 14, 8, 8, 16, 16, 10, 14, 22, 22, 22, 22, 22, 22, 22, 18, 22, 40, 22, 20],
        rows: data.map((m) => [
          m.pseudo, m.email, MEMBER_STATUS[m.status]?.[0] || m.status, m.city, m.country, m.points, m.referrals, d(m.created_at), d(m.verified_at), m.consent_marketing ? 'Oui' : 'Non', m.referrer,
          opt(q.situation.options, m.situation), opt(q.frequency, m.receive_frequency), list(m.receive_countries), opt(q.frequency, m.send_frequency), list(m.send_countries),
          opt(q.interest, m.interest_transfers), opt(q.shopFrequency.options, m.local_shop_frequency), opt(q.shopSpend.options, m.local_shop_spend), opt(q.interest, m.interest_cashback),
          list(m.services, q.services.options), opt(q.pay.options, m.willing_to_pay), opt(q.usage.options, m.usage_intent),
        ]),
      },
    ],
    'krisma-membres',
  )
}

export async function exportRanking() {
  const { data, error } = await supabase.rpc('admin_export_ranking', { p_size: 2000 })
  if (error) throw error
  await save(
    [
      {
        sheet: 'Classement final',
        head: ['Rang', 'Pseudo', 'E-mail', 'Ville', 'Pays', 'Points', 'Filleuls', 'Commerces', 'Validé le'],
        widths: [8, 18, 30, 18, 16, 10, 10, 12, 18],
        rows: data.map((r) => [Number(r.rank), r.pseudo, r.email, r.city, r.country, r.points, r.referrals, r.shops, d(r.verified_at)]),
      },
    ],
    'krisma-classement-final',
  )
}
