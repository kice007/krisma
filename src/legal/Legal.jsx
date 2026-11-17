import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../i18n'
import { LEGAL } from './text'

function Block({ b, sep }) {
  const [kind, data] = b
  if (kind === 'p') return <p className="mt-3 font-body text-[15px] leading-[1.65] text-noir/85">{data}</p>
  if (kind === 'ul')
    return (
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 font-body text-[15px] leading-[1.6] text-noir/85 marker:text-marque">
        {data.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    )
  if (kind === 'dl')
    return (
      <dl className="mt-3 flex flex-col gap-2.5">
        {data.map(([k, v]) => (
          <div key={k} className="font-body text-[15px] leading-[1.6] text-noir/85">
            <dt className="inline font-semibold text-noir">
              {k}
              {sep}
            </dt>
            <dd className="inline">{v}</dd>
          </div>
        ))}
      </dl>
    )
  if (kind === 'table') {
    const [head, rows] = data
    return (
      <div className="mt-4 overflow-x-auto rounded-[18px] border border-ligne">
        <table className="w-full min-w-[480px] border-collapse text-left font-body text-[14px]">
          <thead className="bg-clair text-gris">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-ligne align-top">
                {r.map((c, i) => (
                  <td key={i} className={`px-4 py-3 leading-[1.5] ${i === 0 ? 'font-medium text-noir' : 'text-noir/80'}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return null
}

// Mentions légales (/mentions-legales) et politique de confidentialité (/confidentialite).
export default function Legal({ page }) {
  const { lang } = useLang()
  const t = LEGAL[lang] || LEGAL.fr
  const doc = t[page]
  const { hash } = useLocation()
  const [active, setActive] = useState(doc.sections[0].id)

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' })
    doc.sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [doc])

  const others = [
    ['/mentions-legales', t.other.mentions, 'mentions'],
    ['/confidentialite', t.other.privacy, 'privacy'],
    ['/reglement', t.other.rules, 'rules'],
  ].filter(([, , k]) => k !== page)

  return (
    <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
      <aside className="hidden lg:block">
        <nav className="sticky top-32 flex flex-col gap-1">
          <p className="mb-3 font-body text-[13px] font-semibold text-gris">{t.toc}</p>
          {doc.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={`rounded-xl px-3 py-2 font-body text-[14px] ${active === s.id ? 'bg-white font-semibold text-noir' : 'text-noir/65 hover:text-noir'}`}>
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 rounded-[28px] bg-white p-6 lg:p-12">
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-clair px-3 font-body text-[12px] font-medium">
          <span className="h-[7px] w-[7px] rounded-full bg-marque" />
          {t.updated}
        </span>
        <h1 className="mt-4 font-display text-[34px] font-bold leading-[1.05] tracking-[-1.2px] lg:text-[52px] lg:tracking-[-2px]">{doc.title}</h1>
        <p className="mt-3 font-body text-[16px] leading-[1.6] text-gris lg:text-[17px]">{doc.intro}</p>

        {doc.sections.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-32 border-t border-ligne pt-8">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.6px] lg:text-[26px]">{s.title}</h2>
            {s.blocks.map((b, i) => (
              <Block key={i} b={b} sep={lang === 'en' ? ': ' : ' : '} />
            ))}
          </section>
        ))}

        <div className="mt-10 flex flex-col gap-4 rounded-[20px] bg-clair p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[14px]">
            <span className="font-semibold">{t.contact}</span> <span className="text-gris">{t.contactText}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {others.map(([to, label]) => (
              <Link key={to} to={to} className="inline-flex h-10 items-center rounded-full border border-ligne bg-white px-4 font-body text-[13px] font-semibold hover:border-noir">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
