-- =============================================================================
-- KRISMA · Waitlist — 14 : règles corrigées le 13/11/2026
--
-- 1. Un membre ne propose et ne vote que pour les commerces de SA ville
--    (celle du questionnaire). Retirer un ancien vote reste possible.
-- 2. Un vote rapporte 5 points, attribués tout de suite :
--    - retirer son vote retire les 5 points (revoked), revoter les rend ;
--    - le soutien automatique de l'auteur à son propre commerce ne rapporte rien
--      (il touche déjà les 20 points de la proposition) ;
--    - si le commerce est refusé ou classé doublon, les points de ses votes sont
--      retirés ; ils reviennent si l'équipe annule ce statut.
--    source_id d'un vote = md5(shop_id:user_id) → unicité (kind, source_id) gardée.
-- 3. Classement strict : à points égaux, le premier membre validé (verified_at)
--    passe devant. Il y a donc exactement 2 000 membres dans le top 2 000.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Registre des points : type « vote » et lien vers le commerce
-- -----------------------------------------------------------------------------
alter table public.point_events
  add column if not exists shop_id uuid references public.shops (id) on delete set null;
create index if not exists point_events_shop_idx on public.point_events (shop_id) where shop_id is not null;

alter table public.point_events drop constraint if exists fixed_points;
alter table public.point_events add constraint fixed_points check (
  (kind = 'signup' and points = 170) or
  (kind = 'referral' and points = 50) or
  (kind = 'shop' and points = 20) or
  (kind = 'vote' and points = 5)
);

create or replace function public.vote_source_id(p_shop uuid, p_user uuid)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select md5(p_shop::text || ':' || p_user::text)::uuid;
$$;
revoke execute on function public.vote_source_id(uuid, uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Classement strict (ex æquo départagés par la date de validation)
-- -----------------------------------------------------------------------------
create or replace view public.member_ranking as
select t.*, row_number() over (order by t.points desc, t.verified_at asc, t.id) as rank
from public.member_totals t;
revoke all on public.member_ranking from anon, authenticated;

create or replace function public.rank_at(p_user uuid, p_at timestamptz)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  with past as (
    select p.id, p.verified_at,
           coalesce(sum(e.points) filter (where e.status = 'awarded' and e.created_at <= p_at), 0) as pts
    from public.profiles p
    left join public.point_events e on e.user_id = p.id
    where p.status = 'verified' and p.verified_at <= p_at
    group by p.id
  )
  select r::int from (
    select id, row_number() over (order by pts desc, verified_at asc, id) as r from past
  ) x where id = p_user;
$$;

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
    row_number() over (order by t.points desc, t.verified_at asc, t.id) as rank,
    t.pseudo,
    c.name,
    t.points,
    t.referrals,
    t.shops,
    t.id = auth.uid()
  from public.member_totals t
  left join public.cities c on c.id = t.city_id
  where p_city_id is null or t.city_id = p_city_id
  order by t.points desc, t.verified_at asc, t.id
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
$$;

-- -----------------------------------------------------------------------------
-- Vote : ville du membre + 5 points
-- -----------------------------------------------------------------------------
create or replace function public.toggle_shop_vote(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_city  uuid;
  v_shop  public.shops;
  v_voted boolean;
  v_src   uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select city_id into v_city from public.profiles where id = v_uid and status = 'verified';
  if not found then
    raise exception 'not_verified';
  end if;
  select * into v_shop from public.shops where id = p_shop_id
     and status in ('proposed', 'validated', 'contacted', 'partner', 'cashback_active');
  if not found then
    raise exception 'shop_not_found';
  end if;

  v_src := public.vote_source_id(p_shop_id, v_uid);

  delete from public.shop_votes where shop_id = p_shop_id and user_id = v_uid;
  if found then
    v_voted := false;
    update public.point_events
       set status = 'revoked', reason = 'Vote retiré'
     where kind = 'vote' and source_id = v_src and status = 'awarded';
  else
    if v_city is null or v_shop.city_id <> v_city then
      raise exception 'not_my_city';
    end if;
    insert into public.shop_votes (shop_id, user_id) values (p_shop_id, v_uid);
    v_voted := true;
    if v_shop.proposed_by is distinct from v_uid then
      insert into public.point_events (user_id, kind, source_id, shop_id, points, status, awarded_at)
      values (v_uid, 'vote', v_src, p_shop_id, 5, 'awarded', now())
      on conflict (kind, source_id) do update
        set status = 'awarded', awarded_at = now(), reason = null
        where public.point_events.status = 'revoked';
    end if;
  end if;

  return jsonb_build_object(
    'voted', v_voted,
    'votes', (select count(*) from public.shop_votes where shop_id = p_shop_id)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Proposition : ville du membre uniquement (reprend la version 9)
-- -----------------------------------------------------------------------------
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
  v_city   uuid;
  v_dup    record;
  v_shop   uuid;
  v_recent int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  select city_id into v_city from public.profiles where id = v_uid and status = 'verified';
  if not found then
    raise exception 'not_verified';
  end if;
  if not exists (select 1 from public.cities where id = p_city_id) then
    raise exception 'unknown_city';
  end if;
  if v_city is null or p_city_id <> v_city then
    raise exception 'not_my_city';
  end if;

  -- Garde-fou contre le spam (le nombre de commerces récompensés n'est pas plafonné)
  select count(*) into v_recent from public.shops
  where proposed_by = v_uid and created_at > now() - interval '24 hours';
  if v_recent >= 30 then
    raise exception 'rate_limited';
  end if;

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
   order by (c.name_sim >= 0.8 and (c.addr_sim >= 0.8 or c.dist < 50)) desc, c.name_sim desc, c.dist asc
   limit 1;

  if found then
    -- Doublon exact : jamais enregistré, même en forçant
    if (v_dup.name_sim >= 0.8 and (v_dup.addr_sim >= 0.8 or v_dup.dist < 50)) or not coalesce(p_force, false) then
      return jsonb_build_object(
        'result', 'duplicate_candidate',
        'shop', jsonb_build_object('id', v_dup.id, 'name', v_dup.name, 'address', v_dup.address,
                                   'category', v_dup.category, 'public_status', v_dup.public_status,
                                   'cashback_rate', v_dup.cashback_rate, 'votes', v_dup.votes,
                                   'voted', v_dup.voted,
                                   'blocked', v_dup.name_sim >= 0.8 and (v_dup.addr_sim >= 0.8 or v_dup.dist < 50))
      );
    end if;
  end if;

  insert into public.shops (name, category, address, city_id, lat, lng, details, proposed_by)
  values (btrim(p_name), p_category, btrim(p_address), p_city_id, p_lat, p_lng, nullif(btrim(p_details), ''), v_uid)
  returning id into v_shop;

  -- +20 en attente, attribués à la validation par l'équipe
  insert into public.point_events (user_id, kind, source_id, shop_id, points, status)
  values (v_uid, 'shop', v_shop, v_shop, 20, 'pending');

  -- l'auteur soutient d'office son commerce (sans points de vote)
  insert into public.shop_votes (shop_id, user_id) values (v_shop, v_uid);

  return jsonb_build_object('result', 'created', 'shop_id', v_shop);
end;
$$;

-- -----------------------------------------------------------------------------
-- Commerce refusé ou doublon : les points de ses votes sont retirés (et rendus
-- si l'équipe revient sur ce statut)
-- -----------------------------------------------------------------------------
create or replace function public.shop_status_vote_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('rejected', 'duplicate') and old.status not in ('rejected', 'duplicate') then
    update public.point_events
       set status = 'revoked', reason = 'Commerce refusé'
     where kind = 'vote' and shop_id = new.id and status = 'awarded';
  elsif old.status in ('rejected', 'duplicate') and new.status not in ('rejected', 'duplicate') then
    update public.point_events e
       set status = 'awarded', awarded_at = now(), reason = null
     where e.kind = 'vote' and e.shop_id = new.id and e.status = 'revoked' and e.reason = 'Commerce refusé'
       and exists (select 1 from public.shop_votes v where v.shop_id = new.id and v.user_id = e.user_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.shop_status_vote_points() from public, anon, authenticated;

drop trigger if exists shops_vote_points on public.shops;
create trigger shops_vote_points after update of status on public.shops
  for each row execute function public.shop_status_vote_points();

-- -----------------------------------------------------------------------------
-- Libellés « vote » dans le tableau de bord et l'export (reprend la version 5)
-- -----------------------------------------------------------------------------
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
    'pseudo',            v_profile.pseudo::text,
    'status',            v_profile.status,
    'locale',            v_profile.locale,
    'email',             (select email from auth.users where id = v_uid),
    'verified_at',       v_profile.verified_at,
    'consent_marketing', v_profile.consent_marketing,
    'notify_points',     v_profile.notify_points,
    'city',              (select jsonb_build_object('id', c.id, 'name', c.name, 'country_code', c.country_code,
                                                    'country_name', c.country_name, 'admin_area', c.admin_area)
                          from public.cities c where c.id = v_profile.city_id),
    'referral_code',     case when v_profile.status = 'verified' then v_profile.referral_code end,
    'points',            coalesce(v_rank.points, 0),
    'pending_points',    coalesce(v_rank.pending_points,
                           (select coalesce(sum(points), 0) from public.point_events
                            where user_id = v_uid and status = 'pending')),
    'rank',              v_rank.rank,
    'rank_week_ago',     case when v_rank.rank is not null then public.rank_at(v_uid, now() - interval '7 days') end,
    'breakdown',         (select coalesce(jsonb_object_agg(kind, total), '{}') from (
                            select kind, sum(points) as total from public.point_events
                            where user_id = v_uid and status = 'awarded' group by kind) s),
    'top',               public.get_top_threshold(),
    'referees',          (select coalesce(jsonb_agg(jsonb_build_object(
                              'pseudo', r.pseudo::text,
                              'status', case
                                when e.status = 'awarded' then 'awarded'
                                when e.status = 'suspended' then 'under_review'
                                when e.status = 'revoked' then 'revoked'
                                when r.status = 'verified' then 'verified'
                                else 'pending_email' end
                            ) order by r.created_at desc), '[]')
                          from public.profiles r
                          left join public.point_events e on e.kind = 'referral' and e.source_id = r.id
                          where r.referred_by = v_uid),
    'shops',             (select coalesce(jsonb_agg(jsonb_build_object(
                              'id', s.id, 'name', s.name, 'category', s.category,
                              'city', (select name from public.cities where id = s.city_id),
                              'status', s.status, 'points_status', e.status
                            ) order by s.created_at desc), '[]')
                          from public.shops s
                          left join public.point_events e on e.kind = 'shop' and e.source_id = s.id
                          where s.proposed_by = v_uid),
    'history',           (select coalesce(jsonb_agg(jsonb_build_object(
                              'kind', e.kind, 'points', e.points, 'status', e.status,
                              'created_at', e.created_at,
                              'label', case e.kind
                                when 'referral' then (select pseudo::text from public.profiles where id = e.source_id)
                                when 'shop' then (select name from public.shops where id = e.source_id)
                                when 'vote' then (select name from public.shops where id = e.shop_id)
                              end
                            ) order by e.created_at desc), '[]')
                          from public.point_events e where e.user_id = v_uid)
  );
end;
$$;

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
                                 when 'shop' then (select name from public.shops where id = e.source_id)
                                 when 'vote' then (select name from public.shops where id = e.shop_id) end)
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

-- -----------------------------------------------------------------------------
-- Données existantes (base de test) : points des votes déjà faits, hors
-- soutien automatique de l'auteur et hors commerces refusés ou doublons
-- -----------------------------------------------------------------------------
insert into public.point_events (user_id, kind, source_id, shop_id, points, status, awarded_at, reason)
select v.user_id, 'vote', public.vote_source_id(v.shop_id, v.user_id), v.shop_id, 5,
       case when s.status in ('rejected', 'duplicate') then 'revoked' else 'awarded' end::public.point_status,
       v.created_at,
       case when s.status in ('rejected', 'duplicate') then 'Commerce refusé' end
  from public.shop_votes v
  join public.shops s on s.id = v.shop_id
  join public.profiles p on p.id = v.user_id and p.status = 'verified'
 where s.proposed_by is distinct from v.user_id
on conflict (kind, source_id) do nothing;

-- Lien commerce pour les points de proposition déjà enregistrés
update public.point_events set shop_id = source_id where kind = 'shop' and shop_id is null;
