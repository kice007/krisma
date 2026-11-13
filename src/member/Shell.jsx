import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { House, LogOut, Map as MapIcon, Sparkles, Trophy, User } from 'lucide-react'
import { LangSwitch } from '../components/Nav'
import { useLang } from '../i18n'
import { rpc, supabase } from '../lib/supabase'
import { Loading } from '../waitlist/Layout'
import { PATHS, hasPassword, isPreview, myDashboard, waitForSession } from '../waitlist/flow'
import { PREVIEW_MEMBER } from './preview'
import { MTEXT } from './text'

const MemberContext = createContext(null)

export function useMember() {
  return useContext(MemberContext)
}

export function useMT() {
  const { lang } = useLang()
  return { t: MTEXT[lang], lang }
}

export const fmt = (n, lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(n ?? 0)
// awa_k → AK, mariam.dk → MD, kofi → KO
export const initials = (p = '') => {
  const parts = p.split(/[._-]+/).filter(Boolean)
  const ini = parts.length > 1 ? parts[0][0] + parts[1][0] : p.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)
  return ini.toUpperCase() || '?'
}

// Données du membre connecté (null si visiteur), partagées par toutes les pages de l'espace.
function useMemberData() {
  const [state, setState] = useState({ loading: true, d: null })
  const refresh = useCallback(async () => {
    if (isPreview()) return PREVIEW_MEMBER
    const res = await myDashboard()
    setState({ loading: false, d: res.status && res.status !== 'none' ? res : null })
    return res
  }, [])
  useEffect(() => {
    if (isPreview()) return setState({ loading: false, d: PREVIEW_MEMBER })
    waitForSession(600).then((s) => {
      if (s && !s.user.is_anonymous) refresh()
      else setState({ loading: false, d: null })
    })
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setState({ loading: false, d: null })
    })
    return () => data.subscription.unsubscribe()
  }, [refresh])
  return { ...state, refresh }
}

// Réservé aux membres validés ; sinon connexion, ou reprise du parcours.
export function RequireMember({ children }) {
  const m = useMember()
  const [pwd, setPwd] = useState(isPreview() ? true : null)
  const verified = m.d?.status === 'verified'
  useEffect(() => {
    if (!verified || pwd !== null) return
    hasPassword().then(setPwd)
  }, [verified, pwd])
  if (m.loading) return <Loading />
  if (!m.d) return <Navigate to={PATHS.login} replace />
  if (m.d.status !== 'verified' && m.d.status !== 'suspended') return <Navigate to={PATHS.resume} replace />
  // Le mot de passe se choisit juste après la vérification de l'e-mail.
  if (verified && pwd === null) return <Loading />
  if (verified && pwd === false) return <Navigate to={PATHS.password} replace />
  return children
}

function Avatar({ pseudo, size = 44 }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-marque font-body text-[14px] font-bold text-white" style={{ width: size, height: size }}>
      {initials(pseudo)}
    </span>
  )
}

function AccountMenu({ d, t }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }
  return (
    <div className="relative" ref={box}>
      <button type="button" aria-label={t.nav.profile} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="cursor-pointer rounded-full">
        <Avatar pseudo={d.pseudo} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-ligne bg-white p-1.5 shadow-[0_16px_40px_rgba(17,17,17,0.12)]"
          >
            <p className="truncate px-3 pb-2 pt-1.5 font-body text-[13px] text-gris">{d.pseudo}</p>
            <Link to="/espace/profil" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-body text-[14px] font-medium hover:bg-clair">
              <User size={16} />
              {t.nav.profile}
            </Link>
            <button type="button" onClick={logout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-body text-[14px] font-medium hover:bg-clair">
              <LogOut size={16} />
              {t.nav.logout}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Header({ m, t, full }) {
  const links = [
    ['/espace', t.nav.home, true],
    ['/classement', t.nav.board],
    ['/carte', t.nav.map],
    ['/reglement', t.nav.rules],
  ]
  return (
    <header className={full ? 'fixed inset-x-0 top-0 z-40 hidden px-10 pt-7 lg:block' : 'sticky top-0 z-40 bg-[#f4f4f4]/90 px-4 pb-2 pt-4 backdrop-blur lg:px-10 lg:pt-7'}>
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between rounded-full border-ligne lg:h-[68px] lg:border lg:bg-white lg:pl-6 lg:pr-2.5">
        <Link to={m.d ? '/espace' : '/'} className="flex items-center gap-2" aria-label="KRISMA">
          <img src="/img/landing/k-ink.png" alt="" className="h-[23px] w-[18px] object-contain lg:h-[25px] lg:w-5" />
          <span className="font-display text-[16px] font-extrabold tracking-[1.5px]">KRISMA</span>
        </Link>
        <nav className="hidden items-center gap-[26px] lg:flex">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className="group flex flex-col items-center gap-1 font-body text-[14px] font-medium">
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-noir' : 'text-noir/65 group-hover:text-noir'}>{label}</span>
                  <span className={`h-0.5 w-[18px] rounded-full ${isActive ? 'bg-marque' : 'bg-transparent'}`} />
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:block">
            <LangSwitch />
          </div>
          {m.d ? (
            <>
              <Link to="/espace/points" className="hidden h-11 items-center gap-2 rounded-full bg-noir px-4 font-body text-[14px] font-semibold text-white lg:flex">
                <Sparkles size={15} />
                {fmt(m.d.points)} {t.pts}
              </Link>
              <div className="hidden lg:block">
                <AccountMenu d={m.d} t={t} />
              </div>
              <Link to="/espace/profil" className="lg:hidden" aria-label={t.nav.profile}>
                <Avatar pseudo={m.d.pseudo} size={40} />
              </Link>
            </>
          ) : (
            <>
              <Link to={PATHS.login} className="hidden h-11 items-center rounded-full border border-ligne bg-white px-5 font-body text-[14px] font-semibold hover:border-noir lg:flex">
                {t.nav.login}
              </Link>
              <Link to={PATHS.home} className="flex h-10 items-center rounded-full bg-marque px-4 font-body text-[14px] font-semibold text-white hover:bg-[#f06e1b] lg:h-11 lg:px-5">
                <span className="lg:hidden">{t.nav.joinShort}</span>
                <span className="hidden lg:inline">{t.nav.join}</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function Tabs({ t }) {
  const items = [
    ['/espace', House, t.nav.tabs[0], true],
    ['/classement', Trophy, t.nav.tabs[1]],
    ['/carte', MapIcon, t.nav.tabs[2]],
    ['/espace/profil', User, t.nav.tabs[3]],
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-ligne bg-white px-2 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      {items.map(([to, I, label, end]) => (
        <NavLink key={to} to={to} end={end} className="flex w-[76px] flex-col items-center gap-1 font-body text-[11px]">
          {({ isActive }) => (
            <>
              <I size={22} className={isActive ? 'text-noir' : 'text-[#a3a3a3]'} />
              <span className={isActive ? 'font-semibold text-noir' : 'text-[#a3a3a3]'}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// La langue choisie dans l'espace devient celle des e-mails du membre.
function SyncLocale({ m }) {
  const { lang } = useLang()
  useEffect(() => {
    if (m.d && m.d.locale !== lang && !isPreview()) rpc('update_my_settings', { p_locale: lang }).then(m.refresh, () => {})
  }, [lang, m])
  return null
}

export default function Shell() {
  const m = useMemberData()
  const { t } = useMT()
  const { pathname } = useLocation()
  // KRISMA Map occupe tout l'écran ; la barre du haut flotte au-dessus (desktop).
  const full = pathname === '/carte'
  return (
    <MemberContext.Provider value={m}>
      <div className="min-h-screen bg-[#f4f4f4]">
        <Header m={m} t={t} full={full} />
        <SyncLocale m={m} />
        <main className={full ? '' : `mx-auto max-w-[1360px] px-4 pt-4 lg:px-10 lg:pb-20 lg:pt-10 ${m.d ? 'pb-28' : 'pb-16'}`}>
          <Outlet key={pathname} />
        </main>
        {m.d && <Tabs t={t} />}
      </div>
    </MemberContext.Provider>
  )
}
