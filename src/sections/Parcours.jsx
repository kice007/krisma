import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import { useViewport } from '../components/useStage'
import { useLang } from '../i18n'
import twinkle from '../data/twinkle.json'

const TW = ['#fd8030', '#0676f8', '#111111']

// A sample of the map's own dots blinks softly, each on its own rhythm.
function Twinkles({ points, w, h }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {points.map(([x, y], i) => {
        const d = i % 3 === 2 ? 3.6 : 4.8
        return (
          <span
            key={i}
            className="twinkle"
            style={{
              left: `${(x / w) * 100}%`,
              top: `${(y / h) * 100}%`,
              width: d,
              height: d,
              marginLeft: -d / 2,
              marginTop: -d / 2,
              background: TW[i % 3],
              animationDelay: `-${(i * 0.37) % 6}s`,
              animationDuration: `${4 + (i % 5) * 0.8}s`,
            }}
          />
        )
      })}
    </div>
  )
}

function Arc({ d, stroke, delay }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 1.6, ease: 'easeInOut', delay }}
    />
  )
}

function Pin({ x, y, color, label, labelX, labelY, text, delay }) {
  return (
    <>
      <Reveal scale={0} y={0} delay={delay} duration={0.6} className="absolute" style={{ left: x, top: y }}>
        <span className="halo relative block h-4 w-4 rounded-full" style={{ color }}>
          <span className="absolute inset-0 rounded-full border-2 border-white" style={{ background: color }} />
        </span>
      </Reveal>
      <Reveal x={-10} y={0} delay={delay + 0.15} duration={0.6} className="absolute" style={{ left: labelX, top: labelY }}>
        <span className={`block rounded-full px-3 py-2 font-body text-[13px] font-semibold leading-4 ${text}`} style={{ background: color }}>
          {label}
        </span>
      </Reveal>
    </>
  )
}

function StepCard({ s, i, style, from }) {
  return (
    <Reveal x={from * 90} y={0} delay={0.1 + i * 0.12} className="absolute h-[280px] w-[380px]" style={style}>
      <article className="flex h-full flex-col justify-between rounded-3xl bg-white px-6 py-[22px] shadow-[0_16px_44px_rgba(15,20,36,0.08)]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <img src={`/img/landing/parcours-${i + 1}.webp`} alt="" className="h-[76px] w-[76px] rounded-full border-2 border-ligne object-cover" />
            <span className="font-display text-[28px] font-medium text-gris">{s.n}</span>
          </div>
          <h3 className="font-display text-[20px] font-bold leading-[1.15] tracking-[-0.4px] text-noir">{s.title}</h3>
          <p className="font-body text-[14px] leading-[1.45] text-gris">{s.text}</p>
        </div>
        <span className="w-fit rounded-full bg-clair px-3 py-1.5 font-body text-[12px] font-semibold text-noir">{s.tag}</span>
      </article>
    </Reveal>
  )
}

function Desktop() {
  const { t } = useLang()
  const { w } = useViewport()
  const s = Math.min(1, (w - 80) / 1240)
  const steps = t.parcours.steps
  return (
    <div className="relative mx-auto mt-[18px] hidden lg:block" style={{ width: 1240 * s, height: 700 * s }}>
      <div className="absolute left-0 top-0 h-[700px] w-[1240px] origin-top-left" style={{ transform: `scale(${s})` }}>
        <Reveal y={0} duration={1.4} className="absolute left-[-100px] top-[30px] h-[640px] w-[1440px]">
          <img src="/img/landing/map-monde.png" alt="" className="h-full w-full" />
          <Twinkles points={twinkle.desktop} w={1440} h={640} />
        </Reveal>
        <svg viewBox="0 0 1240 700" className="absolute inset-0 h-full w-full" aria-hidden>
          <Arc d="M380 110C440 70 560 100 628 182" stroke="#bdbdbd" delay={0.2} />
          <Arc d="M860 350C780 430 680 440 604 374" stroke="#bdbdbd" delay={0.5} />
          <Arc d="M628 182C700 250 680 330 604 374" stroke="#8a8a8a" delay={0.8} />
          <Arc d="M380 550C450 500 540 450 604 374" stroke="#bdbdbd" delay={1.1} />
        </svg>
        <StepCard s={steps[0]} i={0} from={-1} style={{ left: 0, top: 0 }} />
        <StepCard s={steps[1]} i={1} from={1} style={{ left: 860, top: 200 }} />
        <StepCard s={steps[2]} i={2} from={-1} style={{ left: 0, top: 400 }} />
        <Pin x={620} y={174} color="#0676f8" label={t.parcours.here} labelX={642} labelY={166} text="text-white" delay={0.9} />
        <Pin x={596} y={366} color="#fd8030" label={t.parcours.there} labelX={620} labelY={358} text="text-noir" delay={1.2} />
      </div>
    </div>
  )
}

const AVATARS = [
  { i: 0, cx: 96, cy: 62, color: '#0676f8', lx: 20, ly: 104, w: 152 },
  { i: 2, cx: 292, cy: 160, color: '#fd8030', lx: 218, ly: 202, w: 152 },
  { i: 1, cx: 150, cy: 340, color: '#15803d', lx: 64, ly: 382, w: 188 },
]

function Mobile() {
  const { t } = useLang()
  const { w } = useViewport()
  const s = Math.min(w / 390, 1.5)
  return (
    <div className="relative mx-auto mt-3.5 overflow-hidden lg:hidden" style={{ width: 390 * s, height: 500 * s }}>
      <div className="absolute left-0 top-0 h-[500px] w-[390px] origin-top-left" style={{ transform: `scale(${s})` }}>
        <Reveal y={0} duration={1.2} className="absolute inset-0">
          <img src="/img/landing/map-mobile.png" alt="" className="h-full w-full" />
          <Twinkles points={twinkle.mobile} w={390} h={500} />
        </Reveal>
        <svg viewBox="0 0 390 500" className="absolute inset-0 h-full w-full" aria-hidden>
          <Arc d="M120 92C215 150 215 260 172 322" stroke="#8a8a8a" delay={0.3} />
          <Arc d="M172 322C300 330 340 260 292 190" stroke="#8a8a8a" delay={0.9} />
        </svg>
        {AVATARS.map((a, k) => {
          const st = t.parcours.steps[a.i]
          return (
            <div key={st.n}>
              <Reveal scale={0.4} y={0} delay={0.15 + k * 0.2} duration={0.8} className="absolute h-[76px] w-[76px]" style={{ left: a.cx - 38, top: a.cy - 38 }}>
                <span className="ring-pulse relative block h-full w-full rounded-full" style={{ color: a.color }}>
                  <img
                    src={`/img/landing/parcours-${a.i + 1}.webp`}
                    alt=""
                    className="relative h-full w-full rounded-full border-[3px] object-cover shadow-[0_8px_18px_rgba(15,20,36,0.15)]"
                    style={{ borderColor: a.color }}
                  />
                </span>
              </Reveal>
              <Reveal y={16} delay={0.3 + k * 0.2} duration={0.7} className="absolute" style={{ left: a.lx, top: a.ly, width: a.w }}>
                <div className="rounded-[14px] bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(15,20,36,0.08)]">
                  <p className="font-display text-[15px] font-semibold leading-[1.2] text-noir">{st.title}</p>
                  <p className="mt-0.5 font-body text-[12px] leading-[1.35] text-gris">{st.short}</p>
                </div>
              </Reveal>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Parcours() {
  const { t } = useLang()
  const p = t.parcours
  return (
    <section id="parcours" className="overflow-hidden bg-white pb-8 pt-16 lg:px-10 lg:pb-[100px] lg:pt-[100px]">
      <Reveal className="mx-auto flex max-w-[860px] flex-col items-center gap-3 px-5 text-center lg:gap-[18px]">
        <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-noir lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">
          {p.title[0]} <br className="hidden lg:block" />
          {p.title[1]}
        </h2>
        <p className="max-w-[780px] font-body text-[16px] leading-[1.5] text-gris lg:text-[18px] lg:leading-[1.55]">{p.sub}</p>
      </Reveal>
      <Desktop />
      <Mobile />
    </section>
  )
}
