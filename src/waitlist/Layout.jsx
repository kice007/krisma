import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { LangSwitch } from '../components/Nav'
import { useLang } from '../i18n'
import { TEXT } from './text'

export function useT() {
  const { lang } = useLang()
  return { t: TEXT[lang], lang }
}

function Logo({ dark }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="KRISMA">
      <img src={dark ? '/img/landing/k-white.png' : '/img/landing/k-ink.png'} alt="" className="h-[25px] w-5 object-contain" />
      <span className={`font-display text-[17px] font-extrabold tracking-[1.5px] ${dark ? 'text-white' : 'text-noir'}`}>KRISMA</span>
    </Link>
  )
}

// Panneau noir de gauche (desktop) : marque, accroche et progression du parcours.
function Panel({ step, title }) {
  const { t } = useT()
  return (
    <aside className="sticky top-0 hidden h-screen w-[36%] max-w-[520px] shrink-0 flex-col justify-between overflow-hidden bg-noir p-14 lg:flex">
      <img src="/img/waitlist/panneau.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
      <div className="relative">
        <Logo dark />
      </div>
      {step == null && <div className="flex-1" />}
      <div className="relative flex flex-col gap-[18px]">
        <p className="font-body text-[14px] text-white/70">{t.panel.eyebrow}</p>
        <p className="font-display text-[34px] font-bold leading-[1.08] tracking-[-1.4px] text-white xl:text-[40px] xl:tracking-[-1.6px]">{title || t.panel.title}</p>
      </div>
      {step != null && (
        <ol className="relative flex flex-col gap-3.5">
          {t.panel.steps.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-body text-[12px] font-bold ${
                  i < step ? 'bg-marque text-white' : i === step ? 'bg-white text-noir' : 'border border-white/30 text-white/50'
                }`}
              >
                {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`font-body text-[15px] ${i === step ? 'font-semibold text-white' : i < step ? 'text-white' : 'text-white/50'}`}>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

/**
 * Gabarit des écrans du parcours : panneau à gauche sur grand écran, en-tête
 * compact sur mobile (bouton fermer/retour + titre), barre d'action collée en bas.
 */
export default function FlowLayout({ step, panelTitle, mobileTitle, onBack, backTo = '/', children, footer, center = true, width = 'max-w-[560px]' }) {
  const { t } = useT()
  const navigate = useNavigate()
  const back = onBack || (() => navigate(backTo))
  return (
    <div className="flex min-h-screen bg-white">
      <Panel step={step} title={panelTitle} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Desktop */}
        <div className="hidden items-center justify-between px-10 pt-10 lg:flex xl:px-24">
          <button type="button" onClick={back} className="cursor-pointer font-body text-[14px] font-medium text-noir underline-offset-4 hover:underline">
            {t.back}
          </button>
          <LangSwitch />
        </div>
        {/* Mobile */}
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white px-4 lg:hidden">
          <button type="button" onClick={back} aria-label={step === 0 || step == null ? t.close : t.back} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-clair">
            {step === 0 || step == null ? <X size={18} /> : <ArrowLeft size={18} />}
          </button>
          <span className="font-body text-[16px] font-semibold">{mobileTitle}</span>
          <div className="flex w-10 justify-end">
            <LangSwitch />
          </div>
        </div>
        <main className={`flex flex-1 flex-col px-5 pb-8 pt-2 lg:px-10 lg:pb-12 lg:pt-6 xl:px-24 ${center ? 'lg:justify-center' : ''}`}>
          <div className={`mx-auto w-full ${width}`}>{children}</div>
        </main>
        {footer}
      </div>
    </div>
  )
}

// Écran d'attente neutre (chargement de session, redirections).
export function Loading() {
  const { t } = useT()
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex items-center gap-3 font-body text-[15px] text-gris" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ligne border-t-marque" />
        {t.loading}
      </div>
    </div>
  )
}
