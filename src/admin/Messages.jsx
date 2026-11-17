import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, MessageCircle, Search, Send } from '../components/icons'
import { arpc as rpc } from './api'
import { CHAT_KIND, CHAT_TOPIC, exportChat } from './exports'
import { useAdmin } from './Shell'
import { Badge, Button, Card, Empty, PageHead, Select, Spinner, ago, date, errText, fmt, pct } from './ui'

const STATUS = { open: ['En attente', 'orange'], answered: ['Répondu', 'ok'], closed: ['Fermé', 'neutral'] }
const FILTERS = [['', 'Toutes'], ['unread', 'Non lues'], ['open', 'En attente'], ['answered', 'Répondues'], ['closed', 'Fermées']]
const KIND_TONE = { member: 'dark', registrant: 'info', visitor: 'neutral' }

function Who({ t }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-body text-[14px] font-semibold">{t.name || 'Anonyme'}</span>
      <Badge tone={KIND_TONE[t.kind]}>{CHAT_KIND[t.kind]}</Badge>
    </span>
  )
}

// Petits chiffres du chat : volume, délai de réponse, sujets.
function ChatStats({ s }) {
  if (!s) return null
  const topics = Object.entries(s.by_topic || {}).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...topics.map(([, n]) => n))
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1.6fr] lg:gap-4">
      {[
        ['Conversations', fmt(s.threads), '30 derniers jours'],
        ['Questions', fmt(s.questions), `${fmt(s.by_kind?.visitor || 0)} conversations anonymes`],
        ['En attente', fmt(s.waiting), `${pct(s.answered, s.threads)} ont une réponse`],
        ['Délai médian', s.median_reply_minutes == null ? '—' : s.median_reply_minutes < 60 ? `${fmt(Math.round(s.median_reply_minutes))} min` : `${fmt(Math.round(s.median_reply_minutes / 6) / 10)} h`, 'avant la 1re réponse'],
      ].map(([l, v, sub]) => (
        <Card key={l}>
          <p className="font-body text-[13px] text-gris">{l}</p>
          <p className="mt-1.5 font-display text-[24px] font-bold tracking-[-1px] tabular-nums lg:mt-2 lg:text-[28px]">{v}</p>
          <p className="mt-1 font-body text-[12px] text-gris">{sub}</p>
        </Card>
      ))}
      <Card className="col-span-2 lg:col-span-1">
        <p className="mb-3 font-body text-[13px] text-gris">Sujets les plus demandés</p>
        {topics.length === 0 ? (
          <p className="font-body text-[13px] text-gris">Pas encore de question.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topics.slice(0, 4).map(([k, n], i) => (
              <li key={k}>
                <div className="flex justify-between font-body text-[12px]">
                  <span>{CHAT_TOPIC[k] || k}</span>
                  <span className="text-gris tabular-nums">{fmt(n)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-clair">
                  <div className={`h-full rounded-full ${i === 0 ? 'bg-marque' : 'bg-noir'}`} style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Thread({ id, onBack, onChanged }) {
  const [t, setT] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const list = useRef(null)

  const load = useCallback(() => rpc('admin_chat_thread', { p_thread: id }).then(setT, (e) => setError(errText(e))), [id])
  useEffect(() => {
    setT(null)
    load().then(onChanged)
    const iv = setInterval(load, 8000)
    return () => clearInterval(iv)
  }, [load, onChanged])
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [t?.messages?.length])

  const reply = async (e) => {
    e?.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      setT(await rpc('admin_chat_reply', { p_thread: id, p_body: text.trim() }))
      setText('')
      onChanged()
    } catch (err) {
      setError(errText(err))
    } finally {
      setBusy(false)
    }
  }
  const update = async (patch) => {
    try {
      await rpc('admin_chat_update', { p_thread: id, p_topic: patch.topic ?? null, p_status: patch.status ?? null })
      setT((x) => ({ ...x, ...patch }))
      onChanged()
    } catch (err) {
      setError(errText(err))
    }
  }

  if (!t) return <Card className="flex min-h-[420px] items-center justify-center">{error ? <p className="font-body text-[14px] text-[#b91c1c]">{error}</p> : <Spinner />}</Card>
  const willMail = !t.online && t.email
  return (
    <Card className="flex h-[calc(100dvh-150px)] min-h-[520px] flex-col !p-0 lg:h-[680px]">
      <div className="flex flex-col gap-3 border-b border-ligne p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} aria-label="Retour" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-clair lg:hidden">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <Who t={t} />
            <p className="mt-1 truncate font-body text-[12px] text-gris">
              {[t.email || 'Pas d’e-mail', t.locale?.toUpperCase(), t.page && `depuis ${t.page}`, `ouverte le ${date(t.created_at, true)}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`mt-1 flex shrink-0 items-center gap-1.5 font-body text-[12px] ${t.online ? 'text-vert' : 'text-gris'}`}>
            <span className={`h-2 w-2 rounded-full ${t.online ? 'bg-vert' : 'bg-ligne'}`} />
            {t.online ? 'Fenêtre ouverte' : 'Hors ligne'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select label="Sujet" value={t.topic} onChange={(v) => update({ topic: v })} options={Object.entries(CHAT_TOPIC)} />
          <Select label="Statut" value={t.status} onChange={(v) => update({ status: v })} options={Object.entries(STATUS).map(([k, [l]]) => [k, l])} />
        </div>
      </div>
      <div ref={list} className="km-scroll flex flex-1 flex-col gap-3 overflow-y-auto bg-[#fafafa] p-4 lg:p-5">
        {t.messages.map((m) => {
          const staff = m.from === 'staff'
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${staff ? 'items-end' : 'items-start'}`}>
              <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-[16px] px-3.5 py-2.5 font-body text-[14px] leading-[1.5] ${staff ? 'rounded-br-[6px] bg-noir text-white' : 'rounded-bl-[6px] border border-ligne bg-white'}`}>{m.body}</p>
              <span className="px-1 font-body text-[11px] text-gris">
                {staff ? `${m.staff || 'Équipe'} · ` : ''}
                {date(m.at, true)}
              </span>
            </div>
          )
        })}
      </div>
      <form onSubmit={reply} className="flex flex-col gap-2 border-t border-ligne p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) reply(e)
            }}
            rows={2}
            maxLength={2000}
            placeholder="Écrire la réponse…"
            aria-label="Réponse"
            className="km-scroll max-h-[160px] min-h-[52px] flex-1 resize-none rounded-[14px] border border-ligne px-3.5 py-2.5 font-body text-[14px] outline-none [field-sizing:content] focus:border-noir"
          />
          <Button tone="orange" icon={Send} busy={busy} disabled={!text.trim()} type="submit" className="h-[52px]">
            Répondre
          </Button>
        </div>
        <p className="font-body text-[12px] text-gris">
          {t.online
            ? 'La personne a la fenêtre ouverte : la réponse s’affiche tout de suite.'
            : willMail
              ? `Fenêtre fermée : la réponse sera aussi envoyée à ${t.email}.`
              : 'Fenêtre fermée et pas d’e-mail : la réponse ne sera vue que si la personne revient dans le même onglet.'}{' '}
          Ctrl + Entrée pour envoyer.
        </p>
        {error && <p className="font-body text-[13px] text-[#b91c1c]">{error}</p>}
      </form>
    </Card>
  )
}

// Messages du chat : boîte de réception de l'équipe.
export default function Messages() {
  const { refreshCounts } = useAdmin()
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [sel, setSel] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () => rpc('admin_chat_threads', { p_status: filter || null, p_search: q || null, p_limit: 100, p_offset: 0 }).then(setData, (e) => setError(errText(e))),
    [filter, q],
  )
  const changed = useCallback(() => {
    load()
    refreshCounts()
    rpc('admin_chat_stats', { p_days: 30 }).then(setStats, () => {})
  }, [load, refreshCounts])

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(id)
  }, [load, q])
  useEffect(() => {
    rpc('admin_chat_stats', { p_days: 30 }).then(setStats, () => {})
    const iv = setInterval(() => {
      load()
      refreshCounts()
    }, 10000)
    return () => clearInterval(iv)
  }, [load, refreshCounts])

  return (
    <div>
      <PageHead title="Messages" sub="Questions posées dans le chat du site, par les inscrits et les visiteurs">
        <Button
          tone="dark"
          icon={Download}
          busy={busy}
          onClick={async () => {
            setBusy(true)
            await exportChat().catch(() => {})
            setBusy(false)
          }}
        >
          Exporter les questions
        </Button>
      </PageHead>
      <ChatStats s={stats} />
      {error && <p className="mb-3 font-body text-[14px] text-[#b91c1c]">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className={`min-w-0 ${sel ? 'hidden lg:block' : ''}`}>
          <Card className="!p-0">
            <div className="flex flex-col gap-2.5 border-b border-ligne p-3.5">
              <label className="flex h-11 items-center gap-2 rounded-full bg-clair px-4">
                <Search size={16} className="text-gris" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail ou mot de la question" aria-label="Rechercher" className="min-w-0 flex-1 bg-transparent font-body text-[14px] outline-none" />
              </label>
              <div className="km-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1">
                {FILTERS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setFilter(v)} className={`h-8 shrink-0 cursor-pointer rounded-full px-3 font-body text-[13px] font-medium ${filter === v ? 'bg-noir text-white' : 'bg-clair text-noir'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {!data ? (
              <Spinner />
            ) : data.rows.length === 0 ? (
              <Empty>{filter || q ? 'Aucune conversation pour ce filtre.' : 'Pas encore de message. La bulle de chat est visible sur toutes les pages du site.'}</Empty>
            ) : (
              <ul className="km-scroll max-h-[560px] overflow-y-auto">
                {data.rows.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSel(t.id)
                        if (window.innerWidth < 1024) setTimeout(() => document.getElementById('conversation')?.scrollIntoView({ behavior: 'smooth' }), 50)
                      }}
                      className={`flex w-full cursor-pointer flex-col gap-1 border-b border-ligne px-4 py-3.5 text-left ${sel === t.id ? 'bg-clair' : 'hover:bg-[#fafafa]'}`}
                    >
                      <span className="flex items-center gap-2">
                        {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-marque" aria-label="Non lu" />}
                        <span className="min-w-0 flex-1">
                          <Who t={t} />
                        </span>
                        <span className="shrink-0 font-body text-[12px] text-gris">{ago(t.last_message_at)}</span>
                      </span>
                      <span className={`line-clamp-2 font-body text-[13px] leading-[1.45] ${t.unread ? 'text-noir' : 'text-gris'}`}>
                        {t.last_sender === 'staff' ? 'Toi : ' : ''}
                        {t.preview}
                      </span>
                      <span className="flex flex-wrap gap-1.5 pt-0.5">
                        <Badge tone={STATUS[t.status][1]}>{STATUS[t.status][0]}</Badge>
                        <Badge>{CHAT_TOPIC[t.topic]}</Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div id="conversation" className={`min-w-0 scroll-mt-16 ${sel ? '' : 'hidden lg:block'}`}>
          {sel ? (
            <Thread key={sel} id={sel} onBack={() => setSel(null)} onChanged={changed} />
          ) : (
            <Card className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clair">
                <MessageCircle size={22} />
              </span>
              <p className="max-w-[320px] font-body text-[14px] text-gris">Choisis une conversation pour lire la question et répondre.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
