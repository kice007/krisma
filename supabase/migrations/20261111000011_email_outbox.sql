-- =============================================================================
-- KRISMA · Waitlist — 11 : envoi des e-mails de la file (phase 7)
--
-- La fonction Edge « send-emails » (lancée chaque minute) appelle
-- claim_email_batch() avec la clé service_role, envoie les e-mails via Resend,
-- puis finish_email(). Un e-mail en échec est retenté (5 essais, 5 min d'écart).
-- Un parrainage d'abord suspendu puis attribué par l'équipe envoie aussi
-- l'e-mail « parrainage validé ».
-- =============================================================================

alter table public.email_outbox add column if not exists last_attempt_at timestamptz;

-- Réserve un lot d'e-mails à envoyer, avec tout ce qu'il faut pour les écrire.
create or replace function public.claim_email_batch(p_limit int default 50)
returns table (
  id             bigint,
  template       text,
  payload        jsonb,
  email          text,
  locale         text,
  pseudo         text,
  notify_points  boolean,
  referral_code  text,
  points         int,
  rank           bigint,
  members        bigint
)
language sql
volatile
security definer
set search_path = ''
as $$
  with picked as (
    select o.id
      from public.email_outbox o
     where o.status = 'queued'
       and o.attempts < 5
       and (o.last_attempt_at is null or o.last_attempt_at < now() - interval '5 minutes')
     order by o.created_at
     limit least(greatest(p_limit, 1), 100)
     for update skip locked
  ), upd as (
    update public.email_outbox o
       set attempts = o.attempts + 1, last_attempt_at = now()
      from picked
     where o.id = picked.id
    returning o.id, o.user_id, o.template, o.payload
  )
  select u.id, u.template, u.payload, au.email::text, p.locale, p.pseudo::text, p.notify_points,
         p.referral_code, coalesce(r.points, 0), r.rank, (select count(*) from public.member_totals)
    from upd u
    join public.profiles p on p.id = u.user_id
    join auth.users au on au.id = u.user_id
    left join public.member_ranking r on r.id = u.user_id;
$$;

-- Résultat d'un envoi : sent | skipped | failed (retenté tant qu'il reste des essais)
create or replace function public.finish_email(p_id bigint, p_status text, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.email_outbox set
    status = case
      when p_status = 'failed' and attempts < 5 then 'queued'
      when p_status in ('sent', 'skipped', 'failed') then p_status
      else status end,
    last_error = p_error,
    sent_at = case when p_status = 'sent' then now() else sent_at end
  where id = p_id;
end;
$$;

-- Parrainage suspendu par l'anti-fraude puis attribué par l'équipe : e-mail au parrain.
create or replace function public.queue_referral_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'referral' and new.status = 'awarded' and old.status = 'suspended' then
    insert into public.email_outbox (user_id, template, payload)
    values (new.user_id, 'referral_awarded',
            jsonb_build_object('points', new.points,
                               'referee', (select pseudo::text from public.profiles where id = new.source_id)));
  end if;
  return new;
end;
$$;

drop trigger if exists point_events_referral_email on public.point_events;
create trigger point_events_referral_email
  after update of status on public.point_events
  for each row execute function public.queue_referral_email();

revoke execute on function public.claim_email_batch(int), public.finish_email(bigint, text, text), public.queue_referral_email()
  from public, anon, authenticated;
grant execute on function public.claim_email_batch(int), public.finish_email(bigint, text, text) to service_role;
