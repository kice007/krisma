import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Heart, LoaderCircle, Map as MapIcon, MapPin, X } from '../components/icons'
import { rpc } from '../lib/supabase'
import { MAPTEXT } from '../member/map/text'
import { fmtNumber } from '../lib/publicStats'

const STATUS = ['proposed', 'validated', 'contacted', 'partner', 'cashback_active']
const STATUS_COLOR = { proposed: '#9ca3af', validated: '#111111', contacted: '#0676f8', partner: '#fd8030', cashback_active: '#15803d' }
const PARIS = [48.8566, 2.3522]

// La vraie KRISMA Map, intégrée à la page liste d'attente : villes et commerces
// réels (get_map_cities / get_map_shops), fiche au clic, lien vers la carte
// complète. Chargée seulement à l'approche de la section (MapLibre est lourd).
export default function LiveMap({ lang, t }) {
  const m = MAPTEXT[lang]
  const box = useRef(null)
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const lib = useRef(null)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [cities, setCities] = useState(null)
  const [city, setCity] = useState(null)
  const [shops, setShops] = useState([])
  const [selected, setSelected] = useState(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(box.current)
    return () => io.disconnect()
  }, [])

  // Villes ayant des commerces (la plus fournie d'abord).
  useEffect(() => {
    if (!visible) return
    rpc('get_map_cities', { p_query: null })
      .then((list) => {
        setCities(list || [])
        setCity((list || [])[0] || null)
      })
      .catch(() => setCities([]))
  }, [visible])

  // Carte MapLibre.
  useEffect(() => {
    if (!visible) return
    let alive = true
    let mp
    import('../member/map/maplibre').then((mod) => {
      if (!alive || !el.current) return
      lib.current = mod
      mp = mod.createMap(el.current, { center: PARIS, zoom: 11, scrollZoom: true, cooperative: true, lang })
      mp.on('click', () => setSelected(null))
      layer.current = new mod.ShopLayer(mp, (s) => setSelected(s))
      map.current = mp
      setReady(true)
    })
    return () => {
      alive = false
      layer.current?.destroy()
      mp?.remove()
    }
  }, [visible, lang])

  // Commerces de la ville choisie + cadrage.
  useEffect(() => {
    if (!ready || !city) return
    let alive = true
    rpc('get_map_shops', { p_city_id: city.id })
      .then((list) => {
        if (!alive) return
        setShops(list || [])
        setSelected(null)
        const pts = (list || []).map((s) => [s.lat, s.lng])
        if (pts.length) lib.current.fitPoints(map.current, pts, { top: 100, left: 60, right: 60, bottom: 100 }, 14)
        else map.current.jumpTo({ center: [city.lng, city.lat], zoom: 12 })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [ready, city])

  useEffect(() => {
    layer.current?.set(shops, selected?.id || null)
  }, [shops, selected, ready])

  const color = selected ? STATUS_COLOR[selected.public_status] || '#111111' : null

  return (
    <div ref={box} className="relative mx-auto mt-12 aspect-[4/5] max-w-[1200px] overflow-hidden rounded-[28px] bg-[#e9eef2] sm:aspect-[1200/520]">
      <div ref={el} className="km-map absolute inset-0" style={{ position: 'absolute' }} role="region" aria-label={t.eyebrow} />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle size={22} className="animate-spin text-gris" />
        </div>
      )}

      {/* Ville */}
      <div className="absolute left-4 top-4 z-10 lg:left-6 lg:top-6">
        <button
          type="button"
          onClick={() => setMenu((o) => !o)}
          disabled={!cities?.length}
          aria-expanded={menu}
          className="flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white px-[18px] font-body text-[15px] font-semibold shadow-[0_12px_28px_rgba(17,17,17,0.12)] disabled:cursor-default"
        >
          <MapPin size={16} className="text-marque" />
          {city ? `${city.name} · ${m.shopsCount(city.shops)}` : cities && !cities.length ? m.noCity : m.chooseCity}
          {cities?.length > 1 && <ChevronDown size={16} className="text-gris" />}
        </button>
        {menu && cities?.length > 1 && (
          <ul className="mt-2 max-h-[260px] w-[280px] overflow-y-auto rounded-[20px] bg-white p-2 shadow-[0_16px_40px_rgba(17,17,17,0.14)]">
            {cities.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCity(c)
                    setMenu(false)
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left font-body text-[14px] hover:bg-clair ${city?.id === c.id ? 'font-semibold' : ''}`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-[13px] text-gris">{m.shopsCount(c.shops)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Badge « en direct » */}
      <span className="absolute right-4 top-4 z-10 flex h-9 items-center gap-1.5 rounded-full bg-white px-3 font-body text-[12px] font-semibold text-vert shadow-[0_12px_28px_rgba(17,17,17,0.12)] lg:right-6 lg:top-6">
        <span className="relative flex h-[7px] w-[7px]">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
          <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
        </span>
        {t.live}
      </span>

      {/* Légende */}
      <div className="absolute bottom-6 left-6 z-10 hidden h-12 items-center gap-4 rounded-full bg-white px-5 shadow-[0_12px_28px_rgba(17,17,17,0.12)] lg:flex">
        {STATUS.map((k) => (
          <span key={k} className="flex items-center gap-2 font-body text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[k] }} />
            {m.legend[k]}
          </span>
        ))}
      </div>

      {/* Aucun commerce encore */}
      {ready && cities && !cities.length && (
        <p className="absolute bottom-4 left-1/2 z-10 w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 rounded-2xl bg-white px-4 py-3 text-center font-body text-[14px] shadow-[0_12px_28px_rgba(17,17,17,0.12)] lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
          {m.noCity}
        </p>
      )}

      {/* Fiche du commerce choisi */}
      {selected && (
        <div className="absolute bottom-4 right-4 z-10 w-[320px] max-w-[calc(100%-32px)] rounded-[20px] bg-white p-[18px] shadow-[0_16px_40px_rgba(17,17,17,0.14)] lg:bottom-6 lg:right-6">
          <div className="flex items-start justify-between gap-2">
            <span className="font-display text-[16px] font-bold leading-tight">{selected.name}</span>
            <button type="button" onClick={() => setSelected(null)} aria-label={m.close} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
              <X size={16} />
            </button>
          </div>
          <span className="mt-2 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 font-body text-[11px] font-semibold" style={{ background: `${color}1a`, color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {selected.public_status === 'cashback_active' && selected.cashback_rate ? m.cashback(fmtNumber(Number(selected.cashback_rate), lang)) : m.status[selected.public_status]}
          </span>
          <p className="mt-2.5 font-body text-[13px] text-gris">{[m.cat[selected.category], selected.address].filter(Boolean).join(' · ')}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-body text-[13px]">
              <Heart size={14} variant="Bold" className="text-marque" />
              {m.waiting(Number(selected.votes))}
            </span>
            <Link
              to={`/carte?ville=${city?.id}&commerce=${selected.id}`}
              className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-noir px-3.5 font-body text-[13px] font-semibold text-white hover:bg-[#2b2b2b]"
            >
              <MapIcon size={14} />
              {t.open}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
