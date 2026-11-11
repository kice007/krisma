import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, Map as MapIcon, Trash2, TriangleAlert } from 'lucide-react'
import { PATHS } from '../waitlist/flow'
import { downloadMyData } from './account'
import { useMT, useMember } from './Shell'

// W14 — Règles de la campagne (page publique, sommaire collant sur desktop).
export default function Rules() {
  const { t } = useMT()
  const r = t.rules
  const { d } = useMember()
  const { hash } = useLocation()
  const [active, setActive] = useState(r.sections[0].id)

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' })
    r.sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [r])

  return (
    <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
      <aside className="hidden lg:block">
        <nav className="sticky top-32 flex flex-col gap-1">
          <p className="mb-3 font-body text-[13px] font-semibold text-gris">{r.toc}</p>
          {r.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`rounded-xl px-3 py-2 font-body text-[14px] ${active === s.id ? 'bg-white font-semibold text-noir' : 'text-noir/65 hover:text-noir'}`}
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 rounded-[28px] bg-white p-6 lg:p-12">
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-clair px-3 font-body text-[12px] font-medium">
          <span className="h-[7px] w-[7px] rounded-full bg-marque" />
          {r.badge}
        </span>
        <h1 className="mt-4 font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] lg:text-[52px] lg:tracking-[-2px]">{r.title}</h1>
        <p className="mt-3 font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{r.intro}</p>

        {r.sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-32 border-t border-ligne pt-8">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.6px] lg:text-[26px]">{s.title}</h2>
            {s.body.map((para, i) => (
              <p key={i} className="mt-3 font-body text-[15px] leading-[1.65] text-noir/85">
                {para}
              </p>
            ))}
            {s.table && (
              <div className="mt-5 overflow-hidden rounded-[18px] border border-ligne">
                <table className="w-full border-collapse text-left font-body text-[14px]">
                  <thead className="bg-clair text-gris">
                    <tr>
                      {r.table.head.map((h, i) => (
                        <th key={h} className={`px-4 py-3 font-medium ${i === 2 ? 'hidden sm:table-cell' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.table.rows.map(([a, p, c]) => (
                      <tr key={a} className="border-t border-ligne">
                        <td className="px-4 py-3.5 font-semibold">
                          {a}
                          <span className="mt-0.5 block font-normal text-gris sm:hidden">{c}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-marque">{p}</td>
                        <td className="hidden px-4 py-3.5 sm:table-cell">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {s.after && <p className="mt-4 font-body text-[13px] leading-[1.6] text-gris">{s.after}</p>}
            {s.id === 'carte' && (
              <Link to="/carte" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-ligne px-4 font-body text-[14px] font-semibold hover:border-noir">
                <MapIcon size={16} />
                {t.nav.map}
              </Link>
            )}
            {s.data && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {d ? (
                  <>
                    <button type="button" onClick={() => downloadMyData().catch(() => {})} className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ligne px-4 font-body text-[14px] font-semibold hover:border-noir">
                      <Download size={16} />
                      {t.profile.export}
                    </button>
                    <Link to="/espace/profil" className="flex h-11 items-center gap-2 rounded-full border border-ligne px-4 font-body text-[14px] font-semibold hover:border-noir">
                      <Trash2 size={16} />
                      {t.profile.delete}
                    </Link>
                  </>
                ) : (
                  <Link to={PATHS.login} className="flex h-11 items-center rounded-full border border-ligne px-4 font-body text-[14px] font-semibold hover:border-noir">
                    {t.nav.login}
                  </Link>
                )}
              </div>
            )}
          </section>
        ))}

        <p className="mt-10 flex items-start gap-3 rounded-[18px] bg-[#fff4ec] p-4 font-body text-[13px] leading-[1.5] text-[#9a3412]">
          <TriangleAlert size={17} className="mt-px shrink-0" />
          {r.draft}
        </p>
      </article>
    </div>
  )
}

// /carte — KRISMA Map (phase 5).
export function MapSoon() {
  const { t } = useMT()
  const { d } = useMember()
  return (
    <section className="mx-auto flex max-w-[640px] flex-col items-center gap-5 rounded-[28px] bg-white px-6 py-16 text-center lg:py-24">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clair">
        <MapIcon size={26} />
      </span>
      <h1 className="font-display text-[30px] font-bold tracking-[-1px] lg:text-[38px]">{t.soon.title}</h1>
      <p className="max-w-[460px] font-body text-[16px] leading-[1.6] text-gris">{t.soon.sub}</p>
      <Link to={d ? '/espace' : PATHS.home} className="flex h-12 items-center rounded-full bg-noir px-6 font-body text-[15px] font-semibold text-white hover:bg-[#2b2b2b]">
        {d ? t.soon.cta : t.soon.ctaPublic}
      </Link>
    </section>
  )
}
