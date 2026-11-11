-- =============================================================================
-- KRISMA · Waitlist — 3/3 : sécurité (RLS, droits d'appel)
--
-- Principe : lecture limitée à ses propres données (ou à tout pour l'équipe),
-- AUCUNE écriture directe depuis le navigateur. Toutes les écritures passent
-- par les fonctions RPC de la migration 2, qui contrôlent les règles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RLS : activée partout
-- -----------------------------------------------------------------------------
alter table public.cities                   enable row level security;
alter table public.profiles                 enable row level security;
alter table public.questionnaire_responses  enable row level security;
alter table public.shops                    enable row level security;
alter table public.shop_votes               enable row level security;
alter table public.point_events             enable row level security;
alter table public.point_event_history      enable row level security;
alter table public.user_roles               enable row level security;
alter table public.admin_audit_log          enable row level security;
alter table public.email_outbox             enable row level security;
alter table public.disposable_email_domains enable row level security;

-- Villes : publiques (noms de villes, aucune donnée personnelle)
create policy cities_read on public.cities
  for select to anon, authenticated using (true);

-- Profil : le sien, ou tous pour l'équipe
create policy profiles_read on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_staff());

create policy questionnaire_read on public.questionnaire_responses
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- Commerces : la carte publique passe par get_map_shops() ; en direct, on ne
-- voit que ses propositions (ou tout pour l'équipe)
create policy shops_read on public.shops
  for select to authenticated using (proposed_by = auth.uid() or public.is_staff());

create policy shop_votes_read on public.shop_votes
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

create policy point_events_read on public.point_events
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

create policy point_event_history_read on public.point_event_history
  for select to authenticated using (public.is_staff());

create policy user_roles_read on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

create policy admin_audit_log_read on public.admin_audit_log
  for select to authenticated using (public.is_admin());

create policy email_outbox_read on public.email_outbox
  for select to authenticated using (public.is_admin());

create policy disposable_domains_read on public.disposable_email_domains
  for select to authenticated using (public.is_staff());

-- Aucune politique INSERT / UPDATE / DELETE : les écritures directes sont refusées.
-- La clé service_role (Edge Functions) contourne la RLS pour l'envoi d'e-mails.

-- -----------------------------------------------------------------------------
-- Droits sur les tables et vues
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.profiles, public.questionnaire_responses, public.shops,
                public.shop_votes, public.point_events, public.point_event_history,
                public.user_roles, public.admin_audit_log, public.email_outbox,
                public.disposable_email_domains
  to authenticated;

-- Vues de calcul internes : jamais exposées à l'API
revoke all on public.member_totals, public.member_ranking from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Droits d'appel des fonctions
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

-- Utilisées par les politiques RLS
grant execute on function public.is_staff(), public.is_admin() to authenticated;

-- Accessibles sans être connecté : page waitlist, carte publique
grant execute on function
  public.check_pseudo_available(text),
  public.get_referrer(text),
  public.get_top_threshold(int),
  public.get_leaderboard(uuid, int, int),
  public.get_map_cities(text),
  public.get_map_shops(uuid)
to anon, authenticated;

-- Membres (y compris la session anonyme créée au début de l'inscription)
grant execute on function
  public.start_registration(text, boolean, boolean, text, text),
  public.set_my_city(text, text, text, text, float8, float8, text),
  public.save_questionnaire(jsonb),
  public.complete_questionnaire(),
  public.get_my_dashboard(),
  public.propose_shop(text, public.shop_category, text, uuid, float8, float8, text, boolean),
  public.toggle_shop_vote(uuid),
  public.update_my_preferences(text, boolean),
  public.export_my_data()
to authenticated;

-- Administration : appelables par un membre connecté, mais chaque fonction
-- refuse l'accès (« forbidden ») si l'utilisateur n'a pas de rôle d'équipe.
grant execute on function
  public.admin_review_shop(uuid, text, text, uuid),
  public.admin_set_shop_status(uuid, public.shop_status, boolean, numeric),
  public.admin_set_point_status(bigint, public.point_status, text),
  public.admin_set_user_suspended(uuid, boolean, text),
  public.admin_list_users(text, public.profile_status, uuid, boolean, int, int),
  public.admin_overview(),
  public.admin_city_stats(),
  public.admin_questionnaire_stats()
to authenticated;

-- Fonctions internes (finalize_registration, referral_is_suspicious, triggers…) :
-- aucun droit d'appel depuis l'API.

-- Les fonctions créées plus tard ne seront pas exécutables par défaut
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
