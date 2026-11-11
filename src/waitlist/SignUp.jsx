import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AtSign, Mail, UserPlus } from 'lucide-react'
import { currentUser, rpc, supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Checkbox, Field, Sub, Title, Turnstile, useCaptcha } from './ui'
import { EMAIL_RE, PSEUDO_RE, captureReferral, store } from './store'
import { errorText } from './text'
import { PATHS, myDashboard } from './flow'

// W02 — Inscription : e-mail, pseudo unique, consentements, parrain éventuel.
export default function SignUp() {
  const { t, lang } = useT()
  const s = t.signup
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState(params.get('email') || store.email())
  const [pseudo, setPseudo] = useState('')
  const [ownPseudo, setOwnPseudo] = useState('')
  const [rules, setRules] = useState(false)
  const [marketing, setMarketing] = useState(params.get('news') === '1')
  const [referrer, setReferrer] = useState(null)
  const [pseudoState, setPseudoState] = useState('idle')
  const captcha = useCaptcha()
  const [hasSession, setHasSession] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Reprise : une session existante renvoie à la bonne étape, ou pré-remplit le pseudo.
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
        if (d.pseudo) {
          setPseudo(d.pseudo)
          setOwnPseudo(d.pseudo)
          setRules(true)
        }
      }
      if (alive) setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [location.search, navigate])

  // Disponibilité du pseudo, vérifiée pendant la saisie.
  const seq = useRef(0)
  useEffect(() => {
    const p = pseudo.trim()
    if (!p) return setPseudoState('idle')
    if (!PSEUDO_RE.test(p)) return setPseudoState('invalid')
    if (ownPseudo && p.toLowerCase() === ownPseudo.toLowerCase()) return setPseudoState('free')
    setPseudoState('checking')
    const id = ++seq.current
    const timer = setTimeout(async () => {
      const free = await rpc('check_pseudo_available', { p_pseudo: p }).catch(() => null)
      if (id === seq.current) setPseudoState(free === null ? 'idle' : free ? 'free' : 'taken')
    }, 350)
    return () => clearTimeout(timer)
  }, [pseudo, ownPseudo])

  const emailOk = EMAIL_RE.test(email.trim())

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError(null)
    if (!emailOk || !rules || pseudoState === 'invalid' || pseudoState === 'taken' || !pseudo.trim()) return
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
        p_pseudo: pseudo.trim(),
        p_accept_rules: true,
        p_consent_marketing: marketing,
        p_locale: lang,
        p_referral_code: store.ref() || null,
      })
      store.setEmail(email.trim().toLowerCase())
      navigate(PATHS.question(1))
    } catch (err) {
      if (err.code === 'already_registered') return navigate(PATHS.login)
      if (err.code === 'pseudo_taken') setPseudoState('taken')
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return <Loading />

  const pseudoMsg = {
    checking: [undefined, s.pseudoChecking],
    free: ['ok', s.pseudoFree],
    taken: ['err', s.pseudoTaken],
    invalid: ['err', s.pseudoRules],
    idle: [tried && !pseudo.trim() ? 'err' : undefined, s.pseudoRules],
  }[pseudoState]

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
        <Field
          label={s.pseudo}
          hint={s.pseudoHint}
          icon={AtSign}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          placeholder={s.pseudoPh}
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value.replace(/\s/g, ''))}
          state={pseudoMsg[0]}
          message={pseudoMsg[1]}
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
