import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CircleCheck, Download, Globe, KeyRound, LoaderCircle, LogOut, MapPin, Megaphone, ScrollText, Shield, Trash2, User } from 'lucide-react'
import { useLang } from '../i18n'
import { rpc, supabase } from '../lib/supabase'
import { NAME_RE, cleanName } from '../waitlist/store'
import { PATHS } from '../waitlist/flow'
import { deleteMyAccount } from './account'
import ExportButtons from './ExportButtons'
import { initials, useMT, useMember } from './Shell'

function Group({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 font-body text-[13px] font-semibold text-gris">{title}</h2>
      <div className="rounded-[22px] bg-white px-5">{children}</div>
    </section>
  )
}

function Line({ icon: I, label, value, onClick, to, danger, last, children }) {
  const cls = `flex min-h-[58px] w-full items-center gap-3.5 py-3 text-left font-body text-[15px] ${last ? '' : 'border-b border-ligne'} ${danger ? 'text-[#b91c1c]' : ''}`
  const inner = (
    <>
      <I size={19} className="shrink-0" />
      <span className="min-w-0 flex-1 font-medium">{label}</span>
      {value && <span className="truncate text-[14px] text-gris">{value}</span>}
      {children}
    </>
  )
  if (to) return <Link to={to} className={`${cls} hover:opacity-70`}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} cursor-pointer hover:opacity-70`}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-[30px] w-[50px] shrink-0 cursor-pointer rounded-full transition-colors ${on ? 'bg-noir' : 'bg-[#e5e5e5]'}`}>
      <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  )
}

// M19 — Profil : compte, notifications, données et confidentialité.
export default function Profile() {
  const m = useMember()
  const d = m.d
  const { t, lang } = useMT()
  const { setLang } = useLang()
  const p = t.profile
  const navigate = useNavigate()
  const [edit, setEdit] = useState(null)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    rpc('get_my_name')
      .then((n) => {
        setFirst(n?.first_name || '')
        setLast(n?.last_name || '')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(id)
  }, [notice])

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await m.refresh()
      setEdit(null)
      setNotice(p.saved)
    } catch (err) {
      setError(t.errors[err.code] || t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  const saveName = () => {
    if (!NAME_RE.test(cleanName(first)) || !NAME_RE.test(cleanName(last))) return setError(t.errors.name_invalid)
    run(async () => {
      await rpc('update_my_name', { p_first_name: cleanName(first), p_last_name: cleanName(last) })
      await supabase.auth.updateUser({ data: { pseudo: cleanName(first) } })
    })
  }
  const saveSetting = (key, value) => run(() => rpc('update_my_settings', { [key]: value }))
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }
  const remove = async () => {
    setBusy(true)
    try {
      await deleteMyAccount()
      navigate('/', { replace: true })
    } catch {
      setError(t.errors.generic)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <h1 className="hidden font-display text-[34px] font-bold tracking-[-1px] lg:block">{p.title}</h1>
      <section className="flex items-center gap-4 rounded-[24px] bg-white p-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-marque font-body text-[20px] font-bold text-white">{initials(d.pseudo)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[20px] font-bold">{d.pseudo}</span>
          <span className="block truncate font-body text-[13px] text-gris">{[d.email, d.city?.name].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="hidden h-8 items-center gap-1.5 rounded-full bg-[#dcf5e4] px-3 font-body text-[13px] font-medium text-vert sm:flex">
          <CircleCheck size={15} />
          {p.verified}
        </span>
      </section>

      {(notice || error) && (
        <p role="status" className={`rounded-2xl px-4 py-3 font-body text-[14px] ${error ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#dcf5e4] text-vert'}`}>
          {error || notice}
        </p>
      )}

      <Group title={p.account}>
        {edit === 'name' ? (
          <div className="flex flex-col gap-3 border-b border-ligne py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['first', p.firstName, first, setFirst, 'given-name'],
                ['last', p.lastName, last, setLast, 'family-name'],
              ].map(([id, label, value, set, ac]) => (
                <label key={id} className="flex flex-col gap-1.5 font-body text-[14px] font-semibold">
                  {label}
                  <input
                    value={value}
                    maxLength={60}
                    autoComplete={ac}
                    onChange={(e) => set(e.target.value)}
                    className="h-12 rounded-2xl border-[1.5px] border-noir px-4 font-body text-[16px] font-normal outline-none"
                  />
                </label>
              ))}
            </div>
            <p className="font-body text-[13px] text-gris">{p.nameHint}</p>
            <div className="flex gap-2">
              <button type="button" onClick={saveName} disabled={busy} className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-noir px-5 font-body text-[14px] font-semibold text-white">
                {busy && <LoaderCircle size={15} className="animate-spin" />}
                {p.save}
              </button>
              <button type="button" onClick={() => (setEdit(null), setError(null))} className="h-11 cursor-pointer rounded-full border border-ligne px-5 font-body text-[14px] font-semibold">
                {p.cancel}
              </button>
            </div>
          </div>
        ) : (
          <Line icon={User} label={p.name} value={[first, last].filter(Boolean).join(' ') || d.pseudo} onClick={() => setEdit('name')} />
        )}
        <Line icon={KeyRound} label={p.password} value={p.change} to={`${PATHS.password}?reinitialiser`} />
        {/* Ville fixée à l'inscription : on vote et propose uniquement dans sa ville. */}
        <Line icon={MapPin} label={p.city} value={d.city?.name} />
        <p className="-mt-1 border-b border-ligne pb-3 pl-[33px] font-body text-[12px] text-gris">{p.cityLocked}</p>
        <Line icon={Globe} label={p.lang} last>
          <div className="flex rounded-full bg-clair p-1">
            {['fr', 'en'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`h-8 cursor-pointer rounded-full px-3.5 font-body text-[13px] font-semibold ${lang === code ? 'bg-noir text-white' : 'text-noir/70'}`}
              >
                {p.langs[code]}
              </button>
            ))}
          </div>
        </Line>
      </Group>

      <Group title={p.notifications}>
        <Line icon={Bell} label={p.notifyPoints}>
          <Toggle on={d.notify_points} label={p.notifyPoints} onChange={(v) => saveSetting('p_notify_points', v)} />
        </Line>
        <Line icon={Megaphone} label={p.marketing} last>
          <Toggle on={d.consent_marketing} label={p.marketing} onChange={(v) => saveSetting('p_consent_marketing', v)} />
        </Line>
      </Group>

      <Group title={p.data}>
        <Line icon={ScrollText} label={p.rules} to="/reglement" />
        <Line icon={Shield} label={p.privacy} to="/reglement#donnees" />
        <div className="flex flex-col gap-3 border-b border-ligne py-4 sm:flex-row sm:items-center">
          <span className="flex min-w-0 flex-1 items-start gap-3.5">
            <Download size={19} className="mt-0.5 shrink-0" />
            <span>
              <span className="block font-body text-[15px] font-medium">{p.export}</span>
              <span className="block font-body text-[13px] text-gris">{p.exportSub}</span>
            </span>
          </span>
          <ExportButtons onError={setError} className="pl-[33px] sm:pl-0" />
        </div>
        <Line icon={Trash2} label={p.delete} onClick={() => setConfirm(true)} danger last />
      </Group>

      <button type="button" onClick={logout} className="flex h-14 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-ligne bg-white font-body text-[15px] font-semibold hover:border-noir">
        <LogOut size={17} />
        {p.logout}
      </button>

      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => !busy && setConfirm(false)}>
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="del-title"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[460px] rounded-[28px] bg-white p-6 lg:p-8"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#fee2e2] text-[#b91c1c]">
                <Trash2 size={22} />
              </span>
              <h2 id="del-title" className="mt-5 font-display text-[24px] font-bold tracking-[-0.6px]">
                {p.deleteTitle}
              </h2>
              <p className="mt-2 font-body text-[15px] leading-[1.55] text-gris">{p.deleteText}</p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
                <button type="button" onClick={remove} disabled={busy} className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#b91c1c] px-5 font-body text-[15px] font-semibold text-white">
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  {p.deleteConfirm}
                </button>
                <button type="button" onClick={() => setConfirm(false)} disabled={busy} className="h-12 flex-1 cursor-pointer rounded-full border border-ligne px-5 font-body text-[15px] font-semibold">
                  {p.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
