import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, X } from '../components/icons'

export const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0)
export const pct = (a, b) => (b ? `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format((a / b) * 100)} %` : '—')
export const date = (iso, time = false) =>
  iso ? new Intl.DateTimeFormat('fr-FR', time ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '—'
export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000)
  if (m < 60) return `il y a ${Math.max(m, 1)} min`
  if (m < 1440) return `il y a ${Math.round(m / 60)} h`
  if (m < 2880) return 'hier'
  return `il y a ${Math.round(m / 1440)} j`
}

export const MEMBER_STATUS = {
  verified: ['Vérifié', 'ok'],
  questionnaire_done: ['E-mail à vérifier', 'wait'],
  draft: ['Questionnaire', 'info'],
  suspended: ['Suspendu', 'bad'],
}
export const FLAGS = { disposable_email: 'E-mail jetable', shared_ip: 'IP partagée', suspended_points: 'Points suspendus' }
export const POINT_STATUS = { awarded: ['Attribué', 'ok'], pending: ['En attente', 'neutral'], suspended: ['Suspendu', 'wait'], revoked: ['Annulé', 'bad'] }
export const POINT_KIND = { signup: 'Inscription validée', referral: 'Parrainage vérifié', shop: 'Commerce validé', vote: 'Vote pour un commerce' }
export const SHOP_STATUS = {
  proposed: ['Proposé', 'neutral'],
  validated: ['Validé', 'dark'],
  contacted: ['Contacté', 'info'],
  partner: ['Partenaire', 'orange'],
  cashback_active: ['Cashback actif', 'ok'],
  rejected: ['Refusé', 'bad'],
  duplicate: ['Doublon', 'bad'],
}
export const CATEGORY = { grocery: 'Épicerie', butcher: 'Boucherie', bakery: 'Boulangerie', hair_salon: 'Coiffure', restaurant: 'Restaurant', other: 'Autre' }
export const ROLE = { super_admin: 'Super-admin', admin: 'Admin', moderator: 'Modérateur' }

const TONES = {
  ok: 'bg-[#dcf5e4] text-[#15803d]',
  wait: 'bg-[#fef3c7] text-[#b45309]',
  bad: 'bg-[#fee2e2] text-[#b91c1c]',
  info: 'bg-[#dbeafe] text-[#1d4ed8]',
  orange: 'bg-[#ffe6d5] text-[#c2410c]',
  neutral: 'bg-clair text-gris',
  dark: 'bg-noir text-white',
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 font-body text-[12px] font-medium ${TONES[tone]} ${className}`}>{children}</span>
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-[-0.8px] lg:text-[30px]">{title}</h1>
        {sub && <p className="mt-1 font-body text-[14px] text-gris">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <section className={`min-w-0 rounded-[20px] bg-white p-5 lg:p-[22px] ${className}`}>{children}</section>
}

const BTN = {
  dark: 'bg-noir text-white hover:bg-[#2b2b2b]',
  ghost: 'border border-ligne bg-white hover:border-noir',
  orange: 'bg-marque text-white hover:bg-[#f06e1b]',
  danger: 'border border-[#fecaca] bg-white text-[#b91c1c] hover:border-[#b91c1c]',
}
export function Button({ tone = 'ghost', icon: I, busy, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={busy || rest.disabled}
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 font-body text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${BTN[tone]} ${className}`}
    >
      {busy ? <LoaderCircle size={16} className="animate-spin" /> : I && <I size={16} />}
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <LoaderCircle className="animate-spin text-gris" />
    </div>
  )
}

export function Empty({ children }) {
  return <p className="py-10 text-center font-body text-[14px] text-gris">{children}</p>
}

export function Select({ value, onChange, options, label }) {
  return (
    <label className="flex h-11 items-center gap-1 rounded-full border border-ligne bg-white pl-4 pr-2 font-body text-[14px] font-medium">
      <span className="text-gris">{label} :</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer bg-transparent pr-1 font-semibold outline-none">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

// Fenêtre de confirmation, avec motif obligatoire si `reason`.
export function Confirm({ title, text, reason, confirm, tone = 'dark', onCancel, onConfirm }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && !busy && onCancel()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [busy, onCancel])
  const go = async () => {
    if (reason && !value.trim()) return setError('Le motif est obligatoire.')
    setBusy(true)
    setError(null)
    try {
      await onConfirm(value.trim())
    } catch (e) {
      setError(errText(e))
      setBusy(false)
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-[460px] rounded-t-[24px] bg-white p-6 sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-3">
          <h2 id="confirm-title" className="font-display text-[22px] font-bold tracking-[-0.6px]">
            {title}
          </h2>
          <button type="button" aria-label="Fermer" onClick={onCancel} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-clair">
            <X size={18} />
          </button>
        </div>
        {text && <p className="mt-2 font-body text-[14px] leading-[1.55] text-gris">{text}</p>}
        {reason && (
          <label className="mt-4 block">
            <span className="font-body text-[14px] font-semibold">{reason}</span>
            <textarea autoFocus rows={3} value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 w-full rounded-2xl border-[1.5px] border-ligne p-3 font-body text-[15px] outline-none focus:border-noir" />
          </label>
        )}
        {error && <p className="mt-3 font-body text-[13px] text-[#b91c1c]">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button onClick={onCancel}>Annuler</Button>
          <Button tone={tone} busy={busy} onClick={go}>
            {confirm}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const ERRORS = {
  forbidden: 'Ton rôle ne permet pas cette action.',
  reason_required: 'Le motif est obligatoire.',
  already_reviewed: 'Ce commerce a déjà été traité.',
  duplicate_target_required: 'Choisis la fiche d’origine du doublon.',
  cannot_change_self: 'Tu ne peux pas modifier ton propre rôle.',
  invalid_email: 'Adresse e-mail invalide.',
  user_not_found: 'Membre introuvable.',
}
export const errText = (e) => ERRORS[e?.code] || ERRORS[e?.message] || 'Une erreur est survenue. Réessaie.'
