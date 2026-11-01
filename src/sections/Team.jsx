import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import Reveal, { EASE } from '../components/Reveal'
import { useLang } from '../i18n'

const PEOPLE = [
  { name: 'Christian Ehouman', img: '/img/landing/equipe-christian.webp' },
  { name: 'Ivan Ehouman', img: '/img/landing/equipe-ivan.webp' },
  { name: 'Élyse Ehouman' },
]

function Portrait({ p, delay }) {
  return (
    <span className="relative flex h-28 w-28 shrink-0 items-center justify-center lg:h-[296px] lg:w-[296px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <motion.circle
          cx="50"
          cy="50"
          r="49.6"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="0.4"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: 'easeInOut', delay }}
        />
      </svg>
      <motion.span
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-clair lg:h-[252px] lg:w-[252px]"
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: EASE, delay: delay + 0.15 }}
      >
        {p.img ? <img src={p.img} alt={p.name} className="h-full w-full object-cover" /> : <User className="h-9 w-9 text-[#bdbdbd] lg:h-[72px] lg:w-[72px]" />}
      </motion.span>
    </span>
  )
}

export default function Team() {
  const { t } = useLang()
  const m = t.team
  return (
    <section id="equipe" className="bg-white px-5 pb-16 lg:px-10 lg:pb-[120px]">
      <Reveal className="mx-auto flex max-w-[640px] flex-col items-center gap-3 text-center lg:gap-4">
        <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-noir lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">{m.title}</h2>
        <p className="font-body text-[16px] leading-[1.5] text-gris lg:text-[18px] lg:leading-[1.55]">{m.text}</p>
      </Reveal>
      <div className="mx-auto mt-6 flex max-w-[350px] flex-col gap-3 lg:mt-14 lg:max-w-none lg:flex-row lg:justify-center lg:gap-[72px]">
        {PEOPLE.map((p, i) => (
          <div key={p.name} className="flex items-center gap-[18px] py-1.5 lg:flex-col lg:gap-1.5 lg:py-0">
            <Portrait p={p} delay={i * 0.18} />
            <Reveal delay={0.2 + i * 0.18} y={18} className="flex flex-col gap-0.5 lg:mt-3.5 lg:items-center">
              <h3 className="font-display text-[22px] font-semibold leading-[1.2] text-noir lg:text-[24px]">{p.name}</h3>
              <p className="font-body text-[15px] text-gris">{m.roles[i]}</p>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  )
}
