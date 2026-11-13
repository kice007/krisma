-- =============================================================================
-- KRISMA · Waitlist — 15 : prénom et nom à la place du pseudo, chiffres publics
--
-- - profiles.first_name / last_name (obligatoires à l'inscription).
-- - profiles.pseudo devient le NOM PUBLIC calculé « Prénom N. » (trigger) :
--   plus d'unicité ni de format libre. Toutes les fonctions qui lisaient
--   pseudo affichent donc « Awa K. » sans autre changement.
-- - start_registration(p_first_name, p_last_name, …) remplace la version pseudo ;
--   update_my_name remplace update_my_pseudo ; check_pseudo_available supprimée.
-- - Admin : nom complet dans la liste, la fiche et l'export ; recherche par nom.
-- - get_public_stats() : inscrits validés, validés aujourd'hui, pays, 5 derniers
--   inscrits (« Prénom N. », sans ville). Lisible par tous.
-- =============================================================================

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;

alter table public.profiles drop constraint if exists profiles_pseudo_key;
alter table public.profiles drop constraint if exists profiles_pseudo_check;

alter table public.profiles add constraint profiles_first_name_check
  check (first_name is null or char_length(first_name) between 1 and 60);
alter table public.profiles add constraint profiles_last_name_check
  check (last_name is null or char_length(last_name) between 1 and 60);

-- Nettoie un prénom ou un nom : espaces superflus retirés.
create or replace function public.clean_person_name(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'), '');
$$;

-- Vrai si le nom ne contient que des lettres, espaces, tirets ou apostrophes.
create or replace function public.is_person_name(p text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p is not null and char_length(p) between 1 and 60
     and p ~ '^[[:alpha:]][[:alpha:] ''’.-]*$';
$$;

-- Nom public : « Prénom N. »
create or replace function public.public_name(p_first text, p_last text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(coalesce(p_first, '') || ' ' || coalesce(upper(left(p_last, 1)) || '.', ''));
$$;

create or replace function public.profiles_public_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.first_name is not null then
    new.pseudo := public.public_name(new.first_name, new.last_name);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_public_name on public.profiles;
create trigger profiles_public_name before insert or update of first_name, last_name on public.profiles
  for each row execute function public.profiles_public_name();

revoke execute on function public.clean_person_name(text), public.is_person_name(text),
  public.public_name(text, text), public.profiles_public_name() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Inscription
-- -----------------------------------------------------------------------------
drop function if exists public.check_pseudo_available(text);
drop function if exists public.start_registration(text, boolean, boolean, text, text);
drop function if exists public.update_my_pseudo(text);

create or replace function public.start_registration(
  p_first_name          text,
  p_last_name           text,
  p_accept_rules        boolean,
  p_consent_marketing   boolean default false,
  p_locale              text default 'fr',
  p_referral_code       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_existing  public.profiles;
  v_referrer  uuid;
  v_first     text := public.clean_person_name(p_first_name);
  v_last      text := public.clean_person_name(p_last_name);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if coalesce(p_accept_rules, false) is false then
    raise exception 'rules_not_accepted';
  end if;
  if not public.is_person_name(v_first) then
    raise exception 'first_name_invalid';
  end if;
  if not public.is_person_name(v_last) then
    raise exception 'last_name_invalid';
  end if;
  if p_locale not in ('fr', 'en') then
    p_locale := 'fr';
  end if;

  select * into v_existing from public.profiles where id = v_uid;
  if found and v_existing.status in ('verified', 'suspended') then
    raise exception 'already_registered';
  end if;

  if p_referral_code is not null and btrim(p_referral_code) <> '' then
    select id into v_referrer
    from public.profiles
    where referral_code = upper(btrim(p_referral_code))
      and status = 'verified'
      and id <> v_uid;
  end if;

  insert into public.profiles (
    id, pseudo, first_name, last_name, locale, referred_by, consent_rules_at,
    consent_marketing, consent_marketing_at, signup_ip
  )
  values (
    v_uid, public.public_name(v_first, v_last), v_first, v_last, p_locale, v_referrer, now(),
    coalesce(p_consent_marketing, false),
    case when p_consent_marketing then now() end,
    public.request_ip()
  )
  on conflict (id) do update set
    first_name           = excluded.first_name,
    last_name            = excluded.last_name,
    locale               = excluded.locale,
    -- un filleul ne peut avoir qu'un seul parrain : on garde le premier
    referred_by          = coalesce(public.profiles.referred_by, excluded.referred_by),
    consent_marketing    = excluded.consent_marketing,
    consent_marketing_at = excluded.consent_marketing_at;

  return jsonb_build_object(
    'pseudo', public.public_name(v_first, v_last),
    'first_name', v_first,
    'referred', v_referrer is not null or v_existing.referred_by is not null
  );
end;
$$;

create or replace function public.update_my_name(p_first_name text, p_last_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_first text := public.clean_person_name(p_first_name);
  v_last  text := public.clean_person_name(p_last_name);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_person_name(v_first) then
    raise exception 'first_name_invalid';
  end if;
  if not public.is_person_name(v_last) then
    raise exception 'last_name_invalid';
  end if;
  update public.profiles set first_name = v_first, last_name = v_last where id = v_uid;
  if not found then
    raise exception 'registration_not_started';
  end if;
  return public.public_name(v_first, v_last);
end;
$$;

revoke execute on function public.start_registration(text, text, boolean, boolean, text, text),
  public.update_my_name(text, text) from public, anon;
grant execute on function public.start_registration(text, text, boolean, boolean, text, text),
  public.update_my_name(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Chiffres publics (compteur en direct)
-- -----------------------------------------------------------------------------
create or replace function public.get_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'members',   (select count(*) from public.profiles where status = 'verified'),
    'today',     (select count(*) from public.profiles where status = 'verified'
                    and verified_at >= date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'),
    'countries', (select count(distinct c.country_code) from public.profiles p
                    join public.cities c on c.id = p.city_id where p.status = 'verified'),
    'latest',    (select coalesce(jsonb_agg(jsonb_build_object('name', x.pseudo, 'at', x.verified_at) order by x.verified_at desc), '[]')
                    from (select pseudo::text as pseudo, verified_at from public.profiles
                          where status = 'verified' order by verified_at desc limit 5) x)
  );
$$;
revoke execute on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Tableau de bord : prénom et nom en plus (pour le profil)
-- -----------------------------------------------------------------------------
create or replace function public.get_my_name()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('first_name', first_name, 'last_name', last_name, 'public_name', pseudo::text)
  from public.profiles where id = auth.uid();
$$;
revoke execute on function public.get_my_name() from public, anon;
grant execute on function public.get_my_name() to authenticated;

-- -----------------------------------------------------------------------------
-- Admin : nom complet (reprend la version 10)
-- -----------------------------------------------------------------------------
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
    select p.id, coalesce(nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.pseudo::text) as pseudo, u.email::text as email, c.name as city, c.country_code::text as country_code,
           p.status, p.created_at,
           coalesce((select sum(e.points) from public.point_events e where e.user_id = p.id and e.status = 'awarded'), 0)::int as points,
           (select count(*) from public.point_events e where e.user_id = p.id and e.kind = 'referral' and e.status = 'awarded')::int as referrals,
           coalesce((select sum(e.points) from public.point_events e where e.user_id = p.id and e.status = 'suspended'), 0)::int as suspended_points,
           public.member_flags(p.id) as flags
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.cities c on c.id = p.city_id
     where (p_search is null or p.pseudo::text ilike '%' || p_search || '%' or btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%')
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
    'id', v.id, 'pseudo', v.pseudo::text, 'first_name', v.first_name, 'last_name', v.last_name, 'status', v.status, 'locale', v.locale,
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
  select coalesce(nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.pseudo::text), u.email::text, p.status, c.name, c.country_name,
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

-- -----------------------------------------------------------------------------
-- Mot de passe : l'e-mail n'est vérifié qu'une fois (lien), puis le membre se
-- connecte avec son mot de passe. On garde la date de création du mot de passe
-- pour savoir s'il reste à le choisir.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists password_set_at timestamptz;

create or replace function public.mark_password_set()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  update public.profiles set password_set_at = now() where id = auth.uid();
end;
$$;
revoke execute on function public.mark_password_set() from public, anon;
grant execute on function public.mark_password_set() to authenticated;

create or replace function public.get_my_name()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('first_name', first_name, 'last_name', last_name, 'public_name', pseudo::text,
                            'password_set', password_set_at is not null)
  from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Ville verrouillée après la validation (sinon on pourrait voter dans plusieurs
-- villes en changeant de ville). Reprend la version 2.
-- -----------------------------------------------------------------------------
create or replace function public.set_my_city(
  p_source_ref    text,
  p_name          text,
  p_country_code  text,
  p_country_name  text,
  p_lat           float8,
  p_lng           float8,
  p_admin_area    text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_city  uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'registration_not_started';
  end if;
  -- La ville vote et propose : elle est fixée une fois l'inscription validée.
  if exists (select 1 from public.profiles where id = v_uid and status in ('verified', 'suspended') and city_id is not null) then
    raise exception 'city_locked';
  end if;

  insert into public.cities (source, source_ref, name, admin_area, country_code, country_name, lat, lng)
  values ('osm', p_source_ref, btrim(p_name), p_admin_area, upper(p_country_code), p_country_name, p_lat, p_lng)
  on conflict (source, source_ref) do update set name = excluded.name
  returning id into v_city;

  update public.profiles set city_id = v_city where id = v_uid;
  return v_city;
end;
$$;
