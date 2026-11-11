import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FlowLayout, { useT } from './Layout'
import { Alert, Btn, Field, Sub, Title, Turnstile, captchaEnabled } from './ui'
import { EMAIL_RE } from './store'
import { errorText } from './text'
import { PATHS } from './flow'

// Sans compte, Supabase refuse l'envoi : on affiche quand même « lien envoyé »
// pour ne pas révéler quelles adresses sont inscrites.
const SILENT = ['otp_disabled', 'signup_disabled', 'user_not_found', 'email_address_not_authorized']

// W09 — Connexion par lien magique.
export default function Login() {
  const { t, lang } = useT()
  const l = t.login
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [captcha, setCaptcha] = useState('')
  const [error, setError] = useState(new URLSearchParams(location.search).get('expired') ? t.errors.otp_expired : null)
  const onToken = useCallback((tok) => setCaptcha(tok), [])
  const ok = EMAIL_RE.test(email.trim())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !data.session.user.is_anonymous) navigate(PATHS.resume, { replace: true })
    })
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError(null)
    if (!ok) return
    if (captchaEnabled && !captcha) return setError(t.errors.captcha_failed)
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}${PATHS.resume}`, ...(captcha ? { captchaToken: captcha } : {}) },
    })
    setBusy(false)
    if (err && !SILENT.includes(err.code) && !/signups not allowed/i.test(err.message)) return setError(errorText(t, err))
    setSent(true)
  }

  return (
    <FlowLayout panelTitle={t.panel.loginTitle} mobileTitle={l.mobileTitle} backTo={PATHS.home}>
      {sent ? (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#dcf5e4]">
            <MailCheck size={24} className="text-vert" />
          </div>
          <Title>{l.sentTitle}</Title>
          <Sub className="max-w-[460px]">{l.sentSub(email.trim())}</Sub>
          <button type="button" onClick={() => setSent(false)} className="cursor-pointer font-body text-[14px] font-semibold underline underline-offset-2">
            {l.other}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mx-auto flex max-w-[480px] flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <Title>{l.title}</Title>
            <Sub>{l.sub}</Sub>
          </div>
          <Field
            label={t.signup.email}
            icon={Mail}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t.signup.emailPh}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            state={tried && !ok ? 'err' : undefined}
            message={tried && !ok ? t.signup.errEmail : undefined}
          />
          <Turnstile onToken={onToken} lang={lang} />
          <Alert>{error}</Alert>
          <Btn type="submit" busy={busy} className="w-full">
            {l.cta}
          </Btn>
          <div className="flex items-center gap-3 font-body text-[13px] text-gris">
            <span className="h-px flex-1 bg-ligne" />
            {l.or}
            <span className="h-px flex-1 bg-ligne" />
          </div>
          <p className="text-center font-body text-[14px] text-gris">
            {l.notYet}{' '}
            <Link to={PATHS.home} className="font-semibold text-noir underline-offset-2 hover:underline">
              {l.join}
            </Link>
          </p>
        </form>
      )}
    </FlowLayout>
  )
}
