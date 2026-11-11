import { rpc, supabase } from '../lib/supabase'

// L'export des données (PDF / Excel) est dans exportData.js.

// Supprime définitivement le compte puis ferme la session locale.
export async function deleteMyAccount() {
  await rpc('delete_my_account')
  await supabase.auth.signOut({ scope: 'local' })
}
