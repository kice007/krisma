import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X } from '../components/icons'
import { useLang } from '../i18n'
import { rpc, supabase } from '../lib/supabase'
import { CHAT } from './text'

// ?apercu (développement) : réponses simulées, rien n'est écrit en base.
const preview = () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('apercu')

// Chat visiteurs → équipe : bulle en bas de chaque page publique.
// Le jeton de la conversation vit dans sessionStorage : il disparaît avec
// l'onglet, la conversation n'est donc gardée que côté équipe (migration 17).
const KEY = 'krisma-chat'
const store = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}
    } catch {
      return {}
    }
  },
  set(v) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...store.get(), ...v }))
    } catch {
      /* navigation privée : la conversation reste en mémoire */
    }
  },
}
const newToken = () => {
  const a = new Uint8Array(24)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Position de la bulle selon la page (évite les barres fixées en bas).
function placement(pathname) {
  if (pathname.startsWith('/carte')) return 'right-4 top-[84px] lg:top-auto lg:bottom-10 lg:right-[92px]'
  if (/^\/(espace|classement|reglement)/.test(pathname)) return 'right-4 bottom-[96px] lg:bottom-6 lg:right-6'
  if (/^\/(waitlist\/|connexion)/.test(pathname)) return 'right-4 bottom-[104px] lg:bottom-6 lg:right-6'
  return 'right-4 bottom-4 lg:bottom-6 lg:right-6'
}

function Bubble({ m, t }) {
  const mine = m.from === 'visitor'
  return (
    <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
      {!mine && <span className="pl-1 font-body text-[11px] font-semibold text-gris">{t.team}</span>}
      <p
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 font-body text-[14px] leading-[1.5] ${
          mine ? 'rounded-br-[6px] bg-noir text-white' : 'rounded-bl-[6px] bg-clair text-noir'
        }`}
      >
        {m.body}
      </p>
    </div>
  )
}

export default function ChatWidget() {
  const { pathname } = useLocation()
  const { lang } = useLang()
  const t = CHAT[lang] || CHAT.fr
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [me, setMe] = useState(undefined) // undefined : inconnu, null : anonyme
  const [unread, setUnread] = useState(false)
  const list = useRef(null)
  const input = useRef(null)
  const hidden = pathname.startsWith('/admin')

  const token = () => store.get().token
  const lastStaff = (msgs) => msgs.filter((m) => m.from === 'staff').at(-1)?.id || 0

  const poll = useCallback(async () => {
    if (!token() || document.hidden || preview()) return
    try {
      const r = await rpc('chat_poll', { p_token: token() })
      const msgs = r?.messages || []
      setMessages(msgs)
      const seen = store.get().seen || 0
      if (lastStaff(msgs) > seen) setUnread(true)
    } catch {
      /* réseau : on retentera au prochain tour */
    }
  }, [])

  // Reprise de la conversation de cet onglet.
  useEffect(() => {
    if (token()) poll()
  }, [poll])

  // Lecture régulière : toutes les 4 s fenêtre ouverte, 20 s fermée.
  useEffect(() => {
    if (hidden || !messages.length) return
    const id = setInterval(poll, open ? 4000 : 20000)
    return () => clearInterval(id)
  }, [open, messages.length, poll, hidden])

  // Fenêtre ouverte : réponses marquées comme lues, défilement en bas.
  useEffect(() => {
    if (!open) return
    store.set({ seen: lastStaff(messages) })
    setUnread(false)
    requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }))
  }, [open, messages])

  // Qui écrit : inscrit (prénom et nom) ou anonyme.
  useEffect(() => {
    if (!open || me !== undefined) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setMe(null)
      try {
        const n = await rpc('get_my_name')
        setMe(n?.first_name ? `${n.first_name} ${n.last_name || ''}`.trim() : null)
      } catch {
        setMe(null)
      }
    })
  }, [open, me])

  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  const send = async (e) => {
    e?.preventDefault()
    const body = text.trim()
    if (!body || busy) return
    if (trap) return setText('') // robot : on fait semblant
    setBusy(true)
    setError(null)
    try {
      if (!token()) store.set({ token: newToken() })
      if (preview()) {
        const mine = { id: Date.now(), from: 'visitor', body }
        setMessages((m) => [...m, mine])
        setText('')
        setTimeout(() => setMessages((m) => [...m, { id: Date.now() + 1, from: 'staff', body: lang === 'en' ? 'Thanks for your question! KRISMA is planned at €4.99 a month, with the first 3 months free.' : 'Merci pour ta question ! L’offre envisagée est de 4,99 € par mois, avec les 3 premiers mois offerts.' }]), 1500)
        return
      }
      const r = await rpc('chat_send', {
        p_token: token(),
        p_body: body,
        p_email: me ? null : email.trim() || null,
        p_page: pathname,
        p_locale: lang,
      })
      setMessages(r?.messages || [])
      setText('')
      input.current?.focus()
    } catch (err) {
      setError(t.errors[err.code] || t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  if (hidden) return null
  const started = messages.length > 0
  const waiting = started && messages.at(-1).from === 'visitor'

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label={t.title}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-3 top-[max(12px,env(safe-area-inset-top))] z-[1300] flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(17,17,17,0.22)] sm:inset-x-auto sm:right-6 sm:top-auto sm:bottom-6 sm:h-[min(620px,calc(100vh-48px))] sm:w-[380px]"
          >
            <header className="relative flex items-start gap-3 overflow-hidden bg-noir px-5 pb-5 pt-5 text-white">
              <img src="/img/landing/rayons-menu.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12">
                <img src="/img/landing/k-white.png" alt="" className="h-[18px] w-[14px] object-contain" />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block font-display text-[18px] font-bold tracking-[-0.3px]">{t.title}</span>
                <span className="block font-body text-[13px] text-white/70">{t.sub}</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <X size={18} />
              </button>
            </header>

            <div ref={list} className="km-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              <Bubble m={{ from: 'staff', body: t.hello }} t={t} />
              {messages.map((m) => (
                <Bubble key={m.id} m={m} t={t} />
              ))}
              {waiting && <p className="px-1 text-center font-body text-[12px] leading-[1.5] text-gris">{me === null && email ? t.waitingMail : t.waiting}</p>}
              {!started && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {t.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setText(s)
                        input.current?.focus()
                      }}
                      className="cursor-pointer rounded-full border border-ligne px-3 py-1.5 text-left font-body text-[13px] hover:border-noir"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={send} className="flex flex-col gap-2 border-t border-ligne px-4 pb-4 pt-3">
              {me === null && !started && (
                <label className="flex flex-col gap-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email}
                    aria-label={t.email}
                    autoComplete="email"
                    className="h-10 rounded-xl bg-clair px-3.5 font-body text-[14px] outline-none placeholder:text-gris focus:ring-1 focus:ring-noir"
                  />
                  <span className="px-1 font-body text-[11px] text-gris">{t.emailHint}</span>
                </label>
              )}
              <input tabIndex={-1} aria-hidden autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" className="absolute h-0 w-0 opacity-0" />
              <div className="flex items-end gap-2">
                <textarea
                  ref={input}
                  rows={1}
                  value={text}
                  maxLength={2000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) send(e)
                  }}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  className="km-scroll max-h-[120px] min-h-[44px] flex-1 resize-none rounded-[14px] border border-ligne px-3.5 py-2.5 font-body text-[14px] leading-[1.45] outline-none [field-sizing:content] placeholder:text-gris focus:border-noir"
                />
                <button
                  type="submit"
                  disabled={busy || !text.trim()}
                  aria-label={busy ? t.sending : t.send}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-marque text-white hover:bg-[#f06e1b] disabled:cursor-default disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
              {error && <p className="px-1 font-body text-[12px] text-[#b91c1c]">{error}</p>}
              <p className="px-1 font-body text-[11px] text-gris">
                {me ? t.as(me) : t.anon} {t.note}
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className={`fixed z-[1250] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-noir text-white shadow-[0_12px_32px_rgba(17,17,17,0.28)] hover:-translate-y-0.5 ${placement(pathname)}`}
        >
          <MessageCircle size={24} />
          {unread && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-marque px-1 font-body text-[10px] font-bold" aria-label={t.newReply}>
              1
            </span>
          )}
        </motion.button>
      )}
    </>
  )
}
