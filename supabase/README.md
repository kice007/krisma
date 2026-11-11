# KRISMA · Base de données de la waitlist (Supabase)

## Fichiers

| Fichier | Contenu |
|---|---|
| `migrations/20261111000001_waitlist_schema.sql` | Tables, types, contraintes, domaines jetables |
| `migrations/20261111000002_waitlist_logic.sql` | Règles de points, classement, fonctions RPC (inscription, questionnaire, carte, admin) |
| `migrations/20261111000003_waitlist_security.sql` | RLS et droits d'appel |
| `migrations/20261111000004_proposed_shops_public.sql` | Commerces « Proposé » visibles par tous et soutenables |
| `migrations/20261111000005_member_area.sql` | Espace membre : préférence e-mails de suivi, tableau de bord enrichi (rang il y a 7 jours), pseudo, réglages, suppression du compte |
| `migrations/20261111000006_member_area_grants.sql` | Retire aux visiteurs l’appel des fonctions du compte |
| `migrations/20261111000007_map.sql` | KRISMA Map : auteur et infos sur la carte, `ensure_city`, doublon sans statut interne, export lisible |
| `migrations/20261111000008_better_duplicates.sql` → `…09_block_exact_duplicates.sql` | Doublons de commerces élargis, doublon exact non contournable |
| `migrations/20261111000010_admin.sql` | Administration : rôles resserrés, listes et fiches, équipe et invitations, journal, exports |
| `migrations/20261111000011_email_outbox.sql` | File d’e-mails : réservation par lots, résultat d’envoi, e-mail au parrain quand l’équipe débloque un parrainage |
| `functions/send-emails/` | Fonction Edge qui envoie la file via Resend (modèles E2–E4, FR/EN) |
| `tests/run.mjs` | 116 vérifications dans PGlite (Postgres en WebAssembly), sans Docker : `npm run test:db` |

Mise en ligne : `supabase link --project-ref <ref>` puis `supabase db push`.

## Principes

- **Aucune écriture directe depuis le navigateur.** Les tables sont en lecture seule (ses propres lignes, ou tout pour l'équipe). Toute écriture passe par une fonction RPC qui applique les règles.
- **Registre de points** (`point_events`) : une ligne par gain, unique par `(kind, source_id)`, ce qui interdit toute double attribution. Valeurs fixes : 170 (inscription), 50 (filleul), 20 (commerce validé). Statuts : `pending`, `awarded`, `suspended`, `revoked`. Chaque changement est historisé dans `point_event_history`.
- **Classement** : seuls les points `awarded` des membres `verified` comptent. `rank()` donne le même rang aux ex æquo. `get_top_threshold(2000)` retourne le score limite et le nombre de membres éligibles, égalités comprises.
- **Validation d'inscription** : elle se fait quand le questionnaire est terminé **et** que l'e-mail est confirmé, dans l'ordre qu'on veut. Un trigger sur `auth.users.email_confirmed_at` appelle `finalize_registration`, une fonction idempotente.
- **Anti-fraude du parrainage** : les 50 points sont mis en `suspended` (et non accordés) si l'e-mail est jetable, si le filleul a la même IP que le parrain, ou si 3 filleuls ou plus arrivent de la même IP en 24 h. L'équipe tranche dans l'admin, avec un motif obligatoire.
- **Doublons de commerces** : un nom proche (pg_trgm, similarité ≥ 0,45) à moins de 80 m renvoie `duplicate_candidate`. Le front propose alors de soutenir la fiche existante, ou de forcer la création avec `p_force`.

## Parcours côté front (phase 3)

```ts
// W02 : session anonyme, puis profil
await supabase.auth.signInAnonymously({ options: { captchaToken } });
await supabase.rpc("start_registration", { p_pseudo, p_accept_rules: true, p_consent_marketing, p_locale, p_referral_code });
await supabase.auth.updateUser({ email }, { emailRedirectTo: `${origin}/waitlist/confirm` }); // envoie l'e-mail de vérification

// W03 à W06 : ville + sauvegarde à chaque étape
await supabase.rpc("set_my_city", { p_source_ref, p_name, p_country_code, p_country_name, p_lat, p_lng });
await supabase.rpc("save_questionnaire", { p_answers: { situation: "employee", ... } });
const { data } = await supabase.rpc("complete_questionnaire"); // { status: 'incomplete', missing: [...] } | 'awaiting_email' | 'verified'

// W09 : connexion par lien magique
await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
```

Autres RPC : `check_pseudo_available`, `get_referrer`, `get_my_dashboard`, `get_leaderboard`, `get_map_cities`, `get_map_shops`, `propose_shop`, `toggle_shop_vote`, `update_my_preferences`, `export_my_data` ; côté admin : `admin_overview`, `admin_list_users`, `admin_review_shop`, `admin_set_shop_status`, `admin_set_point_status`, `admin_set_user_suspended`, `admin_city_stats`, `admin_questionnaire_stats`.

Les erreurs remontent sous forme de codes courts à traduire côté front (FR/EN) : `pseudo_taken`, `pseudo_invalid`, `rules_not_accepted`, `invalid_answer`, `not_verified`, `rate_limited`, `forbidden`, `reason_required`…

## Réglages du projet Supabase

- **Auth → Providers** : activer *Anonymous sign-ins* et *Email*. Désactiver l'inscription par mot de passe.
- **Auth → Attack protection** : captcha Cloudflare Turnstile (indispensable avec les sessions anonymes).
- **Auth → SMTP** : passer par Resend (`smtp.resend.com`, port 465), avec l'expéditeur `waitlist@krisma…` sur un domaine vérifié.
- **Auth → Email templates** : *Change email address* (vérification, maquette E1) et *Magic link*, en FR/EN selon `user_metadata.locale`.
- **Auth → URL configuration** : Site URL `https://www.krisma.io` ; Redirect URLs `https://www.krisma.io/**`, `https://krisma.io/**`, `http://localhost:5173/**` (+ previews Vercel si besoin). Domaine servi par Vercel (krisma.io redirigé vers www).
- **Proxy** : `request_ip()` lit `cf-connecting-ip`, puis `x-forwarded-for`. À vérifier sur le projet réel.
- **Admin** : ajouter le premier compte à la main dans `user_roles` (`super_admin`) depuis l'éditeur SQL.
- **E-mails de campagne** (bienvenue, parrainage, commerce validé) : une Edge Function, planifiée chaque minute, vide `email_outbox` vers Resend avec la clé `service_role` (phase 7).

## Front branché (phase 3, 2026-11-11)

Code dans `src/waitlist/` (React Router, chargé à la demande) et `src/lib/supabase.js`. Variables dans `.env.local` (non versionné ; modèle : `.env.example`), à recopier dans Vercel : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, et `VITE_TURNSTILE_SITE_KEY` le jour où le captcha est activé.

| Route | Écran |
|---|---|
| `/waitlist` | W01 : page de la liste d’attente (garde `?ref=`, transmet `?email=` et `?news=` à l’inscription) |
| `/waitlist/inscription` | W02 : e-mail, pseudo vérifié en direct, consentements |
| `/waitlist/questionnaire/1…4` | W03–W06 : chaque « Suivant » enregistre l'étape ; villes via Photon (OpenStreetMap) |
| `/waitlist/verification` | W07 : envoi du lien à la fin du questionnaire, renvoi, changement d'adresse ; la page bascule seule quand le lien est cliqué |
| `/waitlist/bienvenue` | W08 : arrivée du lien de confirmation (+170, rang, lien de parrainage) |
| `/connexion` → `/waitlist/reprise` | W09 : lien magique, puis reprise à la bonne étape |
| `/espace`, `/espace/points`, `/espace/profil` | W10 tableau de bord, M12 historique, M19 profil (réservés aux membres validés) — `src/member/` |
| `/classement`, `/reglement` | W11 classement et W14 règles, publics |
| `/carte` | W12/W13 KRISMA Map (Leaflet + tuiles OpenStreetMap, regroupement des repères) : villes, filtres, fiche et vote, proposition avec doublon — `src/member/map/`. Paramètres : `?ville=`, `?commerce=`, `?proposer=1` |

En développement, `?apercu` affiche les écrans 3 à 8 avec des données d'exemple, sans session ni écriture en base.

## E-mails d'authentification via Resend

Modèles dans `supabase/templates/` (FR/EN selon `user_metadata.locale`, pseudo via `user_metadata.pseudo`) :

| Modèle Supabase (Authentication → Emails → Templates) | Fichier | Sujet |
|---|---|---|
| Change email address | `confirm-email.html` | `{{ if and .Data.locale (eq .Data.locale "en") }}Confirm your email · KRISMA{{ else }}Confirme ton adresse e-mail · KRISMA{{ end }}` |
| Magic link | `magic-link.html` | `{{ if and .Data.locale (eq .Data.locale "en") }}Your KRISMA login link{{ else }}Ton lien de connexion KRISMA{{ end }}` |

SMTP (Authentication → Emails → SMTP Settings) : hôte `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = clé API Resend (accès « Sending » limité au domaine), expéditeur `waitlist@krisma.io`, nom `KRISMA`. Les images des e-mails sont servies par le site (`https://www.krisma.io/img/...`) : elles n'apparaissent qu'une fois le site déployé.

## Règle pour les prochaines migrations

Sur Supabase, toute fonction créée est appelable par `anon` (droit hérité de PUBLIC), malgré la révocation par défaut de la migration 3. Chaque nouvelle fonction doit commencer par `revoke execute on function ... from public, anon;` avant ses `grant`. Vérification : `npx supabase db query --remote --read-only "select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')"`.

## Tuiles de carte

La carte utilise les tuiles publiques d’OpenStreetMap (attribution affichée). Leur politique d’usage interdit un trafic important : avant l’ouverture publique, passer à un fournisseur (MapTiler, Stadia, Protomaps…) en changeant `TILE_URL` dans `src/member/map/leaflet.js`.

## Administration (phase 6)

Routes `/admin/connexion`, `/admin` (vue d’ensemble), `/admin/membres` (+ fiche), `/admin/commerces`, `/admin/points`, `/admin/statistiques`, `/admin/equipe` — code dans `src/admin/` (français uniquement). En développement, `?apercu` affiche des données d’exemple.

Rôles : modérateur (commerces, consultation), admin (+ points, suspensions, partenariats, exports), super-admin (+ équipe). Une invitation à une adresse sans compte s’applique quand la personne confirme son adresse via le lien de `/admin/connexion` (le compte est créé à ce moment-là).

Premier super-admin, à exécuter une fois dans l’éditeur SQL :

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'ton.adresse@exemple.com';
```

## E-mails de campagne (phase 7)

La base met en file `email_outbox` : bienvenue (+170), parrainage validé (+50), commerce validé (+20). La fonction Edge `send-emails` les envoie par lots via l’API Resend ; les e-mails de suivi (parrainage, commerce) respectent l’interrupteur « Points et parrainages » du profil ; un échec est retenté 5 fois.

Mise en place :
1. `npx supabase db push --remote` (migration 11).
2. Secret Resend : Supabase → Edge Functions → Secrets → `RESEND_API_KEY` (une clé « Sending access » sur krisma.io). Facultatifs : `EMAIL_FROM` (défaut `KRISMA <waitlist@krisma.io>`), `SITE_URL` (défaut `https://www.krisma.io`).
3. Déploiement : `npx supabase functions deploy send-emails --project-ref kysiaecnbbnobnxzjexs --use-api`.
4. Planification : Supabase → Integrations → Cron → nouvelle tâche « Supabase Edge Function » `send-emails`, toutes les minutes (`* * * * *`).
