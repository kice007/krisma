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
export const PSEUDO_RE = /^[A-Za-z0-9._-]{3,20}$/

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
