import { ArrowUpRight } from 'lucide-react'
import Reveal from '../components/Reveal'
import { useLang } from '../i18n'

const U = 'https://images.unsplash.com/'
const P = 'crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080'

const PEOPLE = [
  { name: 'Christian Ehouman', img: '../public/img/team_1.jpg' },
  { name: 'Ivan Ehouman', img: '../public/img/team_2.png' },
  { name: 'Élyse Ehouman', img: '../public/img/team_3.jpg' },
]

export default function Team() {
  const { t } = useLang()
  const tm = t.team
  const MEMBERS = PEOPLE.map((m, i) => ({ ...m, role: tm.roles[i] }))
  return (
    <section id="equipe" className="bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-16 lg:py-20">
        {/* Head */}
        <Reveal className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex flex-col gap-[18px]">
            <span className="w-fit rounded-full bg-bgalt px-4 py-2 font-body text-[12px] font-bold text-indigo">
              {tm.badge}
            </span>
            <h2 className="font-display text-[30px] font-semibold leading-[1.1] text-ink lg:text-[44px]">
              {tm.heading}
            </h2>
          </div>
          <p className="font-body text-[16px] leading-[1.55] text-ink lg:max-w-[400px]">
            {tm.paragraph}
          </p>
        </Reveal>

        {/* Mobile: rows */}
        <div className="mt-8 flex flex-col gap-4 lg:hidden">
          {MEMBERS.map((m) => (
            <div key={m.name} className="flex items-center gap-4">
              <img src={m.img} alt={m.name} className="h-[130px] w-[110px] shrink-0 rounded-[14px] object-cover" />
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-[20px] font-bold text-ink">{m.name}</p>
                <p className="font-body text-[12px] font-semibold tracking-[1px] text-indigolt">{m.role}</p>
              </div>
            </div>
          ))}
          <a
            href="#contact"
            className="mt-4 flex w-fit items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[15px] font-semibold text-white hover:-translate-y-0.5"
          >
            {tm.seeAll}
            <ArrowUpRight size={16} />
          </a>
        </div>

        {/* Desktop: grid */}
        <div className="mt-12 hidden grid-cols-3 gap-x-9 gap-y-11 lg:grid">
          {MEMBERS.map((m, i) => (
            <Reveal key={m.name} delay={(i % 3) * 0.05}>
              <div className="flex flex-col gap-5">
                <img src={m.img} alt={m.name} className="h-[230px] w-[200px] rounded-[14px] object-cover" />
                <div className="flex flex-col gap-1.5">
                  <p className="font-display text-[22px] font-bold text-ink">{m.name}</p>
                  <p className="font-body text-[12px] font-semibold tracking-[1px] text-indigolt">{m.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Desktop CTA — centered below the team row */}
        <div className="mt-14 hidden justify-center lg:flex">
          <a
            href="#contact"
            className="flex items-center gap-2.5 rounded-full bg-ink px-7 py-4 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {tm.seeAll}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
