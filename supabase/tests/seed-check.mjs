// Vérifie le jeu de données de test (supabase/seed/test-data.sql) dans PGlite,
// avant de le lancer en prod : node supabase/tests/seed-check.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const here = dirname(fileURLToPath(import.meta.url))
const db = new PGlite({ extensions: { citext, pg_trgm, pgcrypto } })
await db.exec(`
  create schema extensions;
  create extension pgcrypto with schema extensions;
  create schema auth;
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  grant usage on schema public, extensions, auth to anon, authenticated, service_role;
  create table auth.users (
    instance_id uuid, id uuid primary key default gen_random_uuid(), aud text, role text, email text unique,
    encrypted_password text, email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
    created_at timestamptz default now(), updated_at timestamptz, last_sign_in_at timestamptz,
    confirmation_token text, recovery_token text, email_change_token_new text, email_change text,
    email_change_token_current text, phone_change_token text, reauthentication_token text,
    is_anonymous boolean not null default true
  );
  create table auth.identities (
    id uuid primary key default gen_random_uuid(), provider_id text, user_id uuid references auth.users on delete cascade,
    identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
`)
const dir = join(here, '..', 'migrations')
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) await db.exec(readFileSync(join(dir, f), 'utf8'))

const seed = readFileSync(join(here, '..', 'seed', 'test-data.sql'), 'utf8')
for (let run = 1; run <= 2; run++) {
  const res = await db.exec(seed)
  console.log(`passage ${run}`, JSON.stringify(res[res.length - 1].rows[0]))
}
const q = async (sql) => (await db.query(sql)).rows
console.log('statuts commerces', JSON.stringify(await q(`select status, count(*)::int n from public.shops group by 1 order by 1`)))
console.log('statuts membres', JSON.stringify(await q(`select status, count(*)::int n from public.profiles group by 1 order by 1`)))
console.log('points par type', JSON.stringify(await q(`select kind, status, count(*)::int n from public.point_events group by 1,2 order by 1,2`)))
console.log('top 5', JSON.stringify(await q(`select pseudo, points, rank from public.member_ranking order by rank limit 5`)))
console.log('e-mails en file', (await q(`select count(*)::int n from public.email_outbox`))[0].n)
await db.exec(readFileSync(join(here, '..', 'seed', 'test-data-cleanup.sql'), 'utf8'))
console.log('après nettoyage', JSON.stringify(await q(`select (select count(*)::int from auth.users) users, (select count(*)::int from public.shops) shops, (select count(*)::int from public.cities) cities`)))
