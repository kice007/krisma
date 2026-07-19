import { ArrowUpRight } from 'lucide-react'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

function Num({ children }) {
  return <span className="font-display text-[15px] font-bold text-indigo">{children}</span>
}

export default function Industries() {
  const { t } = useLang()
  const s = t.industries
  return (
    <section id="industries" className="bg-deepindigo">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-16 lg:px-16 lg:py-[88px]">
        {/* Desktop row 1: head + card 01 */}
        <div className="flex flex-col gap-5 lg:flex-row lg:gap-5">
          {/* Head block */}
          <Reveal className="lg:w-[460px] lg:shrink-0">
            <div className="flex flex-col gap-5 pb-1">
              <span className="w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 font-body text-[13px] font-semibold text-white">
                {s.badge}
              </span>
              <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-white lg:text-[44px]">
                {s.heading}
              </h2>
              <p className="font-body text-[15px] leading-[1.55] text-[#c4c9e8]">
                {s.paragraph}
              </p>
              <a
                href="#contact"
                className="flex w-fit items-center gap-2 rounded-full bg-indigo px-6 py-[13px] text-[14px] font-semibold text-white hover:-translate-y-0.5"
              >
                {s.cta}
                <ArrowUpRight size={15} />
              </a>
            </div>
          </Reveal>

          {/* Card 01 — étudiants (horizontal on desktop) */}
          <Reveal className="flex-1" delay={0.05}>
            <div className="flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-white p-7 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex flex-col gap-3 lg:flex-1">
                <Num>01.</Num>
                <h3 className="font-display text-[22px] font-bold text-ink">{s.studentsTitle}</h3>
                <p className="font-body text-[14px] leading-[1.5] text-muted">
                  {s.studentsDesc}
                </p>
              </div>
              <img
                src="/img/etudiants.png"
                alt={s.studentsTitle}
                className="h-[200px] w-full rounded-2xl object-cover lg:h-[240px] lg:flex-1"
              />
            </div>
          </Reveal>
        </div>

        {/* Desktop row 2: card 02 (row, shorter) + card 03 (stacked, taller) */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-5">
          {/* Card 02 — familles (text left, image right) */}
          <Reveal className="lg:flex-[1.55]">
            <div className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-7 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex flex-col gap-3 lg:flex-1">
                <Num>02.</Num>
                <h3 className="font-display text-[22px] font-bold text-ink">{s.familiesTitle}</h3>
                <p className="font-body text-[14px] leading-[1.5] text-muted">
                  {s.familiesDesc}
                </p>
              </div>
              <img
                src="/img/familles.png"
                alt={s.familiesTitle}
                className="h-[200px] w-full rounded-2xl object-cover lg:h-[280px] lg:flex-1"
              />
            </div>
          </Reveal>

          {/* Card 03 — entrepreneurs (text top, image bottom — taller) */}
          <Reveal className="lg:flex-1" delay={0.05}>
            <div className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-7">
              <Num>03.</Num>
              <h3 className="font-display text-[22px] font-bold text-ink">{s.diasporaTitle}</h3>
              <p className="font-body text-[14px] leading-[1.5] text-muted">
                {s.diasporaDesc}
              </p>
              <img
                src="/img/entrepreneurs.png"
                alt={s.diasporaTitle}
                className="mt-1 h-[200px] w-full rounded-2xl object-cover lg:h-[300px]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
