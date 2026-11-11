-- =============================================================================
-- KRISMA · Waitlist — 2/3 : logique (points, parrainage, commerces, RPC)
--
-- Règle d'or : les points ne sont attribués que par ces fonctions, côté serveur,
-- après validation. Le navigateur n'écrit jamais directement dans les tables.
-- Les erreurs renvoient un code court (ex. « pseudo_taken ») que l'interface
-- traduit en FR / EN.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rôles et contexte
-- -----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- IP du client transmise par l'API Supabase (null si indisponible)
create or replace function public.request_ip()
returns inet
language plpgsql
stable
set search_path = ''
as $$
declare
  h json;
  v text;
begin
  h := nullif(current_setting('request.headers', true), '')::json;
  v := btrim(split_part(coalesce(h ->> 'cf-connecting-ip', h ->> 'x-forwarded-for', ''), ',', 1));
  if v = '' then
    return null;
  end if;
  return v::inet;
exception when others then
  return null;
end;
$$;

-- Distance en mètres entre deux points (formule de haversine)
create or replace function public.distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function public.log_admin_action(p_action text, p_table text, p_id text, p_details jsonb default '{}')
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_log (actor, action, target_table, target_id, details)
  values (auth.uid(), p_action, p_table, p_id, coalesce(p_details, '{}'));
$$;

-- -----------------------------------------------------------------------------
-- Historique automatique des statuts de points
-- -----------------------------------------------------------------------------
create or replace function public.point_events_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.point_event_history (event_id, old_status, new_status, actor, reason)
    values (new.id, null, new.status, auth.uid(), new.reason);
  elsif new.status is distinct from old.status then
    insert into public.point_event_history (event_id, old_status, new_status, actor, reason)
    values (new.id, old.status, new.status, auth.uid(), new.reason);
  end if;
  return new;
end;
$$;

create trigger point_events_history_ins after insert on public.point_events
  for each row execute function public.point_events_history();
create trigger point_events_history_upd after update of status on public.point_events
  for each row execute function public.point_events_history();

-- -----------------------------------------------------------------------------
-- Totaux et classement (vues internes, non exposées à l'API)
-- Égalité : rank() donne le même rang aux ex æquo ; « rang ≤ 2000 » inclut donc
-- tous les ex æquo à la limite du top 2 000.
-- -----------------------------------------------------------------------------
create view public.member_totals as
select
  p.id,
  p.pseudo::text as pseudo,
  p.city_id,
  p.verified_at,
  coalesce(sum(e.points) filter (where e.status = 'awarded'), 0)::int        as points,
  coalesce(sum(e.points) filter (where e.status = 'pending'), 0)::int        as pending_points,
  count(*) filter (where e.kind = 'referral' and e.status = 'awarded')::int as referrals,
  count(*) filter (where e.kind = 'shop' and e.status = 'awarded')::int     as shops
from public.profiles p
left join public.point_events e on e.user_id = p.id
where p.status = 'verified'
group by p.id;

create view public.member_ranking as
select t.*, rank() over (order by t.points desc) as rank
from public.member_totals t;

-- -----------------------------------------------------------------------------
-- Anti-fraude du parrainage
-- -----------------------------------------------------------------------------
create or replace function public.referral_is_suspicious(p_referrer uuid, p_referee uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_referrer_ip inet;
  v_referee_ip  inet;
  v_domain      text;
  v_same_ip     int;
begin
  select signup_ip into v_referrer_ip from public.profiles where id = p_referrer;
  select signup_ip into v_referee_ip  from public.profiles where id = p_referee;
  select lower(split_part(email, '@', 2)) into v_domain from auth.users where id = p_referee;

  -- E-mail jetable
  if exists (select 1 from public.disposable_email_domains where domain = v_domain) then
    return true;
  end if;

  -- Même connexion que le parrain
  if v_referee_ip is not null and v_referee_ip = v_referrer_ip then
    return true;
  end if;

  -- 3 filleuls ou plus depuis la même IP en 24 h
  if v_referee_ip is not null then
    select count(*) into v_same_ip
    from public.profiles
    where referred_by = p_referrer
      and signup_ip = v_referee_ip
      and created_at > now() - interval '24 hours';
    if v_same_ip >= 3 then
      return true;
    end if;
  end if;

  return false;
end;
$$;

-- -----------------------------------------------------------------------------
-- Validation de l'inscription : questionnaire terminé + e-mail vérifié
-- Appelée par le trigger sur auth.users et à la fin du questionnaire,
-- quel que soit l'ordre des deux événements. Idempotente.
-- -----------------------------------------------------------------------------
create or replace function public.finalize_registration(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile    public.profiles;
  v_confirmed  timestamptz;
  v_referrer   public.profiles;
  v_status     public.point_status;
begin
  select * into v_profile from public.profiles where id = p_user for update;
  if not found or v_profile.status <> 'questionnaire_done' then
    return false;
  end if;

  select email_confirmed_at into v_confirmed from auth.users where id = p_user;
  if v_confirmed is null then
    return false;
  end if;

  update public.profiles
     set status = 'verified', verified_at = now()
   where id = p_user;

  -- +170 points, une seule fois
  insert into public.point_events (user_id, kind, source_id, points, status, awarded_at)
  values (p_user, 'signup', p_user, 170, 'awarded', now())
  on conflict (kind, source_id) do nothing;

  insert into public.email_outbox (user_id, template, payload)
  values (p_user, 'welcome', jsonb_build_object('points', 170, 'pseudo', v_profile.pseudo::text));

  -- +50 points pour le parrain, s'il est lui-même vérifié
  if v_profile.referred_by is not null then
    select * into v_referrer from public.profiles where id = v_profile.referred_by;
    if found and v_referrer.status = 'verified' then
      v_status := case
        when public.referral_is_suspicious(v_referrer.id, p_user) then 'suspended'
        else 'awarded'
      end;

      insert into public.point_events (user_id, kind, source_id, points, status, awarded_at, reason)
      values (
        v_referrer.id, 'referral', p_user, 50, v_status,
        case when v_status = 'awarded' then now() end,
        case when v_status = 'suspended' then 'Contrôle anti-fraude automatique' end
      )
      on conflict (kind, source_id) do nothing;

      if v_status = 'awarded' then
        insert into public.email_outbox (user_id, template, payload)
        values (v_referrer.id, 'referral_awarded',
                jsonb_build_object('points', 50, 'referee', v_profile.pseudo::text));
      end if;
    end if;
  end if;

  return true;
end;
$$;

-- Déclenché quand Supabase Auth confirme l'adresse e-mail
create or replace function public.on_auth_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    perform public.finalize_registration(new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.on_auth_user_email_confirmed();

-- =============================================================================
-- RPC publiques — parcours d'inscription
-- =============================================================================

-- Le pseudo est-il libre ? (accessible sans être connecté)
create or replace function public.check_pseudo_available(p_pseudo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_pseudo ~ '^[A-Za-z0-9._-]{3,20}$'
     and not exists (
       select 1 from public.profiles
       where lower(pseudo::text) = lower(p_pseudo) and id is distinct from auth.uid()
     );
$$;

-- Infos publiques d'un code de parrainage (bandeau « Invité·e par… »)
create or replace function public.get_referrer(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('pseudo', pseudo::text)
  from public.profiles
  where referral_code = upper(btrim(p_code)) and status = 'verified';
$$;

-- Étape 2 : crée (ou modifie tant que non validé) l'inscription de l'utilisateur
-- connecté. Côté front : session anonyme Supabase (signInAnonymously) puis cet appel.
create or replace function public.start_registration(
  p_pseudo              text,
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
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if coalesce(p_accept_rules, false) is false then
    raise exception 'rules_not_accepted';
  end if;
  if p_pseudo !~ '^[A-Za-z0-9._-]{3,20}$' then
    raise exception 'pseudo_invalid';
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

  begin
    insert into public.profiles (
      id, pseudo, locale, referred_by, consent_rules_at,
      consent_marketing, consent_marketing_at, signup_ip
    )
    values (
      v_uid, p_pseudo, p_locale, v_referrer, now(),
      coalesce(p_consent_marketing, false),
      case when p_consent_marketing then now() end,
      public.request_ip()
    )
    on conflict (id) do update set
      pseudo               = excluded.pseudo,
      locale               = excluded.locale,
      -- un filleul ne peut avoir qu'un seul parrain : on garde le premier
      referred_by          = coalesce(public.profiles.referred_by, excluded.referred_by),
      consent_marketing    = excluded.consent_marketing,
      consent_marketing_at = excluded.consent_marketing_at;
  exception when unique_violation then
    raise exception 'pseudo_taken';
  end;

  return jsonb_build_object(
    'pseudo', p_pseudo,
    'referred', v_referrer is not null or v_existing.referred_by is not null
  );
end;
$$;

-- Q1 : enregistre la ville choisie dans les suggestions OpenStreetMap
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

  insert into public.cities (source, source_ref, name, admin_area, country_code, country_name, lat, lng)
  values ('osm', p_source_ref, btrim(p_name), p_admin_area, upper(p_country_code), p_country_name, p_lat, p_lng)
  on conflict (source, source_ref) do update set name = excluded.name
  returning id into v_city;

  update public.profiles set city_id = v_city where id = v_uid;
  return v_city;
end;
$$;

-- Enregistre une ou plusieurs réponses (sauvegarde à chaque étape).
-- p_answers : { "situation": "employee", "receive_frequency": "monthly",
--               "receive_countries": ["CI","SN"], ... }
create or replace function public.save_questionnaire(p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_status public.profile_status;
  a        jsonb := coalesce(p_answers, '{}');
  -- convertit un tableau JSON en text[] en majuscules
  v_recv   text[];
  v_send   text[];
  v_serv   text[];
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select status into v_status from public.profiles where id = v_uid;
  if not found then
    raise exception 'registration_not_started';
  end if;
  if v_status in ('verified', 'suspended') then
    raise exception 'questionnaire_locked';
  end if;

  if a ? 'receive_countries' then
    select coalesce(array_agg(distinct upper(x)), '{}') into v_recv from jsonb_array_elements_text(a -> 'receive_countries') x;
  end if;
  if a ? 'send_countries' then
    select coalesce(array_agg(distinct upper(x)), '{}') into v_send from jsonb_array_elements_text(a -> 'send_countries') x;
  end if;
  if a ? 'services' then
    select coalesce(array_agg(distinct x), '{}') into v_serv from jsonb_array_elements_text(a -> 'services') x;
    -- « Tous ces services » est exclusif
    if 'all' = any(v_serv) then
      v_serv := array['all'];
    end if;
  end if;

  insert into public.questionnaire_responses (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.questionnaire_responses set
    situation            = case when a ? 'situation'            then a ->> 'situation'            else situation end,
    receive_frequency    = case when a ? 'receive_frequency'    then a ->> 'receive_frequency'    else receive_frequency end,
    receive_countries    = case when a ? 'receive_countries'    then v_recv                       else receive_countries end,
    send_frequency       = case when a ? 'send_frequency'       then a ->> 'send_frequency'       else send_frequency end,
    send_countries       = case when a ? 'send_countries'       then v_send                       else send_countries end,
    interest_transfers   = case when a ? 'interest_transfers'   then a ->> 'interest_transfers'   else interest_transfers end,
    local_shop_frequency = case when a ? 'local_shop_frequency' then a ->> 'local_shop_frequency' else local_shop_frequency end,
    local_shop_spend     = case when a ? 'local_shop_spend'     then a ->> 'local_shop_spend'     else local_shop_spend end,
    interest_cashback    = case when a ? 'interest_cashback'    then a ->> 'interest_cashback'    else interest_cashback end,
    services             = case when a ? 'services'             then v_serv                       else services end,
    willing_to_pay       = case when a ? 'willing_to_pay'       then a ->> 'willing_to_pay'       else willing_to_pay end,
    usage_intent         = case when a ? 'usage_intent'         then a ->> 'usage_intent'         else usage_intent end
  where user_id = v_uid;

  -- Sous-questions conditionnelles : pas de pays si « Jamais »
  update public.questionnaire_responses set
    receive_countries = case when receive_frequency = 'never' then '{}' else receive_countries end,
    send_countries    = case when send_frequency    = 'never' then '{}' else send_countries end
  where user_id = v_uid;
exception when check_violation then
  raise exception 'invalid_answer';
end;
$$;

-- Fin du questionnaire : vérifie que tout est rempli, puis valide l'inscription
-- si l'e-mail est déjà confirmé. Renvoie la liste des questions manquantes sinon.
create or replace function public.complete_questionnaire()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles;
  q          public.questionnaire_responses;
  v_missing  text[] := '{}';
  v_verified boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'registration_not_started';
  end if;
  if v_profile.status in ('verified', 'suspended') then
    return jsonb_build_object('status', v_profile.status);
  end if;

  select * into q from public.questionnaire_responses where user_id = v_uid;

  if v_profile.city_id is null then v_missing := v_missing || 'q1'::text; end if;
  if q.situation is null then v_missing := v_missing || 'q2'::text; end if;
  if q.receive_frequency is null
     or (q.receive_frequency <> 'never' and cardinality(q.receive_countries) = 0) then
    v_missing := v_missing || 'q3'::text;
  end if;
  if q.send_frequency is null
     or (q.send_frequency <> 'never' and cardinality(q.send_countries) = 0) then
    v_missing := v_missing || 'q4'::text;
  end if;
  if q.interest_transfers is null then v_missing := v_missing || 'q5'::text; end if;
  if q.local_shop_frequency is null then v_missing := v_missing || 'q6'::text; end if;
  if q.local_shop_spend is null then v_missing := v_missing || 'q7'::text; end if;
  if q.interest_cashback is null then v_missing := v_missing || 'q8'::text; end if;
  if q.services is null or cardinality(q.services) = 0 then v_missing := v_missing || 'q9'::text; end if;
  if q.willing_to_pay is null then v_missing := v_missing || 'q10'::text; end if;
  if q.usage_intent is null then v_missing := v_missing || 'q11'::text; end if;

  if cardinality(v_missing) > 0 then
    return jsonb_build_object('status', 'incomplete', 'missing', to_jsonb(v_missing));
  end if;

  update public.profiles
     set status = 'questionnaire_done', questionnaire_completed_at = now()
   where id = v_uid;

  v_verified := public.finalize_registration(v_uid);

  return jsonb_build_object(
    'status', case when v_verified then 'verified' else 'awaiting_email' end
  );
end;
$$;

-- =============================================================================
-- RPC — espace membre
-- =============================================================================

-- Seuil du top 2 000 (points du dernier rang retenu) et nombre de membres éligibles
create or replace function public.get_top_threshold(p_size int default 2000)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'threshold', coalesce(min(points), 0),
    'eligible',  count(*),
    'members',   (select count(*) from public.member_totals)
  )
  from public.member_ranking
  where rank <= p_size;
$$;

-- Tout ce qu'affiche le tableau de bord, en un seul appel
create or replace function public.get_my_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_rank    public.member_ranking;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    return jsonb_build_object('status', 'none');
  end if;

  select * into v_rank from public.member_ranking where id = v_uid;

  return jsonb_build_object(
    'pseudo',        v_profile.pseudo::text,
    'status',        v_profile.status,
    'locale',        v_profile.locale,
    'city',          (select jsonb_build_object('id', c.id, 'name', c.name, 'country_code', c.country_code)
                      from public.cities c where c.id = v_profile.city_id),
    -- le lien de parrainage n'existe qu'une fois l'inscription validée
    'referral_code', case when v_profile.status = 'verified' then v_profile.referral_code end,
    'points',        coalesce(v_rank.points, 0),
    'pending_points',coalesce(v_rank.pending_points,
                       (select coalesce(sum(points), 0) from public.point_events
                        where user_id = v_uid and status = 'pending')),
    'rank',          v_rank.rank,
    'breakdown',     (select coalesce(jsonb_object_agg(kind, total), '{}') from (
                        select kind, sum(points) as total from public.point_events
                        where user_id = v_uid and status = 'awarded' group by kind) s),
    'top',           public.get_top_threshold(),
    'referees',      (select coalesce(jsonb_agg(jsonb_build_object(
                          'pseudo', r.pseudo::text,
                          'status', case
                            when e.status = 'awarded' then 'awarded'
                            when e.status = 'suspended' then 'under_review'
                            when r.status = 'verified' then 'verified'
                            else 'pending_email' end
                        ) order by r.created_at desc), '[]')
                      from public.profiles r
                      left join public.point_events e on e.kind = 'referral' and e.source_id = r.id
                      where r.referred_by = v_uid),
    'shops',         (select coalesce(jsonb_agg(jsonb_build_object(
                          'id', s.id, 'name', s.name, 'category', s.category,
                          'status', s.status, 'points_status', e.status
                        ) order by s.created_at desc), '[]')
                      from public.shops s
                      left join public.point_events e on e.kind = 'shop' and e.source_id = s.id
                      where s.proposed_by = v_uid),
    'history',       (select coalesce(jsonb_agg(jsonb_build_object(
                          'kind', e.kind, 'points', e.points, 'status', e.status,
                          'created_at', e.created_at,
                          'label', case e.kind
                            when 'referral' then (select pseudo::text from public.profiles where id = e.source_id)
                            when 'shop' then (select name from public.shops where id = e.source_id)
                          end
                        ) order by e.created_at desc), '[]')
                      from public.point_events e where e.user_id = v_uid)
  );
end;
$$;

-- Classement public (pseudos uniquement). p_city_id : classement de la ville.
create or replace function public.get_leaderboard(
  p_city_id uuid default null,
  p_limit   int default 50,
  p_offset  int default 0
)
returns table (
  rank       bigint,
  pseudo     text,
  city       text,
  points     int,
  referrals  int,
  shops      int,
  is_me      boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    rank() over (order by t.points desc) as rank,
    t.pseudo,
    c.name,
    t.points,
    t.referrals,
    t.shops,
    t.id = auth.uid()
  from public.member_totals t
  left join public.cities c on c.id = t.city_id
  where p_city_id is null or t.city_id = p_city_id
  order by t.points desc, t.verified_at asc
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
$$;

-- =============================================================================
-- RPC — KRISMA Map
-- =============================================================================

-- Villes qui ont des commerces visibles (sélecteur de ville + recherche)
create or replace function public.get_map_cities(p_query text default null)
returns table (
  id            uuid,
  name          text,
  country_code  text,
  country_name  text,
  lat           float8,
  lng           float8,
  shops         int,
  partners      int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.name, c.country_code::text, c.country_name, c.lat, c.lng,
    count(s.id)::int,
    count(s.id) filter (where s.status in ('partner', 'cashback_active') and s.partner_public)::int
  from public.cities c
  join public.shops s on s.city_id = c.id
   and s.status in ('validated', 'contacted', 'partner', 'cashback_active')
  where p_query is null
     or c.name ilike '%' || p_query || '%'
  group by c.id
  order by count(s.id) desc, c.name
  limit 50;
$$;

-- Commerces d'une ville, avec leur statut PUBLIC.
-- Un commerce simplement proposé n'est visible que par son auteur ; un
-- partenariat n'est affiché que si le commerçant a donné son accord.
create or replace function public.get_map_shops(p_city_id uuid)
returns table (
  id             uuid,
  name           text,
  category       public.shop_category,
  address        text,
  lat            float8,
  lng            float8,
  public_status  text,
  cashback_rate  numeric,
  votes          int,
  voted          boolean,
  mine           boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id, s.name, s.category, s.address, s.lat, s.lng,
    case
      when s.status = 'proposed' then 'proposed'
      when s.status in ('partner', 'cashback_active') and not s.partner_public then 'validated'
      else s.status::text
    end,
    case when s.status = 'cashback_active' and s.partner_public then s.cashback_rate end,
    (select count(*)::int from public.shop_votes v where v.shop_id = s.id),
    exists (select 1 from public.shop_votes v where v.shop_id = s.id and v.user_id = auth.uid()),
    s.proposed_by is not distinct from auth.uid() and auth.uid() is not null
  from public.shops s
  where s.city_id = p_city_id
    and (
      s.status in ('validated', 'contacted', 'partner', 'cashback_active')
      or (s.status = 'proposed' and s.proposed_by = auth.uid())
    );
$$;

-- Proposer un commerce. Si une fiche proche porte un nom semblable, renvoie
-- « duplicate_candidate » sans rien créer (l'utilisateur peut la soutenir) ;
-- p_force = true crée quand même la fiche (l'équipe tranchera).
create or replace function public.propose_shop(
  p_name      text,
  p_category  public.shop_category,
  p_address   text,
  p_city_id   uuid,
  p_lat       float8,
  p_lng       float8,
  p_details   text default null,
  p_force     boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_dup    record;
  v_shop   uuid;
  v_recent int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and status = 'verified') then
    raise exception 'not_verified';
  end if;
  if not exists (select 1 from public.cities where id = p_city_id) then
    raise exception 'unknown_city';
  end if;

  -- Garde-fou contre le spam (le nombre de commerces récompensés n'est pas plafonné)
  select count(*) into v_recent from public.shops
  where proposed_by = v_uid and created_at > now() - interval '24 hours';
  if v_recent >= 30 then
    raise exception 'rate_limited';
  end if;

  if not coalesce(p_force, false) then
    select s.id, s.name, s.address, s.status,
           (select count(*) from public.shop_votes v where v.shop_id = s.id) as votes
      into v_dup
      from public.shops s
     where s.city_id = p_city_id
       and s.status not in ('rejected', 'duplicate')
       and public.distance_m(s.lat, s.lng, p_lat, p_lng) < 80
       and extensions.similarity(lower(s.name), lower(p_name)) >= 0.35
     order by extensions.similarity(lower(s.name), lower(p_name)) desc
     limit 1;

    if found then
      return jsonb_build_object(
        'result', 'duplicate_candidate',
        'shop', jsonb_build_object('id', v_dup.id, 'name', v_dup.name, 'address', v_dup.address,
                                   'status', v_dup.status, 'votes', v_dup.votes)
      );
    end if;
  end if;

  insert into public.shops (name, category, address, city_id, lat, lng, details, proposed_by)
  values (btrim(p_name), p_category, btrim(p_address), p_city_id, p_lat, p_lng, nullif(btrim(p_details), ''), v_uid)
  returning id into v_shop;

  -- +20 en attente, attribués à la validation par l'équipe
  insert into public.point_events (user_id, kind, source_id, points, status)
  values (v_uid, 'shop', v_shop, 20, 'pending');

  -- l'auteur soutient d'office son commerce
  insert into public.shop_votes (shop_id, user_id) values (v_shop, v_uid);

  return jsonb_build_object('result', 'created', 'shop_id', v_shop);
end;
$$;

-- Voter / retirer son vote (sert aussi à « soutenir » un commerce existant)
create or replace function public.toggle_shop_vote(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_voted boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and status = 'verified') then
    raise exception 'not_verified';
  end if;
  if not exists (select 1 from public.shops where id = p_shop_id
                 and status in ('validated', 'contacted', 'partner', 'cashback_active')) then
    raise exception 'shop_not_found';
  end if;

  delete from public.shop_votes where shop_id = p_shop_id and user_id = v_uid;
  if found then
    v_voted := false;
  else
    insert into public.shop_votes (shop_id, user_id) values (p_shop_id, v_uid);
    v_voted := true;
  end if;

  return jsonb_build_object(
    'voted', v_voted,
    'votes', (select count(*) from public.shop_votes where shop_id = p_shop_id)
  );
end;
$$;

-- =============================================================================
-- RPC — profil et RGPD
-- =============================================================================
create or replace function public.update_my_preferences(
  p_locale             text default null,
  p_consent_marketing  boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  update public.profiles set
    locale               = case when p_locale in ('fr', 'en') then p_locale else locale end,
    consent_marketing    = coalesce(p_consent_marketing, consent_marketing),
    consent_marketing_at = case when p_consent_marketing is not null then now() else consent_marketing_at end
  where id = auth.uid();
end;
$$;

-- Export de toutes les données du membre (droit d'accès RGPD)
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'account',       (select jsonb_build_object('email', email, 'created_at', created_at) from auth.users where id = auth.uid()),
    'profile',       (select to_jsonb(p) - 'signup_ip' from public.profiles p where id = auth.uid()),
    'questionnaire', (select to_jsonb(q) from public.questionnaire_responses q where user_id = auth.uid()),
    'points',        (select coalesce(jsonb_agg(to_jsonb(e)), '[]') from public.point_events e where user_id = auth.uid()),
    'shops',         (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.shops s where proposed_by = auth.uid()),
    'votes',         (select coalesce(jsonb_agg(shop_id), '[]') from public.shop_votes where user_id = auth.uid())
  );
$$;
-- La suppression de compte passe par une Edge Function (clé service_role) qui
-- supprime l'utilisateur Auth : tout le reste suit par « on delete cascade ».

-- =============================================================================
-- RPC — administration (réservées à l'équipe)
-- =============================================================================

-- Modération d'une proposition : validate | reject | duplicate
create or replace function public.admin_review_shop(
  p_shop_id       uuid,
  p_decision      text,
  p_note          text default null,
  p_duplicate_of  uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop public.shops;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  select * into v_shop from public.shops where id = p_shop_id for update;
  if not found then
    raise exception 'shop_not_found';
  end if;
  if v_shop.status <> 'proposed' then
    raise exception 'already_reviewed';
  end if;

  if p_decision = 'validate' then
    update public.shops
       set status = 'validated', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
     where id = p_shop_id;

    -- +20 points, seulement si l'auteur est toujours un membre vérifié
    update public.point_events
       set status = 'awarded', awarded_at = now(), reason = null
     where kind = 'shop' and source_id = p_shop_id and status = 'pending'
       and exists (select 1 from public.profiles where id = user_id and status = 'verified');

    if found then
      insert into public.email_outbox (user_id, template, payload)
      values (v_shop.proposed_by, 'shop_validated',
              jsonb_build_object('points', 20, 'shop', v_shop.name, 'shop_id', v_shop.id));
    end if;

  elsif p_decision = 'reject' then
    update public.shops
       set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
     where id = p_shop_id;
    update public.point_events
       set status = 'revoked', reason = coalesce(p_note, 'Proposition refusée')
     where kind = 'shop' and source_id = p_shop_id;

  elsif p_decision = 'duplicate' then
    if p_duplicate_of is null or p_duplicate_of = p_shop_id
       or not exists (select 1 from public.shops where id = p_duplicate_of) then
      raise exception 'duplicate_target_required';
    end if;
    update public.shops
       set status = 'duplicate', duplicate_of = p_duplicate_of,
           reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
     where id = p_shop_id;
    -- les soutiens sont reportés sur la fiche d'origine
    insert into public.shop_votes (shop_id, user_id, created_at)
    select p_duplicate_of, user_id, created_at from public.shop_votes where shop_id = p_shop_id
    on conflict do nothing;
    update public.point_events
       set status = 'revoked', reason = 'Doublon'
     where kind = 'shop' and source_id = p_shop_id;
  else
    raise exception 'invalid_decision';
  end if;

  perform public.log_admin_action('shop_' || p_decision, 'shops', p_shop_id::text,
    jsonb_build_object('note', p_note, 'duplicate_of', p_duplicate_of));
end;
$$;

-- Suivi commercial : contacted → partner → cashback_active
create or replace function public.admin_set_shop_status(
  p_shop_id         uuid,
  p_status          public.shop_status,
  p_partner_public  boolean default null,
  p_cashback_rate   numeric default null
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
  if p_status not in ('validated', 'contacted', 'partner', 'cashback_active') then
    raise exception 'invalid_status';
  end if;
  update public.shops set
    status         = p_status,
    partner_public = coalesce(p_partner_public, partner_public),
    cashback_rate  = coalesce(p_cashback_rate, cashback_rate)
  where id = p_shop_id
    and status in ('validated', 'contacted', 'partner', 'cashback_active');
  if not found then
    raise exception 'shop_not_found';
  end if;
  perform public.log_admin_action('shop_status', 'shops', p_shop_id::text,
    jsonb_build_object('status', p_status, 'partner_public', p_partner_public, 'cashback_rate', p_cashback_rate));
end;
$$;

-- Corriger une attribution : awarded | suspended | revoked (motif obligatoire)
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
  if not public.is_staff() then
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

-- Suspendre / rétablir un membre (il disparaît du classement pendant la suspension)
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
  if not public.is_staff() then
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

-- Liste des membres avec e-mail (admin uniquement)
create or replace function public.admin_list_users(
  p_search  text default null,
  p_status  public.profile_status default null,
  p_city_id uuid default null,
  p_flagged boolean default false,
  p_limit   int default 50,
  p_offset  int default 0
)
returns table (
  id               uuid,
  pseudo           text,
  email            text,
  city             text,
  status           public.profile_status,
  points           int,
  referrals        int,
  suspended_points int,
  created_at       timestamptz
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
  select
    p.id, p.pseudo::text, u.email::text, c.name, p.status,
    coalesce(sum(e.points) filter (where e.status = 'awarded'), 0)::int,
    count(e.id) filter (where e.kind = 'referral' and e.status = 'awarded')::int,
    coalesce(sum(e.points) filter (where e.status = 'suspended'), 0)::int,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.cities c on c.id = p.city_id
  left join public.point_events e on e.user_id = p.id
  where (p_search is null or p.pseudo::text ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%')
    and (p_status is null or p.status = p_status)
    and (p_city_id is null or p.city_id = p_city_id)
  group by p.id, u.email, c.name
  having not p_flagged
      or p.status = 'suspended'
      or count(e.id) filter (where e.status = 'suspended') > 0
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 500)
  offset greatest(p_offset, 0);
end;
$$;

-- Indicateurs de la vue d'ensemble
create or replace function public.admin_overview()
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
    'registrations',        (select count(*) from public.profiles),
    'verified',             (select count(*) from public.profiles where status = 'verified'),
    'questionnaire_done',   (select count(*) from public.profiles where questionnaire_completed_at is not null),
    'referrals_validated',  (select count(*) from public.point_events where kind = 'referral' and status = 'awarded'),
    'shops_proposed',       (select count(*) from public.shops),
    'shops_to_review',      (select count(*) from public.shops where status = 'proposed'),
    'points_suspended',     (select coalesce(sum(points), 0) from public.point_events where status = 'suspended'),
    'top',                  public.get_top_threshold(),
    'daily',                (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'total', total, 'referred', referred) order by d), '[]')
                             from (select date_trunc('day', created_at)::date as d, count(*) as total,
                                          count(*) filter (where referred_by is not null) as referred
                                   from public.profiles
                                   where created_at > now() - interval '30 days'
                                   group by 1) s)
  );
end;
$$;

-- Suivi ville par ville (déploiement de KRISMA Partners)
create or replace function public.admin_city_stats()
returns table (
  city_id          uuid,
  city             text,
  country_code     text,
  members          int,
  shops_proposed   int,
  shops_validated  int,
  votes            int,
  partners         int,
  cashback_active  int,
  top_category     public.shop_category
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
  select
    c.id, c.name, c.country_code::text,
    (select count(*)::int from public.profiles p where p.city_id = c.id and p.status = 'verified'),
    (select count(*)::int from public.shops s where s.city_id = c.id),
    (select count(*)::int from public.shops s where s.city_id = c.id and s.status in ('validated', 'contacted', 'partner', 'cashback_active')),
    (select count(*)::int from public.shop_votes v join public.shops s on s.id = v.shop_id where s.city_id = c.id),
    (select count(*)::int from public.shops s where s.city_id = c.id and s.status in ('partner', 'cashback_active')),
    (select count(*)::int from public.shops s where s.city_id = c.id and s.status = 'cashback_active'),
    (select s.category from public.shops s where s.city_id = c.id and s.status not in ('rejected', 'duplicate')
      group by s.category order by count(*) desc limit 1)
  from public.cities c
  order by 4 desc;
end;
$$;

-- Répartition des réponses au questionnaire (membres vérifiés)
create or replace function public.admin_questionnaire_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v    jsonb := '{}';
  part jsonb;
  col  text;
begin
  if not public.is_staff() then
    raise exception 'forbidden';
  end if;
  foreach col in array array['situation', 'receive_frequency', 'send_frequency', 'interest_transfers',
                             'local_shop_frequency', 'local_shop_spend', 'interest_cashback',
                             'willing_to_pay', 'usage_intent'] loop
    execute format(
      'select coalesce(jsonb_object_agg(k, n), ''{}'') from (
         select q.%I as k, count(*) as n
         from public.questionnaire_responses q
         join public.profiles p on p.id = q.user_id and p.status = ''verified''
         where q.%I is not null group by 1) s', col, col)
    into part;
    v := v || jsonb_build_object(col, part);
  end loop;

  -- Q9 (plusieurs réponses) et pays cités en Q3 / Q4
  select v || jsonb_build_object(
    'services', (select coalesce(jsonb_object_agg(k, n), '{}') from (
                  select unnest(q.services) as k, count(*) as n
                  from public.questionnaire_responses q
                  join public.profiles p on p.id = q.user_id and p.status = 'verified'
                  group by 1) s),
    'receive_countries', (select coalesce(jsonb_object_agg(k, n), '{}') from (
                  select unnest(q.receive_countries) as k, count(*) as n
                  from public.questionnaire_responses q
                  join public.profiles p on p.id = q.user_id and p.status = 'verified'
                  group by 1) s),
    'send_countries', (select coalesce(jsonb_object_agg(k, n), '{}') from (
                  select unnest(q.send_countries) as k, count(*) as n
                  from public.questionnaire_responses q
                  join public.profiles p on p.id = q.user_id and p.status = 'verified'
                  group by 1) s)
  ) into v;

  return v;
end;
$$;
