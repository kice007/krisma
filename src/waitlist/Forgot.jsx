import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from '../components/icons'
import { supabase } from '../lib/supabase'
import FlowLayout, { useT } from './Layout'
import { Alert, Btn, Field, Sub, Title, Turnstile, useCaptcha } from './ui'
import { EMAIL_RE } from './store'
import { errorText } from './text'
import { PATHS } from './flow'

// Erreurs passées sous silence pour ne pas révéler quelles adresses sont inscrites.
const SILENT = ['user_not_found', 'email_address_not_authorized']

// W09b — Mot de passe oublié : lien de réinitialisation par e-mail.
export default function Forgot() {
  const { t, lang } = useT()
  const f = t.forgot
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const captcha = useCaptcha()
  const ok = EMAIL_RE.test(email.trim())

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError(null)
    if (!ok) return
    if (captcha.missing) return setError(t.errors.captcha_required)
    setBusy(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}${PATHS.password}?reinitialiser`,
      ...captcha.options,
    })
    setBusy(false)
    captcha.reset()
    if (err && !SILENT.includes(err.code)) return setError(errorText(t, err))
    setSent(true)
  }

  return (
    <FlowLayout panelTitle={t.panel.loginTitle} mobileTitle={f.mobileTitle} backTo={PATHS.login}>
      {sent ? (
        <div className="mx-auto flex max-w-[480px] flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#dcf5e4]">
            <MailCheck size={24} className="text-vert" />
          </div>
          <Title>{f.sentTitle}</Title>
          <Sub>{f.sentSub(email.trim())}</Sub>
          <Link to={PATHS.login} className="font-body text-[14px] font-semibold underline underline-offset-2">
            {f.login}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mx-auto flex max-w-[480px] flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <Title>{f.title}</Title>
            <Sub>{f.sub}</Sub>
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
          <Turnstile key={captcha.key} onToken={captcha.onToken} lang={lang} />
          <Alert>{error}</Alert>
          <Btn type="submit" busy={busy} className="w-full">
            {f.cta}
          </Btn>
          <p className="text-center font-body text-[14px] text-gris">
            {f.remember}{' '}
            <Link to={PATHS.login} className="font-semibold text-noir underline-offset-2 hover:underline">
              {f.login}
            </Link>
          </p>
        </form>
      )}
    </FlowLayout>
  )
}
