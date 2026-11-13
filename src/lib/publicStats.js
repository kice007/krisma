import { useEffect, useState } from 'react'
import { rpc } from './supabase'

// Chiffres publics de la liste d'attente (get_public_stats) : inscrits validés,
// validés aujourd'hui, pays représentés, derniers inscrits (« Prénom N. »).
// Rafraîchis toutes les 30 secondes tant que l'onglet est visible.
const EMPTY = { members: null, today: null, countries: null, latest: [] }
let cache = null

export function usePublicStats(every = 30000) {
  const [stats, setStats] = useState(cache || EMPTY)
  useEffect(() => {
    let alive = true
    const load = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const s = await rpc('get_public_stats')
        cache = { members: Number(s.members), today: Number(s.today), countries: Number(s.countries), latest: s.latest || [] }
        if (alive) setStats(cache)
      } catch {
        /* hors ligne : on garde les derniers chiffres */
      }
    }
    load()
    const id = setInterval(load, every)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', load)
    }
  }, [every])
  return stats
}

export const fmtNumber = (n, lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(n ?? 0)

// « il y a 3 min » / « 3 min ago »
export function ago(iso, lang) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(lang === 'fr' ? 'fr' : 'en', { numeric: 'auto' })
  if (s < 60) return lang === 'fr' ? "à l'instant" : 'just now'
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute')
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour')
  return rtf.format(-Math.round(s / 86400), 'day')
}

const COLORS = ['#fd8030', '#0676f8', '#a351fc', '#15803d']
export const avatarColor = (i) => COLORS[i % COLORS.length]
