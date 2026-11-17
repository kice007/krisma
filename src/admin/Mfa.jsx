import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle, LogOut, ShieldCheck } from '../components/icons'
import { supabase } from '../lib/supabase'

// Double authentification de l'équipe (migration 18) : sans code validé,
// la base refuse tous les droits d'administration.
// - première fois : QR code à scanner dans une application d'authentification ;
// - ensuite : code à 6 chiffres à chaque connexion.

// Niveau de la session : { needed: bool, enrolled: bool }.
export async function mfaState() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) return { needed: true, enrolled: false }
  return { needed: data.currentLevel !== 'aal2', enrolled: data.nextLevel === 'aal2' }
}

function CodeInput({ value, onChange, onDone, disabled }) {
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <input
      ref={ref}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 6)
        onChange(v)
        if (v.length === 6) onDone(v)
      }}
      aria-label="Code à 6 chiffres"
      placeholder="000000"
      className="h-14 w-full rounded-2xl border-[1.5px] border-ligne bg-white text-center font-display text-[28px] font-bold tracking-[10px] outline-none focus:border-noir"
    />
  )
}

export default function Mfa({ email, enrolled, onDone }) {
  const [factor, setFactor] = useState(null) // { id, qr, secret } pendant l'enregistrement
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Première fois : nettoie un enregistrement inachevé, puis crée le QR code.
  useEffect(() => {
    if (enrolled) return
    ;(async () => {
      const { data } = await supabase.auth.mfa.listFactors()
      for (const f of data?.all || []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
      const { data: e, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `KRISMA admin ${new Date().toISOString().slice(0, 10)}` })
      if (err) return setError('Impossible de créer le QR code. Recharge la page.')
      setFactor({ id: e.id, qr: e.totp.qr_code, secret: e.totp.secret })
    })()
  }, [enrolled])

  const verify = async (value) => {
    setBusy(true)
    setError(null)
    try {
      let factorId = factor?.id
      if (enrolled) {
        const { data } = await supabase.auth.mfa.listFactors()
        factorId = data?.totp?.[0]?.id
      }
      if (!factorId) throw new Error('no_factor')
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: value })
      if (err) throw err
      onDone()
    } catch {
      setError('Code incorrect ou expiré. Attends le code suivant et réessaie.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clair px-5 py-8">
      <div className="w-full max-w-[460px] rounded-[28px] bg-white p-7 lg:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-noir text-white">
          <ShieldCheck size={22} />
        </span>
        <h1 className="mt-5 font-display text-[26px] font-bold tracking-[-0.8px]">{enrolled ? 'Code de vérification' : 'Active la double authentification'}</h1>
        <p className="mt-2 font-body text-[15px] leading-[1.6] text-gris">
          {enrolled
            ? 'Ouvre ton application d’authentification et saisis le code à 6 chiffres affiché pour KRISMA.'
            : 'Obligatoire pour l’équipe. Scanne ce QR code avec une application d’authentification (Google Authenticator, Microsoft Authenticator, Authy, 1Password…), puis saisis le code affiché.'}
        </p>

        {!enrolled && (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-[20px] bg-clair p-5">
            {factor ? (
              <>
                <img src={factor.qr} alt="QR code à scanner" className="h-[180px] w-[180px] rounded-xl bg-white p-2" />
                <p className="text-center font-body text-[12px] text-gris">
                  Pas de caméra ? Saisis cette clé dans l’application :
                  <span className="mt-1 block break-all font-mono text-[13px] font-semibold text-noir">{factor.secret}</span>
                </p>
              </>
            ) : (
              <LoaderCircle className="my-16 animate-spin text-gris" />
            )}
          </div>
        )}

        <div className="mt-5">
          <CodeInput value={code} onChange={setCode} onDone={verify} disabled={busy || (!enrolled && !factor)} />
        </div>
        {busy && <p className="mt-3 font-body text-[13px] text-gris">Vérification…</p>}
        {error && <p className="mt-3 font-body text-[13px] text-[#b91c1c]">{error}</p>}

        <div className="mt-7 flex items-center justify-between border-t border-ligne pt-5 font-body text-[13px] text-gris">
          <span className="truncate">{email}</span>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.assign('/admin/connexion')
            }}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 font-semibold text-noir"
          >
            <LogOut size={14} />
            Changer de compte
          </button>
        </div>
        <p className="mt-4 font-body text-[12px] leading-[1.5] text-gris">
          Téléphone perdu ? Demande à un super-admin de supprimer ta double authentification dans Supabase (Authentication, Users), puis reconnecte-toi. <Link to="/" className="underline">Retour au site</Link>
        </p>
      </div>
    </div>
  )
}
