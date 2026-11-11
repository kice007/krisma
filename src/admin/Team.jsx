import { useEffect, useState } from 'react'
import { Check, CircleSlash, Download, Ellipsis, Send, ShieldCheck, Store, Trash2, UserPlus, UserX } from 'lucide-react'
import { arpc as rpc } from './api'
import { useAdmin } from './Shell'
import { Badge, Button, Card, Confirm, PageHead, ROLE, Spinner, date, errText } from './ui'

const ROLES = ['moderator', 'admin', 'super_admin']
const ROLE_TONE = { super_admin: 'orange', admin: 'info', moderator: 'info' }
const ACTIONS = {
  user_suspend: [UserX, (a) => `a suspendu ${a.target}`],
  user_unsuspend: [Check, (a) => `a rétabli ${a.target}`],
  points_revoked: [CircleSlash, (a) => `a annulé des points de ${a.target}`],
  points_awarded: [Check, (a) => `a attribué des points à ${a.target}`],
  points_suspended: [CircleSlash, (a) => `a suspendu des points de ${a.target}`],
  shop_validate: [Store, (a) => `a validé « ${a.target} »`],
  shop_reject: [Store, (a) => `a refusé « ${a.target} »`],
  shop_duplicate: [Store, (a) => `a marqué « ${a.target} » comme doublon`],
  shop_status: [Store, (a) => `a changé le statut de « ${a.target} »`],
  team_grant: [UserPlus, (a) => `a ajouté ${a.target} comme ${ROLE[a.details.role] || a.details.role}`],
  team_invite: [Send, (a) => `a invité ${a.details.email} comme ${ROLE[a.details.role] || a.details.role}`],
  team_invite_cancel: [Trash2, (a) => `a annulé l’invitation de ${a.details.email}`],
  team_role: [ShieldCheck, (a) => `a passé ${a.target} en ${ROLE[a.details.role] || a.details.role}`],
  team_remove: [UserX, (a) => `a retiré ${a.target} de l’équipe`],
  export_members: [Download, () => 'a exporté la liste des membres'],
  export_ranking: [Download, () => 'a exporté le classement final'],
}

// A5 / AM8 — Équipe & accès : membres, rôles, invitations, journal.
export default function Team() {
  const { canSuper } = useAdmin()
  const [team, setTeam] = useState(null)
  const [audit, setAudit] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('moderator')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [action, setAction] = useState(null)
  const [all, setAll] = useState(false)

  const load = () =>
    Promise.all([rpc('admin_list_team'), rpc('admin_list_audit', { p_limit: 60 })]).then(
      ([t, a]) => {
        setTeam(t)
        setAudit(a)
      },
      (e) => setError(errText(e)),
    )
  useEffect(() => {
    load()
  }, [])

  const invite = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await rpc('admin_invite_member', { p_email: email.trim(), p_role: role })
      setNotice(res === 'granted' ? `${email.trim()} a désormais le rôle ${ROLE[role]}.` : `Invitation enregistrée : ${email.trim()} aura le rôle ${ROLE[role]} à sa première connexion sur /admin/connexion.`)
      setEmail('')
      await load()
    } catch (err) {
      setError(errText(err))
    } finally {
      setBusy(false)
    }
  }

  if (!team) return error ? <p className="font-body text-[14px] text-[#b91c1c]">{error}</p> : <Spinner />
  const supers = team.members.filter((m) => m.role === 'super_admin').length

  return (
    <div>
      <PageHead title="Équipe & accès" sub={`${team.members.length} membre${team.members.length > 1 ? 's' : ''} actif${team.members.length > 1 ? 's' : ''} · ${team.invites.length} invitation${team.invites.length > 1 ? 's' : ''} en attente`} />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left font-body text-[14px]">
                <thead className="text-[12px] text-gris">
                  <tr className="border-b border-ligne">
                    {['Membre', 'Rôle', 'Ajouté par', 'Dernière connexion', ''].map((h, i) => (
                      <th key={i} className="px-5 py-3.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m) => (
                    <tr key={m.user_id} className="border-b border-ligne last:border-0">
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold">
                          {m.name}
                          {m.me ? ' (toi)' : ''}
                        </span>
                        <span className="block text-[13px] text-gris">{m.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {canSuper && !m.me ? (
                          <select
                            value={m.role}
                            aria-label={`Rôle de ${m.name}`}
                            onChange={(e) => setAction({ title: 'Changer le rôle', text: `${m.name} passe ${ROLE[e.target.value]}.`, confirm: 'Confirmer', run: () => rpc('admin_set_member_role', { p_user: m.user_id, p_role: e.target.value }) })}
                            className="h-9 cursor-pointer rounded-xl border border-ligne bg-white px-2.5 font-semibold"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge tone={ROLE_TONE[m.role]}>{ROLE[m.role]}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">{m.granted_by || '—'}</td>
                      <td className="px-5 py-3.5">{date(m.last_sign_in_at, true)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {canSuper && !m.me && !(m.role === 'super_admin' && supers <= 1) && (
                          <button
                            type="button"
                            aria-label={`Retirer ${m.name}`}
                            onClick={() => setAction({ title: 'Retirer de l’équipe', text: `${m.name} perd immédiatement l’accès à l’administration.`, confirm: 'Retirer', run: () => rpc('admin_remove_member', { p_user: m.user_id }) })}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gris hover:bg-clair hover:text-[#b91c1c]"
                          >
                            <UserX size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {team.invites.map((i) => (
                    <tr key={i.email} className="border-b border-ligne bg-[#fff7ed] last:border-0">
                      <td className="px-5 py-3.5">
                        <span className="block font-semibold">Invitation</span>
                        <span className="block text-[13px] text-gris">{i.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={ROLE_TONE[i.role]}>{ROLE[i.role]}</Badge>
                      </td>
                      <td className="px-5 py-3.5">{i.invited_by || '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone="wait">En attente</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {canSuper && (
                          <button type="button" onClick={() => setAction({ title: 'Annuler l’invitation', text: `${i.email} n’aura pas accès à l’administration.`, confirm: 'Annuler l’invitation', run: () => rpc('admin_cancel_invite', { p_email: i.email }) })} className="cursor-pointer font-semibold text-[#b91c1c] hover:underline">
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {canSuper && (
            <Card>
              <h2 className="font-body text-[16px] font-semibold">Inviter un membre</h2>
              <p className="mt-1 font-body text-[13px] text-gris">S’il a déjà un compte KRISMA, le rôle s’applique immédiatement. Sinon, il s’appliquera à sa première connexion sur /admin/connexion.</p>
              <form onSubmit={invite} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@krisma.io" aria-label="Adresse e-mail" className="h-11 min-w-0 flex-1 rounded-full border border-ligne px-4 font-body text-[14px] outline-none focus:border-noir" />
                <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Rôle" className="h-11 cursor-pointer rounded-full border border-ligne bg-white px-4 font-body text-[14px] font-semibold">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE[r]}
                    </option>
                  ))}
                </select>
                <Button tone="dark" icon={UserPlus} busy={busy} type="submit">
                  Inviter
                </Button>
              </form>
              {notice && <p className="mt-3 font-body text-[13px] text-vert">{notice}</p>}
              {error && <p className="mt-3 font-body text-[13px] text-[#b91c1c]">{error}</p>}
            </Card>
          )}
          <Card>
            <h2 className="mb-2 font-body text-[16px] font-semibold">Journal des actions sensibles</h2>
            {audit.length === 0 && <p className="font-body text-[14px] text-gris">Aucune action pour l’instant.</p>}
            <ul>
              {(all ? audit : audit.slice(0, 8)).map((a, i) => {
                const [I, text] = ACTIONS[a.action] || [Ellipsis, () => a.action]
                return (
                  <li key={i} className="flex items-center gap-3 border-b border-ligne py-3 last:border-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-clair">
                      <I size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-[14px]">
                        <strong className="font-semibold">{a.actor || 'Système'}</strong> {text(a)}
                      </span>
                      {a.details?.reason && <span className="block font-body text-[12px] text-gris">Motif : {a.details.reason}</span>}
                    </span>
                    <span className="shrink-0 font-body text-[12px] text-gris">{date(a.created_at, true)}</span>
                  </li>
                )
              })}
            </ul>
            {audit.length > 8 && (
              <button type="button" onClick={() => setAll((x) => !x)} className="mt-2 cursor-pointer font-body text-[13px] font-semibold underline underline-offset-2">
                {all ? 'Réduire' : 'Tout voir'}
              </button>
            )}
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="font-body text-[16px] font-semibold">Ce que chaque rôle peut faire</h2>
            {[
              ['Modérateur', 'info', 'Vérifier, valider ou refuser les commerces. Consulter les membres et les points.'],
              ['Admin', 'info', '+ Corriger les points, suspendre des membres, suivre les partenariats, exporter les données.'],
              ['Super-admin', 'orange', '+ Gérer l’équipe et les rôles. Au moins un super-admin doit rester.'],
            ].map(([r, t, d]) => (
              <div key={r} className="mt-4">
                <Badge tone={t}>{r}</Badge>
                <p className="mt-1.5 font-body text-[13px] leading-[1.5] text-gris">{d}</p>
              </div>
            ))}
          </Card>
          <Card>
            <h2 className="font-body text-[16px] font-semibold">Sécurité des accès</h2>
            <ul className="mt-3 flex flex-col gap-2.5 font-body text-[13px]">
              {['Connexion par lien magique, sans mot de passe', 'Le retrait d’un rôle coupe l’accès immédiatement', 'Chaque action sensible est journalisée'].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check size={15} className="mt-px shrink-0 text-vert" />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      {action && (
        <Confirm
          {...action}
          onCancel={() => setAction(null)}
          onConfirm={async () => {
            await action.run()
            setAction(null)
            await load()
          }}
        />
      )}
    </div>
  )
}
