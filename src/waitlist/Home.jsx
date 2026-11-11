import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight, BadgeCheck, Beef, Copy, CreditCard, Croissant, Gift, Heart, ListChecks, Mail, MailCheck, Map as MapIcon, Menu, Minus, Plus,
  Scissors, ShieldCheck, Store, Timer, Trophy, UserPlus, Utensils, X,
} from 'lucide-react'
import Reveal, { EASE } from '../components/Reveal'
import { LangSwitch } from '../components/Nav'
import { useLang } from '../i18n'
import { rpc } from '../lib/supabase'
import { HOME } from './homeText'
import { captureReferral, store } from './store'
import { PATHS, myDashboard, waitForSession } from './flow'

// Le compteur public n'apparaît qu'à partir d'un volume crédible.
const MIN_PUBLIC_COUNT = 100

function Pill({ children, dark, className = '' }) {
  return (
    <span className={`inline-flex h-[30px] items-center gap-2 rounded-full px-3 font-body text-[13px] font-medium ${dark ? 'bg-white/10 text-white' : 'bg-white text-noir'} ${className}`}>
      <span className="h-[7px] w-[7px] rounded-full bg-marque" />
      {children}
    </span>
  )
}

function H2({ children, className = '', dark }) {
  return (
    <h2 className={`font-display text-[32px] font-bold leading-[1.08] tracking-[-1px] lg:text-[44px] lg:tracking-[-1.5px] ${dark ? 'text-white' : 'text-noir'} ${className}`}>
      {children}
    </h2>
  )
}

const CTA_CLS = 'inline-flex h-[52px] items-center justify-center rounded-full px-7 font-body text-[15px] font-semibold lg:h-14'

function Header({ h, member, signupHref }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  const account = member ? { to: PATHS.member, label: h.nav.space } : { to: PATHS.login, label: h.nav.login }
  return (
    <>
      <header className="fixed inset-x-4 top-4 z-50 mx-auto max-w-[1360px] lg:inset-x-10 lg:top-7">
        <div className="flex h-14 items-center justify-between rounded-full border border-ligne bg-white pl-5 pr-2 shadow-[0_8px_30px_rgba(17,17,17,0.06)] lg:h-[68px] lg:pl-6 lg:pr-2.5">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="KRISMA">
            <img src="/img/landing/k-ink.png" alt="" className="h-[23px] w-[18px] object-contain lg:h-[25px] lg:w-5" />
            <span className="font-display text-[16px] font-extrabold tracking-[1.5px]">KRISMA</span>
          </Link>
          <nav className="hidden items-center gap-[26px] xl:flex">
            {h.nav.links.map((l) => (
              <a key={l.href} href={l.href} className="whitespace-nowrap font-body text-[14px] font-medium text-noir/70 hover:text-noir">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:block">
              <LangSwitch />
            </div>
            <Link to={account.to} className="hidden h-12 items-center rounded-full border border-ligne px-5 font-body text-[14px] font-semibold hover:border-noir lg:flex">
              {account.label}
            </Link>
            <Link to={signupHref} className="hidden h-12 items-center whitespace-nowrap rounded-full bg-marque px-5 font-body text-[14px] font-semibold text-white hover:bg-[#f06e1b] lg:flex">
              {h.nav.cta}
            </Link>
            <button
              type="button"
              aria-label={open ? h.nav.close : h.nav.open}
              onClick={() => setOpen((o) => !o)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-clair lg:hidden"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-noir bg-cover px-6 pb-10 pt-6 lg:hidden"
            style={{ backgroundImage: 'url(/img/landing/rayons-menu.webp)' }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <img src="/img/landing/k-white.png" alt="" className="h-[23px] w-[18px] object-contain" />
                <span className="font-display text-[16px] font-extrabold tracking-[1.5px] text-white">KRISMA</span>
              </span>
              <button type="button" aria-label={h.nav.close} onClick={() => setOpen(false)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="mt-10 flex flex-col">
              {h.nav.links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.05 + i * 0.05 }}
                  className={`flex h-16 items-center border-b border-white/12 font-display text-[28px] font-semibold tracking-[-0.8px] ${i === 0 ? 'text-marque' : 'text-white'}`}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-10">
              <div className="mb-2 flex gap-2">
                {['fr', 'en'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`h-9 cursor-pointer rounded-full px-4 font-body text-[13px] font-semibold uppercase ${lang === code ? 'bg-white text-noir' : 'border border-white/30 text-white'}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <Link to={signupHref} className={`${CTA_CLS} w-full bg-marque text-white`}>
                {h.nav.cta}
              </Link>
              <Link to={account.to} className={`${CTA_CLS} w-full bg-white text-noir`}>
                {account.label}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Carte membre d'exemple (illustration du tableau de bord), à droite du titre.
function MemberCard({ c }) {
  return (
    <div className="relative mx-auto w-full max-w-[480px]" aria-hidden>
      <div className="relative overflow-hidden rounded-[32px] bg-noir p-9">
        <img src="/img/waitlist/panneau.webp" alt="" className="absolute inset-0 h-full w-full object-fill opacity-90" />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2">
            <img src="/img/landing/k-white.png" alt="" className="h-[22px] w-[17px] object-contain" />
            <span className="font-display text-[16px] font-extrabold tracking-[1.5px] text-white">KRISMA</span>
          </span>
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 font-body text-[13px] text-white">
            <BadgeCheck size={14} />
            {c.verified}
          </span>
        </div>
        <p className="relative mt-16 font-body text-[14px] text-white/70">{c.points}</p>
        <p className="relative flex items-baseline gap-2 font-display text-[88px] font-bold leading-none tracking-[-4px] text-white">
          290<span className="font-body text-[22px] font-semibold tracking-normal text-white/70">pts</span>
        </p>
        <div className="relative mt-10 grid grid-cols-3 gap-3">
          {[
            [c.rank, '#1 248'],
            [c.referees, c.refereesValue],
            [c.shops, c.shopsValue],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/[0.08] px-4 py-3">
              <p className="font-body text-[12px] text-white/60">{k}</p>
              <p className="font-display text-[17px] font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-14 flex items-center justify-between rounded-full bg-white p-1.5 pl-5">
          <span className="truncate font-body text-[14px] text-noir">krisma.io/waitlist?ref=AMINA7</span>
          <span className="flex h-10 items-center gap-2 rounded-full bg-marque px-4 font-body text-[14px] font-semibold text-white">
            <Copy size={15} />
            {c.copy}
          </span>
        </div>
      </div>
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-3 -top-7 flex h-[50px] items-center gap-2.5 rounded-full border border-ligne bg-white pl-2 pr-4 font-body text-[14px] font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.1)] xl:-right-6"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bleu text-white">
          <UserPlus size={16} />
        </span>
        {c.chipReferral}
      </motion.span>
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute -bottom-8 -left-6 flex h-[50px] items-center gap-2.5 rounded-full border border-ligne bg-white pl-2 pr-4 font-body text-[14px] font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.1)] xl:-left-16"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vert text-white">
          <Store size={16} />
        </span>
        {c.chipShop}
      </motion.span>
    </div>
  )
}

const PIN = 'M22 0c-12.15 0-22 9.85-22 22 0 15.5 22 32 22 32s22-16.5 22-32c0-12.15-9.85-22-22-22z'
const PINS = [
  { x: 140, y: 120, c: '#15803d', I: Store },
  { x: 330, y: 210, c: '#fd8030', I: Scissors },
  { x: 520, y: 110, c: '#111111', I: Beef },
  { x: 250, y: 330, c: '#9ca3af', I: Croissant },
  { x: 560, y: 330, c: '#0676f8', I: Utensils },
]
const STATUS_COLORS = ['#9ca3af', '#111111', '#0676f8', '#fd8030', '#15803d']

function MapPreview({ m }) {
  return (
    <div className="relative aspect-[696/520] w-full overflow-hidden rounded-[28px] bg-[#eef0ea]" aria-hidden>
      <img src="/img/waitlist/carte-quartier.webp" alt="" className="absolute max-w-none" style={{ left: '-17.24%', top: '-23.08%', width: '172.4%', height: '153.85%' }} />
      {PINS.map(({ x, y, c, I }) => (
        <span key={x} className="absolute h-[54px] w-[44px] -translate-x-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] max-sm:scale-75" style={{ left: `${(x / 696) * 100}%`, top: `${(y / 520) * 100}%` }}>
          <svg viewBox="0 0 44 54" className="absolute inset-0 h-full w-full">
            <path d={PIN} fill={c} />
          </svg>
          <I size={20} className="absolute left-3 top-[11px] text-white" />
        </span>
      ))}
      <div className="absolute bottom-[5%] right-[5%] w-[300px] max-w-[88%] rounded-[20px] bg-white p-[18px] shadow-[0_16px_40px_rgba(17,17,17,0.14)] max-sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[15px] font-bold">{m.shop}</span>
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-[#dcf5e4] px-2.5 font-body text-[11px] font-semibold text-vert">
            <span className="h-1.5 w-1.5 rounded-full bg-vert" />
            {m.shopStatus}
          </span>
        </div>
        <p className="mt-2.5 font-body text-[13px] text-gris">{m.shopMeta}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-body text-[13px]">{m.shopVotes}</span>
          <span className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-ligne px-3 font-body text-[13px] font-semibold">
            <Heart size={14} />
            {m.vote}
          </span>
        </div>
      </div>
    </div>
  )
}

function Faq({ f }) {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="scroll-mt-24 bg-clair px-5 py-16 lg:px-10 lg:py-24 xl:px-[120px]">
      <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
        <Reveal className="flex flex-col items-start gap-4">
          <Pill className="!bg-transparent !px-0">{f.eyebrow}</Pill>
          <H2>{f.title}</H2>
        </Reveal>
        <div className="flex flex-col gap-3">
          {f.items.map(([q, a], i) => {
            const on = open === i
            return (
              <Reveal key={q} delay={i * 0.05} y={20}>
                <div className="rounded-[20px] bg-white">
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setOpen(on ? null : i)}
                    className="flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left font-body text-[15px] font-semibold lg:min-h-[76px] lg:px-[26px] lg:text-[16px]"
                  >
                    {q}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${on ? 'bg-noir text-white' : 'bg-clair text-noir'}`}>
                      {on ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                        <p className="px-5 pb-6 font-body text-[14px] leading-[1.6] text-gris lg:px-[26px] lg:text-[15px]">{a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// W01 — Page de la liste d'attente : présentation, principe, points, récompenses, départ de l'inscription.
export default function Home() {
  const { lang } = useLang()
  const h = HOME[lang]
  const location = useLocation()
  const [members, setMembers] = useState(null)
  const [referrer, setReferrer] = useState(null)
  const [member, setMember] = useState(false)

  // E-mail saisi sur la page d'accueil et code de parrainage : transmis à l'inscription.
  const params = new URLSearchParams(location.search)
  const forward = new URLSearchParams()
  if (params.get('email')) forward.set('email', params.get('email'))
  if (params.get('news')) forward.set('news', '1')
  const signupHref = `${PATHS.signup}${forward.size ? `?${forward}` : ''}`

  useEffect(() => {
    captureReferral(location.search)
    const ref = store.ref()
    if (ref) rpc('get_referrer', { p_code: ref }).then((r) => setReferrer(r?.pseudo || null), () => {})
    rpc('get_top_threshold', { p_size: 2000 }).then((r) => setMembers(r?.members ?? null), () => {})
    waitForSession(400).then(async (s) => {
      if (s && !s.user.is_anonymous) setMember((await myDashboard()).status === 'verified')
    })
  }, [location.search])

  const fmt = (n) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(n)
  const countLabel = members >= MIN_PUBLIC_COUNT ? `${h.hero.open} · ${h.hero.members(fmt(members))}` : h.hero.open
  const facts = [Timer, ListChecks, Gift]

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white">
      <Header h={h} member={member} signupHref={signupHref} />
      <main>
        {/* Hero */}
        <section id="accueil" className="bg-[#f0f0f0] px-5 pb-14 pt-[104px] lg:px-10 lg:pb-28 lg:pt-[180px] xl:px-[120px]">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-16">
            <div className="flex flex-col items-start gap-6 lg:gap-7">
              <Reveal className="flex flex-wrap gap-2">
                <Pill>{countLabel}</Pill>
                {referrer && (
                  <span className="inline-flex h-[30px] items-center gap-2 rounded-full bg-[#ffe6d5] px-3 font-body text-[13px] font-medium text-[#9a3412]">
                    <UserPlus size={14} />
                    {h.hero.invited(referrer)}
                  </span>
                )}
              </Reveal>
              <Reveal delay={0.06} as="h1" className="font-display text-[44px] font-bold leading-[1.02] tracking-[-1.8px] text-noir sm:text-[56px] lg:text-[72px] lg:tracking-[-3px]">
                {h.hero.title}
              </Reveal>
              <Reveal delay={0.12} as="p" className="max-w-[540px] font-body text-[16px] leading-[1.6] text-gris lg:text-[18px]">
                <span className="lg:hidden">{h.hero.subShort}</span>
                <span className="hidden lg:inline">{h.hero.sub}</span>
              </Reveal>
              <Reveal delay={0.18} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link to={signupHref} className={`${CTA_CLS} bg-marque text-white hover:bg-[#f06e1b]`}>
                  {h.hero.start}
                </Link>
                <Link to={member ? PATHS.member : PATHS.login} className={`${CTA_CLS} border border-ligne bg-white text-noir hover:border-noir`}>
                  {member ? h.nav.space : h.hero.account}
                </Link>
              </Reveal>
              <Reveal delay={0.24} className="hidden flex-wrap gap-x-6 gap-y-2 font-body text-[14px] text-gris sm:flex">
                {h.hero.facts.map((f, i) => {
                  const I = facts[i]
                  return (
                    <span key={f} className="flex items-center gap-2">
                      <I size={16} />
                      {f}
                    </span>
                  )
                })}
              </Reveal>
            </div>
            <Reveal delay={0.2} y={40} className="hidden lg:block">
              <MemberCard c={h.hero.card} />
            </Reveal>
            {/* Mobile : version courte de la carte + les trois gains */}
            <Reveal delay={0.2} className="flex flex-col gap-3 lg:hidden" aria-hidden>
              <div className="relative h-[230px] overflow-hidden rounded-[28px] bg-noir p-6">
                <img src="/img/waitlist/panneau.webp" alt="" className="absolute inset-0 h-full w-full object-fill" />
                <span className="relative flex items-center gap-2">
                  <img src="/img/landing/k-white.png" alt="" className="h-[22px] w-[17px] object-contain" />
                  <span className="font-display text-[16px] font-extrabold tracking-[1.5px] text-white">KRISMA</span>
                </span>
                <p className="absolute bottom-6 left-6 flex items-baseline gap-2 font-display text-[64px] font-bold leading-none tracking-[-3px] text-white">
                  170<span className="font-body text-[14px] font-normal tracking-normal text-white/70">{h.hero.card.mobileUnit}</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {h.hero.tiles.map(([v, l], i) => (
                  <div key={l} className={`rounded-[20px] px-3.5 py-3 ${i === 1 ? 'bg-marque text-white' : 'bg-white'}`}>
                    <p className="font-display text-[22px] font-bold">{v}</p>
                    <p className={`font-body text-[13px] ${i === 1 ? 'text-white/90' : 'text-gris'}`}>{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Services */}
        <section className="px-5 py-16 lg:px-10 lg:py-24 xl:px-[120px]">
          <div className="mx-auto max-w-[1200px]">
            <Reveal className="flex flex-col items-start gap-4">
              <Pill className="!bg-clair">{h.services.eyebrow}</Pill>
              <H2 className="max-w-[760px]">{h.services.title}</H2>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-5">
              {h.services.items.map(([title, text], i) => {
                const [I, tone] = [
                  [CreditCard, 'bg-[#dbeafe] text-bleu'],
                  [ArrowLeftRight, 'bg-[#ffe6d5] text-marque'],
                  [Store, 'bg-[#dcf5e4] text-vert'],
                ][i]
                return (
                  <Reveal key={title} delay={i * 0.08} className="flex flex-col gap-3 rounded-[24px] bg-clair p-7">
                    <span className={`mb-6 flex h-[52px] w-[52px] lg:mb-10 items-center justify-center rounded-[14px] ${tone}`}>
                      <I size={22} />
                    </span>
                    <h3 className="font-display text-[21px] font-bold tracking-[-0.5px]">{title}</h3>
                    <p className="font-body text-[15px] leading-[1.55] text-gris">{text}</p>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="etapes" className="scroll-mt-24 bg-clair px-5 py-16 lg:px-10 lg:py-24 xl:px-[120px]">
          <div className="mx-auto max-w-[1200px]">
            <Reveal className="flex flex-col items-start gap-4">
              <Pill className="!bg-transparent !px-0">{h.steps.eyebrow}</Pill>
              <H2>{h.steps.title}</H2>
              <p className="max-w-[620px] font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{h.steps.sub}</p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {h.steps.items.map(([title, text], i) => {
                const I = [Mail, ListChecks, MailCheck, Trophy][i]
                return (
                  <Reveal key={title} delay={i * 0.07} className="flex flex-col gap-3 rounded-[24px] border border-ligne bg-white p-7">
                    <div className="mb-6 flex items-center justify-between lg:mb-10">
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${i === 3 ? 'bg-marque' : 'bg-noir'}`}>
                        <I size={20} />
                      </span>
                      <span className="font-display text-[28px] font-bold text-ligne">0{i + 1}</span>
                    </div>
                    <h3 className="font-display text-[19px] font-bold tracking-[-0.4px]">{title}</h3>
                    <p className="font-body text-[15px] leading-[1.55] text-gris">{text}</p>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* Points */}
        <section id="points" className="scroll-mt-24 px-5 pb-10 pt-16 lg:px-10 lg:pt-24 xl:px-[120px]">
          <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-[72px]">
            <Reveal className="flex flex-col items-start gap-4">
              <Pill className="!bg-clair">{h.points.eyebrow}</Pill>
              <H2>{h.points.title}</H2>
              <p className="font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{h.points.sub}</p>
              <p className="mt-3 flex items-start gap-3 rounded-[20px] bg-clair p-5 font-body text-[14px] leading-[1.5] text-gris">
                <ShieldCheck size={18} className="mt-px shrink-0 text-vert" />
                {h.points.note}
              </p>
            </Reveal>
            <div className="flex flex-col gap-4">
              {h.points.items.map(([value, title, text], i) => {
                const I = [BadgeCheck, UserPlus, Store][i]
                const tone = ['bg-noir text-white', 'bg-marque text-white', 'bg-clair text-noir'][i]
                return (
                  <Reveal key={title} delay={i * 0.08} className={`flex items-center gap-5 rounded-[24px] px-6 py-6 lg:gap-8 lg:px-8 ${tone}`}>
                    <span className="w-[96px] shrink-0 font-display text-[40px] font-bold tracking-[-1.5px] lg:w-[150px] lg:text-[56px]">{value}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-[19px] font-bold tracking-[-0.4px] lg:text-[21px]">{title}</h3>
                      <p className={`mt-1 font-body text-[14px] leading-[1.55] lg:text-[15px] ${i === 2 ? 'text-gris' : 'text-white/80'}`}>{text}</p>
                    </div>
                    <I size={22} className="hidden shrink-0 sm:block" />
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* Récompenses */}
        <section className="px-5 py-10 lg:px-10 lg:pb-24 xl:px-[120px]">
          <Reveal className="relative mx-auto grid max-w-[1200px] items-center gap-10 overflow-hidden rounded-[32px] bg-noir p-8 lg:grid-cols-[1fr_360px] lg:gap-16 lg:rounded-[40px] lg:p-20">
            <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
            <div className="relative flex flex-col items-start gap-5">
              <Pill dark>{h.rewards.eyebrow}</Pill>
              <H2 dark className="lg:text-[52px]">{h.rewards.title}</H2>
              <p className="max-w-[540px] font-body text-[16px] leading-[1.65] text-white/75 lg:text-[17px]">{h.rewards.text}</p>
            </div>
            <div className="relative flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] px-6 py-12 text-center">
              <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-marque text-white">
                <Gift size={34} />
              </span>
              <p className="font-display text-[36px] font-bold tracking-[-1.2px] text-white">{h.rewards.badge}</p>
              <p className="font-body text-[15px] text-white/70">{h.rewards.badgeSub}</p>
            </div>
          </Reveal>
        </section>

        {/* KRISMA Map */}
        <section id="carte" className="scroll-mt-24 px-5 py-16 lg:px-10 lg:py-24 xl:px-[120px]">
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-16">
            <Reveal className="flex flex-col items-start gap-5">
              <Pill className="!bg-clair">{h.map.eyebrow}</Pill>
              <H2>{h.map.title}</H2>
              <p className="font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{h.map.text}</p>
              <ul className="flex flex-col gap-2.5">
                {h.map.statuses.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 font-body text-[14px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[i] }} />
                    {s}
                  </li>
                ))}
              </ul>
              <Link to="/carte" className="mt-2 inline-flex h-[52px] items-center gap-2.5 rounded-full bg-noir px-6 font-body text-[15px] font-semibold text-white hover:bg-[#2b2b2b]">
                {h.map.cta}
                <MapIcon size={16} />
              </Link>
            </Reveal>
            <Reveal delay={0.1} y={40}>
              <MapPreview m={h.map} />
            </Reveal>
          </div>
        </section>

        <Faq f={h.faq} />

        {/* Appel final */}
        <section className="px-5 py-20 text-center lg:py-28">
          <Reveal className="mx-auto flex max-w-[720px] flex-col items-center gap-5">
            <H2 className="lg:text-[56px]">{h.final.title}</H2>
            <p className="font-body text-[16px] text-gris lg:text-[18px]">{h.final.sub}</p>
            <Link to={signupHref} className={`${CTA_CLS} mt-2 bg-marque text-white hover:bg-[#f06e1b]`}>
              {h.hero.start}
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="bg-noir px-5 pb-8 pt-12 lg:px-10 xl:px-[120px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-8 border-b border-white/12 pb-8 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-2" aria-label="KRISMA">
              <img src="/img/landing/k-white.png" alt="" className="h-[25px] w-5 object-contain" />
              <span className="font-display text-[17px] font-extrabold tracking-[1.5px] text-white">KRISMA</span>
            </Link>
            <nav className="flex flex-wrap gap-x-7 gap-y-3">
              {h.footer.links.map(([label, href]) =>
                href.startsWith('/') ? (
                  <Link key={label} to={href} className="font-body text-[14px] text-white/75 hover:text-white">
                    {label}
                  </Link>
                ) : (
                  <a key={label} href={href} className="font-body text-[14px] text-white/75 hover:text-white">
                    {label}
                  </a>
                ),
              )}
            </nav>
          </div>
          <div className="flex flex-col gap-4 pt-6 font-body text-[13px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>{h.footer.legal}</p>
            <FooterLang />
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterLang() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1.5">
      {['fr', 'en'].map((code, i) => (
        <span key={code} className="flex items-center gap-1.5">
          {i > 0 && <span>·</span>}
          <button type="button" onClick={() => setLang(code)} className={`cursor-pointer uppercase ${lang === code ? 'text-white' : 'hover:text-white'}`}>
            {code}
          </button>
        </span>
      ))}
    </div>
  )
}
