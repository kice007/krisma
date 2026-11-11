-- =============================================================================
-- KRISMA · Waitlist — 7 : KRISMA Map (phase 5) et export lisible des données
--
-- - get_map_shops : + auteur (pseudo), catégorie déjà là, + informations
-- - ensure_city : enregistre la ville d'un commerce proposé sans changer
--   la ville du membre
-- - propose_shop : le doublon renvoyé n'expose plus le statut interne
--   (un partenariat non public reste affiché « validé »), + catégorie, + vote
-- - export_my_data : noms des villes et des commerces soutenus, pour un
--   export PDF / Excel compréhensible
-- Chaque fonction créée retire d'abord le droit d'appel à PUBLIC / anon
-- (voir migration 6).
-- =============================================================================

drop function if exists public.get_map_shops(uuid);

create function public.get_map_shops(p_city_id uuid)
returns table (
  id             uuid,
  name           text,
  category       public.shop_category,
  address        text,
  details        text,
  lat            float8,
  lng            float8,
  public_status  text,
  cashback_rate  numeric,
  votes          int,
  voted          boolean,
  mine           boolean,
  proposer       text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id, s.name, s.category, s.address, s.details, s.lat, s.lng,
    case
      when s.status in ('partner', 'cashback_active') and not s.partner_public then 'validated'
      else s.status::text
    end,
    case when s.status = 'cashback_active' and s.partner_public then s.cashback_rate end,
    (select count(*)::int from public.shop_votes v where v.shop_id = s.id),
    exists (select 1 from public.shop_votes v where v.shop_id = s.id and v.user_id = auth.uid()),
    s.proposed_by is not distinct from auth.uid() and auth.uid() is not null,
    (select p.pseudo::text from public.profiles p where p.id = s.proposed_by and p.status = 'verified')
  from public.shops s
  where s.city_id = p_city_id
    and s.status in ('proposed', 'validated', 'contacted', 'partner', 'cashback_active');
$$;

revoke execute on function public.get_map_shops(uuid) from public;
grant execute on function public.get_map_shops(uuid) to anon, authenticated;

-- Ville d'un commerce proposé (recherche OpenStreetMap), sans toucher au profil
create or replace function public.ensure_city(
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
  v_city uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'verified') then
    raise exception 'not_verified';
  end if;
  insert into public.cities (source, source_ref, name, admin_area, country_code, country_name, lat, lng)
  values ('osm', p_source_ref, btrim(p_name), p_admin_area, upper(p_country_code), p_country_name, p_lat, p_lng)
  on conflict (source, source_ref) do update set name = excluded.name
  returning id into v_city;
  return v_city;
end;
$$;

revoke execute on function public.ensure_city(text, text, text, text, float8, float8, text) from public, anon;
grant execute on function public.ensure_city(text, text, text, text, float8, float8, text) to authenticated;

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
    select s.id, s.name, s.address, s.category,
           case
             when s.status in ('partner', 'cashback_active') and not s.partner_public then 'validated'
             else s.status::text
           end as public_status,
           case when s.status = 'cashback_active' and s.partner_public then s.cashback_rate end as cashback_rate,
           (select count(*) from public.shop_votes v where v.shop_id = s.id) as votes,
           exists (select 1 from public.shop_votes v where v.shop_id = s.id and v.user_id = v_uid) as voted
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
                                   'category', v_dup.category, 'public_status', v_dup.public_status,
                                   'cashback_rate', v_dup.cashback_rate, 'votes', v_dup.votes,
                                   'voted', v_dup.voted)
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

-- Export RGPD lisible (PDF / Excel générés côté navigateur)
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'account',       (select jsonb_build_object('email', email, 'created_at', created_at) from auth.users where id = auth.uid()),
    'profile',       (select to_jsonb(p) - 'signup_ip'
                              || jsonb_build_object('city_name', c.name, 'country_name', c.country_name,
                                                    'referrer', (select pseudo::text from public.profiles where id = p.referred_by))
                      from public.profiles p left join public.cities c on c.id = p.city_id
                      where p.id = auth.uid()),
    'questionnaire', (select to_jsonb(q) from public.questionnaire_responses q where user_id = auth.uid()),
    'points',        (select coalesce(jsonb_agg(to_jsonb(e) || jsonb_build_object('label', case e.kind
                                 when 'referral' then (select pseudo::text from public.profiles where id = e.source_id)
                                 when 'shop' then (select name from public.shops where id = e.source_id) end)
                               order by e.created_at), '[]')
                      from public.point_events e where e.user_id = auth.uid()),
    'shops',         (select coalesce(jsonb_agg(jsonb_build_object('name', s.name, 'category', s.category, 'address', s.address,
                                 'city', c.name, 'status', s.status, 'created_at', s.created_at) order by s.created_at), '[]')
                      from public.shops s left join public.cities c on c.id = s.city_id
                      where s.proposed_by = auth.uid()),
    'votes',         (select coalesce(jsonb_agg(jsonb_build_object('shop', s.name, 'city', c.name, 'created_at', v.created_at)
                                 order by v.created_at), '[]')
                      from public.shop_votes v join public.shops s on s.id = v.shop_id
                      left join public.cities c on c.id = s.city_id
                      where v.user_id = auth.uid())
  );
$$;
