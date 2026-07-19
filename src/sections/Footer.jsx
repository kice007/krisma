import Reveal from '../components/Reveal'
import { XIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from '../components/BrandIcons'
import { useLang } from '../i18n'

// Hrefs per column (order matches the translated labels in i18n.jsx footer.cols).
const HREFS = [
  ['#features', '#features', '#features', '#features'],
  ['#equipe', '#tarifs', '#contact'],
  ['#', '#', '#', '#'],
]

const SOCIALS = [XIcon, LinkedinIcon, InstagramIcon, FacebookIcon]

export default function Footer() {
  const { t } = useLang()
  const f = t.footer
  const COLS = f.cols.map((c, i) => ({
    h: c.h,
    links: c.labels.map((label, j) => [label, HREFS[i][j]]),
  }))
  return (
    <footer className="bg-indigo p-3.5 lg:px-5 lg:py-6">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <div className="flex flex-col gap-8 rounded-[28px] bg-white p-6 py-10 lg:gap-12 lg:p-16">
            {/* Top divider — mobile only */}
            <div className="h-px w-full bg-line lg:hidden" />
            {/* Top */}
            <div className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-16">
              <div className="flex flex-col gap-4 lg:w-[480px]">
                <h3 className="font-display text-[26px] font-bold leading-[1.1] text-ink lg:text-[34px]">
                  {f.heading}
                </h3>
                <p className="font-body text-[15px] leading-[1.55] text-muted">
                  {f.paragraph}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:flex lg:flex-row lg:gap-12">
                {COLS.map((c) => (
                  <div key={c.h} className="flex flex-col gap-3.5 lg:w-[160px]">
                    <p className="font-display text-[17px] font-bold text-ink">{c.h}</p>
                    <div className="flex flex-col gap-[13px]">
                      {c.links.map(([label, href]) => (
                        <a
                          key={label}
                          href={href}
                          className="font-body text-[15px] text-muted hover:text-indigo"
                        >
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-line" />

            {/* Bottom */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <span className="font-display text-[40px] font-extrabold text-ink lg:text-[26px]">Krisma</span>
              <div className="flex gap-3">
                {SOCIALS.map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-bgalt text-ink hover:bg-line"
                  >
                    <Icon size={17} />
                  </a>
                ))}
              </div>
              <span className="font-body text-[14px] text-muted">{f.copyright}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
