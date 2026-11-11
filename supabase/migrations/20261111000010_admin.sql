-- =============================================================================
-- KRISMA · Waitlist — 10 : administration (phase 6)
--
-- Rôles : modérateur (commerces, consultation des membres), admin (+ points,
-- suspensions, exports), super-admin (+ équipe et rôles).
--
-- - droits resserrés : corrections de points et suspensions réservées aux admins
-- - vue d'ensemble paramétrable, liste/fiche des membres, liste des commerces
--   avec doublon probable, historique des points avec l'auteur des actions,
--   journal, exports (membres, classement final)
-- - équipe : invitations par e-mail (appliquées à la confirmation de l'adresse),
--   rôles, au moins un super-admin
-- Chaque fonction : « revoke ... from public, anon » puis « grant ... to authenticated ».
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rôle du membre connecté
-- -----------------------------------------------------------------------------
create or replace function public.my_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text from public.user_roles where user_id = auth.uid()
  order by case role when 'super_admin' then 1 when 'admin' then 2 else 3 end
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'super_admin');
$$;

-- Libellé lisible d'un acteur (pseudo, sinon e-mail, sinon « Système »)
create or replace function public.actor_label(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when p_user is null then null else coalesce(
    (select pseudo::text from public.profiles where id = p_user),
    (select split_part(email, '@', 1) from auth.users where id = p_user)) end;
$$;

-- -----------------------------------------------------------------------------
-- Droits resserrés
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_point_status(
  p_event_id  bigint,
  p_status    public.point_status,
  p_reason    text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required';
  end if;
  if p_status = 'pending' then
    raise exception 'invalid_status';
  end if;
  update public.point_events set
    status     = p_status,
    reason     = p_reason,
    awarded_at = case when p_status = 'awarded' then coalesce(awarded_at, now()) else awarded_at end
  where id = p_event_id;
  if not found then
    raise exception 'event_not_found';
  end if;
  perform public.log_admin_action('points_' || p_status, 'point_events', p_event_id::text,
    jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.admin_set_user_suspended(
  p_user_id    uuid,
  p_suspended  boolean,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_suspended then
    update public.profiles
       set status = 'suspended', suspended_at = now(), suspension_reason = p_reason
     where id = p_user_id;
  else
    update public.profiles set
      status = case
        when verified_at is not null then 'verified'::public.profile_status
        when questionnaire_completed_at is not null then 'questionnaire_done'::public.profile_status
        else 'draft'::public.profile_status end,
      suspended_at = null,
      suspension_reason = null
    where id = p_user_id;
  end if;
  if not found then
    raise exception 'user_not_found';
  end if;
  perform public.log_admin_action(case when p_suspended then 'user_suspend' else 'user_unsuspend' end,
    'profiles', p_user_id::text, jsonb_build_object('reason', p_reason));
end;
$$;

-- -----------------------------------------------------------------------------
-- Vue d'ensemble (A1)
-- -----------------------------------------------------------------------------
drop function if exists public.admin_overview();

create function public.admin_overview(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days int := least(greatest(coalesce(p_days, 30), 7), 365);
  v_q    int;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  select count(*) into v_q from public.questionnaire_responses q
    join public.profiles p on p.id = q.user_id and p.status in ('questionnaire_done', 'verified');
  return jsonb_build_object(
    'registrations',        (select count(*) from public.profiles),
    'registrations_week',   (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'verified',             (select count(*) from public.profiles where status = 'verified'),
    'questionnaire_done',   (select count(*) from public.profiles where questionnaire_completed_at is not null),
    'referrals_validated',  (select count(*) from public.point_events where kind = 'referral' and status = 'awarded'),
    'shops_proposed',       (select count(*) from public.shops),
    'shops_to_review',      (select count(*) from public.shops where status = 'proposed'),
    'points_suspended',     (select coalesce(sum(points), 0) from public.point_events where status = 'suspended'),
    'top',                  public.get_top_threshold(),
    'daily',                (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'total', coalesce(s.total, 0), 'referred', coalesce(s.referred, 0)) order by d.day), '[]')
                             from generate_series((now() - make_interval(days => v_days - 1))::date, now()::date, interval '1 day') as d(day)
                             left join (select created_at::date as day, count(*) as total,
                                               count(*) filter (where referred_by is not null) as referred
                                        from public.profiles group by 1) s on s.day = d.day),
    'cities',               (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'members', n) order by n desc), '[]') from (
                               select c.name, count(*) as n from public.profiles p join public.cities c on c.id = p.city_id
                               where p.status = 'verified' group by c.name order by n desc limit 8) x),
    'answers',              jsonb_build_object(
                              'total', v_q,
                              'transfers_interested', (select count(*) from public.questionnaire_responses where interest_transfers in ('very', 'fairly')),
                              'cashback_interested',  (select count(*) from public.questionnaire_responses where interest_cashback in ('very', 'fairly')),
                              'pay_yes',              (select count(*) from public.questionnaire_responses where willing_to_pay = 'yes'),
                              'pay_maybe',            (select count(*) from public.questionnaire_responses where willing_to_pay = 'maybe'),
                              'usage_primary',        (select count(*) from public.questionnaire_responses where usage_intent = 'primary'),
                              'usage_secondary',      (select count(*) from public.questionnaire_responses where usage_intent = 'secondary'))
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Membres (A2, AM3)
-- -----------------------------------------------------------------------------
create or replace function public.member_flags(p_user uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select array_remove(array[
    case when exists (select 1 from auth.users u join public.disposable_email_domains d
                      on d.domain = lower(split_part(u.email, '@', 2)) where u.id = p_user) then 'disposable_email' end,
    case when (select count(*) from public.profiles x join public.profiles me on me.id = p_user
               where x.signup_ip = me.signup_ip and me.signup_ip is not null) >= 3 then 'shared_ip' end,
    case when exists (select 1 from public.point_events where user_id = p_user and status = 'suspended') then 'suspended_points' end
  ], null);
$$;

create or replace function public.admin_list_members(
  p_search  text default null,
  p_status  public.profile_status default null,
  p_city_id uuid default null,
  p_country text default null,
  p_flagged boolean default false,
  p_limit   int default 50,
  p_offset  int default 0
)
returns table (
  id               uuid,
  pseudo           text,
  email            text,
  city             text,
  country_code     text,
  status           public.profile_status,
  points           int,
  referrals        int,
  suspended_points int,
  created_at       timestamptz,
  flags            text[],
  total            bigint
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
  with base as (
    select p.id, p.pseudo::text as pseudo, u.email::text as email, c.name as city, c.country_code::text as country_code,
           p.status, p.created_at,
           coalesce((select sum(e.points) from public.point_events e where e.user_id = p.id and e.status = 'awarded'), 0)::int as points,
           (select count(*) from public.point_events e where e.user_id = p.id and e.kind = 'referral' and e.status = 'awarded')::int as referrals,
           coalesce((select sum(e.points) from public.point_events e where e.user_id = p.id and e.status = 'suspended'), 0)::int as suspended_points,
           public.member_flags(p.id) as flags
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.cities c on c.id = p.city_id
     where (p_search is null or p.pseudo::text ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%')
       and (p_status is null or p.status = p_status)
       and (p_city_id is null or p.city_id = p_city_id)
       and (p_country is null or c.country_code = upper(p_country))
  )
  select b.id, b.pseudo, b.email, b.city, b.country_code, b.status, b.points, b.referrals, b.suspended_points,
         b.created_at, b.flags, count(*) over ()
    from base b
   where not coalesce(p_flagged, false) or b.status = 'suspended' or cardinality(b.flags) > 0
   order by b.created_at desc
   limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_member_detail(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.profiles;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  select * into v from public.profiles where id = p_user;
  if not found then
    raise exception 'user_not_found';
  end if;
  return jsonb_build_object(
    'id', v.id, 'pseudo', v.pseudo::text, 'status', v.status, 'locale', v.locale,
    'email', (select email from auth.users where id = v.id),
    'created_at', v.created_at, 'verified_at', v.verified_at,
    'questionnaire_completed_at', v.questionnaire_completed_at,
    'suspended_at', v.suspended_at, 'suspension_reason', v.suspension_reason,
    'consent_marketing', v.consent_marketing,
    'city', (select jsonb_build_object('name', c.name, 'country_name', c.country_name) from public.cities c where c.id = v.city_id),
    'referrer', public.actor_label(v.referred_by),
    'referral_code', v.referral_code,
    'flags', public.member_flags(v.id),
    'same_ip', (select count(*) - 1 from public.profiles x where x.signup_ip = v.signup_ip and v.signup_ip is not null),
    'points', coalesce((select sum(points) from public.point_events where user_id = v.id and status = 'awarded'), 0),
    'points_suspended', coalesce((select sum(points) from public.point_events where user_id = v.id and status = 'suspended'), 0),
    'questionnaire', (select to_jsonb(q) - 'user_id' from public.questionnaire_responses q where q.user_id = v.id),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'points', e.points, 'status', e.status,
                 'reason', e.reason, 'created_at', e.created_at,
                 'label', case e.kind when 'referral' then public.actor_label(e.source_id)
                                      when 'shop' then (select name from public.shops where id = e.source_id) end)
                 order by e.created_at desc), '[]')
               from public.point_events e where e.user_id = v.id),
    'referees', (select coalesce(jsonb_agg(jsonb_build_object('pseudo', r.pseudo::text, 'status', r.status,
                   'email', (select email from auth.users where id = r.id), 'flags', public.member_flags(r.id))
                   order by r.created_at desc), '[]')
                 from public.profiles r where r.referred_by = v.id),
    'shops', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'status', s.status, 'created_at', s.created_at)
                order by s.created_at desc), '[]')
              from public.shops s where s.proposed_by = v.id)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Commerces (A3) : file de vérification, doublon probable
-- -----------------------------------------------------------------------------
create or replace function public.admin_list_shops(
  p_tab    text default 'review',
  p_search text default null,
  p_limit  int default 50,
  p_offset int default 0
)
returns table (
  id               uuid,
  name             text,
  category         public.shop_category,
  address          text,
  details          text,
  lat              float8,
  lng              float8,
  status           public.shop_status,
  partner_public   boolean,
  cashback_rate    numeric,
  review_note      text,
  city_id          uuid,
  city             text,
  country_name     text,
  proposer_id      uuid,
  proposer         text,
  proposer_city    text,
  created_at       timestamptz,
  votes            int,
  dup_id           uuid,
  dup_name         text,
  dup_address      text,
  dup_distance     int,
  duplicate_of     text,
  total            bigint
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
  with base as (
    select s.*, c.name as city_name, c.country_name as c_country,
           d.id as d_id, d.name as d_name, d.address as d_address, d.dist as d_dist
      from public.shops s
      join public.cities c on c.id = s.city_id
      left join lateral (
        select o.id, o.name, o.address, public.distance_m(o.lat, o.lng, s.lat, s.lng)::int as dist
          from public.shops o
         where o.city_id = s.city_id and o.id <> s.id
           and o.status not in ('rejected', 'duplicate')
           and o.created_at < s.created_at
           and ((extensions.similarity(lower(o.name), lower(s.name)) >= 0.35 and public.distance_m(o.lat, o.lng, s.lat, s.lng) < 150)
             or (extensions.similarity(lower(o.name), lower(s.name)) >= 0.5 and extensions.similarity(lower(o.address), lower(s.address)) >= 0.5)
             or (extensions.similarity(lower(o.name), lower(s.name)) >= 0.8 and public.distance_m(o.lat, o.lng, s.lat, s.lng) < 1000))
         order by extensions.similarity(lower(o.name), lower(s.name)) desc
         limit 1
      ) d on s.status = 'proposed'
     where (p_search is null or s.name ilike '%' || p_search || '%' or s.address ilike '%' || p_search || '%')
       and case coalesce(p_tab, 'review')
             when 'review' then s.status = 'proposed'
             when 'duplicates' then s.status = 'proposed' and d.id is not null
             else true end
  )
  select b.id, b.name, b.category, b.address, b.details, b.lat, b.lng, b.status, b.partner_public, b.cashback_rate,
         b.review_note, b.city_id, b.city_name, b.c_country, b.proposed_by,
         public.actor_label(b.proposed_by),
         (select c2.name from public.profiles p2 join public.cities c2 on c2.id = p2.city_id where p2.id = b.proposed_by),
         b.created_at,
         (select count(*)::int from public.shop_votes v where v.shop_id = b.id),
         b.d_id, b.d_name, b.d_address, b.d_dist,
         (select o.name from public.shops o where o.id = b.duplicate_of),
         count(*) over ()
    from base b
   order by case when b.status = 'proposed' then 0 else 1 end, b.created_at asc
   limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_shop_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'all',        (select count(*) from public.shops),
    'review',     (select count(*) from public.shops where status = 'proposed'),
    'duplicates', (select count(*) from public.admin_list_shops('duplicates', null, 200, 0))
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Points (A4)
-- -----------------------------------------------------------------------------
create or replace function public.admin_list_points(
  p_status public.point_status default null,
  p_search text default null,
  p_limit  int default 50,
  p_offset int default 0
)
returns table (
  id          bigint,
  created_at  timestamptz,
  user_id     uuid,
  member      text,
  kind        public.point_kind,
  label       text,
  points      int,
  status      public.point_status,
  reason      text,
  actor       text,
  changed_at  timestamptz,
  total       bigint
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
  select e.id, e.created_at, e.user_id, public.actor_label(e.user_id), e.kind,
         case e.kind when 'referral' then public.actor_label(e.source_id)
                     when 'shop' then (select sh.name from public.shops sh where sh.id = e.source_id) end,
         e.points, e.status, e.reason,
         public.actor_label(h.actor), h.created_at,
         count(*) over ()
    from public.point_events e
    left join lateral (
      select hh.actor, hh.created_at from public.point_event_history hh
       where hh.event_id = e.id order by hh.created_at desc, hh.id desc limit 1
    ) h on true
   where (p_status is null or e.status = p_status)
     and (p_search is null or public.actor_label(e.user_id) ilike '%' || p_search || '%')
   order by e.created_at desc
   limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end;
$$;

create or replace function public.admin_points_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'awarded',          (select coalesce(sum(points), 0) from public.point_events where status = 'awarded'),
    'suspended',        (select coalesce(sum(points), 0) from public.point_events where status = 'suspended'),
    'suspended_users',  (select count(distinct user_id) from public.point_events where status = 'suspended'),
    'revoked_month',    (select count(*) from public.point_event_history
                          where new_status = 'revoked' and created_at > date_trunc('month', now())),
    'pending',          (select coalesce(sum(points), 0) from public.point_events where status = 'pending'),
    'top',              public.get_top_threshold()
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Journal (A5)
-- -----------------------------------------------------------------------------
create or replace function public.admin_list_audit(p_limit int default 30)
returns table (created_at timestamptz, actor text, action text, target_table text, target text, details jsonb)
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
  select a.created_at, public.actor_label(a.actor), a.action, a.target_table,
         case a.target_table
           when 'profiles' then public.actor_label(a.target_id::uuid)
           when 'shops' then (select name from public.shops where id::text = a.target_id)
           when 'point_events' then (select public.actor_label(user_id) from public.point_events where id::text = a.target_id)
           when 'user_roles' then coalesce(public.actor_label(nullif(a.target_id, '')::uuid), a.details ->> 'email')
           else a.target_id end,
         a.details
    from public.admin_audit_log a
   order by a.created_at desc
   limit least(greatest(p_limit, 1), 200);
end;
$$;

-- -----------------------------------------------------------------------------
-- Équipe (A5) : invitations et rôles
-- -----------------------------------------------------------------------------
create table if not exists public.team_invites (
  email        extensions.citext primary key,
  role         public.app_role not null,
  invited_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
alter table public.team_invites enable row level security;
revoke all on public.team_invites from anon, authenticated;

-- L'invitation est appliquée quand la personne confirme son adresse (lien de connexion).
create or replace function public.apply_team_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.team_invites;
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;
  select * into v_inv from public.team_invites where email = new.email::extensions.citext;
  if found then
    delete from public.user_roles where user_id = new.id;
    insert into public.user_roles (user_id, role, granted_by) values (new.id, v_inv.role, v_inv.invited_by);
    delete from public.team_invites where email = new.email::extensions.citext;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_team_invite on auth.users;
create trigger on_auth_user_team_invite
  after insert or update of email_confirmed_at, email on auth.users
  for each row execute function public.apply_team_invite();

create or replace function public.admin_list_team()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return jsonb_build_object(
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
                  'user_id', r.user_id, 'email', u.email, 'name', public.actor_label(r.user_id), 'role', r.role,
                  'granted_at', r.granted_at, 'granted_by', public.actor_label(r.granted_by),
                  'last_sign_in_at', u.last_sign_in_at, 'me', r.user_id = auth.uid())
                  order by case r.role when 'super_admin' then 1 when 'admin' then 2 else 3 end, r.granted_at), '[]')
                from public.user_roles r join auth.users u on u.id = r.user_id),
    'invites', (select coalesce(jsonb_agg(jsonb_build_object('email', i.email::text, 'role', i.role,
                  'invited_by', public.actor_label(i.invited_by), 'created_at', i.created_at) order by i.created_at desc), '[]')
                from public.team_invites i)
  );
end;
$$;

create or replace function public.admin_invite_member(p_email text, p_role public.app_role)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_user  uuid;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'invalid_email';
  end if;
  select id into v_user from auth.users where lower(email) = v_email and email_confirmed_at is not null;
  if v_user is not null then
    if v_user = auth.uid() then
      raise exception 'cannot_change_self';
    end if;
    delete from public.user_roles where user_id = v_user;
    insert into public.user_roles (user_id, role, granted_by) values (v_user, p_role, auth.uid());
    perform public.log_admin_action('team_grant', 'user_roles', v_user::text, jsonb_build_object('role', p_role, 'email', v_email));
    return 'granted';
  end if;
  insert into public.team_invites (email, role, invited_by) values (v_email, p_role, auth.uid())
  on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by, created_at = now();
  perform public.log_admin_action('team_invite', 'user_roles', '', jsonb_build_object('role', p_role, 'email', v_email));
  return 'invited';
end;
$$;

create or replace function public.admin_set_member_role(p_user uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden';
  end if;
  if p_user = auth.uid() then
    raise exception 'cannot_change_self';
  end if;
  if not exists (select 1 from public.user_roles where user_id = p_user) then
    raise exception 'user_not_found';
  end if;
  delete from public.user_roles where user_id = p_user;
  insert into public.user_roles (user_id, role, granted_by) values (p_user, p_role, auth.uid());
  perform public.log_admin_action('team_role', 'user_roles', p_user::text, jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.admin_remove_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden';
  end if;
  if p_user = auth.uid() then
    raise exception 'cannot_change_self';
  end if;
  delete from public.user_roles where user_id = p_user;
  perform public.log_admin_action('team_remove', 'user_roles', p_user::text, '{}');
end;
$$;

create or replace function public.admin_cancel_invite(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden';
  end if;
  delete from public.team_invites where email = lower(btrim(p_email));
  perform public.log_admin_action('team_invite_cancel', 'user_roles', '', jsonb_build_object('email', lower(btrim(p_email))));
end;
$$;

-- -----------------------------------------------------------------------------
-- Exports (admins)
-- -----------------------------------------------------------------------------
create or replace function public.admin_export_members()
returns table (
  pseudo text, email text, status public.profile_status, city text, country text, points int, referrals int,
  created_at timestamptz, verified_at timestamptz, consent_marketing boolean, referrer text,
  situation text, receive_frequency text, receive_countries text[], send_frequency text, send_countries text[],
  interest_transfers text, local_shop_frequency text, local_shop_spend text, interest_cashback text,
  services text[], willing_to_pay text, usage_intent text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  perform public.log_admin_action('export_members', 'profiles', '', '{}');
  return query
  select p.pseudo::text, u.email::text, p.status, c.name, c.country_name,
         coalesce((select sum(e.points) from public.point_events e where e.user_id = p.id and e.status = 'awarded'), 0)::int,
         (select count(*) from public.point_events e where e.user_id = p.id and e.kind = 'referral' and e.status = 'awarded')::int,
         p.created_at, p.verified_at, p.consent_marketing, public.actor_label(p.referred_by),
         q.situation, q.receive_frequency, q.receive_countries, q.send_frequency, q.send_countries,
         q.interest_transfers, q.local_shop_frequency, q.local_shop_spend, q.interest_cashback,
         q.services, q.willing_to_pay, q.usage_intent
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.cities c on c.id = p.city_id
    left join public.questionnaire_responses q on q.user_id = p.id
   order by p.created_at;
end;
$$;

-- Classement final : le top 2 000 avec tous les ex æquo à la limite
create or replace function public.admin_export_ranking(p_size int default 2000)
returns table (rank bigint, pseudo text, email text, city text, country text, points int, referrals int, shops int, verified_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_threshold int := (public.get_top_threshold(p_size) ->> 'threshold')::int;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  perform public.log_admin_action('export_ranking', 'profiles', '', jsonb_build_object('size', p_size));
  return query
  select r.rank, r.pseudo, u.email::text, c.name, c.country_name, r.points, r.referrals, r.shops, r.verified_at
    from public.member_ranking r
    join auth.users u on u.id = r.id
    left join public.cities c on c.id = r.city_id
   where r.points >= v_threshold
   order by r.rank, r.verified_at;
end;
$$;

-- -----------------------------------------------------------------------------
-- Droits d'appel
-- -----------------------------------------------------------------------------
revoke execute on function
  public.my_staff_role(), public.is_super_admin(), public.actor_label(uuid), public.member_flags(uuid),
  public.admin_overview(int), public.admin_list_members(text, public.profile_status, uuid, text, boolean, int, int),
  public.admin_member_detail(uuid), public.admin_list_shops(text, text, int, int), public.admin_shop_counts(),
  public.admin_list_points(public.point_status, text, int, int), public.admin_points_summary(),
  public.admin_list_audit(int), public.apply_team_invite(), public.admin_list_team(),
  public.admin_invite_member(text, public.app_role), public.admin_set_member_role(uuid, public.app_role),
  public.admin_remove_member(uuid), public.admin_cancel_invite(text),
  public.admin_export_members(), public.admin_export_ranking(int)
from public, anon;

grant execute on function
  public.my_staff_role(),
  public.admin_overview(int), public.admin_list_members(text, public.profile_status, uuid, text, boolean, int, int),
  public.admin_member_detail(uuid), public.admin_list_shops(text, text, int, int), public.admin_shop_counts(),
  public.admin_list_points(public.point_status, text, int, int), public.admin_points_summary(),
  public.admin_list_audit(int), public.admin_list_team(),
  public.admin_invite_member(text, public.app_role), public.admin_set_member_role(uuid, public.app_role),
  public.admin_remove_member(uuid), public.admin_cancel_invite(text),
  public.admin_export_members(), public.admin_export_ranking(int)
to authenticated;
