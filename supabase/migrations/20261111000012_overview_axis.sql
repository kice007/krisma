-- =============================================================================
-- KRISMA · Waitlist — 12 : axe des inscriptions par jour (vue d'ensemble admin)
--
-- L'axe commence au premier jour de la campagne (à gauche) tant que celle-ci
-- est plus jeune que la période choisie ; les jours à venir sont renvoyés vides
-- (« future »). Ensuite, il montre les derniers jours comme avant.
-- La signature ne change pas : les droits d'appel sont conservés.
-- =============================================================================

create or replace function public.admin_overview(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days int := least(greatest(coalesce(p_days, 30), 7), 365);
  v_q    int;
  -- Début de l'axe : premier jour de la campagne tant qu'elle est plus jeune que la période
  v_start date := greatest(
    coalesce((select min(created_at)::date from public.profiles), now()::date),
    now()::date - (v_days - 1));
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
    'daily',                (select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'total', coalesce(s.total, 0), 'referred', coalesce(s.referred, 0), 'future', d.day::date > now()::date) order by d.day), '[]')
                             from generate_series(v_start, v_start + (v_days - 1), interval '1 day') as d(day)
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
