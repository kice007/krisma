-- =============================================================================
-- KRISMA · Migration 17 : chat visiteurs → équipe
--
-- - Tout le monde peut poser une question (inscrit ou non) depuis la bulle du site.
-- - Le visiteur est reconnu par un jeton aléatoire gardé dans l'onglet
--   (sessionStorage) : seul son empreinte SHA-256 est stockée. Fermer l'onglet
--   fait « oublier » la conversation côté utilisateur ; l'équipe la garde.
-- - Inscrit (profil existant) : le prénom et le nom sont joints automatiquement.
--   Sinon : « Anonyme », avec un e-mail facultatif pour recevoir la réponse.
-- - L'équipe répond depuis /admin/messages ; si le visiteur n'a plus la fenêtre
--   ouverte (pas de lecture depuis 2 min), la réponse part aussi par e-mail.
-- - Chaque question est classée par sujet (deviné à partir des mots, modifiable)
--   pour les statistiques.
-- =============================================================================

create table public.chat_threads (
  id               uuid primary key default gen_random_uuid(),
  token_hash       text not null unique,
  user_id          uuid references public.profiles (id) on delete set null,
  email            text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  locale           text not null default 'fr' check (locale in ('fr', 'en')),
  page             text check (page is null or char_length(page) <= 200),
  ip               inet,
  topic            text not null default 'other' check (topic in (
                     'pricing', 'security', 'countries', 'account_card', 'transfers',
                     'waitlist_points', 'shops_map', 'partnership', 'account_help', 'other')),
  status           text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  visitor_seen_at  timestamptz,
  staff_read_at    timestamptz
);
create index chat_threads_last_idx on public.chat_threads (last_message_at desc);
create index chat_threads_ip_idx on public.chat_threads (ip, created_at);

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  thread_id   uuid not null references public.chat_threads (id) on delete cascade,
  sender      text not null check (sender in ('visitor', 'staff')),
  staff_id    uuid references auth.users (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index chat_messages_thread_idx on public.chat_messages (thread_id, id);

-- Accès uniquement par les fonctions ci-dessous.
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
revoke all on public.chat_threads, public.chat_messages from anon, authenticated;

-- -----------------------------------------------------------------------------
-- File d'e-mails : accepte un destinataire sans compte (réponse du chat).
-- -----------------------------------------------------------------------------
alter table public.email_outbox alter column user_id drop not null;
alter table public.email_outbox add column if not exists to_email text;
alter table public.email_outbox drop constraint if exists email_outbox_template_check;
alter table public.email_outbox add constraint email_outbox_template_check
  check (template in ('welcome', 'referral_awarded', 'shop_validated', 'chat_reply'));
alter table public.email_outbox add constraint email_outbox_recipient_check
  check (user_id is not null or to_email is not null);

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
    returning o.id, o.user_id, o.to_email, o.template, o.payload
  )
  select u.id, u.template, u.payload,
         coalesce(u.to_email, au.email::text),
         coalesce(p.locale, u.payload ->> 'locale', 'fr'),
         coalesce(p.pseudo::text, ''),
         coalesce(p.notify_points, true),
         coalesce(p.referral_code, ''),
         coalesce(r.points, 0)::int, r.rank, (select count(*) from public.member_totals)
    from upd u
    left join public.profiles p on p.id = u.user_id
    left join auth.users au on au.id = u.user_id
    left join public.member_ranking r on r.id = u.user_id
   where coalesce(u.to_email, au.email::text) is not null;
$$;

-- -----------------------------------------------------------------------------
-- Outils
-- -----------------------------------------------------------------------------
create or replace function public.chat_token_hash(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

-- Sujet deviné à partir des mots de la question (l'équipe peut le corriger).
create or replace function public.chat_guess_topic(p_body text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when b ~ '(prix|tarif|co[uû]t|combien|gratuit|abonnement|frais|€|eur|price|cost|fee|free|subscription)' then 'pricing'
    when b ~ '(s[ée]curit|arnaque|fiable|confiance|r[ée]gul|agr[ée]|banque|donn[ée]es|security|scam|safe|trust|bank|licen)' then 'security'
    when b ~ '(parrain|points?|classement|rang|top 2|r[ée]compense|waitlist|liste d.attente|referr|rank|reward|leaderboard)' then 'waitlist_points'
    when b ~ '(commerce|boutique|[ée]picerie|carte krisma map|krisma map|vote|shop|store|grocery)' then 'shops_map'
    when b ~ '(partenaire|partenariat|commer[cç]ant|partner|merchant)' then 'partnership'
    when b ~ '(transf[ée]r|envoyer|envoi|recevoir|mobile money|orange money|wave|send|receive|remit)' then 'transfers'
    when b ~ '(pays|country|countries|disponible dans|available in|c[oô]te d.ivoire|s[ée]n[ée]gal|cameroun|maroc|alg[ée]rie|tunisie|mali)' then 'countries'
    when b ~ '(carte|iban|compte|card|account|virement)' then 'account_card'
    when b ~ '(connexion|connecter|mot de passe|e-?mail|inscri|login|password|sign ?up|verify|v[ée]rif)' then 'account_help'
    else 'other'
  end
  from (select lower(coalesce(p_body, '')) as b) s;
$$;

-- Messages d'une conversation, pour le visiteur.
create or replace function public.chat_thread_json(p_thread uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', t.status,
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'from', m.sender, 'body', m.body, 'at', m.created_at) order by m.id)
        from public.chat_messages m where m.thread_id = t.id), '[]'::jsonb))
  from public.chat_threads t where t.id = p_thread;
$$;

-- -----------------------------------------------------------------------------
-- Côté visiteur (anon et connectés)
-- -----------------------------------------------------------------------------
create or replace function public.chat_send(
  p_token  text,
  p_body   text,
  p_email  text default null,
  p_page   text default null,
  p_locale text default 'fr'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_hash   text;
  v_body   text := btrim(coalesce(p_body, ''));
  v_email  text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_ip     inet := public.request_ip();
  v_uid    uuid := auth.uid();
  v_user   uuid;
  v_thread public.chat_threads;
begin
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 128 then
    raise exception 'invalid_token';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 2000 then
    raise exception 'invalid_message';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  v_hash := public.chat_token_hash(p_token);

  -- Inscrit (même en cours d'inscription) : on joint son profil.
  if v_uid is not null then
    select id into v_user from public.profiles where id = v_uid;
  end if;

  select * into v_thread from public.chat_threads where token_hash = v_hash for update;

  -- Limites anti-abus : par conversation et par adresse IP.
  if v_thread.id is not null and (
       (select count(*) from public.chat_messages m where m.thread_id = v_thread.id and m.sender = 'visitor' and m.created_at > now() - interval '1 minute') >= 5
    or (select count(*) from public.chat_messages m where m.thread_id = v_thread.id and m.sender = 'visitor' and m.created_at > now() - interval '1 day') >= 40) then
    raise exception 'rate_limited';
  end if;
  if v_ip is not null and (
       (select count(*) from public.chat_messages m join public.chat_threads t on t.id = m.thread_id
         where t.ip = v_ip and m.sender = 'visitor' and m.created_at > now() - interval '10 minutes') >= 20
    or (v_thread.id is null and (select count(*) from public.chat_threads t where t.ip = v_ip and t.created_at > now() - interval '1 hour') >= 6)) then
    raise exception 'rate_limited';
  end if;

  if v_thread.id is null then
    insert into public.chat_threads (token_hash, user_id, email, locale, page, ip, topic)
    values (v_hash, v_user, case when v_user is null then v_email end,
            case when p_locale = 'en' then 'en' else 'fr' end,
            left(nullif(btrim(coalesce(p_page, '')), ''), 200), v_ip, public.chat_guess_topic(v_body))
    returning * into v_thread;
  else
    update public.chat_threads set
      user_id = coalesce(user_id, v_user),
      email = case when coalesce(user_id, v_user) is null then coalesce(v_email, email) end,
      status = 'open',
      topic = case when topic = 'other' then public.chat_guess_topic(v_body) else topic end
    where id = v_thread.id;
  end if;

  insert into public.chat_messages (thread_id, sender, body) values (v_thread.id, 'visitor', v_body);
  update public.chat_threads set last_message_at = now(), visitor_seen_at = now() where id = v_thread.id;
  return public.chat_thread_json(v_thread.id);
end;
$$;

-- Lecture par le visiteur (toutes les quelques secondes quand la fenêtre est ouverte).
create or replace function public.chat_poll(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 128 then
    return jsonb_build_object('status', null, 'messages', '[]'::jsonb);
  end if;
  update public.chat_threads set visitor_seen_at = now()
   where token_hash = public.chat_token_hash(p_token)
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('status', null, 'messages', '[]'::jsonb);
  end if;
  return public.chat_thread_json(v_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Côté équipe
-- -----------------------------------------------------------------------------
-- Nom affiché : prénom + nom du profil, sinon « Anonyme ».
create or replace function public.chat_identity(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.id is null then jsonb_build_object('name', null, 'kind', 'visitor')
    else jsonb_build_object(
      'name', nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
      'kind', case when p.status = 'verified' then 'member' else 'registrant' end,
      'account_email', (select u.email::text from auth.users u where u.id = p.id))
  end
  from (select 1) one
  left join public.profiles p on p.id = p_user;
$$;

create or replace function public.admin_chat_threads(
  p_status text default null,
  p_search text default null,
  p_limit  int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q    text := nullif(btrim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_total int;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  with base as (
    select t.*, public.chat_identity(t.user_id) as who,
           (select m.body from public.chat_messages m where m.thread_id = t.id order by m.id desc limit 1) as preview,
           (select m.sender from public.chat_messages m where m.thread_id = t.id order by m.id desc limit 1) as last_sender,
           (select count(*) from public.chat_messages m where m.thread_id = t.id) as n,
           exists (select 1 from public.chat_messages m where m.thread_id = t.id and m.sender = 'visitor'
                    and (t.staff_read_at is null or m.created_at > t.staff_read_at)) as unread
      from public.chat_threads t
  ), filtered as (
    select * from base b
     where (p_status is null or p_status = '' or (p_status = 'unread' and b.unread) or b.status = p_status)
       and (v_q is null
            or b.who ->> 'name' ilike '%' || v_q || '%'
            or b.email ilike '%' || v_q || '%'
            or exists (select 1 from public.chat_messages m where m.thread_id = b.id and m.body ilike '%' || v_q || '%'))
  )
  select (select count(*) from filtered),
         coalesce((select jsonb_agg(x order by (x ->> 'last_message_at') desc) from (
           select jsonb_build_object(
             'id', f.id, 'name', f.who ->> 'name', 'kind', f.who ->> 'kind',
             'email', coalesce(f.email, f.who ->> 'account_email'),
             'topic', f.topic, 'status', f.status, 'locale', f.locale, 'page', f.page,
             'created_at', f.created_at, 'last_message_at', f.last_message_at,
             'preview', left(f.preview, 160), 'last_sender', f.last_sender, 'count', f.n, 'unread', f.unread) as x
             from filtered f
            order by f.last_message_at desc
            limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)) s), '[]'::jsonb)
    into v_total, v_rows;
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

create or replace function public.admin_chat_thread(p_thread uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t public.chat_threads;
  w jsonb;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  update public.chat_threads set staff_read_at = now() where id = p_thread returning * into t;
  if t.id is null then
    raise exception 'not_found';
  end if;
  w := public.chat_identity(t.user_id);
  return jsonb_build_object(
    'id', t.id, 'name', w ->> 'name', 'kind', w ->> 'kind', 'user_id', t.user_id,
    'email', coalesce(t.email, w ->> 'account_email'),
    'topic', t.topic, 'status', t.status, 'locale', t.locale, 'page', t.page,
    'created_at', t.created_at, 'visitor_seen_at', t.visitor_seen_at,
    'online', t.visitor_seen_at > now() - interval '2 minutes',
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'from', m.sender, 'body', m.body, 'at', m.created_at,
               'staff', (select split_part(u.email::text, '@', 1) from auth.users u where u.id = m.staff_id))
             order by m.id)
        from public.chat_messages m where m.thread_id = t.id), '[]'::jsonb));
end;
$$;

create or replace function public.admin_chat_reply(p_thread uuid, p_body text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  t      public.chat_threads;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 2000 then
    raise exception 'invalid_message';
  end if;
  select * into t from public.chat_threads where id = p_thread for update;
  if t.id is null then
    raise exception 'not_found';
  end if;
  insert into public.chat_messages (thread_id, sender, staff_id, body) values (t.id, 'staff', auth.uid(), v_body);
  update public.chat_threads set status = 'answered', last_message_at = now(), staff_read_at = now() where id = t.id;

  -- Fenêtre fermée depuis plus de 2 minutes : la réponse part aussi par e-mail.
  if t.visitor_seen_at is null or t.visitor_seen_at < now() - interval '2 minutes' then
    if t.user_id is not null then
      insert into public.email_outbox (user_id, template, payload)
      values (t.user_id, 'chat_reply', jsonb_build_object('reply', v_body, 'locale', t.locale,
              'question', (select m.body from public.chat_messages m where m.thread_id = t.id and m.sender = 'visitor' order by m.id desc limit 1)));
    elsif t.email is not null then
      insert into public.email_outbox (to_email, template, payload)
      values (t.email, 'chat_reply', jsonb_build_object('reply', v_body, 'locale', t.locale,
              'question', (select m.body from public.chat_messages m where m.thread_id = t.id and m.sender = 'visitor' order by m.id desc limit 1)));
    end if;
  end if;
  return public.admin_chat_thread(t.id);
end;
$$;

create or replace function public.admin_chat_update(p_thread uuid, p_topic text default null, p_status text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  update public.chat_threads set
    topic = coalesce(nullif(p_topic, ''), topic),
    status = coalesce(nullif(p_status, ''), status)
  where id = p_thread;
  if not found then
    raise exception 'not_found';
  end if;
exception when check_violation then
  raise exception 'invalid_answer';
end;
$$;

create or replace function public.admin_chat_unread()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_staff() then (
    select count(*)::int from public.chat_threads t
     where t.status <> 'closed'
       and exists (select 1 from public.chat_messages m where m.thread_id = t.id and m.sender = 'visitor'
                    and (t.staff_read_at is null or m.created_at > t.staff_read_at)))
  else 0 end;
$$;

-- Statistiques des questions (période en jours).
create or replace function public.admin_chat_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 30), 1));
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return (
    with t as (
      select th.*, public.chat_identity(th.user_id) ->> 'kind' as kind,
             (select min(m.created_at) from public.chat_messages m where m.thread_id = th.id and m.sender = 'staff') as first_reply
        from public.chat_threads th where th.created_at >= v_from
    )
    select jsonb_build_object(
      'threads', (select count(*) from t),
      'questions', (select count(*) from public.chat_messages m join t on t.id = m.thread_id where m.sender = 'visitor'),
      'answered', (select count(*) from t where t.first_reply is not null),
      'waiting', (select count(*) from t where t.status = 'open'),
      'median_reply_minutes', (select round((percentile_cont(0.5) within group (order by extract(epoch from t.first_reply - t.created_at) / 60))::numeric, 1) from t where t.first_reply is not null),
      'by_topic', coalesce((select jsonb_object_agg(topic, n) from (select topic, count(*) n from t group by 1) s), '{}'::jsonb),
      'by_kind', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from t group by 1) s), '{}'::jsonb),
      'by_locale', coalesce((select jsonb_object_agg(locale, n) from (select locale, count(*) n from t group by 1) s), '{}'::jsonb),
      'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
                   select date_trunc('day', created_at)::date d, count(*) n from t group by 1) s), '[]'::jsonb)
    )
  );
end;
$$;

-- Export Excel : une ligne par question.
create or replace function public.admin_chat_export()
returns table (
  asked_at   timestamptz,
  name       text,
  kind       text,
  email      text,
  topic      text,
  status     text,
  locale     text,
  page       text,
  question   text,
  reply      text,
  replied_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return query
  select m.created_at, w ->> 'name', w ->> 'kind', coalesce(t.email, w ->> 'account_email'),
         t.topic, t.status, t.locale, t.page, m.body,
         r.body, r.created_at
    from public.chat_messages m
    join public.chat_threads t on t.id = m.thread_id
    cross join lateral (select public.chat_identity(t.user_id) as w) i
    left join lateral (select s.body, s.created_at from public.chat_messages s
                        where s.thread_id = m.thread_id and s.sender = 'staff' and s.id > m.id
                        order by s.id limit 1) r on true
   where m.sender = 'visitor'
   order by m.created_at desc;
end;
$$;

-- -----------------------------------------------------------------------------
-- Droits
-- -----------------------------------------------------------------------------
revoke execute on function
  public.chat_token_hash(text), public.chat_guess_topic(text), public.chat_thread_json(uuid),
  public.chat_identity(uuid)
  from public, anon, authenticated;

revoke execute on function public.chat_send(text, text, text, text, text), public.chat_poll(text) from public;
grant execute on function public.chat_send(text, text, text, text, text), public.chat_poll(text) to anon, authenticated;

revoke execute on function
  public.admin_chat_threads(text, text, int, int), public.admin_chat_thread(uuid),
  public.admin_chat_reply(uuid, text), public.admin_chat_update(uuid, text, text),
  public.admin_chat_unread(), public.admin_chat_stats(int), public.admin_chat_export()
  from public, anon;
grant execute on function
  public.admin_chat_threads(text, text, int, int), public.admin_chat_thread(uuid),
  public.admin_chat_reply(uuid, text), public.admin_chat_update(uuid, text, text),
  public.admin_chat_unread(), public.admin_chat_stats(int), public.admin_chat_export()
  to authenticated;

revoke execute on function public.claim_email_batch(int) from public, anon, authenticated;
