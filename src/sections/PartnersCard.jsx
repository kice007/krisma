import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Button from '../components/Button'
import Eyebrow from '../components/Eyebrow'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

export default function PartnersCard() {
  const { t } = useLang()
  const p = t.partners
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])
  const rotate = useTransform(scrollYProgress, [0, 1], [-3, 3])

  return (
    <section id="partenaires" className="bg-white px-5 pb-8 pt-16 lg:px-10 lg:py-[60px] xl:px-[100px]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex max-w-[540px] flex-col items-start gap-3.5 lg:gap-[18px]">
          <Reveal x={-50} y={0}>
            <Eyebrow>{p.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal x={-70} y={0} delay={0.08} as="h2" className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-1.2px] text-noir lg:text-[52px] lg:leading-[1.1] lg:tracking-[-2px]">
            {p.title[0]} <br className="hidden lg:block" />
            {p.title[1]}
          </Reveal>
          <Reveal x={-70} y={0} delay={0.16} as="p" className="max-w-[500px] font-body text-[16px] leading-[1.5] text-gris lg:text-[18px] lg:leading-[1.55]">
            {p.text}
          </Reveal>
          <Reveal x={-70} y={0} delay={0.24} className="lg:mt-2">
            <Button href="#contact" tone="noir" className="h-[54px]">
              {p.cta}
            </Button>
          </Reveal>
        </div>

        <Reveal x={90} y={0} className="w-full lg:max-w-[620px]">
          <div ref={ref} className="relative aspect-[620/640] w-full overflow-hidden rounded-3xl [container-type:inline-size] lg:rounded-[32px]">
            <motion.div className="absolute -inset-[6%]" style={{ y }}>
              <motion.div className="relative h-full w-full" style={{ rotate }}>
                <img src="/img/landing/main-carte.webp" alt="" className="h-full w-full object-cover" />
                <span
                  className="absolute flex origin-top-left items-center gap-[1.1cqw]"
                  style={{ left: '30.5%', top: '17.2%', transform: 'rotate(35.9deg)' }}
                >
                  <img src="/img/landing/k-white.png" alt="" className="w-[3.8cqw] max-w-none" />
                  <span className="font-display text-[4cqw] font-bold text-white">KRISMA</span>
                </span>
              </motion.div>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
