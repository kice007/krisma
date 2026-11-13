import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Check, CircleCheck, CornerDownLeft, CornerDownRight, LoaderCircle, MapPin, Plus, X } from '../components/icons'
import { AFRICA, countryName } from './text'

export function Title({ children, className = '' }) {
  return <h1 className={`font-display text-[30px] font-bold leading-[1.08] tracking-[-0.9px] text-noir lg:text-[42px] lg:tracking-[-1.3px] ${className}`}>{children}</h1>
}

export function Sub({ children, className = '' }) {
  return <p className={`font-body text-[15px] leading-[1.6] text-gris lg:text-[16px] ${className}`}>{children}</p>
}

const TONES = {
  noir: 'bg-noir text-white hover:bg-[#2b2b2b] disabled:bg-[#9a9a9a]',
  orange: 'bg-marque text-white hover:bg-[#f06e1b] disabled:bg-[#f7b98f]',
  ghost: 'border border-ligne bg-white text-noir hover:border-noir disabled:text-gris',
}

export function Btn({ children, tone = 'noir', icon: Icon, busy, className = '', ...rest }) {
  return (
    <button
      {...rest}
      disabled={busy || rest.disabled}
      className={`inline-flex h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-full px-6 font-body text-[15px] font-semibold disabled:cursor-not-allowed lg:h-14 ${TONES[tone]} ${className}`}
    >
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export function Alert({ children, tone = 'error' }) {
  if (!children) return null
  const cls = tone === 'error' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#ffe6d5] text-[#c2410c]'
  return (
    <p role="alert" className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 font-body text-[14px] leading-[1.5] ${cls}`}>
      <AlertCircle size={17} className="mt-[2px] shrink-0" />
      <span>{children}</span>
    </p>
  )
}

// Champ texte du parcours (e-mail, pseudo). `state` : ok | err | undefined.
export function Field({ label, hint, icon: Icon, state, message, id, ...input }) {
  const auto = useId()
  const fid = id || auto
  const ring = state === 'ok' ? 'border-vert bg-white' : state === 'err' ? 'border-[#dc2626] bg-white' : 'border-transparent bg-clair focus-within:border-noir focus-within:bg-white'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fid} className="font-body text-[14px] font-semibold text-noir">
          {label}
        </label>
        {hint && <span className="font-body text-[13px] text-gris">{hint}</span>}
      </div>
      <div className={`flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] px-[18px] transition-colors ${ring}`}>
        {Icon && <Icon size={18} className="shrink-0 text-gris" />}
        <input id={fid} {...input} aria-invalid={state === 'err' || undefined} className="min-w-0 flex-1 bg-transparent font-body text-[16px] text-noir outline-none placeholder:text-gris" />
        {state === 'ok' && <CircleCheck size={18} className="shrink-0 text-vert" />}
      </div>
      {message && (
        <p className={`flex items-center gap-1.5 font-body text-[13px] ${state === 'ok' ? 'text-vert' : state === 'err' ? 'text-[#b91c1c]' : 'text-gris'}`}>
          {state === 'ok' && <Check size={14} />}
          {message}
        </p>
      )}
    </div>
  )
}

export function Checkbox({ checked, onChange, children, invalid }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 font-body text-[14px] leading-[1.5] text-noir">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-marque ${
          checked ? 'border-noir bg-noir' : invalid ? 'border-[#dc2626]' : 'border-ligne'
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} className="text-white" />}
      </span>
      <span className={checked ? '' : 'text-noir/80'}>{children}</span>
    </label>
  )
}

// En-tête d'une question : pastille « Q3 » + intitulé.
export function Question({ n, label, children, error, hint }) {
  const id = useId()
  return (
    <fieldset className="flex flex-col gap-3.5" aria-describedby={error ? id : undefined}>
      <legend className="mb-3.5 flex items-start gap-3">
        <span className="mt-[1px] flex h-6 shrink-0 items-center rounded-full bg-noir px-2 font-body text-[11px] font-bold text-white">Q{n}</span>
        <span className="font-body text-[16px] font-medium leading-[1.45] text-noir lg:text-[17px]">{label}</span>
      </legend>
      {hint && <p className="-mt-1.5 font-body text-[13px] text-gris">{hint}</p>}
      {children}
      {error && (
        <p id={id} className="flex items-center gap-1.5 font-body text-[13px] text-[#b91c1c]">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </fieldset>
  )
}

// Grille de réponses. `multi` : cases à cocher, sinon boutons radio.
export function Choices({ name, options, value, onChange, multi = false, cols = 2 }) {
  const selected = (code) => (multi ? value?.includes(code) : value === code)
  const grid = cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return (
    <div className={`grid grid-cols-1 gap-2.5 ${grid}`}>
      {options.map(([code, label], i) => {
        const on = selected(code)
        const span = cols === 2 && options.length % 2 === 1 && i === options.length - 1
        return (
          <label
            key={code}
            className={`flex min-h-[50px] cursor-pointer items-center gap-3.5 rounded-2xl border px-[18px] py-3 font-body text-[15px] leading-[1.35] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marque ${
              on ? 'border-noir bg-noir font-semibold text-white' : 'border-ligne bg-white text-noir hover:border-noir/40'
            } ${span ? 'sm:col-span-2' : ''}`}
          >
            <input type={multi ? 'checkbox' : 'radio'} name={name} value={code} checked={on} onChange={() => onChange(code)} className="sr-only" />
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-[1.5px] ${multi ? 'rounded-[5px]' : 'rounded-full'} ${
                on ? 'border-marque bg-marque' : 'border-[#cfcfcf]'
              }`}
            >
              {on && <Check size={12} strokeWidth={3.5} className="text-white" />}
            </span>
            {label}
          </label>
        )
      })}
    </div>
  )
}

// Sous-question « Depuis / Vers quel(s) pays ? » : pastilles + recherche parmi les pays d'Afrique.
export function CountryPicker({ label, value, onChange, lang, t, error }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  const norm = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const list = AFRICA.filter((c) => !value.includes(c))
    .map((c) => [c, countryName(c, lang)])
    .filter(([, n]) => norm(n).includes(norm(q)))
    .sort((a, b) => a[1].localeCompare(b[1], lang))
  const add = (c) => {
    onChange([...value, c])
    setQ('')
    setOpen(false)
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-clair p-[18px]">
      <p className="flex items-center gap-2 font-body text-[14px] font-semibold text-noir">
        <CornerDownRight size={16} className="text-marque" />
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2" ref={box}>
        {value.map((c) => (
          <span key={c} className="flex h-9 items-center gap-2 rounded-full border border-ligne bg-white pl-3.5 pr-2 font-body text-[14px] font-medium">
            {countryName(c, lang)}
            <button type="button" aria-label={t.countries.remove(countryName(c, lang))} onClick={() => onChange(value.filter((x) => x !== c))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
              <X size={14} />
            </button>
          </span>
        ))}
        <div className="relative">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-noir/40 px-3.5 font-body text-[14px] text-gris hover:border-noir hover:text-noir">
            <Plus size={15} />
            {t.countries.add}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-30 mt-2 w-[280px] rounded-2xl border border-ligne bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && list[0]) {
                    e.preventDefault()
                    add(list[0][0])
                  }
                  if (e.key === 'Escape') setOpen(false)
                }}
                placeholder={t.countries.search}
                aria-label={t.countries.search}
                className="mb-1 h-10 w-full rounded-xl bg-clair px-3 font-body text-[14px] outline-none"
              />
              <ul className="max-h-60 overflow-y-auto">
                {list.length === 0 && <li className="px-3 py-2 font-body text-[14px] text-gris">{t.countries.none}</li>}
                {list.map(([c, n]) => (
                  <li key={c}>
                    <button type="button" onClick={() => add(c)} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body text-[14px] hover:bg-clair">
                      <span className="w-6 font-body text-[11px] font-bold text-gris">{c}</span>
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 font-body text-[13px] text-[#b91c1c]">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

const OSM = { N: 'node', W: 'way', R: 'relation' }

// Q1 : suggestions de villes (Photon / OpenStreetMap) avec région et pays,
// pour distinguer les homonymes (Saint-Denis 93 / Saint-Denis La Réunion).
export function CityInput({ value, onChange, lang, t }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [state, setState] = useState('idle')
  const [active, setActive] = useState(0)
  const [editing, setEditing] = useState(!value)
  const listId = useId()

  useEffect(() => {
    if (!editing || q.trim().length < 2) {
      setItems([])
      setState('idle')
      return
    }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setState('loading')
      try {
        const tags = ['city', 'town', 'village', 'municipality'].map((v) => `&osm_tag=place:${v}`).join('')
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&lang=${lang === 'fr' ? 'fr' : 'en'}&limit=6${tags}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error('photon')
        const json = await res.json()
        const seen = new Set()
        const next = json.features
          .map((f) => ({
            ref: `${OSM[f.properties.osm_type] || 'node'}/${f.properties.osm_id}`,
            name: f.properties.name,
            region: f.properties.state || f.properties.county || '',
            country: f.properties.country || '',
            cc: (f.properties.countrycode || '').toUpperCase(),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }))
          .filter((c) => c.name && /^[A-Z]{2}$/.test(c.cc) && !seen.has(c.ref) && seen.add(c.ref))
        setItems(next)
        setActive(0)
        setState(next.length ? 'idle' : 'none')
      } catch (e) {
        if (e.name !== 'AbortError') setState('error')
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [q, lang, editing])

  const pick = (c) => {
    onChange(c)
    setEditing(false)
    setQ('')
    setItems([])
  }

  if (value && !editing) {
    return (
      <div className="flex min-h-14 items-center gap-3 rounded-2xl border-[1.5px] border-vert bg-white px-[18px] py-2.5">
        <MapPin size={18} className="shrink-0 text-vert" />
        <span className="flex-1 font-body text-[16px] leading-tight">
          <span className="font-semibold">{value.name}</span>
          <span className="block text-[13px] text-gris">{[value.region, value.country].filter(Boolean).join(', ')}</span>
        </span>
        <button type="button" onClick={() => setEditing(true)} className="cursor-pointer font-body text-[14px] font-semibold underline underline-offset-2">
          {t.city.change}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] border-noir bg-white px-[18px]">
        <MapPin size={18} className="shrink-0 text-gris" />
        <input
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t.city.label}
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, items.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && items[active]) {
              e.preventDefault()
              pick(items[active])
            } else if (e.key === 'Escape' && value) setEditing(false)
          }}
          placeholder={t.city.ph}
          className="min-w-0 flex-1 bg-transparent font-body text-[16px] outline-none placeholder:text-gris"
        />
        {state === 'loading' && <LoaderCircle size={17} className="animate-spin text-gris" />}
      </div>
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="flex flex-col rounded-2xl border border-ligne bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          {items.map((c, i) => (
            <li key={c.ref} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
                className={`flex w-full cursor-pointer items-center gap-3.5 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-clair' : ''}`}
              >
                <span className="flex h-6 w-[34px] shrink-0 items-center justify-center rounded-md bg-noir font-body text-[10px] font-bold text-white">{c.cc}</span>
                <span className="flex-1 font-body leading-tight">
                  <span className="block text-[15px] font-semibold">{c.name}</span>
                  <span className="text-[13px] text-gris">{[c.region, c.country].filter(Boolean).join(', ')}</span>
                </span>
                {i === active && <CornerDownLeft size={16} className="hidden text-gris sm:block" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {state === 'none' && <p className="font-body text-[13px] text-gris">{t.city.none}</p>}
      {state === 'error' && <p className="font-body text-[13px] text-[#b91c1c]">{t.city.error}</p>}
    </div>
  )
}

// Captcha Cloudflare Turnstile, affiché seulement si une clé de site est configurée.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
export const captchaEnabled = Boolean(SITE_KEY)

// Jeton Turnstile à usage unique : reset() recharge le widget après chaque tentative.
export function useCaptcha() {
  const [token, setToken] = useState('')
  const [key, setKey] = useState(0)
  const onToken = useCallback((t) => setToken(t), [])
  const reset = useCallback(() => {
    setToken('')
    setKey((k) => k + 1)
  }, [])
  const options = token ? { captchaToken: token } : {}
  return { token, key, onToken, reset, options, missing: captchaEnabled && !token }
}

export function Turnstile({ onToken, lang }) {
  const el = useRef(null)
  useEffect(() => {
    if (!SITE_KEY) return
    let widget
    let cancelled = false
    const render = () => {
      if (cancelled || !el.current || !window.turnstile) return
      widget = window.turnstile.render(el.current, {
        sitekey: SITE_KEY,
        language: lang,
        theme: 'light',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      })
    }
    if (window.turnstile) render()
    else {
      let s = document.querySelector('script[data-turnstile]')
      if (!s) {
        s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        s.async = true
        s.dataset.turnstile = '1'
        document.head.appendChild(s)
      }
      s.addEventListener('load', render)
    }
    return () => {
      cancelled = true
      if (widget && window.turnstile) window.turnstile.remove(widget)
    }
  }, [onToken, lang])
  if (!SITE_KEY) return null
  return <div ref={el} className="min-h-[65px]" />
}
