// Appels de l'administration. En développement, `?apercu` renvoie des données
// d'exemple (aucune session ni écriture en base) pour vérifier les écrans.
import { rpc } from '../lib/supabase'
import { isPreview } from '../waitlist/flow'

export async function arpc(fn, args) {
  if (isPreview()) {
    const { PREVIEW } = await import('./preview')
    const r = PREVIEW[fn]
    return typeof r === 'function' ? r(args || {}) : r ?? null
  }
  return rpc(fn, args)
}
