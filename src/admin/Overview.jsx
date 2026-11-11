import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { arpc as rpc } from './api'
import { useAdmin } from './Shell'
import { Button, Card, PageHead, Select, Spinner, errText, fmt, pct } from './ui'
import { exportOverview } from './exports'

function Kpi({ label, value, sub, tone = 'text-vert' }) {
  return (
    <Card>
      <p className="font-body text-[13px] text-gris">{label}</p>
      <p className="mt-1.5 font-display text-[28px] font-bold tracking-[-0.8px] tabular-nums lg:text-[30px]">{value}</p>
      {sub && <p className={`mt-1 font-body text-[12px] font-semibold ${tone}`}>{sub}</p>}
    </Card>
  )
}

// Inscriptions par jour : barres empilées (direct en noir, via parrainage en orange).
// L'axe part du premier jour de la campagne ; les jours à venir restent en pointillés.
function Daily({ days }) {
  const max = Math.max(1, ...days.map((d) => d.total))
  const label = (d) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(`${d.day}T12:00:00`))
  const mid = days[Math.floor((days.length - 1) / 2)]
  return (
    <div>
      <div className="flex h-[240px] items-end gap-[3px] lg:h-[440px] lg:gap-1.5" role="img" aria-label="Nouveaux inscrits par jour">
        {days.map((d) =>
          d.future ? (
            <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${label(d)} · à venir`}>
              <span className="h-[3px] w-full rounded-full border-t-2 border-dotted border-ligne" />
            </div>
          ) : (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-noir px-2 py-1 font-body text-[11px] text-white group-hover:block">
                {label(d)} · {d.total} ({d.referred} parr.)
              </span>
              <span className="w-full rounded-t-[4px] bg-marque" style={{ height: `${(d.referred / max) * 100}%` }} />
              <span className={`w-full bg-noir ${d.referred ? '' : 'rounded-t-[4px]'}`} style={{ height: `${((d.total - d.referred) / max) * 100}%`, minHeight: d.total ? 3 : 0 }} />
              {!d.total && <span className="h-[3px] w-full rounded-full bg-clair" />}
            </div>
          ),
        )}
      </div>
      <div className="mt-2.5 flex justify-between border-t border-ligne pt-2 font-body text-[12px] text-gris">
        <span>{label(days[0])}</span>
        <span className="hidden sm:inline">{label(mid)}</span>
        <span>{label(days[days.length - 1])}</span>
      </div>
    </div>
  )
}

// A1 / AM1 — Vue d'ensemble de la campagne.
export default function Overview() {
  const { canAdmin } = useAdmin()
  const [days, setDays] = useState('30')
  const [o, setO] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setO(null)
    rpc('admin_overview', { p_days: Number(days) }).then(setO, (e) => setError(errText(e)))
  }, [days])

  if (error) return <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>
  if (!o) return <Spinner />
  const a = o.answers
  const maxCity = Math.max(1, ...o.cities.map((c) => c.members))

  return (
    <div>
      <PageHead title="Vue d’ensemble" sub="Campagne liste d’attente · données en temps réel">
        <Select label="Période" value={days} onChange={setDays} options={[['7', '7 jours'], ['30', '30 jours'], ['90', '90 jours']]} />
        {canAdmin && (
          <Button
            tone="dark"
            icon={Download}
            busy={busy}
            onClick={async () => {
              setBusy(true)
              await exportOverview(o).catch(() => {})
              setBusy(false)
            }}
          >
            Exporter
          </Button>
        )}
      </PageHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <Kpi label="Inscriptions" value={fmt(o.registrations)} sub={`+${fmt(o.registrations_week)} cette semaine`} />
        <Kpi label="E-mails vérifiés" value={fmt(o.verified)} sub={pct(o.verified, o.registrations)} />
        <Kpi label="Questionnaire terminé" value={pct(o.questionnaire_done, o.registrations)} sub="de complétion" />
        <Kpi label="Parrainages validés" value={fmt(o.referrals_validated)} sub={`${pct(o.referrals_validated, o.verified)} des inscrits`} />
        <Kpi label="Commerces proposés" value={fmt(o.shops_proposed)} sub={`${fmt(o.shops_to_review)} à vérifier`} tone="text-[#c2410c]" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-body text-[16px] font-semibold">Nouveaux inscrits par jour</h2>
            <span className="flex gap-4 font-body text-[12px] text-gris">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-noir" />
                Inscrits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-marque" />
                Via parrainage
              </span>
            </span>
          </div>
          <Daily days={o.daily} />
        </Card>
        <Card>
          <h2 className="mb-4 font-body text-[16px] font-semibold">Top villes (membres vérifiés)</h2>
          {o.cities.length === 0 && <p className="font-body text-[14px] text-gris">Pas encore de membre vérifié.</p>}
          <ul className="flex flex-col gap-4">
            {o.cities.map((c, i) => (
              <li key={c.name}>
                <div className="flex justify-between font-body text-[14px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gris tabular-nums">{fmt(c.members)}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-clair">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-marque' : 'bg-noir'}`} style={{ width: `${(c.members / maxCity) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi label="Intérêt transferts (Q5)" value={pct(a.transfers_interested, a.total)} sub="très ou assez intéressés" tone="text-gris" />
        <Kpi label="Intérêt cashback (Q8)" value={pct(a.cashback_interested, a.total)} sub="très ou assez intéressés" tone="text-gris" />
        <Kpi label="Prêts à payer 4,99 € (Q10)" value={`${pct(a.pay_yes, a.total)} oui`} sub={`+ ${pct(a.pay_maybe, a.total)} peut-être`} tone="text-gris" />
        <Kpi label="Compte principal (Q11)" value={pct(a.usage_primary, a.total)} sub={`${pct(a.usage_secondary, a.total)} secondaire`} tone="text-gris" />
      </div>
    </div>
  )
}
