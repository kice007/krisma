-- Migration 16 : pays d'origine (pays de naissance) des membres.
-- - nouvelle colonne questionnaire_responses.origin_country (code ISO à 2 lettres) ;
-- - demandée à l'étape 1 du questionnaire (save_questionnaire) ;
-- - modifiable par le membre, même après validation (set_my_origin_country),
--   pour que les inscrits d'avant la question puissent la renseigner ;
-- - statistique admin : admin_questionnaire_stats() renvoie origin_country et origin_missing.
-- Non obligatoire côté serveur (complete_questionnaire inchangé) : les anciens
-- questionnaires restent valides ; l'interface la rend obligatoire.

alter table public.questionnaire_responses
  add column origin_country text
  constraint origin_country_iso check (origin_country is null or origin_country ~ '^[A-Z]{2}$');

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
    usage_intent         = case when a ? 'usage_intent'         then a ->> 'usage_intent'         else usage_intent end,
    origin_country       = case when a ? 'origin_country'       then nullif(upper(a ->> 'origin_country'), '') else origin_country end
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
                             'willing_to_pay', 'usage_intent', 'origin_country'] loop
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

  -- Pays d'origine non renseigné (membres inscrits avant la question)
  select v || jsonb_build_object('origin_missing', (
    select count(*) from public.profiles p
    left join public.questionnaire_responses q on q.user_id = p.id
    where p.status = 'verified' and q.origin_country is null)) into v;

  return v;
end;
$$;

-- Le membre renseigne ou corrige son pays d'origine (tous statuts sauf suspendu).
create or replace function public.set_my_origin_country(p_country text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cc  text := nullif(upper(trim(coalesce(p_country, ''))), '');
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and status <> 'suspended') then
    raise exception 'forbidden';
  end if;
  if v_cc is null or v_cc !~ '^[A-Z]{2}$' then
    raise exception 'invalid_answer';
  end if;
  insert into public.questionnaire_responses (user_id, origin_country) values (v_uid, v_cc)
  on conflict (user_id) do update set origin_country = excluded.origin_country;
end;
$$;

revoke execute on function public.set_my_origin_country(text) from public, anon;
grant execute on function public.set_my_origin_country(text) to authenticated;

-- Lecture de son propre pays d'origine (espace membre).
create or replace function public.get_my_origin_country()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select q.origin_country from public.questionnaire_responses q where q.user_id = auth.uid();
$$;

revoke execute on function public.get_my_origin_country() from public, anon;
grant execute on function public.get_my_origin_country() to authenticated;
