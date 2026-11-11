// Modèles des e-mails de campagne (maquettes E2 à E4), FR / EN.
// Même habillage que les e-mails d'authentification (supabase/templates).

export type Row = {
  id: number
  template: 'welcome' | 'referral_awarded' | 'shop_validated'
  payload: Record<string, unknown>
  email: string
  locale: string
  pseudo: string
  notify_points: boolean
  referral_code: string
  points: number
  rank: number | null
  members: number
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function render(row: Row, site: string) {
  const en = row.locale === 'en'
  const nf = new Intl.NumberFormat(en ? 'en-GB' : 'fr-FR')
  const n = (x: unknown) => nf.format(Number(x ?? 0))
  const link = `${site}/waitlist?ref=${row.referral_code}`
  const shortLink = link.replace(/^https?:\/\/(www\.)?/, '')
  const rank = row.rank ? `#${n(row.rank)}` : '—'
  let subject: string
  let points: number
  let title: string
  let paragraphs: string[]
  let cta: [string, string]
  let box: [string, string] | null = null

  if (row.template === 'welcome') {
    points = 170
    subject = en ? 'Welcome to the KRISMA waitlist: +170 points' : 'Bienvenue sur la liste d’attente KRISMA : +170 points'
    title = en ? 'Welcome to the waitlist!' : 'Bienvenue dans la liste d’attente !'
    paragraphs = en
      ? [`Your sign-up is confirmed and your first 170 points are credited. You are currently ${rank} out of ${n(row.members)} members.`, 'To climb the leaderboard: refer your friends (+50 points per confirmed referral) and suggest the shops in your neighbourhood on KRISMA Map (+20 points per approved shop).']
      : [`Ton inscription est validée et tes 170 premiers points sont crédités. Tu es actuellement ${rank} sur ${n(row.members)} membres.`, 'Pour grimper au classement : parraine tes proches (+50 points par filleul vérifié) et propose les commerces de ton quartier sur KRISMA Map (+20 points par commerce validé).']
    box = [en ? 'Your referral link' : 'Ton lien de parrainage', shortLink]
    cta = [en ? 'Go to my space' : 'Voir mon espace', `${site}/espace`]
  } else if (row.template === 'referral_awarded') {
    points = Number(row.payload.points ?? 50)
    const referee = esc(row.payload.referee || (en ? 'A friend' : 'Un proche'))
    subject = en ? `+${points} points: ${row.payload.referee ?? 'your referral'} just joined` : `+${points} points : ${row.payload.referee ?? 'ton filleul'} vient de valider son inscription`
    title = en ? `${referee} just confirmed their sign-up` : `${referee} vient de valider son inscription`
    paragraphs = en
      ? [`Thanks to your link, ${referee} joined the waitlist and verified their address. You earn ${points} points.`, `Total: ${n(row.points)} points · Rank ${rank}.`]
      : [`Grâce à ton lien, ${referee} a rejoint la liste d’attente et vérifié son adresse. Tu gagnes ${points} points.`, `Total : ${n(row.points)} points · Rang ${rank}.`]
    box = [en ? 'Your referral link' : 'Ton lien de parrainage', shortLink]
    cta = [en ? 'Share my link again' : 'Partager à nouveau mon lien', `${site}/espace`]
  } else {
    points = Number(row.payload.points ?? 20)
    const shop = esc(row.payload.shop)
    subject = en ? `Your suggestion is approved: +${points} points` : `Ta proposition est validée : +${points} points`
    title = en ? 'Your suggestion is approved' : 'Ta proposition est validée'
    paragraphs = en
      ? [`Good news: ${shop} is now approved on KRISMA Map. You earn ${points} points.`, 'The more votes it gets, the more KRISMA will prioritise this shop to join KRISMA Partners. Share it around you!']
      : [`Bonne nouvelle : ${shop} est désormais validé sur KRISMA Map. Tu gagnes ${points} points.`, 'Plus il y a de votes, plus KRISMA priorisera ce commerce pour rejoindre KRISMA Partners. Partage-le autour de toi !']
    cta = [en ? 'See it on KRISMA Map' : 'Voir sur KRISMA Map', `${site}/carte${row.payload.shop_id ? `?commerce=${row.payload.shop_id}` : ''}`]
  }

  const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111111;">${t}</p>`
  const html = `<!DOCTYPE html>
<html lang="${en ? 'en' : 'fr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>KRISMA</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(paragraphs[0]).slice(0, 140)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:536px;background:#ffffff;border-radius:24px;overflow:hidden;">
<tr><td style="background:#111111 url('${site}/img/waitlist/email-header.jpg') left top / cover no-repeat;padding:28px 28px 26px;">
<img src="${site}/img/landing/k-white.png" width="17" height="21" alt="" style="display:inline-block;vertical-align:middle;border:0;">
<span style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;letter-spacing:1.5px;color:#ffffff;vertical-align:middle;padding-left:6px;">KRISMA</span>
<div style="height:34px;line-height:34px;">&nbsp;</div>
<span style="font-family:Arial,Helvetica,sans-serif;font-size:52px;font-weight:800;letter-spacing:-2px;color:#ffffff;">+${points}</span>
<span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#bdbdbd;padding-left:6px;">points</span>
</td></tr>
<tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;letter-spacing:-0.6px;color:#111111;font-weight:700;">${title}</h1>
${paragraphs.map(p).join('\n')}
${box ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;"><tr><td style="background:#f4f4f4;border-radius:16px;padding:14px 18px;font-family:Arial,Helvetica,sans-serif;"><span style="display:block;font-size:12px;color:#6b6b6b;">${box[0]}</span><a href="${link}" style="display:block;margin-top:4px;font-size:15px;font-weight:700;color:#111111;text-decoration:none;">${esc(box[1])}</a></td></tr></table>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#fd8030;border-radius:999px;">
<a href="${cta[1]}" style="display:block;padding:16px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${cta[0]}</a></td></tr></table>
<p style="margin:24px 0 28px;font-size:15px;font-weight:700;color:#111111;">${en ? 'The KRISMA team' : 'L’équipe KRISMA'}</p>
</td></tr></table>
<p style="margin:20px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b6b6b;">${en ? "You're receiving this email because you joined the KRISMA waitlist." : 'Tu reçois cet e-mail car tu t’es inscrit·e à la liste d’attente KRISMA.'}</p>
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b6b6b;"><a href="${site}/reglement" style="color:#6b6b6b;">${en ? 'Campaign rules' : 'Règles de la campagne'}</a> · <a href="${site}/reglement#donnees" style="color:#6b6b6b;">${en ? 'Privacy' : 'Confidentialité'}</a> · <a href="${site}/espace/profil" style="color:#6b6b6b;">${en ? 'Manage my preferences' : 'Gérer mes préférences'}</a></p>
</td></tr></table>
</body></html>`

  const text = [title, '', ...paragraphs.map((x) => x.replace(/<[^>]+>/g, '')), '', box ? `${box[0]} : ${link}` : '', `${cta[0]} : ${cta[1]}`].filter(Boolean).join('\n')
  return { subject, html, text }
}
