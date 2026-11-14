import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CircleCheck, Heart, LoaderCircle, MapPin, Move, Send, Store, X } from '../../components/icons'
import { rpc } from '../../lib/supabase'
import { isPreview } from '../../waitlist/flow'
import { CATEGORY_ICON, STATUS_COLOR, createMap, draftElement, maplibregl } from './maplibre'

const CATS = ['grocery', 'butcher', 'bakery', 'hair_salon', 'restaurant', 'other']

const distKm = (a, b) => {
  const r = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// Position de l'adresse saisie (premier résultat Photon autour de la ville).
async function geocode(text, near, lang) {
  try {
    const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : ''
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=${lang === 'fr' ? 'fr' : 'en'}&limit=1${bias}`)
    const f = (await res.json()).features?.[0]
    return f ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null
  } catch {
    return null
  }
}

// Adresse : suggestions Photon (OpenStreetMap) autour de la ville choisie.
function AddressInput({ value, onChange, onPick, center, lang, t, invalid }) {
  const [items, setItems] = useState([])
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!typing || value.trim().length < 4) return setItems([])
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const bias = center ? `&lat=${center.lat}&lon=${center.lng}` : ''
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&lang=${lang === 'fr' ? 'fr' : 'en'}&limit=5${bias}`, { signal: ctrl.signal })
        const json = await res.json()
        setItems(
          json.features
            .filter((f) => f.properties.street || f.properties.name)
            .map((f) => {
              const p = f.properties
              const line = [[p.housenumber, p.street || p.name].filter(Boolean).join(' '), [p.postcode, p.city || p.town || p.village].filter(Boolean).join(' ')].filter(Boolean).join(', ')
              return { label: line, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], key: `${p.osm_type}${p.osm_id}` }
            }),
        )
      } catch {
        /* recherche indisponible : l'adresse reste libre, le repère sert de position */
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [value, typing, center, lang])
  return (
    <div className="relative">
      <div className={`flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] px-[18px] ${invalid ? 'border-[#dc2626] bg-white' : 'border-transparent bg-clair focus-within:border-noir focus-within:bg-white'}`}>
        <MapPin size={18} className="shrink-0 text-gris" />
        <input
          value={value}
          onChange={(e) => {
            setTyping(true)
            onChange(e.target.value)
          }}
          placeholder={t.addressPh}
          aria-label={t.address}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-body text-[16px] outline-none placeholder:text-gris"
        />
      </div>
      {items.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 rounded-2xl border border-ligne bg-white p-1.5 shadow-[0_16px_40px_rgba(17,17,17,0.12)]">
          {items.map((it) => (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => {
                  setTyping(false)
                  setItems([])
                  onPick(it)
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-body text-[14px] hover:bg-clair"
              >
                <MapPin size={15} className="shrink-0 text-gris" />
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Petite carte avec le repère déplaçable.
function PinMap({ point, category, onMove, t }) {
  const el = useRef(null)
  const mp = useRef(null)
  const mk = useRef(null)
  useEffect(() => {
    const m = createMap(el.current, { center: [point.lat, point.lng], zoom: 16, scrollZoom: false })
    const marker = new maplibregl.Marker({ element: draftElement(category), anchor: 'bottom', draggable: true }).setLngLat([point.lng, point.lat]).addTo(m)
    marker.on('dragend', () => {
      const p = marker.getLngLat()
      onMove({ lat: p.lat, lng: p.lng }, true)
    })
    m.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      onMove({ lat: e.lngLat.lat, lng: e.lngLat.lng }, true)
    })
    mp.current = m
    mk.current = marker
    return () => m.remove()
    // Carte créée une seule fois ; la position est suivie plus bas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    mk.current?.setLngLat([point.lng, point.lat])
    mp.current?.easeTo({ center: [point.lng, point.lat], duration: 300 })
  }, [point.lat, point.lng])
  useEffect(() => {
    const el = mk.current?.getElement()
    if (el) el.innerHTML = draftElement(category).innerHTML
  }, [category])
  return (
    <div className="relative h-[150px] overflow-hidden rounded-2xl lg:h-[160px]">
      <div ref={el} className="km-map absolute inset-0" style={{ position: 'absolute' }} />
      <span className="pointer-events-none absolute bottom-2 left-2 z-[500] flex h-7 items-center gap-1.5 rounded-full bg-white/95 px-2.5 font-body text-[12px] text-gris">
        <Move size={13} />
        {t.dragHint}
      </span>
    </div>
  )
}

// W13 / W13b / M16 / M17 — Proposer un commerce, ou soutenir le doublon trouvé.
export default function ProposeDialog({ t, lang, city, desktop, onClose, onDone }) {
  const f = t.form
  const [name, setName] = useState('')
  const [category, setCategory] = useState(null)
  const [address, setAddress] = useState('')
  const [point, setPoint] = useState(city ? { lat: city.lat, lng: city.lng } : { lat: 48.8566, lng: 2.3522 })
  // Origine du repère : aucune, adresse choisie dans la liste, ou déplacé à la main.
  const [pinSource, setPinSource] = useState('none')
  const placed = pinSource !== 'none'
  const [notice, setNotice] = useState(null)
  const [shopCity, setShopCity] = useState(city ? { ...city, existing: true, country: city.country_name, cc: city.country_code } : null)
  const [details, setDetails] = useState('')
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dup, setDup] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const missing = { name: !name.trim(), category: !category, address: address.trim().length < 3, city: !shopCity }
  const invalid = Object.values(missing).some(Boolean)

  const cityId = async () => {
    if (shopCity.existing) return shopCity.id
    return rpc('ensure_city', {
      p_source_ref: shopCity.ref,
      p_name: shopCity.name,
      p_country_code: shopCity.cc,
      p_country_name: shopCity.country,
      p_lat: shopCity.lat,
      p_lng: shopCity.lng,
      p_admin_area: shopCity.region || null,
    })
  }

  const send = async (force = false) => {
    setTried(true)
    setError(null)
    if (invalid) return
    if (isPreview()) {
      if (!force && /awa/i.test(name)) setDup({ id: 's1', name: 'Épicerie Chez Awa', address: '14 rue Myrha, Paris 18e', category: 'grocery', public_status: 'cashback_active', votes: 124, voted: false, cityId: 'paris' })
      else setDone({ kind: 'created', shopId: 's5', cityId: 'paris', name: name.trim() })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      // Le repère doit correspondre à l'adresse : sinon on le replace et on fait vérifier.
      let pt = point
      if (pinSource !== 'address') {
        const g = await geocode(`${address.trim()}, ${shopCity.name}`, shopCity, lang)
        if (g && pinSource === 'none') {
          pt = g
          setPoint(g)
          setPinSource('address')
        } else if (g && distKm(pt, g) > 0.5) {
          setPoint(g)
          setPinSource('address')
          setNotice(f.pinMoved)
          return
        } else if (!g && pinSource === 'none') {
          setError(f.pinRequired)
          return
        }
      }
      const cid = await cityId()
      const res = await rpc('propose_shop', {
        p_name: name.trim(),
        p_category: category,
        p_address: address.trim(),
        p_city_id: cid,
        p_lat: pt.lat,
        p_lng: pt.lng,
        p_details: details.trim() || null,
        p_force: force,
      })
      if (res.result === 'duplicate_candidate') setDup({ ...res.shop, cityId: cid })
      else setDone({ kind: 'created', shopId: res.shop_id, cityId: cid, name: name.trim() })
    } catch (err) {
      setError(t.errors[err.code] || t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  const support = async () => {
    setBusy(true)
    try {
      if (!dup.voted) await rpc('toggle_shop_vote', { p_shop_id: dup.id })
      setDone({ kind: 'supported', shopId: dup.id, cityId: dup.cityId, name: dup.name })
    } catch {
      setError(t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  const label = (text, extra) => (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="font-body text-[14px] font-semibold">{text}</span>
      {extra && <span className="font-body text-[13px] text-gris">{extra}</span>}
    </div>
  )
  const req = (k) => tried && missing[k] && <p className="mt-1.5 font-body text-[13px] text-[#b91c1c]">{f.required}</p>

  let body
  if (done) {
    body = (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dcf5e4] text-vert">
          {done.kind === 'created' ? <CircleCheck size={30} /> : <Heart size={28} variant="Bold" />}
        </span>
        <h2 className="font-display text-[26px] font-bold tracking-[-0.8px]">{done.kind === 'created' ? f.doneTitle : f.supportedTitle}</h2>
        <p className="max-w-[440px] font-body text-[15px] leading-[1.55] text-gris">{done.kind === 'created' ? f.doneText(done.name) : f.supportedText(done.name)}</p>
        <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => onDone(done)} className="flex h-12 cursor-pointer items-center justify-center rounded-full bg-noir px-6 font-body text-[15px] font-semibold text-white">
            {f.seeIt}
          </button>
          <button
            type="button"
            onClick={() => {
              setDone(null)
              setDup(null)
              setName('')
              setAddress('')
              setDetails('')
              setCategory(null)
              setPinSource('none')
              setNotice(null)
              setTried(false)
            }}
            className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-ligne px-6 font-body text-[15px] font-semibold"
          >
            {f.another}
          </button>
        </div>
      </div>
    )
  } else if (dup) {
    const I = CATEGORY_ICON[dup.category] || Store
    const c = STATUS_COLOR[dup.public_status] || '#111111'
    body = (
      <div className="flex flex-col gap-5">
        <div>
          {label(f.name)}
          <div className="flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] border-[#dc2626] bg-clair px-[18px] font-body text-[16px]">
            <Store size={18} className="text-gris" />
            {name}
          </div>
        </div>
        <div className="flex flex-col gap-3.5 rounded-[20px] border border-[#fdba74] bg-[#fff7ed] p-5">
          <p className="flex items-center gap-2.5 font-body text-[16px] font-semibold text-[#c2410c]">
            <AlertCircle size={19} />
            {f.dupTitle}
          </p>
          <div className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]" style={{ background: `${c}1f`, color: c }}>
              <I size={19} />
            </span>
            <span className="min-w-0">
              <span className="block font-body text-[15px] font-semibold">{dup.name}</span>
              <span className="block font-body text-[13px] text-gris">{[dup.address, t.status[dup.public_status], f.supports(dup.votes)].join(' · ')}</span>
            </span>
          </div>
          <p className="font-body text-[14px] leading-[1.55] text-[#9a3412]">{dup.blocked ? f.dupBlocked : f.dupText}</p>
        </div>
        {error && <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {dup.blocked ? (
            <button type="button" onClick={onClose} disabled={busy} className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-ligne px-5 font-body text-[15px] font-semibold">
              {f.cancel}
            </button>
          ) : (
            <button type="button" onClick={() => send(true)} disabled={busy} className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-ligne px-5 font-body text-[15px] font-semibold">
              {f.notSame}
            </button>
          )}
          <button type="button" onClick={support} disabled={busy} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-noir px-5 font-body text-[15px] font-semibold text-white">
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Heart size={16} />}
            {dup.voted ? f.alreadySupported : f.support}
          </button>
        </div>
      </div>
    )
  } else {
    body = (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(false)
        }}
        noValidate
        className="flex flex-col gap-5"
      >
        <div>
          {label(f.name)}
          <div className={`flex h-14 items-center gap-2.5 rounded-2xl border-[1.5px] px-[18px] ${tried && missing.name ? 'border-[#dc2626] bg-white' : 'border-transparent bg-clair focus-within:border-noir focus-within:bg-white'}`}>
            <Store size={18} className="shrink-0 text-gris" />
            <input autoFocus={desktop} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder={f.namePh} aria-label={f.name} className="min-w-0 flex-1 bg-transparent font-body text-[16px] outline-none placeholder:text-gris" />
          </div>
          {req('name')}
        </div>
        <div>
          {label(f.category)}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {CATS.map((c) => {
              const I = CATEGORY_ICON[c]
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 font-body text-[14px] font-medium ${category === c ? 'bg-noir text-white' : 'border border-ligne bg-white'}`}
                >
                  <I size={15} className="hidden sm:block" />
                  {t.cat[c]}
                </button>
              )
            })}
          </div>
          {req('category')}
        </div>
        <div>
          {label(f.address)}
          <AddressInput
            value={address}
            onChange={setAddress}
            onPick={(it) => {
              setAddress(it.label)
              setPoint({ lat: it.lat, lng: it.lng })
              setPinSource('address')
              setNotice(null)
            }}
            center={shopCity ? { lat: shopCity.lat, lng: shopCity.lng } : null}
            lang={lang}
            t={f}
            invalid={tried && missing.address}
          />
          {req('address')}
          <div className="mt-2.5">
            <PinMap
              point={point}
              category={category}
              t={f}
              onMove={(ll) => {
                setPoint({ lat: ll.lat, lng: ll.lng })
                setPinSource('manual')
              }}
            />
          </div>
          {notice ? (
            <p className="mt-2 rounded-xl bg-[#fff7ed] px-3 py-2 font-body text-[13px] text-[#9a3412]">{notice}</p>
          ) : (
            !placed && <p className="mt-1.5 font-body text-[13px] text-gris">{f.addressHint}</p>
          )}
        </div>
        <div>
          {label(f.city)}
          {/* Ville verrouillée : celle du questionnaire (on ne propose que dans sa ville). */}
          <div className="flex h-14 w-full items-center gap-2.5 rounded-2xl bg-clair px-[18px] font-body text-[16px]">
            <MapPin size={18} className="shrink-0 text-gris" />
            <span className="truncate">{[shopCity?.name, shopCity?.country].filter(Boolean).join(', ')}</span>
          </div>
          <p className="mt-1.5 font-body text-[13px] text-gris">{f.cityLocked}</p>
        </div>
        <div>
          {label(desktop ? f.details : f.detailsShort, f.optional)}
          <input value={details} maxLength={500} onChange={(e) => setDetails(e.target.value)} placeholder={f.detailsPh} aria-label={f.details} className="h-14 w-full rounded-2xl border-[1.5px] border-transparent bg-clair px-[18px] font-body text-[16px] outline-none placeholder:text-gris focus:border-noir focus:bg-white" />
        </div>
        {error && <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>}
        <div className="flex gap-2.5 sm:justify-end">
          <button type="button" onClick={onClose} className="hidden h-12 cursor-pointer items-center rounded-full border border-ligne px-6 font-body text-[15px] font-semibold sm:flex">
            {f.cancel}
          </button>
          <button type="submit" disabled={busy} className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-marque px-6 font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b] sm:flex-none">
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
            {f.submit}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/45 lg:items-center lg:p-6" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="propose-title"
        initial={desktop ? { opacity: 0, y: 16 } : { y: '100%' }}
        animate={desktop ? { opacity: 1, y: 0 } : { y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        className="km-scroll max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3 lg:max-w-[640px] lg:rounded-[32px] lg:px-9 lg:pb-9 lg:pt-9"
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ligne lg:hidden" />
        {!done && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="propose-title" className="font-display text-[24px] font-bold tracking-[-0.8px] lg:text-[32px]">
                {f.title}
              </h2>
              <p className="mt-1 font-body text-[14px] text-gris">{desktop ? f.sub : f.subShort}</p>
            </div>
            <button type="button" aria-label={t.close} onClick={onClose} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-clair">
              <X size={18} />
            </button>
          </div>
        )}
        {body}
      </motion.div>
    </div>
  )
}
