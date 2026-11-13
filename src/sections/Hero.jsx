import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Globe, ShieldCheck, Users } from '../components/icons'
import Button from '../components/Button'
import { CardMarks } from '../components/CardMark'
import { EASE } from '../components/Reveal'
import { useViewport } from '../components/useStage'
import { useLang } from '../i18n'
import { avatarColor, fmtNumber, usePublicStats } from '../lib/publicStats'

// Compteur en direct sous le bouton : avatars des derniers inscrits + total.
function LiveCount({ className = '' }) {
  const { t, lang } = useLang()
  const s = usePublicStats()
  if (s.members == null) return <div className={`h-9 ${className}`} />
  const names = s.latest.length ? s.latest.slice(0, 3).map((x) => x.name) : ['A', 'Y', 'K']
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex -space-x-2.5" aria-hidden>
        {names.map((n, i) => (
          <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f1f1f1] font-body text-[13px] font-bold text-white" style={{ background: avatarColor(i) }}>
            {n.trim()[0]?.toUpperCase()}
          </span>
        ))}
      </div>
      <div className="flex flex-col">
        <p className="font-body text-[15px] text-noir">
          <span className="font-display font-bold">{fmtNumber(s.members, lang)}</span> {t.hero.live.people(s.members)}
        </p>
        <p className="flex items-center gap-1.5 font-body text-[13px] text-gris">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#22c55e]" />
          </span>
          {t.hero.live.status}
        </p>
      </div>
    </div>
  )
}

const ICONS = [ShieldCheck, Globe, Users]

// Letters of the giant word rise one after the other.
function Wordmark({ style, className }) {
  return (
    <motion.div
      aria-hidden
      style={style}
      className={`pointer-events-none flex select-none justify-center font-display font-extrabold leading-none text-[#e2e2e2] ${className}`}
    >
      {'KRISMA'.split('').map((l, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.04em]">
          <motion.span
            className="inline-block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.1 + i * 0.06 }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}

// Enters from the left (-1) or the right (1).
function Slide({ from, delay, children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: from * 180 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

function useHeroMotion(ref, offset) {
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset })
  const r = (to) => (reduce ? 0 : to)
  return {
    wordY: useTransform(p, [0, 1], [0, r(-150)]),
    wordScale: useTransform(p, [0, 1], [1, reduce ? 1 : 1.14]),
    cardY: useTransform(p, [0, 1], [0, r(-120)]),
    cardRotate: useTransform(p, [0, 1], [0, r(-9)]),
    rockY: useTransform(p, [0, 1], [0, r(190)]),
    leftX: useTransform(p, [0, 0.8], [0, r(-160)]),
    rightX: useTransform(p, [0, 0.8], [0, r(160)]),
    fade: useTransform(p, [0.1, 0.8], [1, reduce ? 1 : 0]),
  }
}

function Desktop() {
  const { t } = useLang()
  const ref = useRef(null)
  const { w, h } = useViewport()
  const m = useHeroMotion(ref, ['start start', 'end end'])
  const s = Math.min(w / 1440, h / 900)

  return (
    <div ref={ref} className="relative hidden lg:block" style={{ height: h + 520 }}>
      <div className="sticky top-0 h-svh overflow-hidden bg-[#f1f1f1]">
        <div
          className="absolute bottom-0 left-1/2 h-[900px] w-[1440px] origin-bottom"
          style={{ transform: `translateX(-50%) scale(${s})` }}
        >
          <Wordmark
            className="absolute inset-x-0 top-[99px] text-[380px] tracking-[-14px]"
            style={{ y: m.wordY, scale: m.wordScale }}
          />

          <motion.div className="absolute inset-0" style={{ y: m.rockY }}>
            <motion.img
              src="/img/landing/hero-rocher.webp"
              alt=""
              className="absolute left-[385px] top-[-104px] h-[1166px] w-[651px] max-w-none"
              initial={{ y: 720 }}
              animate={{ y: 0 }}
              transition={{ duration: 1.5, ease: EASE, delay: 0.25 }}
            />
          </motion.div>

          <motion.div className="absolute inset-0 origin-[720px_700px]" style={{ y: m.cardY, rotate: m.cardRotate }}>
            <motion.div
              className="absolute inset-0"
              initial={{ y: 900, rotate: 10 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
            >
              <img
                src="/img/landing/hero-carte.webp"
                alt=""
                className="absolute left-[385px] top-[-104px] h-[1166px] w-[651px] max-w-none"
              />
              <CardMarks logo={[780.55, 265]} visa={[671.37, 625]} k={[18, 23]} size={18} gap={7} visaSize={26} />
            </motion.div>
          </motion.div>

          <motion.div className="absolute left-[100px] top-[470px] w-[300px]" style={{ x: m.leftX, opacity: m.fade }}>
            <ul className="flex flex-col gap-3.5">
              {t.hero.perks.map((p, i) => {
                const I = ICONS[i]
                return (
                  <Slide key={p} from={-1} delay={1.02 + i * 0.1}>
                    <li className="flex items-center gap-2.5 font-body text-[15px] font-medium text-noir">
                      <I size={20} />
                      {p}
                    </li>
                  </Slide>
                )
              })}
            </ul>
          </motion.div>

          <motion.div className="absolute left-[1000px] top-[470px] w-[340px]" style={{ x: m.rightX, opacity: m.fade }}>
            <Slide from={1} delay={0.95}>
              <h1 className="whitespace-nowrap font-display text-[44px] font-bold leading-[1.04] tracking-[-1.5px] text-noir">
                {t.hero.title[0]}
                <br />
                {t.hero.title[1]}
              </h1>
            </Slide>
            <Slide from={1} delay={1.07} className="mt-[18px]">
              <p className="font-body text-[18px] leading-[1.5] text-noir">{t.hero.sub}</p>
            </Slide>
            <Slide from={1} delay={1.19} className="mt-[18px]">
              <Button className="h-[54px]">{t.nav.cta}</Button>
            </Slide>
            <Slide from={1} delay={1.31} className="mt-5">
              <LiveCount />
            </Slide>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function Mobile() {
  const { t } = useLang()
  const ref = useRef(null)
  const { w } = useViewport()
  const m = useHeroMotion(ref, ['start start', 'end start'])
  const s = Math.min(w / 390, 1.5)

  return (
    <div ref={ref} className="relative overflow-hidden bg-[#f1f1f1] lg:hidden" style={{ height: 880 * s }}>
      <div className="absolute left-1/2 top-0 h-[880px] w-[390px] origin-top" style={{ transform: `translateX(-50%) scale(${s})` }}>
        <Wordmark
          className="absolute inset-x-0 top-[408px] text-[98px] tracking-[-3px]"
          style={{ y: m.wordY, scale: m.wordScale }}
        />
        <motion.div className="absolute inset-0" style={{ y: m.rockY }}>
          <motion.img
            src="/img/landing/hero-rocher.webp"
            alt=""
            className="absolute left-[-15px] top-[232px] h-[752px] w-[420px] max-w-none"
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.5, ease: EASE, delay: 0.25 }}
          />
        </motion.div>
        <motion.div className="absolute inset-0 origin-[195px_720px]" style={{ y: m.cardY, rotate: m.cardRotate }}>
          <motion.div
            className="absolute inset-0"
            initial={{ y: 600, rotate: 10 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.4 }}
          >
            <img
              src="/img/landing/hero-carte.webp"
              alt=""
              className="absolute left-[-15px] top-[232px] h-[752px] w-[420px] max-w-none"
            />
            <CardMarks logo={[226, 470]} visa={[163, 703]} k={[12, 15]} size={12} gap={4} visaSize={17} />
          </motion.div>
        </motion.div>

        <motion.div className="absolute left-5 top-[100px] w-[350px]" style={{ opacity: m.fade }}>
          <Slide from={-1} delay={0.7}>
            <h1 className="whitespace-nowrap font-display text-[40px] font-bold leading-[1.04] tracking-[-1.2px] text-noir">
              {t.hero.title[0]}
              <br />
              {t.hero.title[1]}
            </h1>
          </Slide>
          <Slide from={1} delay={0.92} className="mt-3.5">
            <p className="font-body text-[17px] leading-[1.5] text-noir">{t.hero.sub}</p>
          </Slide>
          <Slide from={1} delay={1.04} className="mt-3.5">
            <Button className="h-[54px] w-full">{t.nav.cta}</Button>
          </Slide>
          <Slide from={1} delay={1.16} className="mt-4">
            <LiveCount />
          </Slide>
        </motion.div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="hero">
      <Desktop />
      <Mobile />
    </section>
  )
}
