import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Coffee, Gift, Percent, ShoppingBag, Store, Utensils } from '../components/icons'
import Count from '../components/Count'
import Reveal, { EASE } from '../components/Reveal'
import { useViewport } from '../components/useStage'
import { useLang } from '../i18n'

const Tile = ({ className = '', children, delay = 0 }) => (
  <Reveal delay={delay} y={48} className={`relative overflow-hidden rounded-[28px] ${className}`}>
    {children}
  </Reveal>
)

const num = (lang, n, d = 0) =>
  n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ')

function Account() {
  const { t, lang } = useLang()
  const a = t.bento.account
  const balance = (n) => (lang === 'fr' ? `€ ${num(lang, n, 2)}` : `€${num(lang, n, 2)}`)
  const money = (n) => (lang === 'fr' ? `${num(lang, n)} €` : `€${num(lang, n)}`)
  const rows = [
    { I: ArrowUpRight, l: a.spending, v: 3899 },
    { I: ArrowDownLeft, l: a.income, v: 8300 },
  ]
  return (
    <Tile className="min-h-[540px] bg-anthracite text-white lg:h-[580px] lg:flex-[504]">
      <motion.svg
        viewBox="0 0 504 210"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[96px] h-[210px] w-full"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: EASE, delay: 0.2 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="solde" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.27" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 150c30 0 40-32 70-32l40 0c20 0 24-26 48-26 24 0 28 32 50 32 32 0 42-48 82-50l50-2c22 0 26 32 52 32 28 0 54-86 84-86l28 0 0 192-504 0z" fill="url(#solde)" />
      </motion.svg>
      <div className="absolute inset-x-6 top-6 flex flex-col gap-2 lg:inset-x-8 lg:top-8">
        <h3 className="font-display text-[32px] font-semibold leading-[1.06] tracking-[-1px]">{a.title}</h3>
        <p className="max-w-[360px] font-body text-[16px] leading-[1.55]">{a.text}</p>
      </div>
      <div className="absolute inset-x-6 bottom-[22px] flex flex-col gap-[22px] lg:inset-x-8 lg:bottom-[42px]">
        <div className="flex flex-col items-center gap-0.5">
          <Count value={28901.5} format={balance} className="font-display text-[44px] font-medium leading-[1.06] tracking-[-1px] lg:text-[48px]" />
          <span className="font-body text-[14px]">{a.balance}</span>
        </div>
        <div className="flex gap-3">
          {[a.deposit, a.send].map((l) => (
            <span key={l} className="flex h-[50px] flex-1 items-center justify-center rounded-xl bg-white/18 font-body text-[15px] font-medium">
              {l}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-3.5">
          {rows.map(({ I, l, v }) => (
            <div key={l} className="flex items-center justify-between">
              <span className="flex items-center gap-3 font-body text-[17px] font-medium">
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/20">
                  <I size={18} />
                </span>
                {l}
              </span>
              <span className="flex items-baseline gap-1.5">
                <Count value={v} format={money} className="font-body text-[17px] font-semibold" />
                <span className="font-body text-[13px]">{a.month}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Tile>
  )
}

const CHIPS = [
  { I: ShoppingBag, x: 46, y: 462, mx: 10, my: 296, bg: '#e7e6fc', fg: '#4f46e5' },
  { I: Utensils, x: 195, y: 377, mx: 68, my: 190, bg: '#ffe6d5', fg: '#e5620e' },
  { I: Coffee, x: 257, y: 259, mx: 99, my: 254, bg: '#dcf5e4', fg: '#15803d' },
  { I: Store, x: 486, y: 290, mx: 221, my: 183, bg: '#dbeafe', fg: '#0676f8' },
  { I: Percent, x: 450, y: 439, mx: 212, my: 254, bg: '#ffe6d5', fg: '#e5620e' },
  { I: Gift, x: 600, y: 470, mx: 292, my: 296, bg: '#e7e6fc', fg: '#4f46e5' },
]

function Partners({ wide }) {
  const { w } = useViewport()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  // The wide tile is drawn at 712 px and shrinks with the grid.
  const fit = wide ? Math.min(1, ((Math.min(w, 1440) - (w >= 1280 ? 200 : 80) - 24) * 0.5855) / 712) : 1
  const rings = wide
    ? [[46, 270, 620, '#f5f5f5'], [136, 360, 440, '#efefef'], [226, 450, 260, '#e6e6e6'], [278, 502, 156, '#fd8030']]
    : [[10, 195, 330, '#f5f5f5'], [57, 242, 236, '#efefef'], [99, 284, 152, '#e6e6e6'], [129, 314, 92, '#fd8030']]
  const base = wide ? 712 : 350
  const size = wide ? 62 : 48
  return (
    <div ref={ref} className="absolute bottom-0 left-1/2 h-full" style={{ width: base, transform: `translateX(-50%) scale(${fit})`, transformOrigin: 'bottom center' }}>
      {rings.map(([x, y, d, c], i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: x, top: y, width: d, height: d, background: c }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1.1, ease: EASE, delay: 0.1 + (3 - i) * 0.12 }}
        />
      ))}
      <motion.img
        src="/img/landing/k-white.png"
        alt=""
        className="absolute"
        style={wide ? { left: 341, top: 532, width: 29, height: 37 } : { left: 164, top: 339, width: 22, height: 28 }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
      {CHIPS.map(({ I, x, y, mx, my, bg, fg }, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: wide ? x : mx, top: wide ? y : my }}
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1, ease: EASE, delay: 0.5 + i * 0.09 }}
        >
          <span
            className="drift flex items-center justify-center rounded-full border-[0.5px] shadow-[0_8px_22px_rgba(15,20,36,0.08)]"
            style={{ width: size, height: size, background: bg, borderColor: fg, color: fg, animationDelay: `-${i * 1.1}s` }}
          >
            <I size={24} />
          </span>
        </motion.span>
      ))}
    </div>
  )
}

function PartnersTile() {
  const { t } = useLang()
  const p = t.bento.partners
  return (
    <Tile delay={0.1} className="h-[380px] bg-white lg:h-[580px] lg:flex-[712]">
      <div className="hidden h-full lg:block">
        <Partners wide />
      </div>
      <div className="h-full lg:hidden">
        <Partners />
      </div>
      <div className="absolute inset-x-6 top-6 flex flex-col gap-2 lg:left-9 lg:right-9 lg:top-8">
        <h3 className="font-display text-[28px] font-semibold leading-[1.06] tracking-[-1px] text-noir lg:text-[32px]">{p.title}</h3>
        <p className="font-body text-[16px] leading-[1.55] text-gris">{p.text}</p>
      </div>
    </Tile>
  )
}

const OUTER = [[10, 199], [12, 169], [21, 141], [35, 115], [53, 92], [76, 74], [102, 60], [130, 51], [160, 49], [189, 51], [217, 60], [243, 74], [266, 92], [284, 115], [298, 141], [307, 169], [310, 198]]
const INNER = [[55, 200], [59, 173], [69, 147], [86, 125], [108, 108], [134, 98], [161, 94], [188, 98], [214, 108], [236, 125], [253, 147], [263, 173], [267, 200]]

function Gauge({ price, per }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const dot = (x, y, r, i, on, off) => (
    <motion.circle
      key={`${x}-${y}`}
      cx={x + r}
      cy={y + r}
      r={r}
      initial={{ opacity: 0, scale: 0, fill: off }}
      animate={inView ? { opacity: 1, scale: 1, fill: on } : {}}
      transition={{ duration: 0.45, delay: 0.2 + i * 0.05 }}
    />
  )
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[333px]">
      <svg viewBox="0 0 333 230" className="w-full" aria-hidden>
        {OUTER.map(([x, y], i) => dot(x, y, 6.5, i, i < 12 ? '#0676f8' : '#e6e6e6', '#e6e6e6'))}
        {INNER.map(([x, y], i) => dot(x, y, 5, i, i < 9 ? '#bdbdbd' : '#e6e6e6', '#e6e6e6'))}
      </svg>
      <div className="absolute inset-x-0 bottom-[4%] flex flex-col items-center">
        <span className="font-display text-[44px] font-bold leading-none tracking-[-1px] text-noir">{price}</span>
        <span className="mt-1 font-body text-[14px] text-gris">{per}</span>
      </div>
    </div>
  )
}

function Offer() {
  const { t } = useLang()
  const o = t.bento.offer
  return (
    <Tile delay={0} className="flex flex-col bg-white p-8 lg:h-[452px] lg:flex-1">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-[26px] font-semibold leading-[1.06] tracking-[-1px] text-noir">{o.title}</h3>
        <span className="whitespace-nowrap rounded-full bg-clair px-3 py-1.5 font-body text-[13px] font-semibold text-noir">{o.badge}</span>
      </div>
      <Gauge price={o.price} per={o.per} />
      <div className="mt-1 flex flex-col gap-2">
        <p className="font-body text-[16px] font-semibold text-noir">{o.free}</p>
        <p className="font-body text-[14px] leading-[1.45] text-gris">{o.note}</p>
      </div>
    </Tile>
  )
}

function Field({ label, value, unit }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-body text-[13px] text-gris">{label}</span>
      <div className="flex h-14 items-center justify-between rounded-xl bg-clair px-3.5">
        {value}
        <span className="rounded-lg bg-white px-2.5 py-1.5 font-body text-[13px] font-semibold text-noir">{unit}</span>
      </div>
    </div>
  )
}

function Transfer() {
  const { t, lang } = useLang()
  const r = t.bento.transfer
  const amount = (n) => (lang === 'fr' ? `${Math.round(n)} €` : `€${Math.round(n)}`)
  const fcfa = (n) => `${num(lang, n)} FCFA`
  const big = 'font-display text-[20px] font-semibold leading-[1.06] tracking-[-0.3px] text-noir'
  return (
    <Tile delay={0.1} className="flex flex-col gap-4 bg-white p-8 lg:h-[452px] lg:flex-1">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[26px] font-semibold leading-[1.06] tracking-[-1px] text-noir">{r.title}</h3>
        <p className="font-body text-[16px] leading-[1.55] text-gris">{r.text}</p>
      </div>
      <Field label={r.send} value={<Count value={500} format={amount} className={big} />} unit="EUR" />
      <Field label={r.receive} value={<Count value={327500} format={fcfa} className={big} />} unit="XOF" />
      <div className="flex justify-between font-body text-[13px] text-gris">
        <span>{r.fee}</span>
        <span>{r.rate}</span>
      </div>
      <a href="#contact" className="flex h-[52px] items-center justify-center rounded-full bg-marque font-body text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:bg-[#f06e1b]">
        {r.cta}
      </a>
    </Tile>
  )
}

// Six people seen from above, arms linked in a circle.
function CommunitySymbol() {
  const N = 6
  const step = (2 * Math.PI) / N
  const P = (r, a) => [60 + r * Math.cos(a), 60 + r * Math.sin(a)]
  const items = Array.from({ length: N }, (_, i) => -Math.PI / 2 + i * step)
  const arcs = items
    .map((a) => {
      const [x0, y0] = P(44, a - step / 2)
      const [cx, cy] = P(6, a)
      const [x1, y1] = P(44, a + step / 2)
      return `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`
    })
    .join('')
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="h-[120px] w-[120px] text-bleu lg:text-indigo"
      initial={{ rotate: -120, opacity: 0, scale: 0.6 }}
      whileInView={{ rotate: 0, opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
      aria-hidden
    >
      <path d={arcs} fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
      {items.map((a, i) => {
        const [x, y] = P(38, a)
        return <circle key={i} cx={x} cy={y} r="8.5" fill="currentColor" />
      })}
    </motion.svg>
  )
}

function Community() {
  const { t } = useLang()
  const c = t.bento.community
  return (
    <Tile delay={0.2} className="flex flex-col gap-4 bg-white p-8 lg:h-[452px] lg:flex-1">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[26px] font-semibold leading-[1.06] tracking-[-1px] text-noir">{c.title}</h3>
        <p className="font-body text-[16px] leading-[1.55] text-gris">{c.text}</p>
      </div>
      <div className="relative mx-auto h-[244px] w-[286px] lg:h-[286px] lg:w-[333px]">
        <Reveal x={-30} y={0} delay={0.3} className="absolute left-[-13px] top-[84px] h-[110px] w-[303px] rounded-lg bg-clair lg:left-[10px] lg:top-[120px]" />
        <Reveal x={30} y={0} delay={0.2} className="absolute left-[23px] top-[64px] h-[150px] w-[239px] rounded-lg bg-[#efefef] lg:left-[46px] lg:top-[100px]" />
        <Reveal scale={0.8} y={0} delay={0.1} className="absolute left-[47px] top-[43px] flex h-[192px] w-[192px] items-center justify-center rounded-lg border-4 border-bleu bg-white shadow-[0_14px_30px_rgba(15,20,36,0.09)] lg:left-[70px] lg:top-[79px] lg:border-indigo">
          <CommunitySymbol />
        </Reveal>
      </div>
    </Tile>
  )
}

export default function Bento() {
  const { t } = useLang()
  const b = t.bento
  return (
    <section id="fonctionnalites" className="bg-clair px-5 py-16 lg:px-10 lg:py-[120px] xl:px-[100px]">
      <div className="mx-auto max-w-[1240px]">
        <Reveal as="h2" className="text-center font-display text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-noir lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">
          {b.title[0]} <br className="hidden lg:block" />
          {b.title[1]}
        </Reveal>
        <div className="mt-6 flex flex-col gap-3.5 lg:mt-14 lg:gap-6">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:gap-6">
            <Account />
            <PartnersTile />
          </div>
          <div className="flex flex-col gap-3.5 lg:flex-row lg:gap-6">
            <Offer />
            <Transfer />
            <Community />
          </div>
        </div>
      </div>
    </section>
  )
}
