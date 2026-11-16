import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../components/Button'
import Rays from '../components/Rays'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

export default function Waitlist() {
  const { t } = useLang()
  const w = t.waitlist
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.5'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])

  return (
    <section id="contact" ref={ref} className="bg-white px-5 py-8 lg:px-10 lg:pb-20 lg:pt-[120px] xl:px-[100px]">
      <motion.div
        style={{ scale }}
        className="relative mx-auto flex max-w-[1240px] flex-col items-center gap-3.5 overflow-hidden rounded-[28px] bg-noir px-[22px] py-9 lg:gap-[18px] lg:rounded-[40px] lg:px-12 lg:py-20"
      >
        <Rays desktop="rayons-liste" mobile="rayons-mobile-haut" />
        <Reveal scale={0.5} y={0} className="relative">
          <img src="/img/landing/k-white.png" alt="" className="h-[38px] w-[30px] object-contain lg:h-[51px] lg:w-10" />
        </Reveal>
        <Reveal delay={0.08} as="h2" className="relative mt-1.5 text-center font-display text-[40px] font-semibold leading-[1.08] tracking-[-1.4px] text-white lg:mt-2.5 lg:text-[64px] lg:leading-[1.06] lg:tracking-[-2px]">
          {w.title}
        </Reveal>
        <Reveal delay={0.16} as="p" className="relative max-w-[620px] text-center font-body text-[16px] leading-[1.5] text-[#d4d4d4] lg:text-[18px] lg:leading-[1.55]">
          {w.text}
        </Reveal>

        <Reveal delay={0.24} className="relative mt-1.5 lg:mt-3">
          <Button href="/waitlist" className="h-[54px] whitespace-nowrap px-8 lg:h-[58px]">
            {w.cta}
          </Button>
        </Reveal>
      </motion.div>
    </section>
  )
}
