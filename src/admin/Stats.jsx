import { useEffect, useState } from 'react'
import { arpc as rpc } from './api'
import { TEXT, countryName } from '../waitlist/text'
import { CATEGORY, Card, PageHead, Spinner, errText, fmt, pct } from './ui'

const q = TEXT.fr.q

function Bars({ title, data, options, labelOf }) {
  const entries = options ? options.map(([code, label]) => [label, data?.[code] || 0]) : Object.entries(data || {}).map(([k, v]) => [labelOf ? labelOf(k) : k, v]).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const max = Math.max(1, ...entries.map(([, v]) => v))
  return (
    <Card>
      <h2 className="mb-4 font-body text-[15px] font-semibold">{title}</h2>
      {total === 0 ? (
        <p className="font-body text-[14px] text-gris">Pas encore de réponse.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map(([label, v]) => (
            <li key={label}>
              <div className="flex justify-between gap-3 font-body text-[13px]">
                <span>{label}</span>
                <span className="shrink-0 text-gris tabular-nums">
                  {fmt(v)} · {pct(v, options ? total : total)}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-clair">
                <div className="h-full rounded-full bg-noir" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// Statistiques : réponses au questionnaire (membres vérifiés) et villes.
export default function Stats() {
  const [s, setS] = useState(null)
  const [cities, setCities] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    Promise.all([rpc('admin_questionnaire_stats'), rpc('admin_city_stats')]).then(
      ([a, b]) => {
        setS(a)
        setCities(b)
      },
      (e) => setError(errText(e)),
    )
  }, [])
  if (error) return <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>
  if (!s) return <Spinner />
  return (
    <div>
      <PageHead title="Statistiques" sub="Réponses au questionnaire des membres vérifiés, et demande par ville" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Bars title="Q2 · Situation" data={s.situation} options={q.situation.options} />
        <Bars title="Q3 · Reçoit de l’argent d’Afrique" data={s.receive_frequency} options={q.frequency} />
        <Bars title="Q3 · Depuis quels pays" data={s.receive_countries} labelOf={(c) => countryName(c, 'fr')} />
        <Bars title="Q4 · Envoie de l’argent en Afrique" data={s.send_frequency} options={q.frequency} />
        <Bars title="Q4 · Vers quels pays" data={s.send_countries} labelOf={(c) => countryName(c, 'fr')} />
        <Bars title="Q5 · Intérêt transferts instantanés" data={s.interest_transfers} options={q.interest} />
        <Bars title="Q6 · Achats en commerces de proximité" data={s.local_shop_frequency} options={q.shopFrequency.options} />
        <Bars title="Q7 · Dépense mensuelle" data={s.local_shop_spend} options={q.shopSpend.options} />
        <Bars title="Q8 · Intérêt cashback" data={s.interest_cashback} options={q.interest} />
        <Bars title="Q9 · Services (plusieurs réponses)" data={s.services} options={q.services.options} />
        <Bars title="Q10 · Prêt à payer 4,99 €/mois" data={s.willing_to_pay} options={q.pay.options} />
        <Bars title="Q11 · Usage envisagé" data={s.usage_intent} options={q.usage.options} />
      </div>
      <Card className="mt-4 !p-0">
        <h2 className="px-5 pt-5 font-body text-[15px] font-semibold">Demande par ville</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[760px] border-collapse text-left font-body text-[14px]">
            <thead className="text-[12px] text-gris">
              <tr className="border-b border-ligne">
                {['Ville', 'Membres vérifiés', 'Commerces proposés', 'Validés', 'Soutiens', 'Partenaires', 'Cashback actif', 'Catégorie la plus proposée'].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.city_id} className="border-b border-ligne last:border-0">
                  <td className="px-5 py-3 font-semibold">
                    {c.city} <span className="font-normal text-gris">{c.country_code}</span>
                  </td>
                  {[c.members, c.shops_proposed, c.shops_validated, c.votes, c.partners, c.cashback_active].map((v, i) => (
                    <td key={i} className="px-5 py-3 tabular-nums">
                      {fmt(v)}
                    </td>
                  ))}
                  <td className="px-5 py-3">{c.top_category ? CATEGORY[c.top_category] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
