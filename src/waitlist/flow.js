import { currentUser, rpc, supabase } from '../lib/supabase'

export const PATHS = {
  home: '/waitlist',
  signup: '/waitlist/inscription',
  question: (n) => `/waitlist/questionnaire/${n}`,
  verify: '/waitlist/verification',
  welcome: '/waitlist/bienvenue',
  resume: '/waitlist/reprise',
  login: '/connexion',
  member: '/espace',
}

// Aperçu des écrans sans session ni écriture en base (développement uniquement) : ?apercu
export const isPreview = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('apercu')
export const SAMPLE = { pseudo: 'awa_k', status: 'verified', points: 170, rank: 4812, referral_code: 'AWAK24', top: { members: 12481 } }

export async function myDashboard() {
  try {
    return await rpc('get_my_dashboard')
  } catch {
    return { status: 'none' }
  }
}

// Où reprendre le parcours, d'après l'état réel de l'inscription en base.
export async function resumePath() {
  const user = await currentUser()
  if (!user) return PATHS.signup
  const d = await myDashboard()
  switch (d.status) {
    case 'verified':
      return PATHS.member
    case 'suspended':
      return PATHS.welcome
    case 'questionnaire_done':
      return PATHS.verify
    case 'draft':
      return PATHS.question(1)
    default:
      return PATHS.signup
  }
}

// Session prête : attend que supabase-js ait lu les jetons d'un lien e-mail.
export function waitForSession(timeout = 2500) {
  return new Promise((resolve) => {
    let done = false
    const finish = (s) => {
      if (done) return
      done = true
      sub.subscription.unsubscribe()
      resolve(s)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) finish(session)
    })
    supabase.auth.getSession().then(({ data }) => data.session && finish(data.session))
    setTimeout(() => supabase.auth.getSession().then(({ data }) => finish(data.session)), timeout)
  })
}

// Erreur transmise par Supabase dans l'URL d'un lien e-mail (lien expiré, déjà utilisé…).
export function linkError() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
  return params.get('error_code') || params.get('error') || null
}

export function cleanUrl() {
  if (window.location.hash || window.location.search.includes('code=')) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

// Envoie (ou renvoie vers une nouvelle adresse) le lien de confirmation.
// Le pseudo et la langue vont dans les métadonnées du compte : les modèles
// d'e-mail Supabase s'en servent (« Bonjour awa_k », version FR ou EN).
export async function sendConfirmation(email, lang) {
  const { pseudo } = await myDashboard()
  const { error } = await supabase.auth.updateUser(
    { email, data: { locale: lang, ...(pseudo ? { pseudo } : {}) } },
    { emailRedirectTo: `${window.location.origin}${PATHS.welcome}` },
  )
  if (error) throw error
}
