import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Globe, ShieldCheck, Users } from '../components/icons'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

const ICONS = [ShieldCheck, Globe, Users]

// Each word lights up as the paragraph scrolls through the screen.
function Word({ children, p, range, tone }) {
  const opacity = useTransform(p, range, [0.14, 1])
  return (
    <motion.span style={{ opacity }} className={`mr-[0.26em] inline-block ${tone}`}>
      {children}
    </motion.span>
  )
}

export default function Presentation() {
  const { t } = useLang()
  const ref = useRef(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 0.88', 'end 0.5'] })
  const a = t.presentation.lead.split(' ')
  const b = t.presentation.rest.split(' ')
  const total = a.length + b.length
  const range = (i) => [i / total, Math.min(1, (i + 3) / total)]

  return (
    <section className="bg-white px-5 pb-10 pt-16 lg:px-10 lg:pb-[100px] lg:pt-[120px] xl:px-[100px]">
      <div ref={ref} className="mx-auto max-w-[1240px]">
        <div className="flex max-w-[1080px] flex-col gap-4 font-display text-[28px] font-medium leading-[1.16] tracking-[-0.8px] lg:gap-7 lg:text-[48px] lg:leading-[1.14] lg:tracking-[-1.5px]">
          <p>
            {a.map((w, i) => (
              <Word key={i} p={p} range={range(i)} tone="text-noir">
                {w}
              </Word>
            ))}
          </p>
          <p>
            {b.map((w, i) => (
              <Word key={i} p={p} range={range(a.length + i)} tone="text-gris">
                {w}
              </Word>
            ))}
          </p>
        </div>
        <ul className="mt-7 flex flex-col gap-3 lg:hidden">
          {t.hero.perks.map((l, i) => {
            const I = ICONS[i]
            return (
              <Reveal key={l} as="li" x={-24} y={0} delay={i * 0.08} className="flex items-center gap-2.5 font-body text-[15px] font-medium text-noir">
                <I size={20} />
                {l}
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
