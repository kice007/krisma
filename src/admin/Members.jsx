import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Download, Search } from '../components/icons'
import { arpc as rpc } from './api'
import { TEXT, countryName } from '../waitlist/text'
import { useAdmin } from './Shell'
import { Badge, Button, Card, Confirm, Empty, FLAGS, MEMBER_STATUS, POINT_KIND, POINT_STATUS, PageHead, SHOP_STATUS, Select, Spinner, date, errText, fmt } from './ui'
import { exportMembers } from './exports'

const PAGE = 50

// A2 / AM2 — Membres : recherche, filtres, signaux anti-fraude.
export default function Members() {
  const { canAdmin } = useAdmin()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [flagged, setFlagged] = useState(false)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(null)
  const [cities, setCities] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    rpc('admin_city_stats').then((list) => setCities(list || []), () => {})
  }, [])
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => setPage(0), [q, status, city, country, flagged])
  useEffect(() => {
    setRows(null)
    rpc('admin_list_members', {
      p_search: q || null,
      p_status: status || null,
      p_city_id: city || null,
      p_country: country || null,
      p_flagged: flagged,
      p_limit: PAGE,
      p_offset: page * PAGE,
    }).then(setRows, (e) => setError(errText(e)))
  }, [q, status, city, country, flagged, page])

  const countries = useMemo(() => [...new Set(cities.map((c) => c.country_code))].sort(), [cities])
  const total = rows?.[0] ? Number(rows[0].total) : 0
  const verified = cities.reduce((s, c) => s + c.members, 0)

  return (
    <div>
      <PageHead title="Utilisateurs" sub={rows ? `${fmt(total)} résultat${total > 1 ? 's' : ''} · ${fmt(verified)} membres vérifiés avec une ville` : ' '}>
        {canAdmin && (
          <Button
            tone="dark"
            icon={Download}
            busy={busy}
            onClick={async () => {
              setBusy(true)
              await exportMembers().catch((e) => setError(errText(e)))
              setBusy(false)
            }}
          >
            Exporter (Excel)
          </Button>
        )}
      </PageHead>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full bg-white px-4 sm:w-[300px]">
          <Search size={17} className="text-gris" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, e-mail…" aria-label="Rechercher un membre" className="min-w-0 flex-1 bg-transparent font-body text-[14px] outline-none" />
        </label>
        <Select label="Ville" value={city} onChange={setCity} options={[['', 'toutes'], ...cities.filter((c) => c.members > 0).map((c) => [c.city_id, c.city])]} />
        <Select label="Pays" value={country} onChange={setCountry} options={[['', 'tous'], ...countries.map((c) => [c, countryName(c, 'fr')])]} />
        <Select label="Statut" value={status} onChange={setStatus} options={[['', 'tous'], ...Object.entries(MEMBER_STATUS).map(([k, [l]]) => [k, l])]} />
        <button
          type="button"
          aria-pressed={flagged}
          onClick={() => setFlagged((f) => !f)}
          className={`h-11 cursor-pointer rounded-full px-4 font-body text-[14px] font-semibold ${flagged ? 'bg-[#b91c1c] text-white' : 'bg-[#fee2e2] text-[#b91c1c]'}`}
        >
          Suspects uniquement
        </button>
      </div>
      {error && <p className="mb-3 font-body text-[14px] text-[#b91c1c]">{error}</p>}
      <Card className="!p-0">
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty>Aucun membre ne correspond à ces filtres.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left font-body text-[14px]">
              <thead className="text-[12px] text-gris">
                <tr className="border-b border-ligne">
                  {['Membre', 'E-mail', 'Ville', 'Statut', 'Points', 'Filleuls', 'Inscrit le', 'Signal'].map((h) => (
                    <th key={h} className="px-5 py-3.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const [label, tone] = MEMBER_STATUS[m.status]
                  const warn = m.status === 'suspended' || m.flags.length > 0
                  return (
                    <tr key={m.id} onClick={() => navigate(`/admin/membres/${m.id}`)} className={`cursor-pointer border-b border-ligne last:border-0 hover:bg-clair ${warn ? 'bg-[#fff7ed]' : ''}`}>
                      <td className="px-5 py-3.5 font-semibold">
                        <Link to={`/admin/membres/${m.id}`} onClick={(e) => e.stopPropagation()}>
                          {m.pseudo}
                        </Link>
                      </td>
                      <td className="max-w-[240px] truncate px-5 py-3.5">{m.email}</td>
                      <td className="px-5 py-3.5">{m.city || '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={tone}>{label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{fmt(m.points)}</td>
                      <td className="px-5 py-3.5 tabular-nums">{fmt(m.referrals)}</td>
                      <td className="px-5 py-3.5">{date(m.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex flex-wrap gap-1">
                          {m.flags.length ? m.flags.map((f) => <Badge key={f} tone="bad">{FLAGS[f]}</Badge>) : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-center gap-3 font-body text-[14px]">
          <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Précédents
          </Button>
          <span className="text-gris">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} sur {fmt(total)}
          </span>
          <Button disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>
            Suivants
          </Button>
        </div>
      )}
    </div>
  )
}

const QA = TEXT.fr.q
const opt = (list, code) => (code ? (list.find(([c]) => c === code) || [null, code])[1] : '—')

// AM3 — Fiche d'un membre : signaux, réponses, points (corrections), filleuls.
export function MemberDetail() {
  const { id } = useParams()
  const { canAdmin } = useAdmin()
  const [m, setM] = useState(null)
  const [error, setError] = useState(null)
  const [action, setAction] = useState(null)
  const [allAnswers, setAllAnswers] = useState(false)
  const load = () => rpc('admin_member_detail', { p_user: id }).then(setM, (e) => setError(errText(e)))
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) return <p className="font-body text-[14px] text-[#b91c1c]">{error}</p>
  if (!m) return <Spinner />
  const [label, tone] = MEMBER_STATUS[m.status]
  const qa = m.questionnaire || {}
  const countries = (arr) => (arr?.length ? arr.map((c) => countryName(c, 'fr')).join(', ') : '—')
  const answers = [
    ['Q2 Situation', opt(QA.situation.options, qa.situation)],
    ['Q3 Reçoit de l’argent', `${opt(QA.frequency, qa.receive_frequency)} · ${countries(qa.receive_countries)}`],
    ['Q4 Envoie de l’argent', `${opt(QA.frequency, qa.send_frequency)} · ${countries(qa.send_countries)}`],
    ['Q5 Transferts', opt(QA.interest, qa.interest_transfers)],
    ['Q6 Commerces de proximité', opt(QA.shopFrequency.options, qa.local_shop_frequency)],
    ['Q7 Dépense mensuelle', opt(QA.shopSpend.options, qa.local_shop_spend)],
    ['Q8 Cashback', opt(QA.interest, qa.interest_cashback)],
    ['Q9 Services', (qa.services || []).map((c) => opt(QA.services.options, c)).join(', ') || '—'],
    ['Q10 4,99 €/mois', opt(QA.pay.options, qa.willing_to_pay)],
    ['Q11 Usage', opt(QA.usage.options, qa.usage_intent)],
  ]
  const alert = [
    m.flags.includes('shared_ip') && `${m.same_ip} autre${m.same_ip > 1 ? 's' : ''} inscription${m.same_ip > 1 ? 's' : ''} depuis la même adresse IP`,
    m.flags.includes('disposable_email') && 'adresse e-mail jetable',
    m.points_suspended > 0 && `${fmt(m.points_suspended)} points suspendus`,
    m.status === 'suspended' && `compte suspendu${m.suspension_reason ? ` (${m.suspension_reason})` : ''}`,
  ].filter(Boolean)

  const setPoints = (ev, status, title) => setAction({ title, reason: 'Motif (visible dans l’historique)', confirm: title, run: (r) => rpc('admin_set_point_status', { p_event_id: ev.id, p_status: status, p_reason: r }) })

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link to="/admin/membres" className="mb-4 inline-flex items-center gap-2 font-body text-[14px] font-medium text-gris hover:text-noir">
        Utilisateurs
      </Link>
      <PageHead title={[m.first_name, m.last_name].filter(Boolean).join(" ") || m.pseudo} sub={m.email}>
        <Badge tone={tone} className="!h-8 !px-3 !text-[13px]">
          {label}
        </Badge>
        {canAdmin &&
          (m.status === 'suspended' ? (
            <Button tone="dark" onClick={() => setAction({ title: 'Rétablir ce membre', text: 'Il retrouve son statut et réapparaît dans le classement.', confirm: 'Rétablir', run: () => rpc('admin_set_user_suspended', { p_user_id: m.id, p_suspended: false }) })}>
              Rétablir
            </Button>
          ) : (
            <Button tone="danger" onClick={() => setAction({ title: 'Suspendre ce membre', text: 'Il disparaît du classement pendant la suspension. Ses points restent dans l’historique.', reason: 'Motif de la suspension', confirm: 'Suspendre', tone: 'dark', run: (r) => rpc('admin_set_user_suspended', { p_user_id: m.id, p_suspended: true, p_reason: r }) })}>
              Suspendre
            </Button>
          ))}
      </PageHead>
      {alert.length > 0 && (
        <p className="mb-4 flex items-start gap-3 rounded-[18px] bg-[#fee2e2] p-4 font-body text-[14px] leading-[1.5] text-[#b91c1c]">
          <AlertTriangle size={18} className="mt-px shrink-0" />
          Signaux : {alert.join(' · ')}.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="!py-2">
            {[
              ['E-mail', m.email],
              ['Ville', m.city ? `${m.city.name}, ${m.city.country_name}` : '—'],
              ['Inscription', date(m.created_at)],
              ['Validée le', date(m.verified_at)],
              ['Parrain', m.referrer || '—'],
              ['Code de parrainage', m.referral_code],
              ['Points', `${fmt(m.points)}${m.points_suspended ? ` (${fmt(m.points_suspended)} suspendus)` : ''}`],
              ['Actualités', m.consent_marketing ? 'Oui' : 'Non'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-ligne py-3 font-body text-[14px] last:border-0">
                <span className="text-gris">{k}</span>
                <span className="truncate text-right font-medium">{v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="font-body text-[15px] font-semibold">Réponses au questionnaire</h2>
            {!m.questionnaire ? (
              <p className="mt-2 font-body text-[14px] text-gris">Pas encore de réponse.</p>
            ) : (
              <>
                <dl className="mt-3 flex flex-col gap-2.5">
                  {(allAnswers ? answers : answers.filter((x) => /^Q(2|5|10) /.test(x[0]))).map(([k, v]) => (
                    <div key={k} className="font-body text-[13px]">
                      <dt className="text-gris">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button type="button" onClick={() => setAllAnswers((x) => !x)} className="mt-3 cursor-pointer font-body text-[13px] font-semibold underline underline-offset-2">
                  {allAnswers ? 'Réduire' : 'Voir les 11 réponses'}
                </button>
              </>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-3 font-body text-[15px] font-semibold">Points</h2>
            {m.events.length === 0 && <p className="font-body text-[14px] text-gris">Aucun point.</p>}
            <ul>
              {m.events.map((e) => {
                const [l, t] = POINT_STATUS[e.status]
                return (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 border-b border-ligne py-3 last:border-0">
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-[14px] font-semibold">{POINT_KIND[e.kind]}</span>
                      <span className="block font-body text-[12px] text-gris">{[e.label, date(e.created_at, true), e.reason].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="font-body text-[14px] font-semibold tabular-nums">+{e.points}</span>
                    <Badge tone={t}>{l}</Badge>
                    {canAdmin && (
                      <span className="flex gap-1.5">
                        {e.status === 'suspended' && (
                          <Button className="!h-8 !px-3 !text-[12px]" onClick={() => setPoints(e, 'awarded', 'Attribuer les points')}>
                            Attribuer
                          </Button>
                        )}
                        {(e.status === 'awarded' || e.status === 'suspended') && (
                          <Button tone="danger" className="!h-8 !px-3 !text-[12px]" onClick={() => setPoints(e, 'revoked', 'Annuler les points')}>
                            Annuler
                          </Button>
                        )}
                        {e.status === 'revoked' && (
                          <Button className="!h-8 !px-3 !text-[12px]" onClick={() => setPoints(e, 'awarded', 'Rétablir les points')}>
                            Rétablir
                          </Button>
                        )}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-body text-[15px] font-semibold">Filleuls ({m.referees.length})</h2>
              {m.referees.length === 0 && <p className="font-body text-[14px] text-gris">Aucun filleul.</p>}
              <ul className="flex flex-col gap-2.5">
                {m.referees.map((r) => (
                  <li key={r.pseudo} className="flex flex-wrap items-center gap-2 font-body text-[13px]">
                    <span className="font-semibold">{r.pseudo}</span>
                    <span className="truncate text-gris">{r.email}</span>
                    <Badge tone={MEMBER_STATUS[r.status][1]}>{MEMBER_STATUS[r.status][0]}</Badge>
                    {r.flags.map((f) => (
                      <Badge key={f} tone="bad">
                        {FLAGS[f]}
                      </Badge>
                    ))}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-3 font-body text-[15px] font-semibold">Commerces proposés ({m.shops.length})</h2>
              {m.shops.length === 0 && <p className="font-body text-[14px] text-gris">Aucun commerce.</p>}
              <ul className="flex flex-col gap-2.5">
                {m.shops.map((s) => (
                  <li key={s.name + s.created_at} className="flex items-center justify-between gap-2 font-body text-[13px]">
                    <span className="truncate font-semibold">{s.name}</span>
                    <Badge tone={SHOP_STATUS[s.status][1]}>{SHOP_STATUS[s.status][0]}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
      {action && (
        <Confirm
          {...action}
          onCancel={() => setAction(null)}
          onConfirm={async (r) => {
            await action.run(r)
            setAction(null)
            await load()
          }}
        />
      )}
    </div>
  )
}
