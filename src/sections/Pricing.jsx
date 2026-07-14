import { BadgeCheck, ArrowUpRight, Menu } from 'lucide-react'
import Reveal from '../components/Reveal'

function Feat({ children }) {
  return (
    <div className="flex items-center gap-3">
      <BadgeCheck size={20} className="shrink-0 text-indigo" />
      <span className="font-body text-[15px] text-ink">{children}</span>
    </div>
  )
}

function Cta() {
  return (
    <a
      href="#contact"
      className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-indigo text-[15px] font-semibold text-white hover:-translate-y-0.5"
    >
      Choisir
      <ArrowUpRight size={16} />
    </a>
  )
}

const STD = [
  'Compte + IBAN + carte Mastercard',
  'Transferts au tarif standard',
  '2 retraits DAB gratuits/mois',
  'Devises : EUR',
  'Assistant IA basique',
]
const PREM = [
  'Tout le Standard inclus',
  'Carte Mastercard Métal',
  'Transferts au tarif réduit',
  'Retraits DAB illimités',
  'Multidevises EUR · XOF · GBP · USD + IA multilingue',
]

export default function Pricing() {
  return (
    <section
      id="tarifs"
      className="overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: 'url(/img/hero-bg.png)' }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center px-5 py-16 lg:px-16 lg:py-20">
        <Reveal className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-white px-4 py-2 font-body text-[13px] font-semibold text-indigo">
            Nos abonnements
          </span>
          <h2 className="font-display text-[34px] font-semibold text-white lg:text-[52px]">
            Simple et transparent.
          </h2>
        </Reveal>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-6 lg:mt-12 lg:flex-row lg:items-center lg:gap-8">
          {/* Standard */}
          <Reveal className="lg:w-[420px]">
            <div className="flex flex-col gap-[22px] rounded-2xl border border-base bg-white p-8">
              <div className="flex flex-col gap-1.5 border-b border-line pb-[22px]">
                <p className="font-display text-[26px] font-semibold text-ink">Standard</p>
                <p className="font-body text-[14px] text-muted">L’essentiel pour vous installer</p>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display text-[46px] font-extrabold leading-none text-ink">1 €</span>
                <span className="font-body text-[13px] font-medium text-muted">/mois</span>
              </div>
              <div className="flex flex-col gap-[18px] rounded-[15px] bg-bgalt p-5">
                {STD.map((f) => (
                  <Feat key={f}>{f}</Feat>
                ))}
              </div>
              <Cta />
            </div>
          </Reveal>

          {/* Premium */}
          <Reveal className="lg:w-[420px]" delay={0.08}>
            <div className="flex flex-col gap-5 rounded-[24px] border-[8px] border-base bg-white p-4 pb-6 shadow-[0_20px_50px_rgba(30,27,102,0.25)] lg:gap-6 lg:p-5 lg:pb-7">
              <div className="flex items-center justify-between rounded-[15px] border border-line px-6 py-5">
                <span className="font-display text-[20px] font-extrabold text-ink">Krisma</span>
                <Menu size={22} className="text-ink" />
              </div>
              <div className="flex flex-col gap-1.5 border-b border-line px-2 pb-[22px]">
                <p className="font-display text-[26px] font-semibold text-ink">Premium</p>
                <p className="font-body text-[14px] text-muted">Le meilleur de Krisma</p>
              </div>
              <div className="flex items-end gap-1.5 px-2">
                <span className="font-display text-[46px] font-bold leading-none text-ink">10 €</span>
                <span className="font-body text-[13px] font-medium text-muted">/mois</span>
              </div>
              <div className="flex flex-col gap-[18px] rounded-[15px] bg-bgalt p-5">
                {PREM.map((f) => (
                  <Feat key={f}>{f}</Feat>
                ))}
              </div>
              <Cta />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
