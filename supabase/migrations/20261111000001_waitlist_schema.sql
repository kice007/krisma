-- =============================================================================
-- KRISMA · Waitlist — 1/3 : schéma (types, tables, index)
-- Spécification : waitlist.md · Plan : waitlist-plan.md
-- =============================================================================

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.profile_status as enum (
  'draft',               -- inscription commencée (e-mail + pseudo), questionnaire en cours
  'questionnaire_done',  -- questionnaire terminé, e-mail pas encore vérifié
  'verified',            -- questionnaire terminé ET e-mail vérifié : inscription validée
  'suspended'            -- suspendu par un administrateur
);

create type public.point_kind   as enum ('signup', 'referral', 'shop');
create type public.point_status as enum ('pending', 'awarded', 'suspended', 'revoked');

create type public.shop_category as enum (
  'grocery', 'butcher', 'bakery', 'hair_salon', 'restaurant', 'other'
);

-- Statuts internes. Les statuts publics sont calculés dans get_map_shops().
create type public.shop_status as enum (
  'proposed',         -- soumis par un membre, en attente de vérification
  'validated',        -- commerce réel, proposition acceptée
  'contacted',        -- KRISMA a pris contact
  'partner',          -- accord commercial obtenu
  'cashback_active',  -- cashback disponible
  'rejected',         -- proposition refusée
  'duplicate'         -- doublon d'une fiche existante
);

create type public.app_role as enum ('moderator', 'admin', 'super_admin');

-- -----------------------------------------------------------------------------
-- Utilitaires
-- -----------------------------------------------------------------------------
create or replace function public.gen_referral_code()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 8 caractères sans 0/O/1/I pour éviter les confusions à la saisie
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 8);
$$;

-- Vrai si tous les éléments sont des codes pays ISO 3166-1 alpha-2 (FR, CI, SN…)
create or replace function public.is_iso2_array(p text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(c ~ '^[A-Z]{2}$'), true) from unnest(p) as c;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Villes (créées à partir du géocodeur OpenStreetMap, sans doublon)
-- -----------------------------------------------------------------------------
create table public.cities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 120),
  admin_area    text,
  country_code  char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  country_name  text not null,
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  source        text not null default 'osm',
  source_ref    text not null,
  created_at    timestamptz not null default now(),
  unique (source, source_ref)
);
create index cities_country_idx on public.cities (country_code);
create index cities_name_trgm_idx on public.cities using gin (name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Profils (1 ligne par compte Supabase Auth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  pseudo                      extensions.citext not null unique
                              check (pseudo ~ '^[A-Za-z0-9._-]{3,20}$'),
  locale                      text not null default 'fr' check (locale in ('fr', 'en')),
  city_id                     uuid references public.cities (id) on delete set null,
  referral_code               text not null unique default public.gen_referral_code(),
  referred_by                 uuid references public.profiles (id) on delete set null,
  status                      public.profile_status not null default 'draft',
  consent_rules_at            timestamptz not null,
  consent_marketing           boolean not null default false,
  consent_marketing_at        timestamptz,
  questionnaire_completed_at  timestamptz,
  verified_at                 timestamptz,
  suspended_at                timestamptz,
  suspension_reason           text,
  signup_ip                   inet,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  constraint no_self_referral check (referred_by is null or referred_by <> id)
);
create index profiles_status_idx on public.profiles (status);
create index profiles_city_idx on public.profiles (city_id);
create index profiles_referred_by_idx on public.profiles (referred_by);
create index profiles_signup_ip_idx on public.profiles (signup_ip);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Questionnaire (11 questions). Les valeurs sont des codes : l'interface les traduit.
-- -----------------------------------------------------------------------------
create table public.questionnaire_responses (
  user_id               uuid primary key references public.profiles (id) on delete cascade,
  -- Q2
  situation             text check (situation in ('student', 'employee', 'entrepreneur', 'job_seeker', 'other')),
  -- Q3 (+ pays si ≠ never)
  receive_frequency     text check (receive_frequency in ('several_per_month', 'monthly', 'few_per_year', 'rarely', 'never')),
  receive_countries     text[] not null default '{}',
  -- Q4 (+ pays si ≠ never)
  send_frequency        text check (send_frequency in ('several_per_month', 'monthly', 'few_per_year', 'rarely', 'never')),
  send_countries        text[] not null default '{}',
  -- Q5
  interest_transfers    text check (interest_transfers in ('very', 'fairly', 'slightly', 'not_at_all', 'unsure')),
  -- Q6
  local_shop_frequency  text check (local_shop_frequency in ('daily', 'several_per_week', 'weekly', 'few_per_month', 'rarely_never')),
  -- Q7
  local_shop_spend      text check (local_shop_spend in ('lt_50', '50_99', '100_249', '250_499', 'gte_500', 'unknown')),
  -- Q8
  interest_cashback     text check (interest_cashback in ('very', 'fairly', 'slightly', 'not_at_all', 'unsure')),
  -- Q9 (plusieurs réponses)
  services              text[] not null default '{}'
                        check (services <@ array['account_card', 'send_to_africa', 'receive_from_africa', 'cashback', 'all']::text[]),
  -- Q10
  willing_to_pay        text check (willing_to_pay in ('yes', 'maybe', 'no')),
  -- Q11
  usage_intent          text check (usage_intent in ('primary', 'secondary', 'unsure')),
  updated_at            timestamptz not null default now(),
  constraint receive_countries_iso check (public.is_iso2_array(receive_countries)),
  constraint send_countries_iso    check (public.is_iso2_array(send_countries))
);

create trigger questionnaire_touch before update on public.questionnaire_responses
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Commerces (KRISMA Map)
-- -----------------------------------------------------------------------------
create table public.shops (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(btrim(name)) between 2 and 120),
  category        public.shop_category not null,
  address         text not null check (char_length(btrim(address)) between 3 and 250),
  city_id         uuid not null references public.cities (id),
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  details         text check (char_length(details) <= 500),
  status          public.shop_status not null default 'proposed',
  -- Le partenariat n'est affiché publiquement qu'avec l'accord du commerçant.
  partner_public  boolean not null default false,
  cashback_rate   numeric(4, 2) check (cashback_rate > 0 and cashback_rate <= 5),
  proposed_by     uuid references public.profiles (id) on delete set null,
  duplicate_of    uuid references public.shops (id),
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint duplicate_has_target check (status <> 'duplicate' or duplicate_of is not null)
);
create index shops_city_status_idx on public.shops (city_id, status);
create index shops_proposed_by_idx on public.shops (proposed_by);
create index shops_name_trgm_idx on public.shops using gin (name extensions.gin_trgm_ops);

create trigger shops_touch before update on public.shops
  for each row execute function public.touch_updated_at();

-- Votes et soutiens (aucun point). Un vote par membre et par commerce, retirable.
create table public.shop_votes (
  shop_id     uuid not null references public.shops (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index shop_votes_user_idx on public.shop_votes (user_id);

-- -----------------------------------------------------------------------------
-- Registre des points
-- Une ligne par action récompensable. L'unicité (kind, source_id) empêche toute
-- double attribution :
--   signup   → source_id = le membre lui-même       (+170, une fois)
--   referral → source_id = le filleul               (+50, un seul parrain récompensé)
--   shop     → source_id = le commerce              (+20, une fois par commerce)
-- Seules les lignes au statut « awarded » comptent dans le total.
-- -----------------------------------------------------------------------------
create table public.point_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        public.point_kind not null,
  source_id   uuid not null,
  points      int not null,
  status      public.point_status not null,
  reason      text,
  awarded_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kind, source_id),
  constraint fixed_points check (
    (kind = 'signup' and points = 170) or
    (kind = 'referral' and points = 50) or
    (kind = 'shop' and points = 20)
  )
);
create index point_events_user_idx on public.point_events (user_id, status);

create trigger point_events_touch before update on public.point_events
  for each row execute function public.touch_updated_at();

-- Historique de chaque changement de statut (annulations, suspensions…)
create table public.point_event_history (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.point_events (id) on delete cascade,
  old_status  public.point_status,
  new_status  public.point_status not null,
  actor       uuid,
  reason      text,
  created_at  timestamptz not null default now()
);
create index point_event_history_event_idx on public.point_event_history (event_id);

-- -----------------------------------------------------------------------------
-- Rôles d'administration
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.app_role not null,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);

-- Journal des opérations sensibles
create table public.admin_audit_log (
  id            bigint generated always as identity primary key,
  actor         uuid,
  action        text not null,
  target_table  text,
  target_id     text,
  details       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

-- -----------------------------------------------------------------------------
-- File d'envoi des e-mails transactionnels (envoyés par une Edge Function + Resend)
-- L'e-mail de vérification est envoyé par Supabase Auth lui-même (SMTP Resend).
-- -----------------------------------------------------------------------------
create table public.email_outbox (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  template    text not null check (template in ('welcome', 'referral_awarded', 'shop_validated')),
  payload     jsonb not null default '{}',
  status      text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts    int not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index email_outbox_queued_idx on public.email_outbox (status, created_at) where status = 'queued';

-- Domaines d'e-mails jetables (anti-fraude parrainage)
create table public.disposable_email_domains (
  domain text primary key check (domain = lower(domain))
);
insert into public.disposable_email_domains (domain) values
  ('mailinator.com'), ('tempmail.io'), ('temp-mail.org'), ('10minutemail.com'),
  ('guerrillamail.com'), ('yopmail.com'), ('trashmail.com'), ('getnada.com'),
  ('sharklasers.com'), ('dispostable.com'), ('maildrop.cc'), ('throwawaymail.com');
