import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.warn('KRISMA : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY manquent (voir .env.example).')
}

// Session gardée dans le navigateur : la session anonyme créée à l'inscription
// permet de reprendre le questionnaire plus tard sur le même appareil.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export class AppError extends Error {
  constructor(code, cause) {
    super(code)
    this.code = code
    this.cause = cause
  }
}

// Les fonctions SQL lèvent des codes courts (« pseudo_taken »…) : on les remonte tels quels.
export async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new AppError(error.message || 'generic', error)
  return data
}

export async function currentUser() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}
