-- =============================================================================
-- KRISMA · Waitlist — 4 : commerces « Proposé » visibles par tous
--
-- Décision du 2026-11-11 : un commerce proposé (pas encore vérifié par
-- l'équipe) apparaît sur la carte publique en gris « Proposé », et les membres
-- peuvent le soutenir. Les commerces refusés ou marqués doublons restent cachés.
-- Les signatures ne changent pas : les droits d'appel existants sont conservés.
-- =============================================================================

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
   and s.status in ('proposed', 'validated', 'contacted', 'partner', 'cashback_active')
  where p_query is null
     or c.name ilike '%' || p_query || '%'
  group by c.id
  order by count(s.id) desc, c.name
  limit 50;
$$;

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
      when s.status in ('partner', 'cashback_active') and not s.partner_public then 'validated'
      else s.status::text
    end,
    case when s.status = 'cashback_active' and s.partner_public then s.cashback_rate end,
    (select count(*)::int from public.shop_votes v where v.shop_id = s.id),
    exists (select 1 from public.shop_votes v where v.shop_id = s.id and v.user_id = auth.uid()),
    s.proposed_by is not distinct from auth.uid() and auth.uid() is not null
  from public.shops s
  where s.city_id = p_city_id
    and s.status in ('proposed', 'validated', 'contacted', 'partner', 'cashback_active');
$$;

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
                 and status in ('proposed', 'validated', 'contacted', 'partner', 'cashback_active')) then
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
