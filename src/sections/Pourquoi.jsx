import { CircleCheckBig, ArrowUpRight } from 'lucide-react'
import Reveal from '../components/Reveal'

const IMG =
  'https://images.unsplash.com/photo-1706827183359-6b015aaad56c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3ODM3MTM0MjR8&ixlib=rb-4.1.0&q=80&w=1080'

const CHECKS = [
  'Taux  de conversion affichés avant chaque envoi',
  'Carte Mastercard acceptée partout en Europe',
  'Construisez votre score de crédit dès votre arrivée en Europe',
  'Accédez à des prêts adaptés à votre situation'
]

export default function Pourquoi() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-16 lg:py-[88px]">
        <Reveal>
          <span className="inline-block rounded-full bg-bgalt px-4 py-2 font-body text-[12px] font-semibold text-indigo">
            Pourquoi Krisma
          </span>
          <h2 className="mt-6 max-w-[960px] font-display text-[26px] font-semibold leading-[1.15] text-ink lg:text-[44px]">
            Conçue par la diaspora, pour la diaspora.
          </h2>
        </Reveal>

        <div className="mt-8 flex flex-col gap-6 lg:mt-10 lg:flex-row lg:items-stretch lg:gap-10">
          {/* Accent card (desktop only — the mobile design omits it) */}
          <Reveal className="hidden lg:block lg:w-[320px] lg:shrink-0">
            <div className="flex h-full flex-col justify-between gap-11 rounded-2xl bg-indigo p-7 lg:min-h-[280px]">
              <img src="/img/logo-white.png" alt="" className="h-11 w-11 rounded-xl object-cover" />
              <div className="flex flex-col gap-3.5">
                <span className="w-fit rounded-full bg-white px-3 py-2 font-display text-[14px] font-extrabold text-indigo">
                  IA
                </span>
                <p className="font-display text-[20px] font-bold leading-[1.2] text-white">
                  Un assistant multilingue à votre service
                </p>
              </div>
            </div>
          </Reveal>

          {/* Middle */}
          <Reveal className="flex-1" delay={0.05}>
            <div className="flex flex-col gap-5">
              <p className="font-body text-[16px] leading-[1.6] text-muted">
                Les banques traditionnelles ne comprennent pas votre réalité. Krisma oui.
                Frais transparents, transferts instantanés, et un assistant qui parle votre langue.
              </p>
              {CHECKS.map((c) => (
                <div key={c} className="flex gap-3">
                  <CircleCheckBig size={20} className="shrink-0 text-indigo" />
                  <span className="font-body text-[14px] font-medium text-ink">{c}</span>
                </div>
              ))}
              <a
                href="#features"
                className="flex w-fit items-center gap-2.5 rounded-full bg-ink px-[26px] py-[15px] text-[15px] font-semibold text-white hover:-translate-y-0.5"
              >
                En savoir plus
                <ArrowUpRight size={16} />
              </a>
            </div>
          </Reveal>

          {/* Image */}
          <Reveal className="lg:w-[500px] lg:shrink-0" delay={0.1}>
            <img
              src={IMG}
              alt="Krisma"
              className="h-[240px] w-full rounded-[15px] object-cover lg:h-[420px]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
