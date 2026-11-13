import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check } from '../components/icons'
import Button from '../components/Button'
import Rays from '../components/Rays'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

export default function Waitlist() {
  const { t } = useLang()
  const w = t.waitlist
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.5'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])

  // Ouvre la page de la liste d'attente (W01) ; l'adresse saisie pré-remplira l'inscription.
  const submit = (e) => {
    e.preventDefault()
    const q = new URLSearchParams({ email: email.trim() })
    if (consent) q.set('news', '1')
    navigate(`/waitlist?${q}`)
  }

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

        <Reveal delay={0.24} className="relative mt-1.5 w-full lg:mt-3 lg:max-w-[640px]">
          <form onSubmit={submit} className="flex flex-col gap-3.5 lg:h-16 lg:flex-row lg:items-center lg:gap-0 lg:rounded-full lg:bg-white lg:pl-[26px] lg:pr-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label={w.placeholder}
                  placeholder={w.placeholder}
                  className="h-[54px] min-w-0 rounded-full bg-white px-[22px] font-body text-[16px] text-noir outline-none placeholder:text-gris lg:h-full lg:flex-1 lg:bg-transparent lg:px-0"
                />
                <Button type="submit" className="h-[54px] shrink-0 whitespace-nowrap lg:h-[52px]">
                  {w.cta}
                </Button>
          </form>
        </Reveal>

        <Reveal delay={0.3} className="relative flex flex-col gap-2">
          <label className="flex cursor-pointer gap-2.5 font-body text-[14px] leading-[1.4] text-[#d4d4d4]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-[#bdbdbd] transition-colors peer-checked:border-marque peer-checked:bg-marque">
              {consent && <Check size={14} className="text-noir" />}
            </span>
            {w.consent}
          </label>
        </Reveal>
      </motion.div>
    </section>
  )
}
