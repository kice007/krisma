import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, LoaderCircle } from '../components/icons'
import { rpc } from '../lib/supabase'
import { PATHS, isPreview } from '../waitlist/flow'
import { PREVIEW_AROUND, PREVIEW_BOARD } from './preview'
import { fmt, initials, useMT, useMember } from './Shell'

// Classement affiché : 20 membres d'abord, puis jusqu'à 50 avec « Afficher plus ».
const FIRST = 20
const MAX = 50

const MEDALS = ['#fd8030', '#6b6b6b', '#a16207']
const TOP = 2000

// Bandeau sombre (style des e-mails) : ma position et le top 3.
function Banner({ rows, me, d, t, lang }) {
  const b = t.board
  const top3 = rows.slice(0, 3)
  const rank = me ? Number(me.rank) : null
  const threshold = Number(d?.top?.threshold || 0)
  const members = Number(d?.top?.members || 0)
  const inside = rank != null && rank <= TOP
  const ratio = rank == null ? 0 : inside ? Math.max(0.12, members > TOP ? 1 - rank / TOP : 1 - rank / Math.max(members, 1) * 0.5) : Math.min(1, Number(me.points) / Math.max(threshold, 1))
  return (
    <section className="relative grid gap-6 overflow-hidden rounded-[28px] bg-noir p-6 text-white lg:grid-cols-[1fr_440px] lg:items-center lg:gap-12 lg:px-10 lg:py-9">
      <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-90" />
      <div className="relative flex flex-col gap-5">
        {me ? (
          <>
            <p className="font-body text-[14px] text-white/70">{b.position}</p>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
              <span className="font-display text-[56px] font-bold leading-none tracking-[-2px] lg:text-[88px] lg:tracking-[-3.5px]">#{fmt(me.rank, lang)}</span>
              <span className="pb-1 lg:pb-2.5">
                <span className="block font-display text-[20px] font-bold">
                  {fmt(me.points, lang)} {b.points}
                </span>
                <span className="block font-body text-[14px] text-white/70">{[me.pseudo, me.city].filter(Boolean).join(' · ')}</span>
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="relative h-2 overflow-hidden rounded-full bg-white/15">
                <span className="absolute inset-y-0 left-0 rounded-full bg-marque" style={{ width: `${Math.round(ratio * 100)}%` }} />
              </span>
              <span className="flex flex-wrap justify-between gap-x-4 gap-y-1 font-body text-[14px]">
                <span className="font-medium">{inside ? b.inside(fmt(TOP - rank, lang)) : b.missing(fmt(Math.max(threshold - Number(me.points) + 1, 1), lang))}</span>
                {threshold > 0 && <span className="text-white/70">{b.threshold(fmt(threshold, lang))}</span>}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="font-body text-[14px] text-white/70">{b.topLabel}</p>
            <p className="font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] lg:text-[44px]">{b.topTitle}</p>
            <p className="max-w-[460px] font-body text-[15px] leading-[1.55] text-white/75">{b.topText}</p>
          </>
        )}
      </div>
      <ol className="relative rounded-[20px] bg-white px-5 py-2 text-noir">
        {top3.map((r, i) => (
          <li key={r.rank} className={`flex items-center gap-3.5 py-3.5 ${i ? 'border-t border-ligne' : ''}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-bold text-white" style={{ background: MEDALS[i] }}>
              {fmt(r.rank, lang)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[15px] font-semibold">
                {r.pseudo}
              </span>
              <span className="block truncate font-body text-[13px] text-gris">{r.city || '—'}</span>
            </span>
            <span className="shrink-0 font-display text-[15px] font-bold tabular-nums">
              {fmt(r.points, lang)} {t.pts}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Row({ r, t, lang, last }) {
  return (
    <li className={`-mx-5 grid grid-cols-[64px_1fr_auto] items-center gap-3 px-5 py-3.5 lg:-mx-6 lg:grid-cols-[130px_1fr_180px_130px_130px_120px] lg:gap-0 lg:px-6 lg:py-4 ${last ? '' : 'border-b border-ligne'} ${r.is_me ? 'bg-[#fff3ea]' : ''}`}>
      <span className={`font-body text-[15px] font-bold tabular-nums ${r.is_me ? 'text-[#c2410c]' : ''}`}>#{fmt(r.rank, lang)}</span>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full font-body text-[12px] font-bold lg:flex ${r.is_me ? 'bg-marque text-white' : 'bg-clair text-noir'}`}>{initials(r.pseudo).slice(0, 1)}</span>
        <span className="min-w-0">
          <span className={`flex items-center gap-2 truncate font-body text-[15px] ${r.is_me ? 'font-bold' : 'font-medium'}`}>
            <span className="truncate">{r.pseudo}</span>
          </span>
          <span className="block truncate font-body text-[12px] text-gris lg:hidden">{r.city}</span>
        </span>
      </span>
      <span className="hidden truncate font-body text-[15px] text-gris lg:block">{r.city || '—'}</span>
      <span className="hidden font-body text-[15px] tabular-nums lg:block">{fmt(r.referrals, lang)}</span>
      <span className="hidden font-body text-[15px] tabular-nums lg:block">{fmt(r.shops, lang)}</span>
      <span className="text-right font-body text-[15px] font-bold tabular-nums">
        {fmt(r.points, lang)}
        <span className="hidden lg:inline"> {t.pts}</span>
      </span>
    </li>
  )
}

// W11 / M13 — Classement public (général ou ville du membre).
export default function Leaderboard() {
  const { d } = useMember()
  const { t, lang } = useMT()
  const b = t.board
  const [scope, setScope] = useState('all')
  const [rows, setRows] = useState(null)
  const [members, setMembers] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [around, setAround] = useState([])
  const cityId = scope === 'city' ? d?.city?.id : null

  useEffect(() => {
    let alive = true
    setRows(null)
    setAround([])
    if (isPreview()) {
      setRows(PREVIEW_BOARD)
      setMembers(12481)
      setAround(PREVIEW_AROUND)
      return
    }
    Promise.all([
      rpc('get_leaderboard', { p_city_id: cityId, p_limit: FIRST, p_offset: 0 }),
      rpc('get_leaderboard_meta', { p_city_id: cityId }),
    ]).then(([list, meta]) => {
      if (!alive) return
      const data = list
      setRows(data)
      setMembers(meta.members)
      setHasMore(data.length === FIRST)
    }, () => alive && setRows([]))
    return () => {
      alive = false
    }
  }, [cityId])

  // Le membre hors de la page chargée : on affiche ses voisins directs (classement général).
  useEffect(() => {
    if (isPreview() || !rows || scope !== 'all' || !d?.rank || rows.some((r) => r.is_me)) return
    const offset = Math.max(Number(d.rank) - 2, 0)
    rpc('get_leaderboard', { p_city_id: null, p_limit: 3, p_offset: offset }).then(
      (list) => setAround(list),
      () => {},
    )
  }, [rows, scope, d])

  const more = async () => {
    setBusy(true)
    const want = MAX - rows.length
    const list = await rpc('get_leaderboard', { p_city_id: cityId, p_limit: want, p_offset: rows.length }).catch(() => [])
    setRows((prev) => [...prev, ...list])
    setHasMore(false)
    setBusy(false)
  }

  const me = rows?.find((r) => r.is_me) || around.find((r) => r.is_me)
  const rest = rows ? rows.slice(3) : []
  // Le membre hors de la page chargée : ses voisins directs, lui compris, sous les points de suspension.
  const neighbours = around.filter((r) => !rows?.some((x) => Number(x.rank) === Number(r.rank)))

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[40px] lg:tracking-[-1.4px]">{b.title}</h1>
          <p className="mt-1 hidden font-body text-[15px] text-gris sm:block">{b.sub(fmt(members, lang), Number(members))}</p>
        </div>
        {d?.city && (
          <div className="flex rounded-full bg-white p-1">
            {[
              ['all', b.general],
              ['city', b.myCity(d.city.name)],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setScope(k)}
                className={`h-10 flex-1 cursor-pointer rounded-full px-5 font-body text-[14px] font-semibold lg:flex-none ${scope === k ? 'bg-noir text-white' : 'text-noir/70'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows === null ? (
        <div className="flex justify-center py-20">
          <LoaderCircle className="animate-spin text-gris" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-[24px] bg-white p-8 text-center font-body text-[15px] text-gris">{b.empty}</p>
      ) : (
        <>
          <Banner rows={rows} me={me} d={d} t={t} lang={lang} />
          {(rest.length > 0 || neighbours.length > 0) && (
            <section className="rounded-[24px] bg-white px-5 lg:px-6">
              <div className="hidden grid-cols-[130px_1fr_180px_130px_130px_120px] border-b border-ligne py-4 font-body text-[13px] font-medium text-gris lg:grid">
                {b.cols.map((c, i) => (
                  <span key={c} className={i === 5 ? 'text-right' : ''}>
                    {c}
                  </span>
                ))}
              </div>
              <ul>
                {rest.map((r, i) => (
                  <Row key={r.rank} r={r} t={t} lang={lang} last={i === rest.length - 1 && !neighbours.length} />
                ))}
                {neighbours.length > 0 && <li className="border-b border-ligne py-3 font-body text-[14px] text-gris">…</li>}
                {neighbours.map((r, i) => (
                  <Row key={r.rank} r={r} t={t} lang={lang} last={i === neighbours.length - 1} />
                ))}
              </ul>
            </section>
          )}
          {hasMore && (
            <button type="button" onClick={more} disabled={busy} className="mx-auto flex h-12 cursor-pointer items-center gap-2 rounded-full border border-ligne bg-white px-6 font-body text-[14px] font-semibold hover:border-noir">
              {busy && <LoaderCircle size={16} className="animate-spin" />}
              {b.more}
            </button>
          )}
        </>
      )}

      <p className="flex items-start gap-2 font-body text-[13px] text-gris">
        <Info size={15} className="mt-px shrink-0" />
        {b.note}
      </p>

      {!d && (
        <section className="mt-4 flex flex-col items-start gap-4 rounded-[28px] bg-noir p-7 text-white lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <div>
            <h2 className="font-display text-[24px] font-bold tracking-[-0.6px] lg:text-[30px]">{b.joinTitle}</h2>
            <p className="mt-1 font-body text-[15px] text-white/70">{b.joinSub}</p>
          </div>
          <Link to={PATHS.home} className="flex h-12 items-center rounded-full bg-marque px-6 font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b]">
            {t.nav.join}
          </Link>
        </section>
      )}
    </div>
  )
}
