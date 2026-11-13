import { useEffect, useRef, useState } from 'react'
import { Check, CircleCheck, Copy, Search, TriangleAlert, X, XCircle } from '../components/icons'
import { arpc as rpc } from './api'
import { CATEGORY_ICON, STATUS_COLOR, createMap, maplibregl, pinElement } from '../member/map/maplibre'
import { useAdmin } from './Shell'
import { Badge, Button, CATEGORY, Card, Confirm, Empty, PageHead, SHOP_STATUS, Spinner, ago, date, errText, fmt } from './ui'

const PUBLIC = (s) => (s.status === 'partner' || s.status === 'cashback_active') && !s.partner_public ? 'validated' : s.status
const km = (a, b) => {
  const r = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

function MiniMap({ shop }) {
  const el = useRef(null)
  useEffect(() => {
    const m = createMap(el.current, { center: [shop.lat, shop.lng], zoom: 16, scrollZoom: false })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    new maplibregl.Marker({ element: pinElement({ ...shop, public_status: 'partner' }, true), anchor: 'bottom' }).setLngLat([shop.lng, shop.lat]).addTo(m)
    return () => m.remove()
  }, [shop])
  return <div ref={el} className="km-map h-[220px] overflow-hidden rounded-2xl" />
}

// Vérifications automatiques : adresse géolocalisable, doublon probable, ville du membre.
function Checks({ shop }) {
  const [geo, setGeo] = useState('loading')
  useEffect(() => {
    let alive = true
    setGeo('loading')
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(`${shop.address}, ${shop.city}`)}&limit=1&lat=${shop.lat}&lon=${shop.lng}`)
      .then((r) => r.json())
      .then((j) => {
        const f = j.features?.[0]
        if (!alive) return
        if (!f) return setGeo({ ok: false })
        const d = km({ lat: shop.lat, lng: shop.lng }, { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] })
        setGeo({ ok: true, d: Math.round(d * 1000) })
      })
      .catch(() => alive && setGeo('error'))
    return () => {
      alive = false
    }
  }, [shop])
  const row = (state, text) => (
    <li key={text} className="flex items-start gap-2.5 font-body text-[14px]">
      {state === 'ok' ? <CircleCheck size={17} className="mt-px shrink-0 text-vert" /> : state === 'bad' ? <XCircle size={17} className="mt-px shrink-0 text-[#b91c1c]" /> : <TriangleAlert size={17} className="mt-px shrink-0 text-[#c2410c]" />}
      <span>{text}</span>
    </li>
  )
  const items = []
  if (geo === 'loading') items.push(row('warn', 'Recherche de l’adresse sur OpenStreetMap…'))
  else if (geo === 'error') items.push(row('warn', 'Recherche d’adresse indisponible : vérifier manuellement'))
  else if (!geo.ok) items.push(row('bad', 'Adresse introuvable sur OpenStreetMap'))
  else if (geo.d <= 300) items.push(row('ok', `Adresse trouvée (OpenStreetMap), repère à ${fmt(geo.d)} m`))
  else items.push(row('warn', `Adresse trouvée, mais le repère est à ${fmt(geo.d)} m de l’adresse`))
  items.push(shop.dup_id ? row('bad', `Doublon probable : « ${shop.dup_name} » (${shop.dup_address}) à ${fmt(shop.dup_distance)} m`) : row('ok', 'Aucun commerce proche avec un nom similaire'))
  items.push(shop.proposer_city === shop.city ? row('ok', 'Ville identique à celle du membre') : row('warn', `Ville du membre : ${shop.proposer_city || 'inconnue'}`))
  items.push(row('warn', 'Existence à confirmer (fiche Google, site, réseaux sociaux)'))
  return <ul className="flex flex-col gap-2.5">{items}</ul>
}

function Detail({ shop, canAdmin, onDone }) {
  const [action, setAction] = useState(null)
  const [status, setStatus] = useState(shop.status)
  const [isPublic, setIsPublic] = useState(shop.partner_public)
  const [rate, setRate] = useState(shop.cashback_rate ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    setStatus(shop.status)
    setIsPublic(shop.partner_public)
    setRate(shop.cashback_rate ?? '')
    setError(null)
  }, [shop])
  const [label, tone] = SHOP_STATUS[shop.status]
  const google = `https://www.google.com/search?q=${encodeURIComponent(`${shop.name} ${shop.address}`)}`
  const review = (decision, extra = {}) => rpc('admin_review_shop', { p_shop_id: shop.id, p_decision: decision, ...extra })
  const saveStatus = async () => {
    setSaving(true)
    setError(null)
    try {
      await rpc('admin_set_shop_status', { p_shop_id: shop.id, p_status: status, p_partner_public: isPublic, p_cashback_rate: status === 'cashback_active' && rate !== '' ? Number(rate) : null })
      onDone()
    } catch (e) {
      setError(errText(e))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Card className="lg:sticky lg:top-7">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[24px] font-bold leading-tight tracking-[-0.6px]">{shop.name}</h2>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <p className="mt-1 font-body text-[14px] text-gris">
        Proposé par {shop.proposer || 'un compte supprimé'}
        {shop.proposer_city ? ` (${shop.proposer_city})` : ''} le {date(shop.created_at, true)} · {fmt(shop.votes)} soutien{shop.votes > 1 ? 's' : ''}
      </p>
      <div className="mt-4">
        <MiniMap shop={shop} />
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {[
          ['Catégorie', CATEGORY[shop.category]],
          ['Adresse', shop.address],
          ['Ville', `${shop.city}, ${shop.country_name}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-clair p-3.5">
            <p className="font-body text-[12px] text-gris">{k}</p>
            <p className="mt-0.5 font-body text-[14px] font-semibold">{v}</p>
          </div>
        ))}
      </div>
      {shop.details && <p className="mt-3 rounded-2xl bg-clair p-3.5 font-body text-[14px]">« {shop.details} »</p>}
      {shop.status === 'duplicate' && <p className="mt-3 font-body text-[14px] text-gris">Doublon de « {shop.duplicate_of} ».</p>}
      {shop.review_note && <p className="mt-3 font-body text-[14px] text-gris">Note : {shop.review_note}</p>}
      {shop.status === 'proposed' && (
        <>
          <h3 className="mb-2.5 mt-5 font-body text-[15px] font-semibold">Vérifications automatiques</h3>
          <Checks shop={shop} />
          <a href={google} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-body text-[13px] font-semibold underline underline-offset-2">
            <Search size={14} />
            Rechercher sur Google
          </a>
          <div className="mt-5 flex flex-wrap justify-end gap-2.5">
            <Button icon={X} onClick={() => setAction({ title: 'Refuser ce commerce', text: 'Il disparaît de la carte et les 20 points en attente sont annulés.', reason: 'Motif du refus', confirm: 'Refuser', run: (r) => review('reject', { p_note: r }) })}>
              Refuser
            </Button>
            <Button
              icon={Copy}
              disabled={!shop.dup_id}
              title={shop.dup_id ? '' : 'Aucune fiche d’origine détectée'}
              onClick={() => setAction({ title: 'Marquer comme doublon', text: `Cette fiche sera fusionnée avec « ${shop.dup_name} » : ses soutiens y sont reportés et ses 20 points annulés.`, confirm: 'Marquer comme doublon', run: () => review('duplicate', { p_duplicate_of: shop.dup_id }) })}
            >
              Doublon
            </Button>
            <Button tone="dark" icon={Check} onClick={() => setAction({ title: 'Valider ce commerce', text: `${shop.proposer ? `${shop.proposer} reçoit 20 points.` : ''} Le commerce passe en « Validé » sur la carte.`, confirm: 'Valider', run: () => review('validate') })}>
              Valider{shop.proposer ? ` (+20 pts à ${shop.proposer})` : ''}
            </Button>
          </div>
        </>
      )}
      {['validated', 'contacted', 'partner', 'cashback_active'].includes(shop.status) && canAdmin && (
        <div className="mt-5 flex flex-col gap-3 border-t border-ligne pt-5">
          <h3 className="font-body text-[15px] font-semibold">Suivi du partenariat</h3>
          <div className="flex flex-wrap gap-2">
            {['validated', 'contacted', 'partner', 'cashback_active'].map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} className={`h-10 cursor-pointer rounded-full px-4 font-body text-[13px] font-semibold ${status === s ? 'bg-noir text-white' : 'border border-ligne'}`}>
                {SHOP_STATUS[s][0]}
              </button>
            ))}
          </div>
          {(status === 'partner' || status === 'cashback_active') && (
            <label className="flex items-center gap-2.5 font-body text-[14px]">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-[#111]" />
              Le commerçant accepte que le partenariat soit affiché publiquement
            </label>
          )}
          {status === 'cashback_active' && (
            <label className="flex items-center gap-2.5 font-body text-[14px]">
              Taux de cashback
              <input type="number" min="0" max="5" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} className="h-10 w-20 rounded-xl border border-ligne px-3" />%
            </label>
          )}
          {error && <p className="font-body text-[13px] text-[#b91c1c]">{error}</p>}
          <Button tone="dark" busy={saving} className="self-start" onClick={saveStatus}>
            Enregistrer
          </Button>
        </div>
      )}
      {action && (
        <Confirm
          {...action}
          onCancel={() => setAction(null)}
          onConfirm={async (r) => {
            await action.run(r)
            setAction(null)
            onDone()
          }}
        />
      )}
    </Card>
  )
}

// A3 / AM4 / AM5 — Commerces : vérification, doublons, suivi des partenariats.
export default function Shops() {
  const { canAdmin, refreshCounts } = useAdmin()
  const [tab, setTab] = useState('review')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState(null)
  const [counts, setCounts] = useState(null)
  const [sel, setSel] = useState(null)
  const [error, setError] = useState(null)

  const load = async (keep) => {
    setError(null)
    try {
      const [list, c] = await Promise.all([rpc('admin_list_shops', { p_tab: tab, p_search: search.trim() || null, p_limit: 100, p_offset: 0 }), rpc('admin_shop_counts')])
      setRows(list)
      setCounts(c)
      const desktop = window.matchMedia('(min-width: 1024px)').matches
      setSel((cur) => (keep && cur && list.find((s) => s.id === cur.id)) || (desktop ? list[0] : null) || null)
      refreshCounts()
    } catch (e) {
      setError(errText(e))
    }
  }
  useEffect(() => {
    setRows(null)
    const t = setTimeout(() => load(false), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search])

  const tabs = [
    ['review', `À vérifier${counts ? ` · ${counts.review}` : ''}`],
    ['all', 'Tous'],
    ['duplicates', `Doublons${counts ? ` · ${counts.duplicates}` : ''}`],
  ]

  return (
    <div>
      <PageHead title="Commerces" sub={counts ? `${fmt(counts.all)} propositions · ${fmt(counts.review)} en attente de vérification` : ' '}>
        <div className="flex rounded-full bg-white p-1">
          {tabs.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`h-10 cursor-pointer rounded-full px-4 font-body text-[14px] font-semibold ${tab === k ? 'bg-noir text-white' : 'text-noir/70'}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHead>
      {error && <p className="mb-3 font-body text-[14px] text-[#b91c1c]">{error}</p>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,520px)_1fr]">
        <Card className={`!p-3 ${sel ? 'hidden lg:block' : ''}`}>
          <label className="mb-2 flex h-11 items-center gap-2.5 rounded-full bg-clair px-4">
            <Search size={16} className="text-gris" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, adresse…" aria-label="Rechercher un commerce" className="min-w-0 flex-1 bg-transparent font-body text-[14px] outline-none" />
          </label>
          {!rows ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <Empty>{tab === 'review' ? 'Aucun commerce à vérifier. Tout est à jour !' : 'Aucun commerce.'}</Empty>
          ) : (
            <ul className="flex flex-col gap-1">
              {rows.map((s) => {
                const I = CATEGORY_ICON[s.category]
                const flag = s.status === 'proposed' && s.dup_id ? ['Doublon probable', 'orange'] : SHOP_STATUS[s.status]
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSel(s)} className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border p-3 text-left ${sel?.id === s.id ? 'border-noir' : 'border-transparent hover:bg-clair'}`}>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clair" style={{ color: STATUS_COLOR[PUBLIC(s)] === '#9ca3af' ? '#111' : STATUS_COLOR[PUBLIC(s)] }}>
                        <I size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body text-[15px] font-semibold">{s.name}</span>
                        <span className="block truncate font-body text-[12px] text-gris">
                          {CATEGORY[s.category]} · {s.city} · par {s.proposer || '—'} · {ago(s.created_at)}
                        </span>
                      </span>
                      <Badge tone={flag[1]}>{flag[0]}</Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        {sel && (
          <div>
            <button type="button" onClick={() => setSel(null)} className="mb-3 cursor-pointer font-body text-[14px] font-medium text-gris lg:hidden">
              Retour à la liste
            </button>
            <Detail shop={sel} canAdmin={canAdmin} onDone={() => load(true)} />
          </div>
        )}
      </div>
    </div>
  )
}
