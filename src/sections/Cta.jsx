import { ArrowUpRight, ArrowRight, ArrowDownLeft } from 'lucide-react'
import Reveal from '../components/Reveal'
import { AppleIcon, GooglePlayIcon } from '../components/BrandIcons'
import { useLang } from '../i18n'

function StoreBadge({ icon, small, name }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-base px-5 py-[11px]">
      {icon}
      <div className="flex flex-col leading-tight">
        <span className="font-body text-[10px] text-white/80">{small}</span>
        <span className="font-display text-[15px] font-bold text-white">{name}</span>
      </div>
    </div>
  )
}

function TransferCard() {
  const { t } = useLang()
  const c = t.cta
  return (
    <div className="w-[320px] rounded-[18px] border border-white/40 bg-white/15 p-[22px] text-white backdrop-blur-md">
      <div className="flex gap-6">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5 text-white/80">
            <ArrowUpRight size={13} />
            <span className="font-body text-[12px]">{c.youSend}</span>
          </div>
          <span className="font-display text-[24px] font-extrabold">300 €</span>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-1.5 text-white/80">
            <ArrowDownLeft size={13} />
            <span className="font-body text-[12px]">{c.theyReceive}</span>
          </div>
          <span className="font-display text-[24px] font-extrabold">196 750 F</span>
        </div>
      </div>
      <p className="mt-3.5 font-body text-[12px] text-white/70">{c.rate}</p>
      <div className="mt-3.5 flex h-[46px] items-center justify-center gap-2 rounded-[10px] bg-white font-body text-[14px] font-semibold text-indigo">
        {c.confirm}
        <ArrowRight size={16} />
      </div>
    </div>
  )
}

function SpendingCard() {
  const { t } = useLang()
  const c = t.cta
  const rows = c.rows
  return (
    <div className="w-[320px] rounded-[18px] border border-white/40 bg-white/15 p-[22px] text-white backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="font-body text-[14px] font-semibold">{c.spending}</span>
        <span className="font-display text-[22px] font-extrabold">124 €</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/30">
        <div className="h-full w-1/2 rounded-full bg-white" />
      </div>
      <p className="mt-2 font-body text-[12px] text-white/70">{c.remaining}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center gap-2.5">
            <span className="h-[30px] w-[30px] shrink-0 rounded-full bg-white/30" />
            <div className="flex flex-1 flex-col">
              <span className="font-body text-[12px] font-semibold">{r.n}</span>
              <span className="font-body text-[10px] text-white/70">{r.d}</span>
            </div>
            <span className="font-body text-[12px] font-bold">{r.a}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Cta() {
  const { t } = useLang()
  const c = t.cta
  return (
    <section id="contact" className="bg-white px-4 py-11 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[28px] px-6 py-11 lg:px-20 lg:py-[100px]"
            style={{ backgroundImage: 'linear-gradient(240deg, #3B31C7, #5A67E8)' }}
          >
            {/* Floating glass cards — low, flanking the bottom corners, peeking up (clipped by the band) */}
            <div className="pointer-events-none absolute -bottom-10 left-6 z-0 hidden rotate-6 xl:block">
              <TransferCard />
            </div>
            <div className="pointer-events-none absolute -bottom-10 right-6 z-0 hidden -rotate-6 xl:block">
              <SpendingCard />
            </div>

            {/* Center */}
            <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center gap-5 text-center">
              <h2 className="font-display text-[32px] font-semibold leading-[1.06] text-white lg:text-[48px]">
                {c.heading}
              </h2>
              <p className="font-body text-[15px] leading-[1.55] text-[#e4e7fb] lg:text-[16px]">
                {c.paragraph}
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex w-full max-w-[440px] items-center justify-between gap-2 rounded-full border border-line bg-white py-2 pl-6 pr-2"
              >
                <input
                  type="email"
                  placeholder={c.placeholder}
                  className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-ink outline-none placeholder:text-muted"
                />
                <button
                  type="submit"
                  aria-label={c.send}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo text-white hover:-translate-y-0.5"
                >
                  <ArrowUpRight size={20} />
                </button>
              </form>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <StoreBadge icon={<AppleIcon size={22} className="text-white" />} small={c.soon} name="App Store" />
                <StoreBadge icon={<GooglePlayIcon size={22} className="text-white" />} small={c.soon} name="Google Play" />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
