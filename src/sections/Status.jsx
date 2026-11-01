import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CircleCheck, CircleDashed, LoaderCircle } from 'lucide-react'
import Button from '../components/Button'
import Rays from '../components/Rays'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

function Tag({ kind }) {
  const { t } = useLang()
  const s = t.status
  const map = {
    done: [CircleCheck, s.done, 'text-vert', 'text-noir', ''],
    doing: [LoaderCircle, s.doing, 'text-marque', 'text-noir', 'spin-slow'],
    next: [CircleDashed, s.next, 'text-[#d4d4d4]', 'text-[#bdbdbd]', ''],
  }
  const [I, label, ic, tx, anim] = map[kind]
  return (
    <span className={`relative flex items-center gap-2 font-body text-[15px] font-semibold ${tx}`}>
      <I size={20} className={`${ic} ${anim}`} />
      {label}
    </span>
  )
}

function Card({ id, kind, className = '', delay }) {
  const { t } = useLang()
  const it = t.status.items[id]
  return (
    <Reveal delay={delay} y={56} className={className}>
      <article className="flex h-full flex-col justify-between gap-3.5 rounded-[22px] bg-clair p-[22px] transition-transform duration-500 hover:-translate-y-1 lg:rounded-[28px] lg:p-[30px]">
        <Tag kind={kind} />
        <div className="flex flex-col gap-1.5 lg:gap-2.5">
          <h3 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.5px] text-noir lg:text-[30px] lg:tracking-[-1px]">{it.title}</h3>
          <p className="font-body text-[15px] leading-[1.5] text-gris lg:text-[16px]">{it.text}</p>
        </div>
      </article>
    </Reveal>
  )
}

export default function Status() {
  const { t } = useLang()
  const s = t.status
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const midY = useTransform(scrollYProgress, [0, 1], [36, -36])
  const l = s.items.launch

  return (
    <section id="avancement" className="bg-white px-5 py-16 lg:px-10 lg:pb-[100px] lg:pt-0 xl:px-[100px]">
      <div ref={ref} className="mx-auto max-w-[1240px]">
        <Reveal className="mx-auto flex max-w-[780px] flex-col items-center gap-3 text-center lg:gap-[18px]">
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-noir lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">{s.title}</h2>
          <p className="font-body text-[16px] leading-[1.5] text-gris lg:text-[18px] lg:leading-[1.55]">{s.text}</p>
        </Reveal>
        <div className="mt-5 flex flex-col gap-3 lg:mt-12 lg:flex-row lg:gap-6">
          <div className="flex flex-1 flex-col gap-3 lg:gap-6">
            <Card id="company" kind="done" delay={0} className="lg:h-[220px]" />
            <Card id="model" kind="done" delay={0.08} className="lg:h-[280px]" />
          </div>
          <motion.div style={{ y: midY }} className="flex flex-1 flex-col gap-3 max-lg:!transform-none lg:gap-6 lg:pt-14">
            <Card id="partners" kind="doing" delay={0.12} className="lg:h-[240px]" />
            <Card id="tests" kind="doing" delay={0.2} className="lg:h-[204px]" />
          </motion.div>
          <Reveal delay={0.24} y={70} className="flex-1">
            <article className="relative flex h-80 flex-col justify-between overflow-hidden rounded-[22px] bg-noir p-[22px] lg:h-[524px] lg:rounded-[28px] lg:p-[30px]">
              <Rays desktop="rayons-lancement" mobile="rayons-mobile-court" />
              <Tag kind="next" />
              <div className="relative flex flex-col gap-2 lg:gap-2.5">
                <h3 className="font-display text-[36px] font-semibold leading-[1.1] tracking-[-1px] text-white lg:text-[44px]">{l.title}</h3>
                <p className="font-body text-[15px] leading-[1.5] text-[#d4d4d4] lg:text-[16px]">{l.text}</p>
                <Button tone="blanc" className="h-[50px] max-lg:w-full lg:w-fit">
                  {s.cta}
                </Button>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
