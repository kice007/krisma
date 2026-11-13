// Petites mémoires locales du parcours (lien de parrainage, e-mail saisi à
// l'étape 2). Tout est protégé : un navigateur privé peut refuser le stockage.
const KEYS = { ref: 'krisma-ref', email: 'krisma-signup-email' }

function get(k) {
  try {
    return localStorage.getItem(KEYS[k]) || ''
  } catch {
    return ''
  }
}
function set(k, v) {
  try {
    if (v) localStorage.setItem(KEYS[k], v)
    else localStorage.removeItem(KEYS[k])
  } catch {
    /* stockage indisponible : on continue sans */
  }
}

export const store = {
  ref: () => get('ref'),
  setRef: (v) => set('ref', v),
  email: () => get('email'),
  setEmail: (v) => set('email', v),
}

// Un lien « ?ref=CODE » peut arriver sur n'importe quelle page de la waitlist.
export function captureReferral(search) {
  const code = new URLSearchParams(search).get('ref')
  if (code && /^[A-Za-z0-9]{4,16}$/.test(code)) store.setRef(code.toUpperCase())
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Prénom ou nom : lettres (accents compris), espaces, tirets, apostrophes.
export const NAME_RE = /^\p{L}[\p{L} '’.-]{0,59}$/u
export const cleanName = (v) => v.replace(/\s+/g, ' ').trim()
export const publicName = (first, last) => [cleanName(first), cleanName(last) ? cleanName(last)[0].toUpperCase() + '.' : ''].filter(Boolean).join(' ')
// Mot de passe : 8 caractères, une majuscule, une minuscule, un chiffre.
export const passwordRules = (p) => [p.length >= 8, /[a-z]/.test(p) && /[A-Z]/.test(p), /\d/.test(p)]

// Lien direct vers la messagerie la plus probable, d'après le domaine.
export function mailboxUrl(email) {
  const d = (email.split('@')[1] || '').toLowerCase()
  if (['gmail.com', 'googlemail.com'].includes(d)) return 'https://mail.google.com/mail/u/0/#inbox'
  if (/^(outlook|hotmail|live|msn)\./.test(d)) return 'https://outlook.live.com/mail/'
  if (/^yahoo\./.test(d)) return 'https://mail.yahoo.com/'
  if (['icloud.com', 'me.com', 'mac.com'].includes(d)) return 'https://www.icloud.com/mail'
  if (['proton.me', 'protonmail.com', 'pm.me'].includes(d)) return 'https://mail.proton.me/'
  if (['orange.fr', 'wanadoo.fr'].includes(d)) return 'https://messagerie.orange.fr/'
  if (['gmx.fr', 'gmx.com', 'gmx.net'].includes(d)) return 'https://www.gmx.fr/'
  return null
}
