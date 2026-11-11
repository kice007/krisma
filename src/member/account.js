import { rpc, supabase } from '../lib/supabase'

// Télécharge toutes les données du membre (RGPD) en JSON.
export async function downloadMyData() {
  const data = await rpc('export_my_data')
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `krisma-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Supprime définitivement le compte puis ferme la session locale.
export async function deleteMyAccount() {
  await rpc('delete_my_account')
  await supabase.auth.signOut({ scope: 'local' })
}
