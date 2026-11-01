import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Reveal, { EASE } from '../components/Reveal'
import { useLang } from '../i18n'

function Row({ item, open, onToggle, delay }) {
  return (
    <Reveal delay={delay} y={28}>
      <div className="rounded-2xl bg-white lg:rounded-[18px]">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-3 px-[18px] py-[18px] text-left font-body text-[16px] font-semibold leading-[1.35] text-noir lg:min-h-[76px] lg:px-7 lg:text-[18px] lg:font-medium"
        >
          {item.q}
          <ChevronDown className={`h-5 w-5 shrink-0 text-gris lg:h-[22px] lg:w-[22px] transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="max-w-[880px] px-[18px] pb-5 font-body text-[15px] leading-[1.55] text-gris lg:px-7 lg:pb-7 lg:text-[16px]">{item.a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

function All({ label, className }) {
  return (
    <a href="#faq" className={`group items-center gap-2 font-body text-[15px] font-semibold text-noir ${className}`}>
      {label}
      <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
    </a>
  )
}

export default function Faq() {
  const { t } = useLang()
  const f = t.faq
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="bg-clair px-5 py-16 lg:px-10 lg:py-[120px] xl:px-[100px]">
      <div className="mx-auto max-w-[1240px]">
        <Reveal className="flex items-end justify-between">
          <h2 className="font-display text-[34px] font-semibold leading-[1.08] tracking-[-1.2px] text-noir lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">{f.title}</h2>
          <All label={f.all} className="hidden lg:flex" />
        </Reveal>
        <div className="mt-[26px] flex flex-col gap-2.5 lg:mt-8 lg:gap-3">
          {f.items.map((it, i) => (
            <Row key={i} item={it} open={open === i} onToggle={() => setOpen(open === i ? null : i)} delay={i * 0.07} />
          ))}
        </div>
        <All label={f.all} className="mt-5 flex lg:hidden" />
      </div>
    </section>
  )
}
