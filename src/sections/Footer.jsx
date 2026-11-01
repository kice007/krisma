import { LangSwitch } from '../components/Nav'
import Reveal from '../components/Reveal'
import { Socials } from '../components/Socials'
import { useLang } from '../i18n'

function Column({ title, links, href, delay }) {
  return (
    <Reveal delay={delay} y={24} className="flex flex-col gap-2.5 lg:gap-3">
      <h3 className="font-body text-[16px] font-semibold text-noir">{title}</h3>
      {links.map((l, i) => (
        <a key={l} href={href?.[i] ?? '#'} className="w-fit whitespace-nowrap font-body text-[15px] text-gris hover:text-noir">
          {l}
        </a>
      ))}
    </Reveal>
  )
}

export default function Footer() {
  const { t } = useLang()
  const f = t.footer
  return (
    <footer className="bg-white px-5 pb-8 pt-6 lg:px-10 lg:pb-10 lg:pt-0 xl:px-[100px]">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <Reveal className="flex flex-col gap-6 lg:gap-[22px]">
            <span className="flex items-center gap-2">
              <img src="/img/landing/k-ink.png" alt="" className="h-[25px] w-5 object-contain" />
              <span className="font-display text-[20px] font-bold text-noir">KRISMA</span>
            </span>
            <p className="font-display text-[30px] font-semibold leading-[1.12] tracking-[-1px] text-noir lg:text-[36px]">
              {f.tagline[0]}
              <br />
              {f.tagline[1]}
            </p>
            <Socials className="text-noir" />
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:flex lg:gap-[72px]">
            {f.columns.map((c, i) => (
              <Column key={c.h} title={c.h} links={c.links} href={c.href} delay={i * 0.08} />
            ))}
            <div className="lg:hidden">
              <Column title={f.legalTitle} links={f.legal} delay={0.24} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-ligne pt-4 lg:mt-11 lg:pt-5">
          <p className="font-body text-[13px] text-gris lg:text-[14px]">{f.copyright}</p>
          <div className="flex items-center gap-5">
            <div className="hidden gap-5 lg:flex">
              {f.legal.map((l) => (
                <a key={l} href="#" className="font-body text-[14px] text-gris hover:text-noir">
                  {l}
                </a>
              ))}
            </div>
            <LangSwitch up />
          </div>
        </div>
      </div>
    </footer>
  )
}
