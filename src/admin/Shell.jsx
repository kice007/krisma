import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChartColumn, Globe as External, LayoutDashboard, LogOut, Menu, ShieldCheck, ShieldX, Store, Trophy, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { arpc as rpc } from './api'
import { Loading } from '../waitlist/Layout'
import { isPreview, waitForSession } from '../waitlist/flow'
import { ROLE } from './ui'

const AdminContext = createContext(null)
export const useAdmin = () => useContext(AdminContext)

const NAV = [
  ['/admin', LayoutDashboard, 'Vue d’ensemble', 'Vue', true],
  ['/admin/membres', Users, 'Utilisateurs', 'Membres'],
  ['/admin/commerces', Store, 'Commerces', 'Commerces'],
  ['/admin/points', Trophy, 'Points & classement', 'Points'],
  ['/admin/statistiques', ChartColumn, 'Statistiques'],
  ['/admin/equipe', ShieldCheck, 'Équipe & accès'],
]

function Logo({ onDark = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src={onDark ? '/img/landing/k-white.png' : '/img/landing/k-ink.png'} alt="" className="h-[24px] w-[19px] object-contain" />
      <span className={`font-display text-[16px] font-extrabold tracking-[1.5px] ${onDark ? 'text-white' : 'text-noir'}`}>KRISMA</span>
      <span className="rounded-full bg-marque px-2.5 py-0.5 font-body text-[11px] font-semibold text-white">Admin</span>
    </span>
  )
}

// A0c — Compte connecté sans rôle d'équipe.
function Denied({ email }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col bg-clair px-5 py-6 lg:px-12 lg:py-8">
      <Link to="/" className="flex items-center gap-2">
        <img src="/img/landing/k-ink.png" alt="" className="h-[24px] w-[19px] object-contain" />
        <span className="font-display text-[16px] font-extrabold tracking-[1.5px]">KRISMA</span>
      </Link>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[560px] rounded-[28px] bg-white p-7 lg:p-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fee2e2] text-[#b91c1c]">
            <ShieldX size={24} />
          </span>
          <h1 className="mt-6 font-display text-[26px] font-bold tracking-[-0.8px] lg:text-[32px]">Cet espace est réservé à l’équipe</h1>
          <p className="mt-3 font-body text-[15px] leading-[1.6] text-gris">
            Tu es connecté·e avec {email}. Ce compte n’a pas de rôle dans l’équipe KRISMA : l’administration ne lui est pas accessible.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link to="/espace" className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-noir font-body text-[15px] font-semibold text-white">
              Aller à mon espace
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/admin/connexion')
              }}
              className="flex h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-ligne font-body text-[15px] font-semibold"
            >
              <LogOut size={16} />
              Changer de compte
            </button>
          </div>
          <p className="mt-7 border-t border-ligne pt-5 font-body text-[14px] text-gris">
            Tu fais partie de l’équipe ? Demande à un super-admin de t’ajouter, puis reconnecte-toi avec ton adresse d’équipe.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminShell() {
  const [state, setState] = useState({ loading: true })
  const [review, setReview] = useState(0)
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const refreshCounts = useCallback(() => rpc('admin_shop_counts').then((c) => setReview(c.review), () => {}), [])

  useEffect(() => {
    if (isPreview()) {
      setState({ loading: false, role: 'super_admin', email: 'ivan@krisma.io', name: 'ivan' })
      refreshCounts()
      return
    }
    waitForSession(1200).then(async (s) => {
      if (!s || s.user.is_anonymous) return setState({ loading: false, out: true })
      const role = await rpc('my_staff_role').catch(() => null)
      const name = (s.user.email || '').split('@')[0]
      setState({ loading: false, role, email: s.user.email, name })
      if (role) refreshCounts()
    })
  }, [refreshCounts])

  useEffect(() => setMenu(false), [pathname])

  if (state.loading) return <Loading />
  if (state.out) return <Navigate to="/admin/connexion" replace />
  if (!state.role) return <Denied email={state.email} />

  const role = state.role
  const ctx = { role, email: state.email, name: state.name, canAdmin: role !== 'moderator', canSuper: role === 'super_admin', review, refreshCounts }
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/connexion')
  }
  const initials = state.name.slice(0, 2).toUpperCase()

  return (
    <AdminContext.Provider value={ctx}>
      <div className="min-h-screen bg-clair lg:flex">
        {/* Desktop : barre latérale */}
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-noir px-4 py-6 lg:flex">
          <div className="px-2.5 pb-6">
            <Logo />
          </div>
          <nav className="flex flex-col gap-1.5">
            {NAV.map(([to, I, label, , end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex h-[42px] items-center gap-3 rounded-xl px-3 font-body text-[14px] ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/60 hover:text-white'}`}>
                <I size={18} />
                <span className="flex-1">{label}</span>
                {to === '/admin/commerces' && review > 0 && <span className="rounded-full bg-marque px-2 py-0.5 font-body text-[11px] font-bold text-white">{review}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-1">
            <Link to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 font-body text-[13px] text-white/60 hover:text-white">
              <External size={16} />
              Voir le site
            </Link>
            <div className="flex items-center gap-2.5 px-2.5 pt-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-body text-[12px] font-bold text-white">{initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-[13px] font-semibold text-white">{state.name}</span>
                <span className="block font-body text-[12px] text-white/50">{ROLE[role]}</span>
              </span>
              <button type="button" onClick={logout} aria-label="Se déconnecter" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile : en-tête */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-noir px-4 lg:hidden">
          <Logo />
          <span className="font-body text-[12px] text-white/60">{ROLE[role]}</span>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-7">
          <Outlet />
        </main>

        {/* Mobile : onglets */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around bg-noir px-2 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
          {NAV.slice(0, 4).map(([to, I, , short, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `relative flex w-[66px] flex-col items-center gap-1 font-body text-[11px] ${isActive ? 'font-semibold text-white' : 'text-white/45'}`}>
              <I size={22} />
              {short}
              {to === '/admin/commerces' && review > 0 && <span className="absolute -top-1 left-[38px] rounded-full bg-marque px-1.5 font-body text-[9px] font-bold text-white">{review}</span>}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMenu(true)} className="flex w-[66px] cursor-pointer flex-col items-center gap-1 font-body text-[11px] text-white/45">
            <Menu size={22} />
            Menu
          </button>
        </nav>

        <AnimatePresence>
          {menu && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex flex-col bg-noir px-5 pb-8 pt-4 lg:hidden">
              <div className="flex items-center justify-between">
                <Logo />
                <button type="button" aria-label="Fermer" onClick={() => setMenu(false)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 font-body text-[14px] font-bold text-white">{initials}</span>
                <span>
                  <span className="block font-body text-[15px] font-semibold text-white">{state.name}</span>
                  <span className="block font-body text-[13px] text-white/55">{ROLE[role]}</span>
                </span>
              </div>
              <nav className="mt-4 flex flex-col">
                {NAV.map(([to, I, label, , end]) => (
                  <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex h-14 items-center gap-3.5 border-b border-white/10 font-body text-[16px] ${isActive ? 'font-semibold text-white' : 'text-white/75'}`}>
                    <I size={20} />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2.5">
                <Link to="/" className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 font-body text-[15px] font-semibold text-white">
                  <External size={16} />
                  Voir le site public
                </Link>
                <button type="button" onClick={logout} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-white font-body text-[15px] font-semibold text-noir">
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminContext.Provider>
  )
}
