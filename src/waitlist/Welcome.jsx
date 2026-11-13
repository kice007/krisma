import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Copy, Share2, ShieldAlert } from 'lucide-react'
import { EASE } from '../components/Reveal'
import FlowLayout, { Loading, useT } from './Layout'
import { Alert, Btn, Sub, Title } from './ui'
import { errorText } from './text'
import { PATHS, SAMPLE, cleanUrl, hasPassword, isPreview, linkError, myDashboard, waitForSession } from './flow'
import { store } from './store'

// W08 — Inscription validée. C'est aussi la page d'arrivée du lien de confirmation.
export default function Welcome() {
  const { t, lang } = useT()
  const w = t.welcome
  const navigate = useNavigate()
  const [state, setState] = useState('loading')
  const [d, setD] = useState(null)
  const [linkErr] = useState(linkError)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    let tries = 0
    ;(async () => {
      if (isPreview()) {
        setD(SAMPLE)
        return setState('ok')
      }
      const session = await waitForSession()
      cleanUrl()
      if (!alive) return
      if (!session) return setState('signedOut')
      // Le déclencheur SQL valide l'inscription à la confirmation : quelques secondes au plus.
      const poll = async () => {
        const res = await myDashboard()
        if (!alive) return
        if (res.status === 'verified') {
          // Étape 3 bis : le mot de passe, choisi une seule fois juste après la vérification.
          if (!(await hasPassword())) return navigate(PATHS.password, { replace: true })
          if (!alive) return
          store.setEmail('')
          setD(res)
          setState('ok')
        } else if (res.status === 'suspended') setState('suspended')
        else if (res.status === 'draft') navigate(PATHS.question(1), { replace: true })
        else if (res.status === 'none') navigate(PATHS.signup, { replace: true })
        else if (++tries < 10) {
          setState('pending')
          setTimeout(poll, 2000)
        } else navigate(PATHS.verify, { replace: true })
      }
      poll()
    })()
    return () => {
      alive = false
    }
  }, [navigate])

  if (state === 'loading') return <Loading />

  const link = d?.referral_code ? `${window.location.origin}/waitlist?ref=${d.referral_code}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* presse-papiers refusé : le lien reste sélectionnable */
    }
  }
  const share = () => navigator.share?.({ title: 'KRISMA', text: w.shareText, url: link }).catch(() => {})
  const fmt = (n) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(n ?? 0)

  return (
    <FlowLayout step={state === 'ok' ? 4 : 3} mobileTitle="KRISMA" backTo={PATHS.home}>
      {state === 'ok' && (
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="flex h-[180px] w-[180px] items-center justify-center rounded-full bg-[#ffe6d5] lg:h-[220px] lg:w-[220px]"
          >
            <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-[#fdc9a5] lg:h-[172px] lg:w-[172px]">
              <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full bg-marque text-white lg:h-[132px] lg:w-[132px]">
                <span className="font-display text-[34px] font-bold leading-none tracking-[-1px] lg:text-[40px]">+170</span>
                <span className="font-body text-[13px] font-semibold">points</span>
              </div>
            </div>
          </motion.div>
          <div className="flex flex-col gap-3">
            <Title>{w.title((d.pseudo || '').split(' ')[0])}</Title>
            <Sub className="mx-auto max-w-[480px]">{w.sub}</Sub>
          </div>
          <div className="grid w-full grid-cols-3 gap-2.5 lg:gap-3">
            {[
              [fmt(d.points), w.points],
              [d.rank ? `#${fmt(d.rank)}` : '—', w.rank],
              [fmt(d.top?.members), w.members],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col gap-1 rounded-[20px] bg-clair px-2 py-4">
                <span className="font-display text-[22px] font-bold tabular-nums lg:text-[26px]">{value}</span>
                <span className="font-body text-[13px] text-gris">{label}</span>
              </div>
            ))}
          </div>
          {link && (
            <div className="flex w-full flex-col gap-3.5 rounded-[24px] bg-noir p-5 text-left lg:p-[22px]">
              <p className="font-display text-[18px] font-bold tracking-[-0.4px] text-white lg:text-[20px]">{w.referTitle}</p>
              <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4">
                <span className="min-w-0 flex-1 truncate font-body text-[14px] text-noir">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
                {typeof navigator.share === 'function' && (
                  <button type="button" onClick={share} aria-label={w.share} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-clair sm:hidden">
                    <Share2 size={16} />
                  </button>
                )}
                <button type="button" onClick={copy} className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-marque px-4 font-body text-[14px] font-semibold text-white hover:bg-[#f06e1b]">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? w.copied : w.copy}
                </button>
              </div>
            </div>
          )}
          <Btn type="button" onClick={() => navigate(PATHS.member)} className="w-full">
            {w.cta}
          </Btn>
        </div>
      )}

      {state === 'pending' && (
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-ligne border-t-marque" />
          <Title>{w.pendingTitle}</Title>
          <Sub>{w.pendingSub}</Sub>
        </div>
      )}

      {state === 'signedOut' && (
        <div className="flex flex-col items-center gap-5 text-center">
          <Title>{linkErr ? t.errors.generic : w.signedOutTitle}</Title>
          {linkErr ? <Alert>{errorText(t, { code: linkErr })}</Alert> : <Sub>{w.signedOutSub}</Sub>}
          <Btn type="button" onClick={() => navigate(PATHS.login)}>
            {w.signedOutCta}
          </Btn>
        </div>
      )}

      {state === 'suspended' && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#fee2e2]">
            <ShieldAlert size={24} className="text-[#b91c1c]" />
          </div>
          <Title>{w.suspendedTitle}</Title>
          <Sub>{w.suspendedSub}</Sub>
        </div>
      )}
    </FlowLayout>
  )
}
