import { useEffect, useRef, useState } from 'react'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { useLang } from '../i18n'
import LangToggle from './LangToggle'

export default function Nav() {
  const { t } = useLang()
  const LINKS = t.nav.links
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const heroH = useRef(0)

  useEffect(() => {
    const hero = document.getElementById('hero')
    const measure = () => {
      heroH.current = hero ? hero.offsetHeight : 0
    }
    measure()

    const onScroll = () => {
      const y = window.scrollY
      const vh = window.innerHeight
      const lg = window.innerWidth >= 1024
      // The hero is "done" when its sticky pin releases (desktop: heroHeight - viewport),
      // or once it's scrolled out of the nav area (mobile).
      const heroDone = lg ? heroH.current - vh : heroH.current - 72
      const overHero = y < heroDone

      // Solid bar only once we're past the dark hero
      setScrolled(!overHero && y > 40)

      if (lg && overHero) {
        // Desktop only: hold the navbar still through the whole hero / parallax
        setHidden(false)
      } else if (y > lastY.current && y > 80) {
        setHidden(true) // scrolling down (mobile hides over the hero too)
      } else if (y < lastY.current) {
        setHidden(false) // scrolling up → reveal
      }
      lastY.current = y
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const dark = scrolled // dark text on light bar

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${scrolled ? 'bg-white/85 backdrop-blur-md shadow-[0_4px_30px_rgba(15,20,36,0.06)]' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-16 lg:py-6">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2.5">
          <img
            src={dark ? '/img/logo-indigo.png' : '/img/logo-white.png'}
            alt="Krisma"
            className="h-[54px] w-[54px] rounded-[9px] object-cover"
          />
        </a>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-[30px] lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-[15px] font-medium transition-all hover:opacity-70 ${dark ? 'text-ink' : 'text-white/90'
                }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA + language switch */}
        <div className="hidden items-center gap-4 lg:flex">
          <LangToggle dark={dark} />
          <a
            href="#contact"
            className={`flex items-center rounded-full px-6 py-[13px] text-[15px] font-semibold transition-all hover:-translate-y-0.5 ${dark ? 'bg-indigo text-white' : 'bg-white text-indigo'
              }`}
          >
            {t.nav.notify}
          </a>
        </div>

        {/* Mobile: language switch + hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <LangToggle dark={dark} />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X size={26} className={dark ? 'text-ink' : 'text-white'} />
            ) : (
              <Menu size={26} className={dark ? 'text-ink' : 'text-white'} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`overflow-hidden bg-white transition-[max-height] duration-300 lg:hidden ${open ? 'max-h-[420px] border-b border-line' : 'max-h-0'
          }`}
      >
        <nav className="flex flex-col px-6 py-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/70 py-3.5 text-[16px] font-medium text-ink last:border-0"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-3 mb-2 flex items-center justify-center gap-2 rounded-full bg-indigo px-6 py-3.5 text-[15px] font-semibold text-white"
          >
            {t.nav.notifyLaunch}
            <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
    </header>
  )
}
