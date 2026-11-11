import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import { currentUser, rpc, supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Choices, CityInput, CountryPicker, Question, Title } from './ui'
import { countryName, errorText } from './text'
import { PATHS, isPreview, myDashboard, sendConfirmation } from './flow'
import { store } from './store'

const EMPTY = {
  situation: null,
  receive_frequency: null,
  receive_countries: [],
  send_frequency: null,
  send_countries: [],
  interest_transfers: null,
  local_shop_frequency: null,
  local_shop_spend: null,
  interest_cashback: null,
  services: [],
  willing_to_pay: null,
  usage_intent: null,
}

// Champs enregistrés à chaque étape (Q1, la ville, passe par set_my_city).
const STEP_FIELDS = {
  1: ['situation'],
  2: ['receive_frequency', 'receive_countries', 'send_frequency', 'send_countries', 'interest_transfers'],
  3: ['local_shop_frequency', 'local_shop_spend', 'interest_cashback'],
  4: ['services', 'willing_to_pay', 'usage_intent'],
}
const FIELD_Q = { situation: 'q2', receive_frequency: 'q3', receive_countries: 'q3c', send_frequency: 'q4', send_countries: 'q4c', interest_transfers: 'q5', local_shop_frequency: 'q6', local_shop_spend: 'q7', interest_cashback: 'q8', services: 'q9', willing_to_pay: 'q10', usage_intent: 'q11' }
const QUESTION_STEP = { q1: 1, q2: 1, q3: 2, q4: 2, q5: 2, q6: 3, q7: 3, q8: 3, q9: 4, q10: 4, q11: 4 }

function validate(step, a, city) {
  const e = {}
  const need = (k, q) => (a[k] == null || (Array.isArray(a[k]) && a[k].length === 0)) && (e[q] = 'required')
  if (step === 1) {
    if (!city) e.q1 = 'required'
    need('situation', 'q2')
  }
  if (step === 2) {
    need('receive_frequency', 'q3')
    if (a.receive_frequency && a.receive_frequency !== 'never' && !a.receive_countries.length) e.q3c = 'countries'
    need('send_frequency', 'q4')
    if (a.send_frequency && a.send_frequency !== 'never' && !a.send_countries.length) e.q4c = 'countries'
    need('interest_transfers', 'q5')
  }
  if (step === 3) {
    need('local_shop_frequency', 'q6')
    need('local_shop_spend', 'q7')
    need('interest_cashback', 'q8')
  }
  if (step === 4) {
    need('services', 'q9')
    need('willing_to_pay', 'q10')
    need('usage_intent', 'q11')
  }
  return e
}

// W03 à W06 — Questionnaire en 4 thèmes. Chaque « Suivant » enregistre l'étape :
// on peut fermer l'onglet et reprendre plus tard sur le même appareil.
export default function Questionnaire() {
  const { step: raw } = useParams()
  const step = Number(raw)
  const { t, lang } = useT()
  const q = t.q
  const navigate = useNavigate()
  const top = useRef(null)

  const [ready, setReady] = useState(false)
  const [a, setA] = useState(EMPTY)
  const [city, setCity] = useState(null)
  const [cityDirty, setCityDirty] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (isPreview()) return setReady(true)
      if (!(await currentUser())) return navigate(PATHS.signup, { replace: true })
      const d = await myDashboard()
      if (!alive) return
      if (d.status === 'none') return navigate(PATHS.signup, { replace: true })
      if (d.status === 'verified' || d.status === 'suspended') return navigate(PATHS.member, { replace: true })
      const { data } = await supabase.from('questionnaire_responses').select('*').maybeSingle()
      if (!alive) return
      if (data) setA({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]])) })
      if (d.city) setCity({ name: d.city.name, region: '', country: countryName(d.city.country_code, lang), cc: d.city.country_code })
      setReady(true)
    })()
    return () => {
      alive = false
    }
    // Chargement unique : la langue ne fait que changer les libellés.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  useEffect(() => {
    setErrors({})
    setError(null)
    window.scrollTo({ top: 0 })
  }, [step])

  if (!(step >= 1 && step <= 4)) return <Navigate to={PATHS.question(1)} replace />
  if (!ready) return <Loading />

  const set = (k) => (v) => {
    setA((prev) => {
      const next = { ...prev, [k]: v }
      if (k === 'receive_frequency' && v === 'never') next.receive_countries = []
      if (k === 'send_frequency' && v === 'never') next.send_countries = []
      return next
    })
    setErrors((e) => ({ ...e, [FIELD_Q[k]]: undefined }))
  }
  const toggleService = (code) => {
    setErrors((e) => ({ ...e, q9: undefined }))
    setA((prev) => {
      const has = prev.services.includes(code)
      let services = has ? prev.services.filter((c) => c !== code) : [...prev.services, code]
      if (!has && code === 'all') services = ['all']
      else if (!has) services = services.filter((c) => c !== 'all')
      return { ...prev, services }
    })
  }

  const save = async () => {
    if (step === 1 && cityDirty && city?.ref) {
      await rpc('set_my_city', {
        p_source_ref: city.ref,
        p_name: city.name,
        p_country_code: city.cc,
        p_country_name: city.country,
        p_lat: city.lat,
        p_lng: city.lng,
        p_admin_area: city.region || null,
      })
      setCityDirty(false)
    }
    await rpc('save_questionnaire', { p_answers: Object.fromEntries(STEP_FIELDS[step].map((k) => [k, a[k]])) })
  }

  const finish = async () => {
    const res = await rpc('complete_questionnaire')
    if (res.status === 'incomplete') {
      const first = QUESTION_STEP[res.missing[0]] || 1
      navigate(PATHS.question(first))
      setTimeout(() => setErrors(validate(first, a, city)), 0)
      return
    }
    if (res.status === 'verified') return navigate(PATHS.welcome)
    // En attente de l'e-mail : envoie le lien de confirmation s'il ne l'a pas encore été.
    const user = await currentUser()
    const email = store.email()
    if (!user.email && !user.new_email && email) {
      try {
        await sendConfirmation(email, lang)
      } catch (err) {
        return navigate(PATHS.verify, { state: { sendError: err.code || err.message } })
      }
    }
    navigate(PATHS.verify)
  }

  const next = async () => {
    const e = validate(step, a, city)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    if (isPreview()) return navigate(step < 4 ? PATHS.question(step + 1) + '?apercu' : PATHS.verify + '?apercu')
    setBusy(true)
    setError(null)
    try {
      await save()
      if (step < 4) navigate(PATHS.question(step + 1))
      else await finish()
    } catch (err) {
      if (err.code === 'questionnaire_locked') return navigate(PATHS.member)
      if (err.code === 'registration_not_started' || err.code === 'not_authenticated') return navigate(PATHS.signup)
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }

  const keep = isPreview() ? '?apercu' : ''
  const prev = () => (step === 1 ? navigate(PATHS.signup + keep) : navigate(PATHS.question(step - 1) + keep))
  const meta = q.steps[step - 1]
  const err = (k) => (errors[k] ? q.required : null)

  const actions = (mobile) => (
    <div className={mobile ? 'flex gap-2.5' : 'flex items-center justify-between'}>
      <Btn type="button" tone="ghost" icon={mobile ? ArrowLeft : undefined} onClick={prev} aria-label={q.prev} className={mobile ? 'w-[60px] shrink-0 px-0' : ''}>
        {!mobile && q.prev}
      </Btn>
      <Btn type="button" tone={step === 4 ? 'orange' : 'noir'} busy={busy} onClick={next} className={mobile ? 'flex-1' : ''}>
        {step === 4 ? q.finish : q.next}
      </Btn>
    </div>
  )

  return (
    <FlowLayout
      step={1}
      mobileTitle={q.mobileTitle}
      onBack={prev}
      center={false}
      width="max-w-[680px]"
      footer={<div className="sticky bottom-0 z-20 border-t border-ligne bg-white px-5 pb-7 pt-3 lg:hidden">{actions(true)}</div>}
    >
      <div ref={top} className="flex flex-col gap-8 lg:gap-9">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between font-body text-[12px] font-semibold text-gris lg:text-[13px]">
            <span>{q.theme(step, meta.label)}</span>
            <span className="hidden sm:inline">{meta.range}</span>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-noir' : i === step ? 'bg-marque' : 'bg-ligne'}`} />
            ))}
          </div>
        </div>
        <Title className="hidden lg:block">{meta.title}</Title>

        {step === 1 && (
          <>
            <div data-invalid={!!errors.q1}>
              <Question n={1} label={q.city.label} error={err('q1')}>
                <CityInput
                  value={city}
                  lang={lang}
                  t={q}
                  onChange={(c) => {
                    setCity(c)
                    setCityDirty(true)
                    setErrors((e) => ({ ...e, q1: undefined }))
                  }}
                />
              </Question>
            </div>
            <div data-invalid={!!errors.q2}>
              <Question n={2} label={q.situation.label} error={err('q2')}>
                <Choices name="situation" options={q.situation.options} value={a.situation} onChange={set('situation')} />
              </Question>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {[
              ['q3', 'receive', 'receive_frequency', 'receive_countries'],
              ['q4', 'send', 'send_frequency', 'send_countries'],
            ].map(([key, txt, freq, countries], i) => (
              <div key={key} data-invalid={!!(errors[key] || errors[key + 'c'])}>
                <Question n={3 + i} label={q[txt].label} error={err(key)}>
                  <Choices name={freq} options={q.frequency} value={a[freq]} onChange={set(freq)} />
                  {a[freq] && a[freq] !== 'never' && (
                    <CountryPicker label={q[txt].sub} value={a[countries]} onChange={set(countries)} lang={lang} t={q} error={errors[key + 'c'] ? q.countriesRequired : null} />
                  )}
                </Question>
              </div>
            ))}
            <div data-invalid={!!errors.q5}>
              <Question n={5} label={q.transfers.label} error={err('q5')}>
                <Choices name="interest_transfers" options={q.interest} value={a.interest_transfers} onChange={set('interest_transfers')} />
              </Question>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div data-invalid={!!errors.q6}>
              <Question n={6} label={q.shopFrequency.label} error={err('q6')}>
                <Choices name="local_shop_frequency" options={q.shopFrequency.options} value={a.local_shop_frequency} onChange={set('local_shop_frequency')} />
              </Question>
            </div>
            <div data-invalid={!!errors.q7}>
              <Question n={7} label={q.shopSpend.label} error={err('q7')}>
                <Choices name="local_shop_spend" options={q.shopSpend.options} value={a.local_shop_spend} onChange={set('local_shop_spend')} />
              </Question>
            </div>
            <div data-invalid={!!errors.q8}>
              <Question n={8} label={q.cashback.label} error={err('q8')}>
                <Choices name="interest_cashback" options={q.interest} value={a.interest_cashback} onChange={set('interest_cashback')} />
              </Question>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div data-invalid={!!errors.q9}>
              <Question n={9} label={q.services.label} hint={q.several} error={err('q9')}>
                <Choices name="services" multi options={q.services.options} value={a.services} onChange={toggleService} />
              </Question>
            </div>
            <div data-invalid={!!errors.q10}>
              <Question n={10} label={q.pay.label} error={err('q10')}>
                <Choices name="willing_to_pay" cols={3} options={q.pay.options} value={a.willing_to_pay} onChange={set('willing_to_pay')} />
                <p className="flex items-start gap-2 font-body text-[13px] leading-[1.5] text-gris">
                  <Info size={15} className="mt-px shrink-0" />
                  {q.pay.note}
                </p>
              </Question>
            </div>
            <div data-invalid={!!errors.q11}>
              <Question n={11} label={q.usage.label} error={err('q11')}>
                <Choices name="usage_intent" cols={3} options={q.usage.options} value={a.usage_intent} onChange={set('usage_intent')} />
              </Question>
            </div>
          </>
        )}

        <Alert>{error}</Alert>
        <div className="hidden lg:block">{actions(false)}</div>
      </div>
    </FlowLayout>
  )
}
