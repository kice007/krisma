import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Heart, Hourglass, Info, Sparkles, Store, UserPlus } from '../components/icons'
import { fmt, useMT, useMember } from './Shell'

const KIND = {
  signup: [BadgeCheck, 'bg-noir'],
  referral: [UserPlus, 'bg-marque'],
  shop: [Store, 'bg-vert'],
  vote: [Heart, 'bg-[#a351fc]'],
}
// Type inconnu (ajouté plus tard en base) : on affiche quand même la ligne.
const FALLBACK = [Sparkles, 'bg-gris']

// M12 — Historique des points (aussi ouvert par « Historique » sur desktop).
export default function Points() {
  const { d } = useMember()
  const { t, lang } = useMT()
  const p = t.points
  const loc = lang === 'fr' ? 'fr-FR' : 'en-GB'
  const date = (iso, withTime) =>
    new Intl.DateTimeFormat(loc, withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }).format(new Date(iso))
  const waiting = d.history.filter((e) => e.status === 'pending' || e.status === 'suspended')
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link to="/espace" aria-label={t.nav.home} className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-[26px] font-bold tracking-[-0.8px] lg:text-[34px]">{p.title}</h1>
      </div>
      <section className="rounded-[24px] bg-noir p-6 text-white">
        <p className="font-body text-[14px] text-white/70">{p.total}</p>
        <p className="mt-1 font-display text-[36px] font-bold tracking-[-1px] lg:text-[44px]">
          {fmt(d.points, lang)} {p.unit}
        </p>
      </section>
      {waiting.map((e, i) => (
        <p key={i} className="flex items-start gap-3 rounded-[20px] bg-[#fef3c7] p-4 font-body text-[14px] leading-[1.5] text-[#92400e]">
          <Hourglass size={18} className="mt-px shrink-0" />
          {e.kind === 'shop' ? p.pendingShop(e.label || '—') : p.pendingReferral(e.label || '—')}
        </p>
      ))}
      <h2 className="mt-2 font-body text-[14px] font-semibold text-gris">{p.history}</h2>
      <ul className="rounded-[24px] bg-white px-5">
        {d.history.length === 0 && <li className="py-6 font-body text-[14px] text-gris">{p.empty}</li>}
        {d.history.map((e, i) => {
          const [I, bg] = KIND[e.kind] || FALLBACK
          const off = e.status !== 'awarded'
          const revoked = e.status === 'revoked'
          return (
            <li key={i} className={`flex items-center gap-4 py-4 ${i < d.history.length - 1 ? 'border-b border-ligne' : ''}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${off ? 'bg-[#cfcfcf]' : bg}`}>
                <I size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[15px] font-semibold">{(off && !revoked && p.kindsPending[e.kind]) || p.kinds[e.kind] || e.kind}</span>
                <span className="block truncate font-body text-[13px] text-gris">
                  {[e.label, date(e.created_at, e.kind === 'signup'), off && p.status[e.status]].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className={`font-display text-[18px] font-bold tabular-nums ${off ? 'text-gris' : ''} ${revoked ? 'line-through' : ''}`}>+{e.points}</span>
            </li>
          )
        })}
      </ul>
      <p className="flex items-start gap-2 font-body text-[13px] text-gris">
        <Info size={15} className="mt-px shrink-0" />
        {p.note}
      </p>
    </div>
  )
}
