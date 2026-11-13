import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HandCoins, Percent, Star, Store } from '../components/icons'
import Eyebrow from '../components/Eyebrow'
import Rays from '../components/Rays'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

const ICONS = [HandCoins, Percent, Store, Star]

export default function Advantages() {
  const { t } = useLang()
  const a = t.advantages
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.45'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])

  return (
    <section ref={ref} className="bg-white px-5 py-8 lg:px-10 lg:pb-[120px] lg:pt-[60px] xl:px-[100px]">
      <motion.div
        style={{ scale }}
        className="relative mx-auto flex max-w-[1240px] flex-col items-center gap-3.5 overflow-hidden rounded-[28px] bg-noir px-4 pb-4 pt-10 lg:gap-[18px] lg:rounded-[40px] lg:px-12 lg:py-20"
      >
        <Rays desktop="rayons-large" mobile="rayons-mobile-haut" />
        <Reveal className="relative">
          <Eyebrow dark>{a.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.08} as="h2" className="relative text-center font-display text-[30px] font-semibold leading-[1.1] tracking-[-1px] text-white lg:text-[52px] lg:tracking-[-2px]">
          {a.title[0]} <br className="hidden lg:block" />
          {a.title[1]}
        </Reveal>
        <div className="relative mt-3 grid w-full grid-cols-2 gap-2.5 lg:mt-[22px] lg:grid-cols-4 lg:gap-5">
          {a.items.map((it, i) => {
            const I = ICONS[i]
            return (
              <Reveal key={it.title} delay={0.12 + i * 0.1} y={56} className="h-full">
                <article className="group flex h-[186px] flex-col justify-between rounded-[18px] border border-white/12 bg-anthracite p-4 transition-all duration-500 hover:-translate-y-1.5 hover:border-marque hover:bg-marque lg:h-[270px] lg:rounded-[22px] lg:p-[26px]">
                  <I className="h-7 w-7 text-marque transition-colors duration-500 group-hover:text-[#0a0a0f] lg:h-9 lg:w-9" strokeWidth={1.8} />
                  <div className="flex flex-col gap-1 lg:gap-2">
                    <h3 className="font-display text-[18px] font-semibold leading-[1.15] text-white transition-colors duration-500 group-hover:text-anthracite lg:text-[24px]">
                      {it.title}
                    </h3>
                    <p className="font-body text-[13px] leading-[1.35] text-[#bdbdbd] transition-colors duration-500 group-hover:text-anthracite lg:text-[15px]">
                      {it.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
