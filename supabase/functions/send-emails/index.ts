// Fonction Edge « send-emails » : vide la file email_outbox via Resend.
// À planifier chaque minute (Supabase → Integrations → Cron → Edge Function).
// Secrets : RESEND_API_KEY (obligatoire), EMAIL_FROM et SITE_URL (facultatifs).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { render, type Row } from './templates.ts'

const SITE = Deno.env.get('SITE_URL') ?? 'https://www.krisma.io'
const FROM = Deno.env.get('EMAIL_FROM') ?? 'KRISMA <waitlist@krisma.io>'
const RESEND = Deno.env.get('RESEND_API_KEY')

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

const finish = (id: number, status: 'sent' | 'skipped' | 'failed', error: string | null = null) =>
  db.rpc('finish_email', { p_id: id, p_status: status, p_error: error })

Deno.serve(async () => {
  if (!RESEND) return Response.json({ error: 'RESEND_API_KEY manquante' }, { status: 500 })

  const { data, error } = await db.rpc('claim_email_batch', { p_limit: 50 })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const rows = (data ?? []) as Row[]

  // Les e-mails de suivi respectent la préférence « Points et parrainages ».
  const toSend: Row[] = []
  let skipped = 0
  for (const r of rows) {
    if (r.template !== 'welcome' && r.notify_points === false) {
      await finish(r.id, 'skipped', 'notify_points désactivé')
      skipped++
    } else toSend.push(r)
  }

  // Envoi groupé (jusqu'à 100 e-mails par appel Resend), clé d'idempotence par lot.
  let sent = 0
  let failed = 0
  if (toSend.length) {
    const emails = toSend.map((r) => {
      const m = render(r, SITE)
      return { from: FROM, to: [r.email], subject: m.subject, html: m.html, text: m.text, tags: [{ name: 'template', value: r.template }] }
    })
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json', 'Idempotency-Key': `outbox-${toSend.map((r) => r.id).join('-')}`.slice(0, 256) },
      body: JSON.stringify(emails),
    })
    const body = await res.text()
    for (const r of toSend) {
      if (res.ok) {
        await finish(r.id, 'sent')
        sent++
      } else {
        await finish(r.id, 'failed', `${res.status} ${body}`.slice(0, 500))
        failed++
      }
    }
  }

  return Response.json({ claimed: rows.length, sent, skipped, failed })
})
