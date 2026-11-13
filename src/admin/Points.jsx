import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, Search, Trophy } from 'lucide-react'
import { arpc as rpc } from './api'
import { useAdmin } from './Shell'
import { Badge, Button, Card, Confirm, Empty, POINT_KIND, POINT_STATUS, PageHead, Spinner, date, errText, fmt } from './ui'
import { exportRanking } from './exports'

const PAGE = 50
const TABS = [
  ['', 'Tous'],
  ['suspended', 'Suspendus'],
  ['pending', 'En attente'],
  ['revoked', 'Annulés'],
]

// A4 / AM6 — Historique de toutes les attributions, corrections avec motif.
export default function Points() {
  const { canAdmin } = useAdmin()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(null)
  const [sum, setSum] = useState(null)
  const [action, setAction] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    Promise.all([rpc('admin_list_points', { p_status: status || null, p_search: search.trim() || null, p_limit: PAGE, p_offset: page * PAGE }), rpc('admin_points_summary')]).then(
      ([list, s]) => {
        setRows(list)
        setSum(s)
      },
      (e) => setError(errText(e)),
    )
  useEffect(() => setPage(0), [status, search])
  useEffect(() => {
    setRows(null)
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, page])

  const total = rows?.[0] ? Number(rows[0].total) : 0
  const act = (e, next, title) =>
    setAction({
      title,
      text: next === 'revoked' ? `Les ${e.points} points de ${e.member} ne compteront plus. L’opération reste visible dans l’historique.` : `${e.member} récupère ${e.points} points.`,
      reason: 'Motif (obligatoire, visible dans l’historique)',
      confirm: title,
      tone: next === 'revoked' ? 'dark' : 'dark',
      run: (r) => rpc('admin_set_point_status', { p_event_id: e.id, p_status: next, p_reason: r }),
    })

  return (
    <div>
      <PageHead title="Points & classement" sub="Historique de toutes les attributions · aucune double attribution possible">
        {canAdmin && (
          <Button
            tone="dark"
            icon={Trophy}
            busy={busy}
            onClick={async () => {
              setBusy(true)
              await exportRanking().catch((e) => setError(errText(e)))
              setBusy(false)
            }}
          >
            Préparer le classement final
          </Button>
        )}
      </PageHead>
      {sum && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[
            ['Points attribués', fmt(sum.awarded), 'total'],
            ['Seuil top 2 000', `${fmt(sum.top.threshold)} pts`, `${fmt(sum.top.eligible)} membres`],
            ['Points suspendus', fmt(sum.suspended), `${fmt(sum.suspended_users)} compte${sum.suspended_users > 1 ? 's' : ''} en vérification`],
            ['Annulations', fmt(sum.revoked_month), 'ce mois-ci'],
          ].map(([k, v, s]) => (
            <Card key={k}>
              <p className="font-body text-[13px] text-gris">{k}</p>
              <p className="mt-1.5 font-display text-[26px] font-bold tracking-[-0.8px] tabular-nums">{v}</p>
              <p className="mt-1 font-body text-[12px] text-gris">{s}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="flex max-w-full overflow-x-auto rounded-full bg-white p-1 [scrollbar-width:none]">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setStatus(k)} className={`h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 font-body text-[14px] font-semibold ${status === k ? 'bg-noir text-white' : 'text-noir/70'}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="flex h-12 w-full items-center gap-2.5 rounded-full bg-white px-4 sm:w-[260px]">
          <Search size={16} className="text-gris" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom du membre" aria-label="Rechercher un membre" className="min-w-0 flex-1 bg-transparent font-body text-[14px] outline-none" />
        </label>
      </div>
      {error && <p className="mb-3 font-body text-[14px] text-[#b91c1c]">{error}</p>}
      <Card className="!p-0">
        {!rows ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty>Aucune attribution.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left font-body text-[14px]">
              <thead className="text-[12px] text-gris">
                <tr className="border-b border-ligne">
                  {['Date', 'Membre', 'Action', 'Référence', 'Points', 'Statut', 'Par', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const [l, t] = POINT_STATUS[e.status]
                  const by = e.actor || (e.status === 'suspended' ? 'Anti-fraude' : 'Système')
                  return (
                    <tr key={e.id} className={`border-b border-ligne last:border-0 ${e.status === 'suspended' ? 'bg-[#fff7ed]' : ''}`}>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold">{date(e.created_at, true)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/membres/${e.user_id}`} className="hover:underline">
                          {e.member}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">{POINT_KIND[e.kind]}</td>
                      <td className="max-w-[220px] truncate px-5 py-3.5" title={e.reason || ''}>
                        {e.kind === 'signup' ? 'Questionnaire + e-mail' : e.kind === 'referral' ? `Filleul : ${e.label || '—'}` : e.label || '—'}
                      </td>
                      <td className={`px-5 py-3.5 tabular-nums ${e.status === 'revoked' ? 'text-gris line-through' : ''}`}>+{e.points}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={t}>{l}</Badge>
                      </td>
                      <td className="px-5 py-3.5">{by}</td>
                      <td className="px-5 py-3.5 text-right">
                        {canAdmin && e.status === 'awarded' && (
                          <button type="button" onClick={() => act(e, 'revoked', 'Annuler les points')} className="cursor-pointer font-semibold text-[#b91c1c] hover:underline">
                            Annuler
                          </button>
                        )}
                        {canAdmin && e.status === 'suspended' && (
                          <span className="flex justify-end gap-3">
                            <button type="button" onClick={() => act(e, 'awarded', 'Attribuer les points')} className="cursor-pointer font-semibold hover:underline">
                              Attribuer
                            </button>
                            <button type="button" onClick={() => act(e, 'revoked', 'Annuler les points')} className="cursor-pointer font-semibold text-[#b91c1c] hover:underline">
                              Annuler
                            </button>
                          </span>
                        )}
                        {canAdmin && e.status === 'revoked' && (
                          <button type="button" onClick={() => act(e, 'awarded', 'Rétablir les points')} className="cursor-pointer font-semibold hover:underline">
                            Rétablir
                          </button>
                        )}
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
            Précédentes
          </Button>
          <span className="text-gris">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} sur {fmt(total)}
          </span>
          <Button disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>
            Suivantes
          </Button>
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 font-body text-[13px] text-gris">
        <Info size={15} className="mt-px shrink-0" />
        Chaque correction demande un motif et reste visible dans l’historique. Une action ne peut rapporter des points qu’une seule fois (contrainte unique en base). Les points « en attente » sont attribués à la validation du commerce.
      </p>
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
