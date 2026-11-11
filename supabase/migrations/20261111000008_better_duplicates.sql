-- =============================================================================
-- KRISMA · Waitlist — 8 : détection des doublons plus large
--
-- Cas réel (2026-11-11) : le même restaurant proposé deux fois avec la même
-- adresse, mais des repères placés à la main à ~190 m l'un de l'autre. La
-- règle « nom proche à moins de 80 m » ne l'a pas vu. Est maintenant
-- considéré comme doublon possible, dans la même ville et hors fiches
-- refusées / doublons :
--   - nom proche (similarité ≥ 0,35) à moins de 150 m ;
--   - nom proche (≥ 0,5) et adresse texte proche (≥ 0,5), quelle que soit la distance ;
--   - nom quasi identique (≥ 0,8) à moins de 1 km.
-- Le membre peut toujours confirmer « ce n'est pas le même commerce ».
-- =============================================================================

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
    select c.*
      into v_dup
      from (
        select s.id, s.name, s.address, s.category,
               case
                 when s.status in ('partner', 'cashback_active') and not s.partner_public then 'validated'
                 else s.status::text
               end as public_status,
               case when s.status = 'cashback_active' and s.partner_public then s.cashback_rate end as cashback_rate,
               (select count(*) from public.shop_votes v where v.shop_id = s.id) as votes,
               exists (select 1 from public.shop_votes v where v.shop_id = s.id and v.user_id = v_uid) as voted,
               extensions.similarity(lower(s.name), lower(p_name)) as name_sim,
               extensions.similarity(lower(s.address), lower(coalesce(p_address, ''))) as addr_sim,
               public.distance_m(s.lat, s.lng, p_lat, p_lng) as dist
          from public.shops s
         where s.city_id = p_city_id
           and s.status not in ('rejected', 'duplicate')
      ) c
     where (c.name_sim >= 0.35 and c.dist < 150)
        or (c.name_sim >= 0.5 and c.addr_sim >= 0.5)
        or (c.name_sim >= 0.8 and c.dist < 1000)
     order by c.name_sim desc, c.dist asc
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
