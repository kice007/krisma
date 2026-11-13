import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Circle, CircleCheck, Eye, EyeOff, Lock, TriangleAlert } from '../components/icons'
import { rpc, supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Sub, Title } from './ui'
import { errorText } from './text'
import { PATHS, cleanUrl, isPreview, linkError, waitForSession } from './flow'
import { passwordRules } from './store'

// Champ mot de passe avec bouton afficher / masquer.
export function PasswordField({ label, value, onChange, state, message, autoComplete = 'new-password', t }) {
  const id = useId()
  const [show, setShow] = useState(false)
  const ring = state === 'err' ? 'border-[#dc2626] bg-white' : 'border-transparent bg-clair focus-within:border-noir focus-within:bg-white'
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-body text-[14px] font-semibold text-noir">
        {label}
      </label>
      <div className={`flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] px-[18px] transition-colors ${ring}`}>
        <Lock size={18} className="shrink-0 text-gris" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={state === 'err' || undefined}
          className="min-w-0 flex-1 bg-transparent font-body text-[16px] text-noir outline-none placeholder:text-gris"
        />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t.hide : t.show} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-gris hover:text-noir">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {message && <p className="font-body text-[13px] text-[#b91c1c]">{message}</p>}
    </div>
  )
}

// W07c — Crée ton mot de passe (après la vérification de l'e-mail) et
// réinitialisation (lien « mot de passe oublié », ?reinitialiser).
export default function Password() {
  const { t } = useT()
  const p = t.password
  const navigate = useNavigate()
  const reset = new URLSearchParams(window.location.search).has('reinitialiser')
  const [state, setState] = useState('loading')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (isPreview()) {
        setEmail('awa.kone@gmail.com')
        return setState('ok')
      }
      const err = linkError()
      const session = await waitForSession()
      cleanUrl()
      if (!alive) return
      if (err || !session || session.user.is_anonymous) return setState('expired')
      setEmail(session.user.email || '')
      setState('ok')
    })()
    return () => {
      alive = false
    }
  }, [])

  const rules = passwordRules(pwd)
  const strong = rules.every(Boolean)
  const same = pwd === pwd2

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError(null)
    if (!strong || !same) return
    setBusy(true)
    try {
      if (!isPreview()) {
        const { error: err } = await supabase.auth.updateUser({ password: pwd })
        if (err) throw err
        await rpc('mark_password_set').catch(() => {})
      }
      navigate(reset ? PATHS.member : PATHS.welcome, { replace: true })
    } catch (err) {
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <Loading />

  if (state === 'expired') {
    return (
      <FlowLayout panelTitle={t.panel.loginTitle} mobileTitle={p.mobileTitle} backTo={PATHS.login}>
        <div className="mx-auto flex max-w-[480px] flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fee2e2]">
            <TriangleAlert size={24} className="text-[#b91c1c]" />
          </div>
          <Title>{p.expiredTitle}</Title>
          <Sub>{p.expiredSub}</Sub>
          <Btn onClick={() => navigate(PATHS.forgot)}>{p.expiredCta}</Btn>
        </div>
      </FlowLayout>
    )
  }

  return (
    <FlowLayout step={reset ? undefined : 2} panelTitle={reset ? t.panel.loginTitle : undefined} mobileTitle={p.mobileTitle} backTo={reset ? PATHS.login : PATHS.home}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Title>{reset ? p.resetTitle : p.title}</Title>
          <Sub>{reset ? p.resetSub : email ? p.sub(email) : p.subNoEmail}</Sub>
        </div>
        <div className="flex flex-col gap-3">
          <PasswordField label={p.label} value={pwd} onChange={setPwd} state={tried && !strong ? 'err' : undefined} message={tried && !strong ? p.weak : undefined} t={p} />
          <ul className="flex flex-col gap-1.5">
            {p.rules.map((r, i) => (
              <li key={r} className={`flex items-center gap-2 font-body text-[13px] ${rules[i] ? 'text-vert' : 'text-gris'}`}>
                {rules[i] ? <CircleCheck size={16} /> : <Circle size={16} />}
                {r}
              </li>
            ))}
          </ul>
        </div>
        <PasswordField label={p.confirm} value={pwd2} onChange={setPwd2} state={tried && !same ? 'err' : undefined} message={tried && !same ? p.mismatch : undefined} t={p} />
        <Alert>{error}</Alert>
        <Btn type="submit" busy={busy} className="w-full">
          {reset ? p.resetCta : p.cta}
        </Btn>
      </form>
    </FlowLayout>
  )
}
