// Export RGPD lisible : les données du membre en PDF ou en Excel, générés dans
// le navigateur. Les bibliothèques ne sont chargées qu'au moment du clic.
import { rpc } from '../lib/supabase'
import { TEXT, countryName } from '../waitlist/text'
import { MTEXT } from './text'
import { isPreview } from '../waitlist/flow'
import { PREVIEW_EXPORT } from './preview'

const L = {
  fr: {
    title: 'KRISMA — Mes données personnelles',
    generated: (d) => `Export généré le ${d}`,
    file: 'krisma-mes-donnees',
    yes: 'Oui',
    no: 'Non',
    sections: { account: 'Compte', questionnaire: 'Questionnaire', points: 'Points', shops: 'Commerces proposés', votes: 'Commerces soutenus' },
    account: {
      email: 'Adresse e-mail', pseudo: 'Pseudo', status: 'Statut', locale: 'Langue', city: 'Ville', country: 'Pays',
      referral_code: 'Code de parrainage', referrer: 'Parrain', created: 'Compte créé le', rules: 'Règlement accepté le',
      questionnaire: 'Questionnaire terminé le', verified: 'Inscription validée le', marketing: 'Actualités KRISMA',
      notify: 'E-mails de suivi des points',
    },
    status: { draft: 'Inscription commencée', questionnaire_done: 'En attente de vérification de l’e-mail', verified: 'Inscription validée', suspended: 'Suspendue' },
    pointCols: ['Date', 'Type', 'Détail', 'Points', 'Statut'],
    pointStatus: { awarded: 'Attribués', pending: 'En attente', suspended: 'En vérification', revoked: 'Annulés' },
    shopCols: ['Commerce', 'Catégorie', 'Adresse', 'Ville', 'Statut', 'Proposé le'],
    shopStatus: { proposed: 'Proposé', validated: 'Validé', contacted: 'Contacté', partner: 'Partenaire', cashback_active: 'Cashback actif', rejected: 'Refusé', duplicate: 'Doublon' },
    voteCols: ['Commerce', 'Ville', 'Soutenu le'],
    qCols: ['Question', 'Réponse'],
    keyCols: ['Information', 'Valeur'],
    empty: 'Aucune donnée',
  },
  en: {
    title: 'KRISMA — My personal data',
    generated: (d) => `Export generated on ${d}`,
    file: 'krisma-my-data',
    yes: 'Yes',
    no: 'No',
    sections: { account: 'Account', questionnaire: 'Questionnaire', points: 'Points', shops: 'Suggested shops', votes: 'Supported shops' },
    account: {
      email: 'Email address', pseudo: 'Username', status: 'Status', locale: 'Language', city: 'City', country: 'Country',
      referral_code: 'Referral code', referrer: 'Referrer', created: 'Account created on', rules: 'Rules accepted on',
      questionnaire: 'Questionnaire completed on', verified: 'Sign-up confirmed on', marketing: 'KRISMA news',
      notify: 'Points emails',
    },
    status: { draft: 'Sign-up started', questionnaire_done: 'Awaiting email verification', verified: 'Sign-up confirmed', suspended: 'Suspended' },
    pointCols: ['Date', 'Type', 'Detail', 'Points', 'Status'],
    pointStatus: { awarded: 'Awarded', pending: 'Pending', suspended: 'Under review', revoked: 'Cancelled' },
    shopCols: ['Shop', 'Category', 'Address', 'City', 'Status', 'Suggested on'],
    shopStatus: { proposed: 'Suggested', validated: 'Approved', contacted: 'Contacted', partner: 'Partner', cashback_active: 'Cashback live', rejected: 'Rejected', duplicate: 'Duplicate' },
    voteCols: ['Shop', 'City', 'Supported on'],
    qCols: ['Question', 'Answer'],
    keyCols: ['Item', 'Value'],
    empty: 'No data',
  },
}

// Met les données dans une forme commune aux deux formats : des sections
// composées d'un tableau (en-têtes + lignes de texte).
async function buildSections(lang) {
  const data = isPreview() ? PREVIEW_EXPORT : await rpc('export_my_data')
  const l = L[lang]
  const q = TEXT[lang].q
  const m = MTEXT[lang]
  const loc = lang === 'fr' ? 'fr-FR' : 'en-GB'
  const date = (iso, time) => (iso ? new Intl.DateTimeFormat(loc, time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(iso)) : '—')
  const p = data.profile || {}
  const a = data.account || {}
  const yn = (v) => (v ? l.yes : l.no)

  const account = [
    [l.account.email, a.email || '—'],
    [l.account.pseudo, p.pseudo || '—'],
    [l.account.status, l.status[p.status] || p.status || '—'],
    [l.account.locale, p.locale === 'en' ? 'English' : 'Français'],
    [l.account.city, p.city_name || '—'],
    [l.account.country, p.country_name || '—'],
    [l.account.referral_code, p.status === 'verified' ? p.referral_code : '—'],
    [l.account.referrer, p.referrer || '—'],
    [l.account.created, date(a.created_at, true)],
    [l.account.rules, date(p.consent_rules_at, true)],
    [l.account.questionnaire, date(p.questionnaire_completed_at, true)],
    [l.account.verified, date(p.verified_at, true)],
    [l.account.marketing, `${yn(p.consent_marketing)}${p.consent_marketing_at ? ` (${date(p.consent_marketing_at)})` : ''}`],
    [l.account.notify, yn(p.notify_points !== false)],
  ]

  const r = data.questionnaire || {}
  const opt = (list, code) => (list.find(([c]) => c === code) || [null, code || '—'])[1]
  const countries = (arr) => (arr?.length ? arr.map((c) => countryName(c, lang)).join(', ') : '—')
  const questionnaire = [
    [`Q1 · ${q.city.label}`, p.city_name ? `${p.city_name}, ${p.country_name}` : '—'],
    [`Q2 · ${q.situation.label}`, opt(q.situation.options, r.situation)],
    [`Q3 · ${q.receive.label}`, opt(q.frequency, r.receive_frequency)],
    [`    ${q.receive.sub}`, countries(r.receive_countries)],
    [`Q4 · ${q.send.label}`, opt(q.frequency, r.send_frequency)],
    [`    ${q.send.sub}`, countries(r.send_countries)],
    [`Q5 · ${q.transfers.label}`, opt(q.interest, r.interest_transfers)],
    [`Q6 · ${q.shopFrequency.label}`, opt(q.shopFrequency.options, r.local_shop_frequency)],
    [`Q7 · ${q.shopSpend.label}`, opt(q.shopSpend.options, r.local_shop_spend)],
    [`Q8 · ${q.cashback.label}`, opt(q.interest, r.interest_cashback)],
    [`Q9 · ${q.services.label}`, r.services?.length ? r.services.map((c) => opt(q.services.options, c)).join(', ') : '—'],
    [`Q10 · ${q.pay.label}`, opt(q.pay.options, r.willing_to_pay)],
    [`Q11 · ${q.usage.label}`, opt(q.usage.options, r.usage_intent)],
  ]

  const points = (data.points || []).map((e) => [date(e.created_at, true), m.points.kinds[e.kind], e.label || '—', `+${e.points}`, l.pointStatus[e.status] || e.status])
  const shops = (data.shops || []).map((s) => [s.name, m.categories[s.category] || s.category, s.address, s.city || '—', l.shopStatus[s.status] || s.status, date(s.created_at)])
  const votes = (data.votes || []).map((v) => [v.shop, v.city || '—', date(v.created_at)])

  return {
    l,
    stamp: date(new Date().toISOString(), true),
    sections: [
      { title: l.sections.account, head: l.keyCols, rows: account, widths: [32, 50] },
      { title: l.sections.questionnaire, head: l.qCols, rows: questionnaire, widths: [70, 40] },
      { title: l.sections.points, head: l.pointCols, rows: points, widths: [20, 22, 24, 8, 14] },
      { title: l.sections.shops, head: l.shopCols, rows: shops, widths: [26, 14, 34, 14, 14, 14] },
      { title: l.sections.votes, head: l.voteCols, rows: votes, widths: [30, 18, 16] },
    ],
  }
}

const fileName = (l, ext) => `${l.file}-${new Date().toISOString().slice(0, 10)}.${ext}`

export async function exportExcel(lang) {
  const [{ default: writeXlsxFile }, { l, sections }] = await Promise.all([import('write-excel-file/browser'), buildSections(lang)])
  const bold = (value) => ({ value, fontWeight: 'bold', backgroundColor: '#F4F4F4' })
  const sheets = sections.map((s) => ({
    sheet: s.title.slice(0, 31),
    columns: s.widths.map((width) => ({ width })),
    data: [s.head.map(bold), ...(s.rows.length ? s.rows : [[l.empty]]).map((row) => row.map((value) => ({ value: String(value), wrap: true })))],
  }))
  await writeXlsxFile(sheets).toFile(fileName(l, 'xlsx'))
}

// Police Inter intégrée au PDF : les polices standard ignorent ’ … € et les lettres hors latin-1.
async function loadFont(doc) {
  const b64 = async (url) => {
    const buf = new Uint8Array(await (await fetch(url)).arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    return btoa(bin)
  }
  const [regular, bold] = await Promise.all([b64('/fonts/inter-400.ttf'), b64('/fonts/inter-700.ttf')])
  doc.addFileToVFS('Inter-400.ttf', regular)
  doc.addFont('Inter-400.ttf', 'Inter', 'normal')
  doc.addFileToVFS('Inter-700.ttf', bold)
  doc.addFont('Inter-700.ttf', 'Inter', 'bold')
}

export async function exportPdf(lang) {
  const [{ jsPDF }, { autoTable }, { l, stamp, sections }] = await Promise.all([import('jspdf'), import('jspdf-autotable'), buildSections(lang)])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  await loadFont(doc)
  const margin = 40
  doc.setFont('Inter', 'bold').setFontSize(18).setTextColor(17, 17, 17)
  doc.text(l.title, margin, 56)
  doc.setFont('Inter', 'normal').setFontSize(10).setTextColor(107, 107, 107)
  doc.text(l.generated(stamp), margin, 74)
  let y = 100
  for (const s of sections) {
    if (y > 740) {
      doc.addPage()
      y = 56
    }
    doc.setFont('Inter', 'bold').setFontSize(13).setTextColor(17, 17, 17)
    doc.text(s.title, margin, y)
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      head: [s.head],
      body: s.rows.length ? s.rows : [[{ content: l.empty, colSpan: s.head.length }]],
      styles: { font: 'Inter', fontSize: 8.5, cellPadding: 5, textColor: [17, 17, 17], lineColor: [230, 230, 230], lineWidth: 0.5 },
      headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    })
    y = doc.lastAutoTable.finalY + 30
  }
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8).setTextColor(150, 150, 150)
    doc.text(`KRISMA · ${i} / ${pages}`, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' })
  }
  doc.save(fileName(l, 'pdf'))
}
