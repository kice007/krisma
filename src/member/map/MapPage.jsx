import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Crosshair, Heart, List, LoaderCircle, LocateFixed, MapPin, Minus, Navigation, Plus, Search, X } from 'lucide-react'
import { useLang } from '../../i18n'
import { rpc, supabase } from '../../lib/supabase'
import { PATHS, isPreview } from '../../waitlist/flow'
import { PREVIEW_CITIES, PREVIEW_SHOPS } from '../preview'
import { useMember } from '../Shell'
import L, { CATEGORY_ICON, STATUS_COLOR, TILE_ATTRIBUTION, TILE_URL, clusterIcon, shopIcon } from './leaflet'
import ProposeDialog from './ProposeDialog'
import { MAPTEXT } from './text'

const CATEGORIES = ['grocery', 'hair_salon', 'restaurant', 'butcher', 'bakery', 'other']
const STATUSES = ['proposed', 'validated', 'contacted', 'partner', 'cashback_active']
const FALLBACK = { lat: 48.8566, lng: 2.3522 }
const fmt = (n, lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(n ?? 0)
const norm = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const km = (a, b) => {
  const r = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
const useDesktop = () => {
  const q = '(min-width: 1024px)'
  const [desk, setDesk] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setDesk(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desk
}

function CatIcon({ category, status, size = 18 }) {
  const I = CATEGORY_ICON[category] || CATEGORY_ICON.other
  const c = STATUS_COLOR[status] || '#111111'
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]" style={{ background: `${c}1f`, color: c === '#9ca3af' ? '#6b6b6b' : c }}>
      <I size={size} />
    </span>
  )
}

// Liste des villes (desktop : menu sous le sélecteur ; mobile : feuille).
function CityPicker({ t, lang, cities, current, onPick, onClose, sheet }) {
  const [q, setQ] = useState('')
  const [locating, setLocating] = useState(false)
  const [err, setErr] = useState(null)
  const list = cities.filter((c) => norm(c.name).includes(norm(q)) || norm(c.country_name).includes(norm(q)))
  const near = () => {
    if (!navigator.geolocation) return setErr(t.locateError)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const best = [...cities].sort((a, b) => km(me, a) - km(me, b))[0]
        if (best) onPick(best, me)
        else setErr(t.locateError)
      },
      () => {
        setLocating(false)
        setErr(t.locateError)
      },
      { timeout: 8000 },
    )
  }
  return (
    <div className="flex max-h-full flex-col">
      {sheet && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.6px]">{t.chooseCity}</h2>
          <button type="button" aria-label={t.close} onClick={onClose} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
            <X size={20} />
          </button>
        </div>
      )}
      <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-clair px-4">
        <Search size={17} className="text-gris" />
        <input autoFocus={!sheet} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchCity} aria-label={t.searchCity} className="min-w-0 flex-1 bg-transparent font-body text-[15px] outline-none placeholder:text-gris" />
      </label>
      <button type="button" onClick={near} className="mt-2 flex h-11 cursor-pointer items-center gap-2.5 px-3 font-body text-[15px] font-semibold text-bleu">
        {locating ? <LoaderCircle size={17} className="animate-spin" /> : <Crosshair size={17} />}
        {locating ? t.locating : t.aroundMe}
      </button>
      {err && <p className="px-3 pb-2 font-body text-[13px] text-[#b91c1c]">{err}</p>}
      <p className="mt-1 border-t border-ligne px-1 pb-2 pt-3 font-body text-[13px] font-semibold text-gris">{t.topCities}</p>
      <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto">
        {list.map((c) => {
          const on = current?.id === c.id
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c)} className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${on ? 'bg-clair' : 'hover:bg-clair/70'}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[15px] font-semibold">{c.name}</span>
                  <span className="block truncate font-body text-[13px] text-gris">
                    {c.country_name} · {t.shopsCount(fmt(c.shops, lang))}
                  </span>
                </span>
                {c.partners > 0 && (
                  <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-[#dcf5e4] px-2.5 font-body text-[12px] font-medium text-vert">
                    <span className="h-1.5 w-1.5 rounded-full bg-vert" />
                    {t.partners(c.partners)}
                  </span>
                )}
                {on && <Check size={17} className="shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 flex items-start gap-2 border-t border-ligne px-1 pt-3 font-body text-[12px] leading-[1.5] text-gris">{t.cityNote}</p>
    </div>
  )
}

// Fiche d'un commerce (carte flottante sur desktop, feuille sur mobile).
function ShopCard({ shop, t, lang, canVote, member, homeCity, onHome, onVote, voting, onClose, onPropose, compact }) {
  const rate = shop.cashback_rate ? Number(shop.cashback_rate) : null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[22px] font-bold leading-tight tracking-[-0.6px]">{shop.name}</h3>
          <p className="mt-1 font-body text-[14px] text-gris">{[t.cat[shop.category], shop.address].filter(Boolean).join(' · ')}</p>
        </div>
        {onClose && (
          <button type="button" aria-label={t.close} onClick={onClose} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {rate ? (
          <span className="flex h-8 items-center gap-2 rounded-full bg-[#dcf5e4] px-3 font-body text-[13px] font-medium text-vert">
            <span className="h-2 w-2 rounded-full bg-vert" />
            {t.cashback(fmt(rate, lang))}
          </span>
        ) : (
          <span className="flex h-8 items-center gap-2 rounded-full bg-clair px-3 font-body text-[13px] font-medium">
            <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[shop.public_status] }} />
            {t.status[shop.public_status]}
          </span>
        )}
      </div>
      {rate && (
        <div className="flex gap-1.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= Math.round(rate) ? 'bg-vert' : 'bg-ligne'}`} />
          ))}
        </div>
      )}
      {shop.details && !compact && <p className="font-body text-[14px] leading-[1.5] text-noir/80">{shop.details}</p>}
      <p className="font-body text-[13px] text-gris">{[shop.proposer && t.proposedBy(shop.proposer), t.waiting(fmt(shop.votes, lang))].filter(Boolean).join(' · ')}</p>
      {canVote ? (
        <div className="mt-1 flex gap-2.5">
          <button
            type="button"
            onClick={onVote}
            disabled={voting}
            aria-pressed={shop.voted}
            className={`flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full font-body text-[15px] font-semibold ${shop.voted ? 'bg-noir text-white' : 'border border-noir bg-white text-noir'}`}
          >
            {voting ? <LoaderCircle size={16} className="animate-spin" /> : <Heart size={16} className={shop.voted ? 'fill-white' : ''} />}
            {shop.voted ? t.voted : t.vote}
          </button>
          {onPropose ? (
            <button type="button" onClick={onPropose} className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-marque font-body text-[15px] font-semibold text-white">
              <Plus size={16} />
              {t.proposeShort}
            </button>
          ) : (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-ligne font-body text-[15px] font-semibold hover:border-noir">
              <Navigation size={16} />
              {t.route}
            </a>
          )}
        </div>
      ) : member ? (
        <div className="mt-1 flex flex-col gap-2.5 rounded-2xl bg-clair p-3.5">
          <p className="font-body text-[13px] text-gris">{t.otherCity(homeCity?.name)}</p>
          {homeCity && (
            <button type="button" onClick={onHome} className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-noir bg-white font-body text-[14px] font-semibold text-noir">
              {t.goHome(homeCity.name)}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-2.5 rounded-2xl bg-clair p-3.5">
          <p className="font-body text-[13px] text-gris">{t.joinToVote}</p>
          <Link to={PATHS.home} className="flex h-11 items-center justify-center rounded-full bg-marque font-body text-[14px] font-semibold text-white">
            {t.join}
          </Link>
        </div>
      )}
    </div>
  )
}

function ShopList({ shops, t, lang, selectedId, onSelect, emptyText }) {
  if (!shops.length) return <p className="px-1 py-6 font-body text-[14px] leading-[1.5] text-gris">{emptyText}</p>
  return (
    <ul className="flex flex-col gap-2.5">
      {shops.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[20px] border p-3 text-left ${selectedId === s.id ? 'border-noir bg-clair' : 'border-ligne bg-white hover:border-noir/30'}`}
          >
            <CatIcon category={s.category} status={s.public_status} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[15px] font-semibold">{s.name}</span>
              <span className="block truncate font-body text-[13px] text-gris">
                {t.cat[s.category]} · {t.status[s.public_status]}
              </span>
            </span>
            <span className={`flex shrink-0 items-center gap-1 font-body text-[14px] font-semibold tabular-nums ${s.voted ? 'text-marque' : ''}`}>
              <Heart size={15} className={s.voted ? 'fill-marque' : ''} />
              {fmt(s.votes, lang)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Chips({ t, category, setCategory }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {['all', ...CATEGORIES].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCategory(c)}
          className={`h-9 shrink-0 cursor-pointer rounded-full px-3.5 font-body text-[14px] font-medium ${category === c ? 'bg-noir text-white' : 'border border-ligne bg-white'}`}
        >
          {c === 'all' ? t.all : t.catPlural[c]}
        </button>
      ))}
    </div>
  )
}

function Legend({ t }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 font-body text-[12px] text-noir/75">
      {STATUSES.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
          {t.legend[s]}
        </li>
      ))}
    </ul>
  )
}

function Sheet({ open, onClose, children, full }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[1100] bg-black/40 lg:hidden" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className={`fixed inset-x-0 bottom-0 z-[1101] flex flex-col rounded-t-[28px] bg-white px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 lg:hidden ${full ? 'top-16' : 'max-h-[80vh]'}`}
          >
            <span className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-ligne" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// W12 / M14 — KRISMA Map : commerces d'une ville, filtres, fiche et vote.
export default function MapPage() {
  const { lang } = useLang()
  const t = MAPTEXT[lang]
  const m = useMember()
  const isMember = m.d?.status === 'verified'
  const myCityId = m.d?.city?.id
  const desktop = useDesktop()
  const [params, setParams] = useSearchParams()

  const [cities, setCities] = useState(null)
  const [city, setCity] = useState(null)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(params.get('commerce'))
  const [cityOpen, setCityOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [propose, setPropose] = useState(params.get('proposer') === '1')
  const [voting, setVoting] = useState(false)
  const [pos, setPos] = useState(null)

  const mapEl = useRef(null)
  const map = useRef(null)
  const cluster = useRef(null)
  const markers = useRef(new Map())
  const focused = useRef(null)

  // Carte Leaflet (une seule instance).
  useEffect(() => {
    const mp = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([FALLBACK.lat, FALLBACK.lng], 12)
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(mp)
    mp.attributionControl.setPrefix(false)
    cluster.current = L.markerClusterGroup({ iconCreateFunction: clusterIcon, showCoverageOnHover: false, maxClusterRadius: 48, spiderfyOnMaxZoom: true })
    mp.addLayer(cluster.current)
    mp.on('click', () => setSelectedId(null))
    map.current = mp
    return () => mp.remove()
  }, [])

  // Villes : celles qui ont des commerces, plus la ville du membre.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = isPreview() ? PREVIEW_CITIES : (await rpc('get_map_cities', { p_query: null }).catch(() => [])) || []
      const wanted = params.get('ville') || m.d?.city?.id
      let extra = null
      if (wanted && !list.some((c) => c.id === wanted)) {
        const { data } = await supabase.from('cities').select('id, name, country_code, country_name, lat, lng').eq('id', wanted).maybeSingle()
        if (data) extra = { ...data, shops: 0, partners: 0 }
      }
      if (!alive) return
      const all = extra ? [...list, extra] : list
      setCities(all)
      setCity(all.find((c) => c.id === wanted) || all[0] || null)
    })()
    return () => {
      alive = false
    }
    // Chargement unique, une fois le membre connu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.loading])

  const loadShops = useCallback(async (c) => {
    if (!c) return setShops([])
    setLoading(true)
    const list = isPreview() ? (c.id === 'paris' ? PREVIEW_SHOPS : []) : (await rpc('get_map_shops', { p_city_id: c.id }).catch(() => [])) || []
    setShops(list)
    setLoading(false)
    return list
  }, [])

  // Changement de ville : commerces + cadrage.
  useEffect(() => {
    if (!city) return
    setParams(
      (p) => {
        p.set('ville', city.id)
        p.delete('proposer')
        return p
      },
      { replace: true },
    )
    loadShops(city).then((list) => {
      const mp = map.current
      if (!mp) return
      // Lien partagé vers un commerce : on centre directement dessus.
      const wanted = (list || []).find((s) => s.id === selectedId)
      if (wanted) return select(wanted)
      const pts = (list || []).map((s) => [s.lat, s.lng])
      if (pts.length > 1) mp.fitBounds(pts, desktop ? { paddingTopLeft: [480, 130], paddingBottomRight: [80, 80], maxZoom: 15 } : { paddingTopLeft: [40, 100], paddingBottomRight: [40, 220], maxZoom: 15 })
      else if (pts.length === 1) mp.setView(pts[0], 15)
      else mp.setView([city.lat, city.lng], 13)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.id])

  const filtered = useMemo(
    () =>
      shops
        .filter((s) => (category === 'all' || s.category === category) && (!query || norm(s.name).includes(norm(query))))
        .sort((a, b) => b.votes - a.votes),
    [shops, category, query],
  )
  const selected = shops.find((s) => s.id === selectedId) || null

  // Repères.
  useEffect(() => {
    const cl = cluster.current
    if (!cl) return
    cl.clearLayers()
    markers.current.clear()
    focused.current?.remove()
    focused.current = null
    filtered.forEach((s) => {
      const on = s.id === selectedId
      const mk = L.marker([s.lat, s.lng], { icon: shopIcon(s, on), zIndexOffset: on ? 1000 : 0, title: s.name, keyboard: true })
      mk.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        select(s, false)
      })
      // Le commerce sélectionné reste toujours visible, hors des regroupements.
      if (on) focused.current = mk.addTo(map.current)
      else cl.addLayer(mk)
      markers.current.set(s.id, mk)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, selectedId])

  // Position de la fiche flottante (desktop) à côté du repère.
  useEffect(() => {
    const mp = map.current
    if (!mp || !selected || !desktop) return setPos(null)
    const upd = () => setPos(mp.latLngToContainerPoint([selected.lat, selected.lng]))
    upd()
    mp.on('move zoom', upd)
    return () => mp.off('move zoom', upd)
  }, [selected, desktop])

  useEffect(() => {
    setParams(
      (p) => {
        if (selectedId) p.set('commerce', selectedId)
        else p.delete('commerce')
        return p
      },
      { replace: true },
    )
  }, [selectedId, setParams])

  function select(s, fly = true) {
    setSelectedId(s.id)
    setListOpen(false)
    const mp = map.current
    if (!mp) return
    const z = Math.max(mp.getZoom(), 15)
    const pt = mp.project([s.lat, s.lng], z)
    // Desktop : le repère à droite du panneau ; mobile : au-dessus de la feuille.
    const target = desktop ? pt.add([-160, 40]) : pt.add([0, 120])
    if (fly) mp.flyTo(mp.unproject(target, z), z, { duration: 0.6 })
    else mp.panTo(mp.unproject(target, z), { animate: true })
  }

  const pickCity = (c, me) => {
    setCityOpen(false)
    setSelectedId(null)
    setQuery('')
    if (city?.id === c.id && me) map.current?.setView([me.lat, me.lng], 15)
    setCity(c)
  }

  const vote = async () => {
    if (!selected) return
    setVoting(true)
    try {
      const res = isPreview() ? { voted: !selected.voted, votes: selected.votes + (selected.voted ? -1 : 1) } : await rpc('toggle_shop_vote', { p_shop_id: selected.id })
      setShops((list) => list.map((s) => (s.id === selected.id ? { ...s, voted: res.voted, votes: Number(res.votes) } : s)))
    } finally {
      setVoting(false)
    }
  }

  // On ne vote et ne propose que dans sa ville (règle de la migration 14).
  const homeCity = cities?.find((c) => c.id === myCityId) || null
  const inMyCity = isMember && !!city && city.id === myCityId
  const goHome = () => homeCity && pickCity(homeCity)
  const openPropose = () => (isMember ? setPropose(true) : setListOpen(false))
  const afterProposal = async ({ shopId, cityId }) => {
    setPropose(false)
    m.refresh?.()
    const target = cities?.find((c) => c.id === cityId)
    if (cityId && cityId !== city?.id) {
      const list = (await rpc('get_map_cities', { p_query: null }).catch(() => [])) || []
      setCities(list)
      const next = list.find((c) => c.id === cityId) || target
      if (next) {
        setCity(next)
        setSelectedId(shopId)
      }
      return
    }
    const list = await loadShops(city)
    const s = list?.find((x) => x.id === shopId)
    if (s) select(s)
  }

  const zoom = (d) => map.current?.setZoom(map.current.getZoom() + d)
  const locate = () =>
    navigator.geolocation?.getCurrentPosition((p) => map.current?.setView([p.coords.latitude, p.coords.longitude], 15), () => {}, { timeout: 8000 })

  const count = shops.length
  const emptyText = !city ? t.noCity : count ? t.noMatch : t.empty
  const proposeBtn = isMember ? (
    <button type="button" onClick={openPropose} className="flex h-14 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-marque font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b]">
      <Plus size={17} />
      {t.propose}
    </button>
  ) : (
    <Link to={PATHS.home} className="flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-marque font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b]">
      {t.join}
    </Link>
  )

  return (
    <div className="fixed inset-0 z-30">
      <div ref={mapEl} className="km-map absolute inset-0 z-0" role="region" aria-label={t.title} />

      {/* Contrôles de la carte */}
      <div className="absolute bottom-28 right-4 z-[500] flex flex-col items-center gap-3 lg:bottom-16 lg:right-9">
        <button type="button" onClick={locate} aria-label={t.locateMe} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_6px_20px_rgba(17,17,17,0.12)]">
          <LocateFixed size={19} />
        </button>
        <div className="hidden flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(17,17,17,0.12)] lg:flex">
          <button type="button" onClick={() => zoom(1)} aria-label={t.zoomIn} className="flex h-11 w-11 cursor-pointer items-center justify-center border-b border-ligne">
            <Plus size={18} />
          </button>
          <button type="button" onClick={() => zoom(-1)} aria-label={t.zoomOut} className="flex h-11 w-11 cursor-pointer items-center justify-center">
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Desktop : panneau latéral */}
      <aside className="absolute bottom-10 left-10 top-[124px] z-[600] hidden w-[400px] flex-col rounded-[28px] bg-white p-6 shadow-[0_16px_50px_rgba(17,17,17,0.12)] lg:flex">
        <h1 className="font-display text-[30px] font-bold tracking-[-1px]">{t.title}</h1>
        <div className="relative mt-4">
          <button type="button" onClick={() => setCityOpen((o) => !o)} aria-expanded={cityOpen} className="flex h-[52px] w-full cursor-pointer items-center gap-3 rounded-2xl bg-noir px-4 text-left text-white">
            <MapPin size={18} className="shrink-0 text-marque" />
            <span className="min-w-0 flex-1">
              <span className="block font-body text-[11px] text-white/60">{t.city}</span>
              <span className="block truncate font-body text-[15px] font-semibold">{city ? `${city.name}, ${city.country_name}` : '—'}</span>
            </span>
            <ChevronDown size={18} className={`transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {cityOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="absolute left-[calc(100%+40px)] top-[-60px] z-10 flex max-h-[560px] w-[340px] flex-col rounded-[24px] bg-white p-3 shadow-[0_16px_50px_rgba(17,17,17,0.16)]"
              >
                <CityPicker t={t} lang={lang} cities={cities || []} current={city} onPick={pickCity} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <label className="mt-3 flex h-12 items-center gap-2.5 rounded-2xl bg-clair px-4">
          <Search size={17} className="text-gris" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchShop} aria-label={t.searchShop} className="min-w-0 flex-1 bg-transparent font-body text-[15px] outline-none placeholder:text-gris" />
        </label>
        <div className="mt-3">
          <Chips t={t} category={category} setCategory={setCategory} />
        </div>
        <div className="mt-3">
          <Legend t={t} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ligne pt-4 font-body text-[14px]">
          <span className="font-semibold">{city ? t.listTitle(city.name, count) : t.title}</span>
          <span className="text-gris">{t.mostWanted}</span>
        </div>
        <div className="-mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1 pb-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="animate-spin text-gris" />
            </div>
          ) : (
            <ShopList shops={filtered} t={t} lang={lang} selectedId={selectedId} onSelect={select} emptyText={emptyText} />
          )}
        </div>
        <div className="pt-3">{proposeBtn}</div>
      </aside>

      {/* Desktop : fiche flottante */}
      {desktop && selected && pos && (
        <div
          className="absolute z-[650] w-[340px] rounded-[24px] bg-white p-6 shadow-[0_20px_60px_rgba(17,17,17,0.18)]"
          style={{ left: Math.min(Math.max(pos.x + 36, 470), window.innerWidth - 380), top: Math.min(Math.max(pos.y - 90, 120), window.innerHeight - 380) }}
        >
          <ShopCard shop={selected} t={t} lang={lang} canVote={inMyCity} member={isMember} homeCity={homeCity} onHome={goHome} onVote={vote} voting={voting} onClose={() => setSelectedId(null)} />
        </div>
      )}

      {/* Mobile : barre de ville */}
      <div className="absolute inset-x-4 top-4 z-[600] flex gap-2 lg:hidden">
        <Link to="/" aria-label="KRISMA, retour à l'accueil du site" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(17,17,17,0.12)]">
          <img src="/img/landing/k-ink.png" alt="" className="h-[22px] w-[17px] object-contain" />
        </Link>
        <button type="button" onClick={() => setCityOpen(true)} className="flex h-[52px] min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-full bg-white px-4 shadow-[0_8px_24px_rgba(17,17,17,0.12)]">
          <MapPin size={18} className="shrink-0 text-marque" />
          <span className="min-w-0 flex-1 truncate text-left font-body text-[15px] font-medium">{city ? `${city.name} · ${t.shopsCount(fmt(count, lang))}` : t.chooseCity}</span>
          <ChevronDown size={17} className="shrink-0" />
        </button>
        <button type="button" onClick={() => setListOpen(true)} aria-label={t.searchShop} className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(17,17,17,0.12)]">
          <Search size={19} />
        </button>
      </div>

      {/* Mobile : fiche du commerce ou résumé */}
      <div className={`absolute inset-x-0 z-[600] lg:hidden ${isMember ? 'bottom-[76px]' : 'bottom-0'}`}>
        <div className="rounded-t-[28px] bg-white px-5 pb-5 pt-3 shadow-[0_-12px_40px_rgba(17,17,17,0.12)]">
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-ligne" />
          {selected ? (
            <ShopCard shop={selected} t={t} lang={lang} canVote={inMyCity} member={isMember} homeCity={homeCity} onHome={goHome} onVote={vote} voting={voting} onClose={() => setSelectedId(null)} onPropose={isMember ? openPropose : null} compact />
          ) : (
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setListOpen(true)} className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-ligne font-body text-[15px] font-semibold">
                <List size={17} />
                {t.list} · {fmt(count, lang)}
              </button>
              <div className="flex-1 [&>*]:h-12">{proposeBtn}</div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={cityOpen && !desktop} onClose={() => setCityOpen(false)} full>
        <CityPicker t={t} lang={lang} cities={cities || []} current={city} onPick={pickCity} onClose={() => setCityOpen(false)} sheet />
      </Sheet>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} full>
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.6px]">{city ? t.listTitle(city.name, count) : t.title}</h2>
          <button type="button" aria-label={t.close} onClick={() => setListOpen(false)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
            <X size={20} />
          </button>
        </div>
        <label className="flex h-12 shrink-0 items-center gap-2.5 rounded-2xl bg-clair px-4">
          <Search size={17} className="text-gris" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchShop} aria-label={t.searchShop} className="min-w-0 flex-1 bg-transparent font-body text-[16px] outline-none placeholder:text-gris" />
        </label>
        <div className="mt-3 shrink-0">
          <Chips t={t} category={category} setCategory={setCategory} />
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <ShopList shops={filtered} t={t} lang={lang} selectedId={selectedId} onSelect={select} emptyText={emptyText} />
        </div>
      </Sheet>

      {propose && isMember && createPortal(<ProposeDialog t={t} lang={lang} city={homeCity || city} desktop={desktop} onClose={() => setPropose(false)} onDone={afterProposal} />, document.body)}
    </div>
  )
}
