import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FlowLayout, { useT } from './Layout'
import { Alert, Btn, Field, Sub, Title, Turnstile, useCaptcha } from './ui'
import { EMAIL_RE } from './store'
import { errorText } from './text'
import { PATHS } from './flow'
import { PasswordField } from './Password'

// W09 — Connexion par e-mail et mot de passe. L'e-mail n'est vérifié qu'une fois,
// à l'inscription ; ensuite le membre utilise son mot de passe.
export default function Login() {
  const { t, lang } = useT()
  const l = t.login
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const captcha = useCaptcha()
  const [error, setError] = useState(new URLSearchParams(location.search).get('expired') ? t.errors.otp_expired : null)
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
    if (!ok || !pwd) return
    if (captcha.missing) return setError(t.errors.captcha_required)
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pwd,
      options: captcha.options,
    })
    setBusy(false)
    captcha.reset()
    if (err) return setError(errorText(t, err))
    navigate(PATHS.resume, { replace: true })
  }

  return (
    <FlowLayout panelTitle={t.panel.loginTitle} mobileTitle={l.mobileTitle} backTo={PATHS.home}>
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
        <div className="flex flex-col gap-2">
          <PasswordField label={l.password} value={pwd} onChange={setPwd} autoComplete="current-password" state={tried && !pwd ? 'err' : undefined} t={t.password} />
          <Link to={PATHS.forgot} className="self-end font-body text-[14px] font-semibold text-[#c2410c] underline-offset-2 hover:underline">
            {l.forgot}
          </Link>
        </div>
        <Turnstile key={captcha.key} onToken={captcha.onToken} lang={lang} />
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
    </FlowLayout>
  )
}
