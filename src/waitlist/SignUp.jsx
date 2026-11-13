import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, Mail, User, UserPlus } from '../components/icons'
import { currentUser, rpc, supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Checkbox, Field, Sub, Title, Turnstile, useCaptcha } from './ui'
import { EMAIL_RE, NAME_RE, captureReferral, cleanName, publicName, store } from './store'
import { errorText } from './text'
import { PATHS, myDashboard } from './flow'

// W02 — Inscription : prénom, nom, e-mail, consentements, parrain éventuel.
export default function SignUp() {
  const { t, lang } = useT()
  const s = t.signup
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState(params.get('email') || store.email())
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [rules, setRules] = useState(false)
  const [marketing, setMarketing] = useState(params.get('news') === '1')
  const [referrer, setReferrer] = useState(null)
  const captcha = useCaptcha()
  const [hasSession, setHasSession] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Reprise : une session existante renvoie à la bonne étape, ou pré-remplit le nom.
  useEffect(() => {
    captureReferral(location.search)
    let alive = true
    ;(async () => {
      const ref = store.ref()
      if (ref) {
        const r = await rpc('get_referrer', { p_code: ref }).catch(() => null)
        if (alive) setReferrer(r?.pseudo || null)
      }
      const user = await currentUser()
      if (user) {
        setHasSession(true)
        const d = await myDashboard()
        if (!alive) return
        if (d.status === 'verified') return navigate(PATHS.member, { replace: true })
        if (d.status === 'questionnaire_done') return navigate(PATHS.verify, { replace: true })
        if (d.status === 'draft') {
          const n = await rpc('get_my_name').catch(() => null)
          if (n?.first_name) {
            setFirst(n.first_name)
            setLast(n.last_name || '')
            setRules(true)
          }
        }
      }
      if (alive) setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [location.search, navigate])

  const emailOk = EMAIL_RE.test(email.trim())
  const firstOk = NAME_RE.test(cleanName(first))
  const lastOk = NAME_RE.test(cleanName(last))
  const shown = firstOk ? publicName(first, lastOk ? last : '') : ''

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError(null)
    if (!firstOk || !lastOk || !emailOk || !rules) return
    if (!hasSession && captcha.missing) return setError(t.errors.captcha_required)
    setBusy(true)
    try {
      if (!(await currentUser())) {
        const { error: authError } = await supabase.auth.signInAnonymously({ options: captcha.options })
        captcha.reset()
        if (authError) throw authError
        setHasSession(true)
      }
      await rpc('start_registration', {
        p_first_name: cleanName(first),
        p_last_name: cleanName(last),
        p_accept_rules: true,
        p_consent_marketing: marketing,
        p_locale: lang,
        p_referral_code: store.ref() || null,
      })
      store.setEmail(email.trim().toLowerCase())
      navigate(PATHS.question(1))
    } catch (err) {
      if (err.code === 'already_registered') return navigate(PATHS.login)
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loading />

  return (
    <FlowLayout step={0} mobileTitle={s.mobileTitle} backTo={PATHS.home}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        {referrer && (
          <p className="flex items-start gap-2.5 self-start rounded-[20px] bg-[#ffe6d5] px-4 py-2.5 font-body text-[13px] font-medium leading-[1.45] text-[#9a3412] lg:rounded-full">
            <UserPlus size={16} className="mt-px shrink-0" />
            {s.invited(referrer)}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Title>{s.title}</Title>
          <Sub>{s.sub}</Sub>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={s.firstName}
              icon={User}
              autoComplete="given-name"
              maxLength={60}
              placeholder={s.firstPh}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              state={tried && !firstOk ? 'err' : undefined}
              message={tried && !firstOk ? s.errFirst : undefined}
            />
            <Field
              label={s.lastName}
              icon={User}
              autoComplete="family-name"
              maxLength={60}
              placeholder={s.lastPh}
              value={last}
              onChange={(e) => setLast(e.target.value)}
              state={tried && !lastOk ? 'err' : undefined}
              message={tried && !lastOk ? s.errLast : undefined}
            />
          </div>
          {shown && (
            <p className="flex items-center gap-1.5 font-body text-[13px] text-vert">
              <Eye size={14} />
              {s.preview(shown)}
            </p>
          )}
        </div>
        <Field
          label={s.email}
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={s.emailPh}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          state={tried && !emailOk ? 'err' : undefined}
          message={tried && !emailOk ? s.errEmail : undefined}
        />
        <div className="flex flex-col gap-3.5">
          <Checkbox checked={rules} onChange={setRules} invalid={tried && !rules}>
            {s.rules[0]}
            <Link to="/reglement" target="_blank" className="underline underline-offset-2">{s.rules[1]}</Link>
            {s.rules[2]}
            <Link to="/confidentialite" target="_blank" className="underline underline-offset-2">{s.rules[3]}</Link>
            {s.rules[4]}
          </Checkbox>
          {tried && !rules && <p className="font-body text-[13px] text-[#b91c1c]">{s.errRules}</p>}
          <Checkbox checked={marketing} onChange={setMarketing}>
            {s.marketing}
          </Checkbox>
        </div>
        {!hasSession && <Turnstile key={captcha.key} onToken={captcha.onToken} lang={lang} />}
        <Alert>{error}</Alert>
        <Btn type="submit" busy={busy} className="w-full">
          {s.cta}
        </Btn>
        <p className="font-body text-[14px] text-gris">
          {s.already}{' '}
          <Link to={PATHS.login} className="font-semibold text-noir underline-offset-2 hover:underline">
            {s.login}
          </Link>
        </p>
      </form>
    </FlowLayout>
  )
}
