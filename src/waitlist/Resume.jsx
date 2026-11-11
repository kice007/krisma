import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FlowLayout, { Loading, useT } from './Layout'
import { Btn, Sub, Title } from './ui'
import { PATHS, cleanUrl, linkError, myDashboard, resumePath, waitForSession } from './flow'

// Arrivée du lien de connexion : renvoie à la bonne étape selon l'état de l'inscription.
export function Resume() {
  const navigate = useNavigate()
  useEffect(() => {
    const err = linkError()
    waitForSession().then(async (session) => {
      cleanUrl()
      if (!session) return navigate(err ? `${PATHS.login}?expired=1` : PATHS.login, { replace: true })
      navigate(await resumePath(), { replace: true })
    })
  }, [navigate])
  return <Loading />
}

// /espace — en attendant la phase 4 (tableau de bord, classement, carte).
export function MemberPlaceholder() {
  const { t } = useT()
  const m = t.member
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [d, setD] = useState(null)

  useEffect(() => {
    waitForSession(800).then(async (session) => {
      if (!session) return setState('out')
      const res = await myDashboard()
      setD(res)
      setState(res.status === 'verified' ? 'ok' : 'redirect')
    })
  }, [])

  if (state === 'loading') return <Loading />
  if (state === 'out') return <Navigate to={PATHS.login} replace />
  if (state === 'redirect') return <Navigate to={PATHS.resume} replace />

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <FlowLayout mobileTitle="KRISMA" backTo="/">
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="rounded-full bg-clair px-4 py-2 font-body text-[14px] font-semibold">
          {d.pseudo} · {d.points} pts{d.rank ? ` · #${d.rank}` : ''}
        </span>
        <Title>{m.title}</Title>
        <Sub>{m.sub}</Sub>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Link to="/" className="inline-flex h-[52px] items-center justify-center rounded-full bg-noir px-6 font-body text-[15px] font-semibold text-white lg:h-14">
            {m.home}
          </Link>
          <Btn type="button" tone="ghost" icon={LogOut} onClick={logout}>
            {m.logout}
          </Btn>
        </div>
      </div>
    </FlowLayout>
  )
}

// /carte — KRISMA Map (phase 5).
export function MapSoon() {
  const { t } = useT()
  const m = t.soonMap
  return (
    <FlowLayout mobileTitle="KRISMA Map" backTo={PATHS.home}>
      <div className="flex flex-col items-center gap-5 text-center">
        <Title>{m.title}</Title>
        <Sub className="max-w-[460px]">{m.sub}</Sub>
        <Link to={PATHS.home} className="inline-flex h-[52px] items-center justify-center rounded-full bg-marque px-7 font-body text-[15px] font-semibold text-white hover:bg-[#f06e1b] lg:h-14">
          {m.cta}
        </Link>
      </div>
    </FlowLayout>
  )
}
