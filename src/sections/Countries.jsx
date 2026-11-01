import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Button from '../components/Button'
import Flag from '../components/Flags'
import Reveal, { EASE } from '../components/Reveal'
import { useLang } from '../i18n'

const CLOUD = [
  ['ci', 124, 150],
  ['sn', 210, 270],
  ['ml', 100, 380],
  ['bf', 190, 490],
  ['bj', 1140, 140],
  ['tg', 1040, 290],
  ['cm', 1190, 390],
  ['ga', 1020, 500],
]
const ROWS = [['ci', 'sn'], ['ml', 'bf'], ['bj', 'tg'], ['cm', 'ga']]

function Chip({ code, vote, setVote, className = '' }) {
  const { t } = useLang()
  const on = vote === code
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setVote(on ? null : code)}
      className={`flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full py-2 pl-2 pr-4 font-display font-semibold text-noir transition-colors duration-500 hover:bg-[#ececec] lg:py-3.5 lg:pl-3.5 lg:pr-[22px] ${on ? 'bg-[#ffe6d5] outline-2 outline-marque' : 'bg-clair'} ${className}`}
    >
      <Flag code={code} />
      <span className="text-[16px] lg:text-[17px]">{t.countries.names[code]}</span>
    </button>
  )
}

function Center({ children }) {
  const { t } = useLang()
  const c = t.countries
  return (
    <div className="relative z-10 flex flex-col items-center gap-3.5 text-center xl:gap-[22px]">
      <Reveal scale={0.5} y={0} duration={1}>
        <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-noir xl:mb-[50px] xl:h-[104px] xl:w-[104px]">
          <img src="/img/landing/k-white.png" alt="" className="h-8 w-[25px] object-contain xl:h-[46px] xl:w-9" />
        </span>
      </Reveal>
      <Reveal as="h2" delay={0.08} className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-noir xl:text-[52px] xl:leading-[1.06] xl:tracking-[-2px]">
        {c.title[0]} <br className="hidden xl:block" />
        {c.title[1]}
      </Reveal>
      <Reveal as="p" delay={0.16} className="max-w-[540px] font-body text-[16px] leading-[1.5] text-gris xl:text-[18px] xl:leading-[1.55]">
        {c.text}
      </Reveal>
      {children}
    </div>
  )
}

export default function Countries({ vote, setVote }) {
  const { t } = useLang()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="pays" className="overflow-hidden bg-white">
      <div className="px-5 pb-12 pt-8 xl:hidden">
        <Center>
          <div className="flex flex-col items-center gap-2 py-1.5">
            {ROWS.map((r, i) => (
              <Reveal key={i} delay={i * 0.08} y={20} className="flex gap-2">
                {r.map((c) => (
                  <Chip key={c} code={c} vote={vote} setVote={setVote} />
                ))}
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="w-full max-w-[350px]">
            <Button tone="noir" className="h-[54px] w-full">
              {t.countries.cta}
            </Button>
          </Reveal>
        </Center>
      </div>

      <div ref={ref} className="relative mx-auto hidden h-[620px] w-full max-w-[1440px] pt-10 xl:block">
        {CLOUD.map(([c, x, y], i) => (
          <motion.div
            key={c}
            className="absolute"
            style={{ left: `${(x / 1440) * 100}%`, top: y }}
            initial={{ opacity: 0, x: x < 720 ? 240 : -240, scale: 0.5 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 1.1, ease: EASE, delay: 0.1 + i * 0.07 }}
          >
            <div className="drift" style={{ animationDelay: `-${i * 0.9}s` }}>
              <Chip code={c} vote={vote} setVote={setVote} />
            </div>
          </motion.div>
        ))}
        <div className="mx-auto w-[700px]">
          <Center>
            <Reveal delay={0.24}>
              <Button tone="noir" className="h-[54px]">
                {t.countries.cta}
              </Button>
            </Reveal>
          </Center>
        </div>
      </div>
    </section>
  )
}
