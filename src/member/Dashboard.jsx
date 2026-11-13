import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Beef, Check, Copy, Croissant, History, Mail, MessageCircle, Plus, ScrollText, Scissors, Send, Share2, Store, TrendingDown, TrendingUp, Utensils } from 'lucide-react'
import { fmt, initials, useMT, useMember } from './Shell'

export const CATEGORY_ICON = { grocery: Store, butcher: Beef, bakery: Croissant, hair_salon: Scissors, restaurant: Utensils, other: Store }

const REFEREE_TONE = {
  awarded: 'bg-[#dcf5e4] text-vert',
  verified: 'bg-[#dcf5e4] text-vert',
  pending_email: 'bg-[#fef3c7] text-[#b45309]',
  under_review: 'bg-[#fef3c7] text-[#b45309]',
  revoked: 'bg-clair text-gris',
}
const SHOP_TONE = {
  proposed: 'bg-[#ffe6d5] text-[#c2410c]',
  validated: 'border border-ligne bg-white text-noir',
  contacted: 'bg-[#dbeafe] text-[#1d4ed8]',
  partner: 'bg-[#ffe6d5] text-[#c2410c]',
  cashback_active: 'bg-[#dcf5e4] text-vert',
  rejected: 'border border-ligne bg-white text-gris',
  duplicate: 'border border-ligne bg-white text-gris',
}

function Card({ children, className = '' }) {
  return <section className={`min-w-0 rounded-[28px] bg-white p-6 lg:p-8 ${className}`}>{children}</section>
}

function Tag({ children, className = '' }) {
  return <span className={`inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-3 font-body text-[12px] font-medium ${className}`}>{children}</span>
}

function PointsCard({ d, t, lang }) {
  const b = d.breakdown || {}
  const parts = [
    ['signup', '#ffffff'],
    ['referral', '#fd8030'],
    ['shop', '#15803d'],
    ['vote', '#93c5fd'],
  ].filter(([k]) => b[k] > 0)
  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] bg-noir p-6 text-white lg:p-8">
      <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-60 lg:opacity-0" />
      <div className="relative flex items-center justify-between">
        <p className="font-body text-[14px] text-white/70">{t.dash.points}</p>
        <Link to="/espace/points" className="flex h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 font-body text-[13px] font-medium hover:bg-white/20">
          <History size={15} />
          {t.dash.history}
        </Link>
      </div>
      <p className="relative mt-6 flex items-baseline gap-3 font-display text-[72px] font-bold leading-none tracking-[-3px] lg:mt-auto lg:pt-10 lg:text-[104px] lg:tracking-[-5px]">
        {fmt(d.points, lang)}
        <span className="font-body text-[18px] font-medium tracking-normal text-white/70 lg:text-[22px]">{t.dash.unit}</span>
      </p>
      {parts.length > 0 && (
        <>
          <div className="relative mt-8 flex h-2 gap-1 overflow-hidden rounded-full">
            {parts.map(([k, c]) => (
              <span key={k} className="h-full rounded-full" style={{ flex: b[k], background: c }} />
            ))}
          </div>
          <ul className="relative mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 font-body text-[13px] text-white/85">
            {parts.map(([k, c]) => (
              <li key={k} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                {t.dash.breakdown[k]} {fmt(b[k], lang)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function RankCard({ d, t, lang }) {
  const top = d.top || {}
  const threshold = top.threshold || 0
  const inside = d.rank != null && (top.members <= 2000 || d.points >= threshold)
  const scale = Math.max(d.points, threshold, 1) * 1.35
  const delta = d.rank_week_ago != null && d.rank != null ? d.rank_week_ago - d.rank : 0
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between">
        <p className="font-body text-[14px] text-gris">{t.dash.rank}</p>
        <Link to="/classement" className="font-body text-[14px] font-semibold hover:underline">
          {t.dash.seeBoard}
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 lg:mt-auto lg:pt-8">
        <p className="font-display text-[48px] font-bold leading-none tracking-[-2px] tabular-nums lg:text-[72px] lg:tracking-[-3px]">{d.rank ? `#${fmt(d.rank, lang)}` : '—'}</p>
        {delta !== 0 && (
          <Tag className={delta > 0 ? 'bg-[#dcf5e4] text-vert' : 'bg-clair text-gris'}>
            {delta > 0 ? <TrendingUp size={14} className="mr-1.5" /> : <TrendingDown size={14} className="mr-1.5" />}
            {delta > 0 ? t.dash.up(fmt(delta, lang)) : t.dash.down(fmt(delta, lang))}
          </Tag>
        )}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-body text-[14px]">
        <span>{t.dash.threshold(fmt(threshold, lang))}</span>
        <span className={`flex items-center gap-1 font-semibold ${inside ? 'text-vert' : 'text-[#c2410c]'}`}>
          {inside ? t.dash.inside : t.dash.missing(fmt(threshold - d.points, lang))}
          {inside && <Check size={15} />}
        </span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-clair">
        <span className="absolute inset-y-0 left-0 rounded-full bg-noir" style={{ width: `${Math.min(100, (d.points / scale) * 100)}%` }} />
        {threshold > 0 && <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-marque" style={{ left: `${(threshold / scale) * 100}%` }} />}
      </div>
      <p className="mt-3 font-body text-[13px] text-gris">{t.dash.thresholdNote}</p>
    </Card>
  )
}

function ReferralCard({ d, t }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/waitlist?ref=${d.referral_code}`
  const short = link.replace(/^https?:\/\/(www\.)?/, '')
  const text = `${t.dash.shareText} ${link}`
  const verified = d.referees.filter((r) => r.status === 'awarded' || r.status === 'verified').length
  const pending = d.referees.length - verified - d.referees.filter((r) => r.status === 'revoked').length
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* presse-papiers refusé */
    }
  }
  const shares = [
    ['WhatsApp', MessageCircle, `https://wa.me/?text=${encodeURIComponent(text)}`, 'text-[#25d366]'],
    ['Telegram', Send, `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t.dash.shareText)}`, 'text-[#229ed9]'],
    ['E-mail', Mail, `mailto:?subject=${encodeURIComponent(t.dash.shareSubject)}&body=${encodeURIComponent(text)}`, ''],
  ]
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.6px] lg:text-[26px]">{t.dash.referTitle}</h2>
          <p className="mt-1 font-body text-[14px] text-gris">{t.dash.referSub}</p>
        </div>
        {d.referees.length > 0 && <Tag className="bg-clair text-noir">{t.dash.referCount(verified, pending)}</Tag>}
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-full bg-clair p-1.5 pl-5">
        <span className="min-w-0 flex-1 truncate font-body text-[15px]">{short}</span>
        <button type="button" onClick={copy} className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-noir px-5 font-body text-[14px] font-semibold text-white hover:bg-[#2b2b2b]">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t.dash.copied : t.dash.copyLink}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {shares.map(([label, I, href, tone]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 rounded-full border border-ligne px-4 font-body text-[14px] font-medium hover:border-noir">
            <I size={16} className={tone} />
            {label}
          </a>
        ))}
        {typeof navigator.share === 'function' && (
          <button type="button" onClick={() => navigator.share({ title: 'KRISMA', text: t.dash.shareText, url: link }).catch(() => {})} className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ligne px-4 font-body text-[14px] font-medium hover:border-noir">
            <Share2 size={16} />
            {t.dash.more}
          </button>
        )}
      </div>
      {d.referees.length === 0 ? (
        <p className="mt-6 font-body text-[14px] leading-[1.55] text-gris">{t.dash.noReferees}</p>
      ) : (
        <ul className="mt-5">
          {d.referees.map((r, i) => (
            <li key={r.pseudo + i} className={`flex items-center gap-3 py-3.5 ${i < d.referees.length - 1 ? 'border-b border-ligne' : ''}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clair font-body text-[12px] font-bold">{initials(r.pseudo).slice(0, 1)}</span>
              <span className="min-w-0 flex-1 truncate font-body text-[15px]">{r.pseudo}</span>
              <Tag className={REFEREE_TONE[r.status]}>{t.dash.referee[r.status]}</Tag>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function ShopsCard({ d, t }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-bold tracking-[-0.6px] lg:text-[26px]">{t.dash.shopsTitle}</h2>
          <p className="mt-1 font-body text-[14px] text-gris">{t.dash.shopsSub}</p>
        </div>
        <Link to="/carte?proposer=1" className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-marque px-5 font-body text-[14px] font-semibold text-white hover:bg-[#f06e1b]">
          <Plus size={16} />
          {t.dash.propose}
        </Link>
      </div>
      {d.shops.length === 0 ? (
        <p className="mt-6 font-body text-[14px] leading-[1.55] text-gris">{t.dash.noShops}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {d.shops.map((s) => {
            const I = CATEGORY_ICON[s.category] || Store
            return (
              <li key={s.id} className="flex items-center gap-4 rounded-[20px] bg-clair p-3.5 pr-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white">
                  <I size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[15px] font-semibold">{s.name}</span>
                  <span className="block truncate font-body text-[13px] text-gris">{[t.categories[s.category], s.city].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="hidden sm:block">
                  <Tag className={SHOP_TONE[s.status]}>{t.dash.shopStatus[s.status]}</Tag>
                </span>
                <span className="sm:hidden">
                  <Tag className={SHOP_TONE[s.status]}>{t.dash.shopShort[s.status] || t.dash.shopStatus[s.status].split(' · ')[0]}</Tag>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <Link to="/carte" className="mt-6 inline-block font-body text-[14px] font-semibold hover:underline">
        {t.dash.seeMap}
      </Link>
    </Card>
  )
}

// W10 / M11 — Tableau de bord du membre.
export default function Dashboard() {
  const { d } = useMember()
  const { t, lang } = useMT()
  const since = d.verified_at ? new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d.verified_at)) : null
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[40px] lg:tracking-[-1.4px]">{t.dash.hello((d.pseudo || '').split(' ')[0])}</h1>
          <p className="mt-1 font-body text-[14px] text-gris lg:text-[15px]">{[d.city?.name, since && t.dash.since(since)].filter(Boolean).join(' · ')}</p>
        </div>
        <span className="hidden h-9 items-center gap-2 rounded-full bg-white px-4 font-body text-[13px] font-medium lg:flex">
          <span className="h-[7px] w-[7px] rounded-full bg-marque" />
          {t.campaign}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-5">
        <PointsCard d={d} t={t} lang={lang} />
        <RankCard d={d} t={t} lang={lang} />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
        {d.referral_code && <ReferralCard d={d} t={t} />}
        <ShopsCard d={d} t={t} />
      </div>
      <Link to="/reglement" className="group flex items-center gap-4 rounded-[24px] bg-white p-5 lg:px-8 lg:py-6">
        <ScrollText size={24} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[15px] font-semibold lg:text-[16px]">{t.dash.rulesTitle}</span>
          <span className="hidden font-body text-[14px] text-gris sm:block">{t.dash.rulesSub}</span>
        </span>
        <span className="hidden h-11 items-center rounded-full border border-ligne px-5 font-body text-[14px] font-semibold group-hover:border-noir sm:flex">{t.dash.rulesCta}</span>
      </Link>
    </div>
  )
}
