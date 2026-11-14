// Après `vite build` : une page HTML par route publique (balises propres +
// résumé texte lisible sans JavaScript + données structurées), et sitemap.xml.
// Les robots des IA et des réseaux sociaux n'exécutent pas JavaScript : sans
// ce fichier, ils ne verraient qu'une page vide.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LANDING_FAQ, PAGES, SITE } from '../src/seo/pages.js'
import { HOME } from '../src/waitlist/homeText.js'
import { MTEXT } from '../src/member/text.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const strip = (s) => String(s).replace(/<[^>]+>/g, '')
const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
const faqHtml = (items) => `<h2>Questions fréquentes</h2>${items.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}`
const faqLd = (items) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })),
})
const link = (href, label) => `<p><a href="${href}">${esc(label)}</a></p>`

const h = HOME.fr
const rules = MTEXT.fr.rules

// Contenu texte de chaque page (FR, langue par défaut du site).
const CONTENT = {
  '/': {
    html: `
      <h1>KRISMA — La finance sans frontières</h1>
      <p>Un compte européen, une carte pour vos dépenses, des transferts entre l’Europe et l’Afrique et des avantages chez nos partenaires. KRISMA propose une nouvelle manière de gérer votre argent, où que la vie vous mène.</p>
      <p>KRISMA est une fintech en préparation : les services présentés ne sont pas encore disponibles. La liste d’attente est ouverte.</p>
      <h2>Ce que prépare KRISMA</h2>
      ${list([
        'Un compte européen avec IBAN et une carte de paiement pour le quotidien.',
        'Des transferts d’argent entre l’Europe et l’Afrique, dans les deux sens.',
        'KRISMA Partners : jusqu’à 5 % de cashback chez les commerces de proximité partenaires (épiceries, boucheries, salons de coiffure, restaurants).',
        'Pour les étudiants internationaux, la diaspora africaine et, à terme, les voyageurs.',
      ])}
      <h2>Offre envisagée</h2>
      <p>4,99 € par mois, avec les 3 premiers mois gratuits. Tarif indicatif, susceptible d’évoluer avant le lancement.</p>
      ${faqHtml(LANDING_FAQ.fr)}
      ${link('/waitlist', 'Rejoindre la liste d’attente KRISMA')}`,
    ld: [faqLd(LANDING_FAQ.fr)],
  },
  '/waitlist': {
    html: `
      <h1>${esc(h.hero.title.join(' '))}</h1>
      <p>${esc(h.hero.sub)} ${esc(h.hero.lead)}</p>
      ${list(h.hero.facts)}
      <h2>${esc(h.simulator.title)}</h2>
      <p>${esc(h.simulator.text)} ${esc(h.simulator.note)}</p>
      <h2>${esc(h.steps.title)}</h2>
      <p>${esc(h.steps.sub)}</p>
      <ol>${h.steps.items.map((s) => `<li><strong>${esc(s.title)}</strong> : ${esc(s.text)}</li>`).join('')}</ol>
      <h2>${esc(h.points.title)}</h2>
      <p>${esc(h.points.sub)}</p>
      ${list([h.points.signup, h.points.referral, h.points.shop, h.points.vote].map(([v, t, d]) => `${v} — ${t} : ${d}`))}
      <h2>${esc(h.rewards.title)}</h2>
      <p>${esc(h.rewards.text)}</p>
      <h2>${esc(h.map.title)}</h2>
      <p>${esc(h.map.text)}</p>
      ${faqHtml(h.faq.items)}
      ${link('/waitlist/inscription', h.hero.start)}`,
    ld: [faqLd(h.faq.items)],
  },
  '/carte': {
    html: `
      <h1>KRISMA Map</h1>
      <p>${esc(h.map.text)}</p>
      <p>Chaque membre vérifié propose et vote pour les commerces de sa ville. Statuts : proposé, validé, contacté, partenaire confirmé, cashback actif.</p>
      ${link('/waitlist', 'Rejoindre la liste d’attente pour proposer un commerce')}`,
  },
  '/classement': {
    html: `
      <h1>Classement de la liste d’attente KRISMA</h1>
      <p>${esc(h.rewards.text)}</p>
      <p>Le classement affiche le prénom et l’initiale du nom des membres. À points égaux, le membre inscrit le plus tôt passe devant.</p>
      ${link('/waitlist', 'Rejoindre la liste d’attente')}`,
  },
  '/reglement': {
    html: `
      <h1>${esc(rules.title)}</h1>
      <p>${esc(rules.intro)}</p>
      ${rules.sections.map((s) => `<h2>${esc(s.title)}</h2>${(s.body || []).map((b) => `<p>${esc(b)}</p>`).join('')}${s.after ? `<p>${esc(s.after)}</p>` : ''}`).join('')}`,
  },
}

const setAttr = (html, selector, attr, value) => {
  const re = new RegExp(`(<${selector}[^>]*?${attr}=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`balise introuvable : ${selector}`)
  return html.replace(re, `$1${esc(value)}$2`)
}

for (const page of PAGES) {
  const t = page.fr
  const url = SITE.url + (page.path === '/' ? '/' : page.path)
  const img = SITE.url + page.image
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(t.title)}</title>`)
  html = setAttr(html, 'meta name="description"', 'content', t.description)
  html = setAttr(html, 'link rel="canonical"', 'href', url)
  html = setAttr(html, 'meta property="og:title"', 'content', t.title)
  html = setAttr(html, 'meta property="og:description"', 'content', t.description)
  html = setAttr(html, 'meta property="og:url"', 'content', url)
  html = setAttr(html, 'meta property="og:image"', 'content', img)
  html = setAttr(html, 'meta name="twitter:title"', 'content', t.title)
  html = setAttr(html, 'meta name="twitter:description"', 'content', t.description)
  html = setAttr(html, 'meta name="twitter:image"', 'content', img)

  const c = CONTENT[page.path]
  const ld = [
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: t.title, description: t.description, inLanguage: 'fr', isPartOf: { '@id': `${SITE.url}/#website` } },
    ...(c.ld || []),
  ]
  html = html.replace('<!--seo:jsonld-->', `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld })}</script>`)
  html = html.replace('<!--seo:content-->', `<div class="seo-static">${c.html.replace(/\n\s*/g, '')}</div>`)

  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path.slice(1), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  console.log('✓', page.path, '→', file.replace(root, '.'))
}

// Sitemap des pages publiques
const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE.url}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
console.log('✓ sitemap.xml')
