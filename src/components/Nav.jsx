import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, X } from './icons'
import { useLang } from '../i18n'
import { EASE } from './Reveal'
import { Socials } from './Socials'

export function LangSwitch({ up = false }) {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={t.nav.language}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 px-1 py-2 font-body text-[14px] font-medium uppercase text-noir"
      >
        {lang}
        <ChevronDown size={15} className={`transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: up ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: up ? 6 : -6 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 z-10 flex min-w-16 flex-col rounded-xl bg-white p-1 shadow-[0_12px_30px_rgba(0,0,0,0.14)] ${up ? 'bottom-full' : 'top-full'}`}
          >
            {['fr', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLang(code)
                  setOpen(false)
                }}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-left font-body text-[14px] font-medium uppercase hover:bg-clair ${lang === code ? 'text-marque' : 'text-noir'}`}
              >
                {code}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Nav() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('#hero')

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Highlights the section being read.
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    t.nav.links.forEach((l) => {
      const el = document.querySelector(l.href)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [t])

  return (
    <>
      <motion.header
        initial={{ y: -110, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        className="fixed inset-x-5 top-4 z-50 mx-auto max-w-[1122px] lg:top-7"
      >
        <div
          className={`flex h-14 items-center justify-between rounded-full bg-white pl-5 pr-2.5 transition-shadow duration-500 lg:h-[68px] lg:pl-6 lg:pr-[10px] ${scrolled ? 'shadow-[0_12px_36px_rgba(17,17,17,0.12)]' : ''}`}
        >
          <a href="#hero" aria-label="KRISMA" className="shrink-0">
            <img src="/img/landing/k-ink.png" alt="" className="h-[23px] w-[18px] object-contain lg:h-[25px] lg:w-5" />
          </a>
          <nav className="hidden items-center gap-[26px] lg:flex">
            {t.nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap font-body text-[14px] font-medium hover:text-marque ${active === l.href ? 'text-marque' : 'text-noir'}`}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5 lg:gap-3.5">
            <LangSwitch />
            <Link
              to="/waitlist"
              className="hidden h-12 items-center whitespace-nowrap rounded-full bg-marque px-5 font-body text-[14px] font-semibold text-white hover:bg-[#f06e1b] lg:flex"
            >
              {t.nav.cta}
            </Link>
            <button
              type="button"
              aria-label={open ? t.nav.close : t.nav.open}
              onClick={() => setOpen((o) => !o)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full lg:hidden ${open ? 'bg-marque text-noir' : 'bg-noir text-white'}`}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-noir bg-cover px-5 pb-16 pt-[92px] lg:hidden"
            style={{ backgroundImage: 'url(/img/landing/rayons-menu.webp)' }}
          >
            <nav className="flex flex-col">
              {t.nav.links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, ease: EASE, delay: 0.05 + i * 0.05 }}
                  className="flex h-16 shrink-0 items-center justify-between border-b border-white/12 font-display text-[32px] font-semibold leading-none tracking-[-1px] text-white"
                >
                  {l.label}
                  {active === l.href && <span className="h-2.5 w-2.5 rounded-full bg-marque" />}
                </motion.a>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
              className="mt-10 flex flex-col items-center gap-[18px]"
            >
              <Link
                to="/waitlist"
                onClick={() => setOpen(false)}
                className="flex h-14 w-full items-center justify-center rounded-full bg-marque font-body text-[15px] font-semibold text-white"
              >
                {t.nav.cta}
              </Link>
              <Socials className="text-white" size={22} gap="gap-[22px]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
