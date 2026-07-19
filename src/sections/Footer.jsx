import Reveal from '../components/Reveal'
import { XIcon, LinkedinIcon, InstagramIcon, FacebookIcon } from '../components/BrandIcons'

const COLS = [
  {
    h: 'Produit',
    links: [
      ['Compte européen', '#features'],
      ['Transferts', '#features'],
      ['Visa étudiant', '#features'],
      ['Garantie locative', '#features'],
    ],
  },
  {
    h: 'Liens',
    links: [
      ['Équipe', '#equipe'],
      ['Tarifs', '#tarifs'],
      ['Contact', '#contact'],
    ],
  },
  {
    h: 'Légal',
    links: [
      ['CGU', '#'],
      ['Confidentialité', '#'],
      ['Cookies', '#'],
      ['Mentions légales', '#'],
    ],
  },
]

const SOCIALS = [XIcon, LinkedinIcon, InstagramIcon, FacebookIcon]

export default function Footer() {
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
                  La banque de la diaspora africaine
                </h3>
                <p className="font-body text-[15px] leading-[1.55] text-muted">
                  La banque qui vous accompagne de votre premier jour en Europe jusqu'à votre réussite
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
              <span className="font-body text-[14px] text-muted">© 2026 Krisma — Tous droits réservés.</span>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  )
}
