import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Beef, Bell, CircleCheck, Heart, ListChecks, Lock, MailCheck, Map as MapIcon, MapPin, Menu, Minus, Plus,
  Scissors, ShoppingBasket, Sparkles, Store, Timer, TrendingUp, UserPlus, Utensils, X, BadgeCheck, Info, Circle,
} from '../components/icons'
import Reveal, { EASE } from '../components/Reveal'
import { CardMarks } from '../components/CardMark'
import { LangSwitch } from '../components/Nav'
import { useViewport } from '../components/useStage'
import { useLang } from '../i18n'
import { rpc } from '../lib/supabase'
import { ago, avatarColor, fmtNumber, usePublicStats } from '../lib/publicStats'
import { HOME } from './homeText'
import LiveMap from './LiveMap'
import { captureReferral, store } from './store'
import { PATHS, myDashboard, waitForSession } from './flow'

const VIOLET = '#a351fc'

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
  // Lien de la section en cours de lecture en orange, comme sur la landing.
  const [active, setActive] = useState('#accueil')
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)), { rootMargin: '-45% 0px -50% 0px' })
    h.nav.links.forEach((l) => {
      const el = document.querySelector(l.href)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [h])
  return (
    <>
      <header className="fixed inset-x-5 top-4 z-50 mx-auto max-w-[1122px] lg:top-7">
        <div className="flex h-14 items-center justify-between rounded-full bg-white pl-5 pr-2.5 shadow-[0_12px_36px_rgba(17,17,17,0.08)] lg:h-[68px] lg:pl-6 lg:pr-[10px]">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="KRISMA">
            <img src="/img/landing/k-ink.png" alt="" className="h-[23px] w-[18px] object-contain lg:h-[25px] lg:w-5" />
          </Link>
          <nav className="hidden items-center gap-[22px] lg:flex xl:gap-[26px]">
            {h.nav.links.map((l) => (
              <a key={l.href} href={l.href} aria-current={active === l.href ? 'true' : undefined} className={`whitespace-nowrap font-body text-[14px] font-medium hover:text-marque ${active === l.href ? 'text-marque' : 'text-noir'}`}>
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


// Puce flottante autour de la carte (« +50 · Parrainage vérifié »).
function Chip({ icon: I, color, children, className = '', style, float = 6, delay = 0 }) {
  return (
    <motion.span
      animate={{ y: [0, -float, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`absolute flex h-[52px] items-center gap-2.5 whitespace-nowrap rounded-full border border-ligne bg-white pl-2 pr-[18px] font-body text-[14px] font-semibold shadow-[0_10px_24px_rgba(17,17,17,0.12)] ${className}`}
      style={style}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ background: color }}>
        <I size={18} />
      </span>
      {children}
    </motion.span>
  )
}

// Compteur en direct : avatars des derniers inscrits, total, inscrits du jour, pays.
function Live({ h, s, lang, light }) {
  if (s.members == null) return <div className="h-[52px]" />
  const names = s.latest.length ? s.latest.slice(0, 3).map((x) => x.name) : ['A', 'Y', 'K']
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5" aria-hidden>
        {names.map((n, i) => (
          <span key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-body text-[13px] font-bold text-white ${light ? 'border-white' : 'border-[#f1f1f1]'}`} style={{ background: avatarColor(i) }}>
            {n.trim()[0]?.toUpperCase()}
          </span>
        ))}
      </div>
      <div>
        <p className="font-display text-[20px] font-bold tracking-[-0.4px] text-noir">
          {fmtNumber(s.members, lang)} {h.members(s.members)}
        </p>
        <p className="flex items-center gap-1.5 font-body text-[13px] text-gris">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
          </span>
          {[h.live, s.countries ? h.countries(fmtNumber(s.countries, lang)) : null].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  )
}

// Dernier inscrit (« Aminata D. vient de s'inscrire · il y a 1 min »), sans ville.
function Latest({ h, s, lang }) {
  const x = s.latest[0]
  if (!x) return null
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={x.name + x.at}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="inline-flex h-10 max-w-full items-center gap-2 rounded-full border border-ligne bg-white pl-1.5 pr-3.5 font-body text-[13px]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marque text-[12px] font-bold text-white">{x.name.trim()[0]?.toUpperCase()}</span>
        <span className="truncate font-semibold">{h.latest(x.name)}</span>
        <span className="shrink-0 text-gris">· {ago(x.at, lang)}</span>
      </motion.span>
    </AnimatePresence>
  )
}

const FACT_ICONS = [
  [Timer, '#111111'],
  [ListChecks, '#111111'],
  [Sparkles, '#111111'],
]

function Facts({ h }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {h.facts.map((f, i) => {
        const [I, c] = FACT_ICONS[i]
        return (
          <li key={f} className="flex items-center gap-2.5 font-body text-[15px] font-medium text-noir">
            <I size={20} style={{ color: c }} />
            {f}
          </li>
        )
      })}
    </ul>
  )
}

// Hero : même composition que la landing (mot géant, carte sur le rocher), carte indigo.
function Hero({ h, s, lang, signupHref, member, referrer }) {
  const { w, h: vh } = useViewport()
  const scale = Math.min(w / 1440, Math.max(vh, 760) / 900)
  const ms = Math.min(w / 390, 1.5)
  const account = member ? { to: PATHS.member, label: HOME[lang].nav.space } : { to: PATHS.login, label: h.login }
  const buttons = (
    <div className="flex flex-wrap gap-2.5">
      <Link to={signupHref} className="inline-flex h-[54px] items-center justify-center rounded-full bg-marque px-[26px] font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b]">
        {h.start}
      </Link>
      <Link to={account.to} className="inline-flex h-[54px] items-center justify-center rounded-full border border-ligne bg-white px-[22px] font-body text-[15px] font-semibold text-noir hover:border-noir">
        {account.label}
      </Link>
    </div>
  )
  return (
    <section id="accueil" className="relative overflow-hidden bg-[#f1f1f1]">
      {/* Desktop : scène 1440 × 900 mise à l'échelle */}
      <div className="relative hidden lg:block" style={{ height: 900 * scale }}>
        <div className="absolute left-1/2 top-0 h-[900px] w-[1440px] origin-top" style={{ transform: `translateX(-50%) scale(${scale})` }}>
          <motion.p
            aria-hidden
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="pointer-events-none absolute inset-x-0 top-[110px] select-none text-center font-display text-[300px] font-extrabold leading-none tracking-[-12px] text-[#e2e2e2]"
          >
            {h.word}
          </motion.p>
          <motion.img
            src="/img/landing/hero-rocher.webp"
            alt=""
            className="absolute left-[385px] top-[-104px] h-[1166px] w-[651px] max-w-none"
            initial={{ y: 720 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.5, ease: EASE, delay: 0.2 }}
          />
          <motion.div className="absolute inset-0" initial={{ y: 900, rotate: 10 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 1.6, ease: EASE, delay: 0.35 }}>
            <img src="/img/landing/hero-carte-indigo.webp" alt="" className="absolute left-[385px] top-[-104px] h-[1166px] w-[651px] max-w-none" />
            <CardMarks logo={[780.55, 265]} visa={[671.37, 625]} k={[18, 23]} size={18} gap={7} visaSize={26} />
          </motion.div>

          <Chip icon={Store} color="#15803d" style={{ left: 1010, top: 180 }} delay={0.4}>{h.chips[0]}</Chip>
          <Chip icon={UserPlus} color="#0676f8" style={{ left: 930, top: 330 }} delay={0.9}>{h.chips[1]}</Chip>
          <Chip icon={Heart} color={VIOLET} style={{ left: 330, top: 330 }} delay={0.2}>{h.chips[2]}</Chip>

          <Reveal delay={0.9} className="absolute left-[100px] top-[470px] flex w-[330px] flex-col gap-6">
            {referrer && (
              <span className="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-[#ffe6d5] px-3 font-body text-[13px] font-medium text-[#9a3412]">
                <UserPlus size={14} />
                {h.invited(referrer)}
              </span>
            )}
            <p className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.5px] text-noir">{h.lead}</p>
            <Live h={h} s={s} lang={lang} />
            <Facts h={h} />
            <Latest h={h} s={s} lang={lang} />
          </Reveal>

          <Reveal delay={1} className="absolute left-[940px] top-[470px] flex w-[440px] flex-col gap-[18px]">
            <h1 className="font-display text-[52px] font-bold leading-[1.04] tracking-[-2px] text-noir">
              {h.title[0]}
              <br />
              {h.title[1]}
            </h1>
            <p className="font-body text-[18px] leading-[1.5] text-noir">{h.sub}</p>
            {buttons}
          </Reveal>
        </div>
      </div>

      {/* Mobile */}
      <div className="px-5 pb-10 pt-[100px] lg:hidden">
        <div className="flex flex-col gap-5">
          {referrer && (
            <span className="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-[#ffe6d5] px-3 font-body text-[13px] font-medium text-[#9a3412]">
              <UserPlus size={14} />
              {h.invited(referrer)}
            </span>
          )}
          <h1 className="font-display text-[42px] font-bold leading-[1.03] tracking-[-1.6px] text-noir">
            {h.title[0]} {h.title[1]}
          </h1>
          <p className="font-body text-[17px] leading-[1.5] text-noir">{h.sub}</p>
          {buttons}
          <Live h={h} s={s} lang={lang} />
        </div>
        <div className="relative -mx-5 mt-2 overflow-hidden" style={{ height: 500 * ms }} aria-hidden>
          <div className="absolute left-1/2 top-0 h-[500px] w-[390px] origin-top" style={{ transform: `translateX(-50%) scale(${ms})` }}>
          <p className="absolute inset-x-0 top-[90px] text-center font-display text-[92px] font-extrabold leading-none tracking-[-4px] text-[#e2e2e2]">{h.word}</p>
          <div className="absolute left-1/2 top-[-150px] h-[752px] w-[420px] -translate-x-1/2">
            <img src="/img/landing/hero-rocher.webp" alt="" className="absolute inset-0 h-full w-full max-w-none" />
            <img src="/img/landing/hero-carte-indigo.webp" alt="" className="absolute inset-0 h-full w-full max-w-none" />
            <CardMarks logo={[241, 238]} visa={[178, 471]} k={[12, 15]} size={12} gap={4} visaSize={17} />
          </div>
          <Chip icon={UserPlus} color="#0676f8" className="!h-11 text-[13px]" style={{ right: 12, top: 40 }}>{h.chips[1]}</Chip>
          <Chip icon={Heart} color={VIOLET} className="!h-11 text-[13px]" style={{ left: 12, top: 300 }} delay={0.6}>{h.chips[2]}</Chip>
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-5">
          <Facts h={h} />
          <Latest h={h} s={s} lang={lang} />
        </div>
      </div>
    </section>
  )
}

// Simulateur de cashback : commerce + montant libre, taux d'exemple fixe.
const RATE = 3
const CATS = [
  ['grocery', ShoppingBasket],
  ['butcher', Beef],
  ['restaurant', Utensils],
  ['hair_salon', Scissors],
]
const QUICK = [100, 250, 500, 1000]

function Simulator({ t, lang }) {
  const [cat, setCat] = useState('grocery')
  const [raw, setRaw] = useState('250')
  const amount = Math.min(Math.max(Number(String(raw).replace(',', '.')) || 0, 0), 100000)
  const money = (n) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n)
  const monthly = Math.round(amount * RATE) / 100
  const yearly = Math.round(monthly * 12 * 100) / 100
  return (
    <section className="px-5 py-16 lg:px-10 lg:py-28 xl:px-[120px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,620px)] xl:gap-20">
        <Reveal className="flex flex-col items-start gap-6">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-clair px-3 font-body text-[12px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-marque" />
            {t.eyebrow}
          </span>
          <h2 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-1.2px] lg:text-[48px] lg:tracking-[-1.5px]">{t.title}</h2>
          <p className="font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{t.text}</p>
          <p className="flex items-start gap-2.5 rounded-2xl bg-clair px-4 py-3.5 font-body text-[14px] leading-[1.5] text-gris">
            <Info size={18} className="mt-px shrink-0" />
            {t.note}
          </p>
        </Reveal>
        <Reveal delay={0.1} y={40} className="flex min-w-0 flex-col gap-7 rounded-[32px] border border-ligne bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,0.06)] lg:p-9">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-body text-[14px] font-semibold">{t.q1}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {CATS.map(([id, I]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={cat === id}
                  onClick={() => setCat(id)}
                  className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full font-body text-[14px] font-semibold transition-colors ${cat === id ? 'bg-noir text-white' : 'bg-clair text-noir hover:bg-ligne'}`}
                >
                  <I size={16} />
                  {t.categories[id]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-3.5">
            <label htmlFor="sim-amount" className="font-body text-[14px] font-semibold">
              {t.q2}
            </label>
            <div className="flex h-16 items-center gap-2 rounded-[18px] border-[1.5px] border-noir px-5">
              <input
                id="sim-amount"
                inputMode="decimal"
                aria-label={t.amountLabel}
                value={raw}
                onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, '').slice(0, 7))}
                className="min-w-0 flex-1 bg-transparent font-display text-[28px] font-bold tracking-[-0.6px] outline-none"
              />
              <span className="shrink-0 font-body text-[16px] font-medium text-gris">{t.perMonth}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRaw(String(v))}
                  className={`h-9 cursor-pointer rounded-full px-3.5 font-body text-[14px] font-semibold ${amount === v ? 'bg-[#fff1e7] text-[#c2410c]' : 'bg-clair hover:bg-ligne'}`}
                >
                  {money(v)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex items-end justify-between gap-6 overflow-hidden rounded-[24px] bg-noir p-7" aria-live="polite">
            <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-80" />
            <div className="relative flex flex-col gap-1">
              <span className="font-body text-[14px] text-white/70">{t.monthly}</span>
              <span className="font-display text-[44px] font-bold leading-none tracking-[-2px] text-white lg:text-[56px]">{money(monthly)}</span>
            </div>
            <div className="relative flex flex-col items-end gap-1 pb-1.5">
              <span className="font-body text-[14px] text-white/70">{t.yearly}</span>
              <span className="font-display text-[24px] font-bold leading-none text-white lg:text-[28px]">{money(yearly)}</span>
            </div>
          </div>
          <p className="font-body text-[13px] leading-[1.5] text-gris">{t.detail(fmtNumber(RATE, lang), t.catArticle[cat], money(amount), money(monthly))}</p>
        </Reveal>
      </div>
    </section>
  )
}

// Quatre étapes : frise pointillée numérotée, une carte par étape (maquette + texte + coches).
const STEP_TONES = [
  ['#fd8030', '#ffe3cc'],
  ['#0676f8', '#dcebff'],
  [VIOLET, '#eedfff'],
  ['#15803d', '#d9f2e1'],
]

function MockCard({ children, className = '' }) {
  return <div className={`flex w-full max-w-[400px] flex-col gap-3 rounded-[22px] bg-white p-[22px] shadow-[0_18px_40px_rgba(17,17,17,0.1)] ${className}`}>{children}</div>
}

function StepMock({ i, m }) {
  if (i === 0)
    return (
      <MockCard>
        <div className="flex items-center gap-3.5 pb-1.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marque font-body text-[17px] font-bold text-white">AK</span>
          <span>
            <span className="block font-body text-[18px] font-semibold">Awa Koné</span>
            <span className="block font-body text-[14px] text-gris">awa.kone@gmail.com</span>
          </span>
        </div>
        {[
          [UserPlus, m.invited],
          [Lock, m.password],
        ].map(([I, l]) => (
          <span key={l} className="flex h-[52px] items-center gap-3 rounded-[14px] bg-clair px-4 font-body text-[16px] font-medium">
            <I size={20} />
            {l}
          </span>
        ))}
      </MockCard>
    )
  if (i === 1)
    return (
      <MockCard>
        <span className="font-body text-[12px] font-semibold tracking-[0.6px] text-gris">{m.question}</span>
        <span className="font-body text-[17px] font-semibold">{m.questionText}</span>
        {m.options.map((o, k) => (
          <span key={o} className={`flex items-center gap-3 py-1 font-body text-[16px] ${k ? 'text-gris' : ''}`}>
            {k ? <Circle size={22} className="text-[#c4c4c4]" /> : <CircleCheck size={22} className="text-bleu" />}
            {o}
          </span>
        ))}
        <span className="h-1.5 rounded-full bg-ligne">
          <span className="block h-1.5 w-[36%] rounded-full bg-bleu" />
        </span>
      </MockCard>
    )
  if (i === 2)
    return (
      <div className="relative w-full max-w-[420px] pt-8">
        <MockCard>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-noir">
              <img src="/img/landing/k-white.png" alt="" className="h-[15px] w-3 object-contain" />
            </span>
            <span className="flex-1 font-body text-[14px] font-semibold">KRISMA</span>
            <span className="font-body text-[13px] text-gris">{m.now}</span>
          </div>
          <span className="font-display text-[18px] font-bold">{m.subject}</span>
          <span className="flex h-[46px] items-center justify-center rounded-full bg-marque font-body text-[15px] font-semibold text-white">{m.confirm}</span>
        </MockCard>
        <span className="absolute right-0 top-0 flex h-11 items-center gap-2 rounded-full bg-noir px-[18px] font-body text-[15px] font-bold text-white shadow-[0_12px_30px_rgba(17,17,17,0.2)]">
          <Sparkles size={16} style={{ color: VIOLET }} />
          {m.points}
        </span>
      </div>
    )
  return (
    <MockCard>
      <div className="flex items-center justify-between pb-1">
        <span className="font-display text-[30px] font-bold tracking-[-1px]">#1 248</span>
        <span className="flex h-7 items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 font-body text-[13px] font-semibold text-vert">
          <TrendingUp size={14} />
          {m.up}
        </span>
      </div>
      {m.rows.map(([p, l], k) => (
        <span key={l} className="flex h-12 items-center gap-3 rounded-[14px] bg-clair px-3.5 font-body text-[15px] font-medium">
          <span className="flex h-7 w-11 items-center justify-center rounded-full font-body text-[13px] font-bold text-white" style={{ background: ['#fd8030', '#15803d', '#0676f8'][k] }}>
            {p}
          </span>
          <span className="truncate">{l}</span>
        </span>
      ))}
    </MockCard>
  )
}

function Steps({ t }) {
  return (
    <section id="etapes" className="scroll-mt-24 bg-[#f7f7f7] px-5 py-16 lg:px-10 lg:py-28 xl:px-[120px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="flex flex-col gap-5 lg:sticky lg:top-32 lg:self-start">
          <h2 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-1.4px] lg:text-[56px] lg:tracking-[-2px]">{t.title}</h2>
          <p className="font-body text-[16px] leading-[1.6] text-gris">{t.sub}</p>
        </Reveal>
        <ol className="flex flex-col">
          {t.items.map((step, i) => {
            const [c, tint] = STEP_TONES[i]
            const last = i === t.items.length - 1
            return (
              <li key={step.title} className="flex gap-4 lg:gap-8">
                <div className="flex w-11 shrink-0 flex-col items-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full font-body text-[16px] font-semibold text-white" style={{ background: c }}>
                    {i + 1}
                  </span>
                  {!last && <span className="mt-2 w-0 flex-1 border-l-2 border-dashed border-[#bdbdbd]" />}
                </div>
                <Reveal delay={0.05} y={30} className={`min-w-0 flex-1 ${last ? '' : 'pb-10'}`}>
                  <div className="flex flex-col gap-7 rounded-[28px] border border-ligne bg-white p-4 lg:p-6">
                    <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-[20px] px-4 py-8 lg:h-[300px] lg:py-0" style={{ background: `radial-gradient(70% 70% at 50% 35%, ${tint}, #f7f7f7)` }}>
                      <div className="flex w-[360px] shrink-0 justify-center max-sm:-my-14 max-sm:scale-[0.64]">
                        <StepMock i={i} m={t.mock} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 px-2 pb-2 lg:px-3">
                      <h3 className="font-display text-[24px] font-bold leading-[1.15] tracking-[-0.8px] lg:text-[26px]">{step.title}</h3>
                      <p className="font-body text-[16px] leading-[1.5] text-gris">{step.text}</p>
                      <ul className="mt-1.5 flex flex-col gap-2">
                        {step.checks.map((ch) => (
                          <li key={ch} className="flex items-start gap-2.5 font-body text-[15px]">
                            <CircleCheck size={18} className="mt-0.5 shrink-0" style={{ color: c }} />
                            {ch}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// Quatre actions : bento (sombre, photo, maquette carte, avatars).
function Pts({ value, color }) {
  return (
    <span className="inline-flex h-8 items-center rounded-full px-3.5 font-display text-[15px] font-bold text-white" style={{ background: color }}>
      {value}
    </span>
  )
}

function CardHead({ item, color, dark }) {
  const [value, title, text] = item
  return (
    <div className="relative flex flex-col items-center gap-2 text-center">
      <Pts value={value} color={color} />
      <h3 className={`font-display text-[24px] font-bold leading-[1.15] tracking-[-0.8px] lg:text-[28px] ${dark ? 'text-white' : 'text-noir'}`}>{title}</h3>
      <p className={`max-w-[420px] font-body text-[15px] leading-[1.5] lg:text-[16px] ${dark ? 'text-white/80' : 'text-gris'}`}>{text}</p>
    </div>
  )
}

const PIN = 'M22 0c-12.15 0-22 9.85-22 22 0 15.5 22 32 22 32s22-16.5 22-32c0-12.15-9.85-22-22-22z'

function Pin({ x, y, c, I }) {
  return (
    <span className="absolute h-[54px] w-[44px] drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] max-sm:scale-75" style={{ left: `${x}%`, top: `${y}%` }}>
      <svg viewBox="0 0 44 54" className="absolute inset-0 h-full w-full">
        <path d={PIN} fill={c} />
      </svg>
      <I size={20} className="absolute left-3 top-[11px] text-white" />
    </span>
  )
}

function Bento({ t }) {
  return (
    <section id="points" className="scroll-mt-24 px-5 py-16 lg:px-10 lg:py-28 xl:px-[120px]">
      <Reveal className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-clair px-3 font-body text-[12px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-marque" />
          {t.eyebrow}
        </span>
        <h2 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] lg:text-[52px] lg:tracking-[-1.8px]">{t.title}</h2>
        <p className="font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{t.sub}</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-[1200px] grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Reveal className="relative flex h-[410px] flex-col justify-end overflow-hidden rounded-[28px] bg-noir p-8 lg:p-9">
            <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-90" />
            <div className="absolute left-1/2 top-5 h-[190px] w-[380px] -translate-x-1/2 max-sm:scale-[0.85]" aria-hidden>
              {[
                [ListChecks, '#fff', '#111', 4, 20, 6],
                [MailCheck, '#fd8030', '#fff', -3, 70, 62],
                [BadgeCheck, '#fff', '#111', 0, 40, 118],
              ].map(([I, bg, fg, r, x, y], k) => (
                <span key={k} className="absolute flex h-16 w-[300px] items-center gap-3 rounded-[18px] px-[18px] font-body text-[17px] font-semibold shadow-[0_16px_36px_rgba(0,0,0,0.3)]" style={{ left: x, top: y, rotate: `${r}deg`, background: bg, color: fg }}>
                  <I size={22} />
                  {t.stack[k]}
                </span>
              ))}
            </div>
            <CardHead item={t.signup} color="#fd8030" dark />
          </Reveal>
          <Reveal delay={0.08} className="relative flex h-[330px] flex-col justify-end overflow-hidden rounded-[28px] p-8 lg:p-9">
            <img src="/img/waitlist/parrainage.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
            <span className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-[#111111e6]" />
            <CardHead item={t.referral} color="#0676f8" dark />
          </Reveal>
        </div>
        <div className="flex flex-col gap-5">
          <Reveal delay={0.04} className="flex h-[500px] flex-col items-center gap-6 overflow-hidden rounded-[28px] border border-ligne bg-white px-8 pb-9">
            <div className="relative h-[300px] w-full max-w-[300px] shrink-0 overflow-hidden rounded-b-[40px] bg-noir px-2.5 pb-2.5" aria-hidden>
              <div className="relative h-full w-full overflow-hidden rounded-b-[32px] bg-[#eef0ea]">
                <img src="/img/waitlist/carte-quartier.webp" alt="" className="absolute left-[-60%] top-[-30%] w-[240%] max-w-none" />
                <Pin x={20} y={20} c="#15803d" I={Store} />
                <Pin x={57} y={40} c="#111111" I={Beef} />
                <Pin x={37} y={57} c="#fd8030" I={Scissors} />
                <span className="absolute bottom-3 left-3.5 right-3.5 flex h-[60px] items-center gap-2.5 rounded-2xl bg-white px-3 shadow-[0_6px_16px_rgba(17,17,17,0.12)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#dcfce7] text-vert">
                    <Store size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-body text-[14px] font-semibold">{t.shopName}</span>
                    <span className="block font-body text-[12px] font-semibold text-vert">{t.shopStatus}</span>
                  </span>
                </span>
              </div>
            </div>
            <CardHead item={t.shop} color="#15803d" />
          </Reveal>
          <Reveal delay={0.12} className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[28px] border border-ligne bg-white p-8">
            <div className="flex items-center" aria-hidden>
              {['A', 'Y', 'K', 'F'].map((l, k) => (
                <span key={l} className="-ml-3 flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-white font-body text-[17px] font-bold text-white first:ml-0" style={{ background: ['#fd8030', '#0676f8', VIOLET, '#15803d'][k] }}>
                  {l}
                </span>
              ))}
              <span className="-ml-3 flex h-[52px] items-center gap-1 rounded-full border-[3px] border-white bg-noir px-4 font-body text-[15px] font-bold text-white">
                <Heart size={14} variant="Bold" className="text-marque" />
                124
              </span>
            </div>
            <CardHead item={t.vote} color={VIOLET} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// Récompenses : bloc noir aux rayons orange, contenu centré.
function Rewards({ t, start, signupHref }) {
  return (
    <section className="px-5 pb-16 lg:px-10 lg:pb-24 xl:px-[120px]">
      <Reveal className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-[18px] overflow-hidden rounded-[28px] bg-noir px-6 py-16 text-center lg:min-h-[420px] lg:justify-center lg:py-24">
        <img src="/img/landing/rayons-liste.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <h2 className="relative font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] text-white lg:text-[52px] lg:tracking-[-1.8px]">{t.title}</h2>
        <p className="relative max-w-[640px] font-body text-[16px] leading-[1.6] text-[#d4d4d4] lg:text-[17px]">{t.text}</p>
        <div className="relative mt-2 flex flex-wrap justify-center gap-3">
          <Link to={signupHref} className="inline-flex h-[52px] items-center rounded-full bg-marque px-7 font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b]">
            {start}
          </Link>
          <Link to="/reglement" className="inline-flex h-[52px] items-center rounded-full bg-white px-6 font-body text-[15px] font-semibold text-noir">
            {t.rules}
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

// KRISMA Map, version verticale : en-tête, la vraie carte en direct, trois actions.
const ACTION_TONES = [
  [Plus, '#fd8030', '#fff1e7'],
  [Heart, VIOLET, '#f5ecff'],
  [Bell, '#0676f8', '#e8f2ff'],
]

function MapSection({ t, lang }) {
  return (
    <section id="carte" className="scroll-mt-24 bg-[#f7f7f7] px-5 py-16 lg:px-10 lg:py-28 xl:px-[120px]">
      <Reveal className="mx-auto flex max-w-[760px] flex-col items-center gap-4 text-center">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-3 font-body text-[12px] font-semibold">
          <MapPin size={14} className="text-vert" />
          {t.eyebrow}
        </span>
        <h2 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] lg:text-[52px] lg:tracking-[-1.8px]">{t.title}</h2>
        <p className="font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{t.text}</p>
      </Reveal>
      <LiveMap lang={lang} t={t} />
      <div className="mx-auto mt-5 grid max-w-[1200px] gap-5 md:grid-cols-3">
        {t.actions.map(([p, title, text], i) => {
          const [I, c, bg] = ACTION_TONES[i]
          return (
            <Reveal key={title} delay={i * 0.06} className="flex flex-col gap-3.5 rounded-[24px] bg-white p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ background: bg, color: c }}>
                  <I size={20} />
                </span>
                <span className="flex h-7 items-center rounded-full px-3 font-body text-[13px] font-bold" style={{ background: bg, color: c }}>
                  {p}
                </span>
              </div>
              <h3 className="font-display text-[20px] font-bold tracking-[-0.4px]">{title}</h3>
              <p className="font-body text-[15px] leading-[1.5] text-gris">{text}</p>
            </Reveal>
          )
        })}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/carte" className="inline-flex h-[54px] items-center gap-2.5 rounded-full bg-noir px-7 font-body text-[15px] font-semibold text-white hover:bg-[#2b2b2b]">
          <MapIcon size={16} />
          {t.cta}
        </Link>
      </div>
    </section>
  )
}

// W01 v2 — Page de la liste d'attente.
export default function Home() {
  const { lang } = useLang()
  const h = HOME[lang]
  const location = useLocation()
  const stats = usePublicStats()
  const [referrer, setReferrer] = useState(null)
  const [member, setMember] = useState(false)

  // E-mail saisi sur la page d'accueil et code de parrainage : transmis à l'inscription.
  const signupHref = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const forward = new URLSearchParams()
    if (params.get('email')) forward.set('email', params.get('email'))
    if (params.get('news')) forward.set('news', '1')
    return `${PATHS.signup}${forward.size ? `?${forward}` : ''}`
  }, [location.search])

  useEffect(() => {
    captureReferral(location.search)
    const ref = store.ref()
    if (ref) rpc('get_referrer', { p_code: ref }).then((r) => setReferrer(r?.pseudo || null), () => {})
    waitForSession(400).then(async (s) => {
      if (s && !s.user.is_anonymous) setMember((await myDashboard()).status === 'verified')
    })
  }, [location.search])

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white">
      <Header h={h} member={member} signupHref={signupHref} />
      <main>
        <Hero h={h.hero} s={stats} lang={lang} signupHref={signupHref} member={member} referrer={referrer} />
        <Simulator t={h.simulator} lang={lang} />
        <Steps t={h.steps} />
        <Bento t={h.points} />
        <Rewards t={h.rewards} start={h.hero.start} signupHref={signupHref} />
        <MapSection t={h.map} lang={lang} />
        <Faq f={h.faq} />
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
