import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Crown, Info, LoaderCircle } from 'lucide-react'
import { rpc } from '../lib/supabase'
import { PATHS, isPreview } from '../waitlist/flow'
import { PREVIEW_AROUND, PREVIEW_BOARD } from './preview'
import { fmt, initials, useMT, useMember } from './Shell'

const PAGE = 50

function Podium({ rows, t, lang }) {
  // Ex æquo possibles : on prend simplement les trois premières lignes.
  const [a, b, c] = [rows[0], rows[1], rows[2]]
  const order = [b, a, c]
  return (
    <div className="grid grid-cols-3 items-end gap-2.5 lg:gap-5">
      {order.map((r, i) => {
        const first = i === 1
        if (!r) return <div key={i} />
        return (
          <div
            key={r.rank}
            className={`flex flex-col justify-between rounded-[22px] p-3.5 lg:rounded-[28px] lg:p-7 ${first ? 'h-[128px] bg-noir text-white lg:h-[290px]' : 'h-[108px] bg-white lg:h-[250px]'} ${r.is_me ? 'ring-2 ring-marque' : ''}`}
          >
            <div className="flex items-start justify-between">
              <span className={`font-display text-[24px] font-bold lg:text-[44px] ${first ? 'text-marque' : ''}`}>#{fmt(r.rank, lang)}</span>
              {first ? <Crown size={24} className="hidden text-marque lg:block" /> : <Award size={24} className="hidden text-gris lg:block" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[14px] font-bold lg:text-[24px] lg:tracking-[-0.6px]">{r.pseudo}</p>
              <p className={`truncate font-body text-[11px] lg:text-[14px] ${first ? 'text-white/70' : 'text-gris'}`}>
                {fmt(r.points, lang)} {t.pts}
                <span className="hidden lg:inline">{r.city ? ` · ${r.city}` : ''}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Row({ r, t, lang, last }) {
  return (
    <li className={`grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3.5 lg:grid-cols-[130px_1fr_180px_130px_130px_120px] lg:gap-0 lg:py-4 ${last ? '' : 'border-b border-ligne'} ${r.is_me ? 'text-marque' : ''}`}>
      <span className="font-body text-[15px] font-bold tabular-nums">#{fmt(r.rank, lang)}</span>
      <span className="flex min-w-0 items-center gap-3">
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clair font-body text-[12px] font-bold text-noir lg:flex">{initials(r.pseudo).slice(0, 1)}</span>
        <span className="min-w-0">
          <span className="block truncate font-body text-[15px] font-medium">
            {r.pseudo}
            {r.is_me ? ` (${t.board.you})` : ''}
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
      rpc('get_leaderboard', { p_city_id: cityId, p_limit: PAGE, p_offset: 0 }),
      rpc('get_leaderboard_meta', { p_city_id: cityId }),
    ]).then(([list, meta]) => {
      if (!alive) return
      const data = list
      setRows(data)
      setMembers(meta.members)
      setHasMore(data.length === PAGE)
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
    const list = await rpc('get_leaderboard', { p_city_id: cityId, p_limit: PAGE, p_offset: rows.length }).catch(() => [])
    setRows((prev) => [...prev, ...list])
    setHasMore(list.length === PAGE)
    setBusy(false)
  }

  const me = rows?.find((r) => r.is_me) || around.find((r) => r.is_me)
  const rest = rows ? rows.slice(3) : []
  const neighbours = around.filter((r) => !r.is_me && !rows?.some((x) => Number(x.rank) === Number(r.rank)))

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[40px] lg:tracking-[-1.4px]">{b.title}</h1>
          <p className="mt-1 hidden font-body text-[15px] text-gris sm:block">{b.sub(fmt(members, lang))}</p>
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
          <Podium rows={rows} t={t} lang={lang} />
          {me && (
            <div className="flex h-14 items-center gap-4 rounded-[18px] bg-marque px-5 text-white lg:h-[72px] lg:rounded-[22px] lg:px-6">
              <span className="font-display text-[18px] font-bold tabular-nums lg:w-[130px] lg:text-[22px]">#{fmt(me.rank, lang)}</span>
              <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-white font-body text-[12px] font-bold text-marque lg:flex">{initials(me.pseudo)}</span>
              <span className="min-w-0 flex-1 truncate font-body text-[15px] font-semibold">
                {me.pseudo} ({b.you})
              </span>
              <span className="hidden font-body text-[15px] lg:block lg:w-[200px]">{me.city}</span>
              <span className="font-display text-[18px] font-bold tabular-nums lg:text-[22px]">
                {fmt(me.points, lang)}
                <span className="hidden lg:inline"> {t.pts}</span>
              </span>
            </div>
          )}
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
