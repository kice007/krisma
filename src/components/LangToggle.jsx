import { useId } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../i18n'

// Segmented FR | EN switch with a sliding active pill. `dark` = dark text on a
// light bar (adapts to the nav state).
export default function LangToggle({ dark = false, className = '' }) {
  const { lang, setLang } = useLang()
  const pillId = useId() // unique per instance (desktop + mobile render separately)

  const track = dark ? 'border-line bg-bgalt' : 'border-white/30 bg-white/10'
  const pill = dark ? 'bg-indigo' : 'bg-white'
  const activeText = dark ? 'text-white' : 'text-indigo'
  const idle = dark ? 'text-ink/60 hover:text-ink' : 'text-white/70 hover:text-white'

  return (
    <div
      className={`inline-flex cursor-pointer items-center rounded-full border p-1 transition-colors ${track} ${className}`}
      role="group"
      aria-label="Language"
    >
      {['fr', 'en'].map((code) => {
        const active = lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className="relative cursor-pointer rounded-full px-4 py-2 font-body text-[15px] font-bold uppercase leading-none"
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${pillId}`}
                className={`absolute inset-0 rounded-full ${pill}`}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-300 ${active ? activeText : idle}`}>
              {code}
            </span>
          </button>
        )
      })}
    </div>
  )
}
