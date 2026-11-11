import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Inbox, Mail, MousePointerClick, RotateCw, Timer } from 'lucide-react'
import { currentUser, supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Field, Sub, Title, Turnstile, captchaEnabled, useCaptcha } from './ui'
import { EMAIL_RE, mailboxUrl, store } from './store'
import { errorText } from './text'
import { PATHS, isPreview, myDashboard, sendConfirmation } from './flow'

const COOLDOWN = 60

// W07 — Vérifie ta boîte mail. La page passe seule à W08 dès que le lien est cliqué.
export default function Verify() {
  const { t, lang } = useT()
  const v = t.verify
  const navigate = useNavigate()
  const location = useLocation()
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [wait, setWait] = useState(COOLDOWN)
  const captcha = useCaptcha()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(location.state?.sendError ? errorText(t, { code: location.state.sendError }) : null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (isPreview()) {
        setEmail('awa.kone@gmail.com')
        return setReady(true)
      }
      const user = await currentUser()
      if (!user) return navigate(PATHS.signup, { replace: true })
      const d = await myDashboard()
      if (!alive) return
      if (d.status === 'verified') return navigate(PATHS.welcome, { replace: true })
      if (d.status === 'draft' || d.status === 'none') return navigate(PATHS.question(1), { replace: true })
      const pending = user.new_email || user.email || ''
      setEmail(pending || store.email())
      setEditing(!pending)
      setDraft(pending || store.email())
      setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [navigate])

  // Le lien peut être ouvert dans un autre onglet ou sur le téléphone : on interroge la base.
  useEffect(() => {
    if (!ready || isPreview()) return
    const check = async () => {
      const d = await myDashboard()
      if (d.status === 'verified') navigate(PATHS.welcome, { replace: true })
    }
    const id = setInterval(check, 4000)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', check)
    }
  }, [ready, navigate])

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  const resend = async () => {
    if (captcha.missing) return setError(t.errors.captcha_required)
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.resend({ type: 'email_change', email, options: captcha.options })
    setBusy(false)
    captcha.reset()
    if (err) return setError(errorText(t, err))
    setNotice(v.resent)
    setWait(COOLDOWN)
  }

  const change = async (e) => {
    e.preventDefault()
    const next = draft.trim().toLowerCase()
    if (!EMAIL_RE.test(next)) return setError(t.signup.errEmail)
    setBusy(true)
    setError(null)
    try {
      await sendConfirmation(next, lang)
      store.setEmail(next)
      setEmail(next)
      setEditing(false)
      setNotice(null)
      setWait(COOLDOWN)
    } catch (err) {
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loading />
  const box = mailboxUrl(email)
  const mm = `${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}`

  return (
    <FlowLayout step={2} mobileTitle={v.mobileTitle} backTo={PATHS.question(4)}>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-clair">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-noir">
            <Mail size={30} className="text-white" />
          </div>
        </div>
        <Title>{v.title}</Title>

        {editing ? (
          <form onSubmit={change} noValidate className="flex w-full flex-col gap-4 text-left">
            <Sub className="text-center">{email ? v.wrong : v.askEmail}</Sub>
            <Field label={t.signup.email} icon={Mail} type="email" autoComplete="email" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Alert>{error}</Alert>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Btn type="submit" busy={busy} className="flex-1">
                {v.save}
              </Btn>
              {email && (
                <Btn type="button" tone="ghost" onClick={() => setEditing(false)}>
                  {v.cancel}
                </Btn>
              )}
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3.5">
              <Sub className="max-w-[460px]">{v.sub}</Sub>
              <span className="flex max-w-full items-center gap-2 rounded-full bg-clair px-4 py-2 font-body text-[15px] font-medium">
                <Mail size={15} className="shrink-0" />
                <span className="truncate">{email}</span>
              </span>
            </div>
            <ul className="flex w-full flex-col gap-3 rounded-[20px] bg-clair p-5 text-left font-body text-[14px] leading-[1.45] text-noir">
              {[Timer, MousePointerClick, Inbox].map((Icon, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0 text-gris" />
                  {v.tips[i]}
                </li>
              ))}
            </ul>
            <Alert>{error}</Alert>
            {notice && <p className="font-body text-[14px] font-medium text-vert">{notice}</p>}
            {captchaEnabled && wait <= 0 && <Turnstile key={captcha.key} onToken={captcha.onToken} lang={lang} />}
            <div className="flex w-full flex-col justify-center gap-2.5 sm:flex-row">
              {box && (
                <a href={box} target="_blank" rel="noreferrer" className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-noir px-6 font-body text-[15px] font-semibold text-white hover:bg-[#2b2b2b] lg:h-14">
                  {v.open}
                </a>
              )}
              <Btn type="button" tone="ghost" icon={RotateCw} busy={busy} disabled={wait > 0} onClick={resend}>
                {wait > 0 ? `${v.resend} (${mm})` : v.resend}
              </Btn>
            </div>
            <p className="font-body text-[14px] text-gris">
              {v.wrong}{' '}
              <button type="button" onClick={() => setEditing(true)} className="cursor-pointer font-semibold text-noir underline-offset-2 hover:underline">
                {v.change}
              </button>
            </p>
            <p className="font-body text-[13px] text-gris">{v.waiting}</p>
          </>
        )}
        {error && error === t.errors.email_exists && (
          <Link to={PATHS.login} className="font-body text-[14px] font-semibold underline underline-offset-2">
            {t.signup.login}
          </Link>
        )}
      </div>
    </FlowLayout>
  )
}
