-- =============================================================================
-- KRISMA · Waitlist — 5 : espace membre (phase 4)
--
-- - préférence « Points et parrainages » (e-mails de suivi, respectée par
--   l'envoi des e-mails en phase 7)
-- - tableau de bord enrichi : e-mail, date de validation, ville complète,
--   préférences, rang d'il y a 7 jours (« +312 places cette semaine »)
-- - changement de pseudo, réglages, suppression du compte (RGPD)
-- - nombre de membres d'un classement (général ou par ville)
-- =============================================================================

alter table public.profiles
  add column if not exists notify_points boolean not null default true;

-- Rang qu'avait un membre il y a p_days jours (points déjà attribués à cette date).
-- null si le membre n'était pas encore validé.
create or replace function public.rank_at(p_user uuid, p_at timestamptz)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  with past as (
    select p.id,
           coalesce(sum(e.points) filter (where e.status = 'awarded' and e.created_at <= p_at), 0) as pts
    from public.profiles p
    left join public.point_events e on e.user_id = p.id
    where p.status = 'verified' and p.verified_at <= p_at
    group by p.id
  )
  select r::int from (select id, rank() over (order by pts desc) as r from past) x where id = p_user;
$$;

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
    -- le lien de parrainage n'existe qu'une fois l'inscription validée
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
                              end
                            ) order by e.created_at desc), '[]')
                          from public.point_events e where e.user_id = v_uid)
  );
end;
$$;

-- Nombre de membres classés (général ou d'une ville)
create or replace function public.get_leaderboard_meta(p_city_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('members', count(*))
  from public.member_totals
  where p_city_id is null or city_id = p_city_id;
$$;

-- Changer de pseudo (libre mais unique)
create or replace function public.update_my_pseudo(p_pseudo text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_pseudo !~ '^[A-Za-z0-9._-]{3,20}$' then
    raise exception 'pseudo_invalid';
  end if;
  begin
    update public.profiles set pseudo = p_pseudo where id = v_uid;
  exception when unique_violation then
    raise exception 'pseudo_taken';
  end;
  if not found then
    raise exception 'registration_not_started';
  end if;
  return p_pseudo;
end;
$$;

-- Réglages du profil : langue, e-mails de suivi, actualités (null = inchangé)
create or replace function public.update_my_settings(
  p_locale            text default null,
  p_notify_points     boolean default null,
  p_consent_marketing boolean default null
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
    notify_points        = coalesce(p_notify_points, notify_points),
    consent_marketing    = coalesce(p_consent_marketing, consent_marketing),
    consent_marketing_at = case when p_consent_marketing is not null then now() else consent_marketing_at end
  where id = auth.uid();
end;
$$;

-- Suppression définitive du compte (RGPD). Les points de parrainage gagnés par
-- le parrain grâce à ce compte sont annulés : un compte supprimé puis recréé
-- ne peut pas rapporter deux fois. Les commerces proposés restent sur la carte
-- sans auteur.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  update public.point_events
     set status = 'revoked'
   where kind = 'referral' and source_id = v_uid and status <> 'revoked';
  delete from auth.users where id = v_uid;
end;
$$;

-- Droits d'appel
revoke execute on function public.rank_at(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.get_leaderboard_meta(uuid) to anon, authenticated;
grant execute on function
  public.update_my_pseudo(text),
  public.update_my_settings(text, boolean, boolean),
  public.delete_my_account()
to authenticated;
