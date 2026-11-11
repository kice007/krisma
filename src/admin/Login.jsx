import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { History, LockKeyhole, Mail, MailCheck, MonitorSmartphone, RotateCw, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EMAIL_RE } from '../waitlist/store'
import { Field, Turnstile, captchaEnabled, useCaptcha } from '../waitlist/ui'

const COOLDOWN = 60

// A0 / A0b — Connexion à l'administration par lien magique (sans mot de passe).
export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [wait, setWait] = useState(0)
  const captcha = useCaptcha()
  const ok = EMAIL_RE.test(email.trim())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && !data.session.user.is_anonymous && navigate('/admin', { replace: true }))
  }, [navigate])
  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  // Le compte est créé au besoin : une personne invitée reçoit ainsi son premier lien.
  // Le message reste neutre pour ne pas révéler quelles adresses font partie de l'équipe.
  const send = async (e) => {
    e?.preventDefault()
    setTried(true)
    setError(null)
    if (!ok) return
    if (captcha.missing) return setError('Patiente le temps de la vérification anti-robot, puis réessaie.')
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/admin`, ...captcha.options } })
    setBusy(false)
    captcha.reset()
    if (err && /captcha/i.test(err.code || err.message)) return setError('La vérification anti-robot a échoué. Réessaie.')
    if (err && /rate|limit/i.test(err.code || err.message)) return setError('Trop de demandes. Patiente une minute avant de réessayer.')
    setSent(true)
    setWait(COOLDOWN)
  }

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden w-[36%] max-w-[520px] shrink-0 flex-col justify-between bg-noir p-14 lg:flex">
        <span className="flex items-center gap-2.5">
          <img src="/img/landing/k-white.png" alt="" className="h-[25px] w-5 object-contain" />
          <span className="font-display text-[17px] font-extrabold tracking-[1.5px] text-white">KRISMA</span>
          <span className="rounded-full bg-marque px-2.5 py-0.5 font-body text-[11px] font-semibold text-white">Admin</span>
        </span>
        <div className="flex flex-col gap-[18px]">
          <p className="font-body text-[14px] text-white/70">Espace équipe</p>
          <p className="font-display text-[38px] font-bold leading-[1.08] tracking-[-1.4px] text-white">Modérer, corriger, piloter la liste d’attente.</p>
          <p className="font-body text-[16px] leading-[1.6] text-white/70">Commerces à vérifier, points à trancher, membres suspects : tout passe par ici.</p>
        </div>
        <div className="flex flex-col gap-3 font-body text-[14px] text-white/80">
          <p className="flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-marque" />
            Accès réservé aux comptes ajoutés par un super-admin
          </p>
          <p className="flex items-center gap-2.5">
            <History size={16} className="text-marque" />
            Chaque action sensible est journalisée
          </p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col px-5 py-6 lg:px-24 lg:py-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-body text-[14px] font-medium underline-offset-4 hover:underline">
            Retour au site
          </Link>
          <span className="flex items-center gap-2 lg:hidden">
            <img src="/img/landing/k-ink.png" alt="" className="h-[22px] w-[17px] object-contain" />
            <span className="rounded-full bg-marque px-2.5 py-0.5 font-body text-[11px] font-semibold text-white">Admin</span>
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-7 py-10">
          {sent ? (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#dcf5e4] text-vert">
                <MailCheck size={24} />
              </span>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[34px]">Vérifie ta boîte mail</h1>
                <p className="font-body text-[16px] leading-[1.6] text-gris">
                  Si {email.trim()} fait partie de l’équipe, un lien de connexion vient d’y être envoyé. Il expire dans 1 heure et ne fonctionne qu’une fois.
                </p>
              </div>
              <p className="flex items-start gap-3 rounded-2xl bg-clair p-4 font-body text-[14px] leading-[1.5]">
                <MonitorSmartphone size={18} className="mt-px shrink-0" />
                Ouvre le lien sur cet appareil : la session admin reste liée au navigateur qui l’ouvre.
              </p>
              {captchaEnabled && wait <= 0 && <Turnstile key={captcha.key} onToken={captcha.onToken} lang="fr" />}
              {error && <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>}
              <div className="flex flex-col gap-3">
                <button type="button" onClick={send} disabled={wait > 0 || busy} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full border border-ligne font-body text-[15px] font-semibold disabled:cursor-not-allowed disabled:text-gris">
                  <RotateCw size={16} />
                  {wait > 0 ? `Renvoyer le lien · 0:${String(wait).padStart(2, '0')}` : 'Renvoyer le lien'}
                </button>
                <button type="button" onClick={() => setSent(false)} className="cursor-pointer font-body text-[14px] font-semibold underline underline-offset-2">
                  Utiliser une autre adresse
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={send} noValidate className="flex flex-col gap-7">
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-clair">
                <LockKeyhole size={24} />
              </span>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[34px]">Connexion à l’administration</h1>
                <p className="font-body text-[16px] leading-[1.6] text-gris">Saisis ton adresse e-mail d’équipe. Tu recevras un lien de connexion valable 1 heure.</p>
              </div>
              <Field label="Adresse e-mail" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} state={tried && !ok ? 'err' : undefined} message={tried && !ok ? 'Saisis une adresse e-mail valide.' : undefined} />
              <Turnstile key={captcha.key} onToken={captcha.onToken} lang="fr" />
              {error && <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>}
              <button type="submit" disabled={busy} className="flex h-14 cursor-pointer items-center justify-center rounded-full bg-noir font-body text-[15px] font-semibold text-white">
                Recevoir le lien de connexion
              </button>
              <div className="flex flex-col gap-2.5 border-t border-ligne pt-5 font-body text-[14px] text-gris">
                <p>Pas encore d’accès ? Demande à un super-admin de t’inviter depuis « Équipe & accès ».</p>
                <p>Pas de mot de passe : le lien sert de clé, une seule fois.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
