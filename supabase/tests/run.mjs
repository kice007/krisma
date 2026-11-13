// Tests de la base waitlist sans Docker : applique les migrations dans PGlite
// (Postgres en WebAssembly) avec une imitation minimale de Supabase Auth,
// puis rejoue les parcours clés. Lancer : npm run test:db
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const here = dirname(fileURLToPath(import.meta.url));
const db = new PGlite({ extensions: { citext, pg_trgm } });

// --- Imitation de Supabase : schémas, rôles, auth.users, auth.uid() ---------
await db.exec(`
  create schema extensions;
  create schema auth;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  grant usage on schema public, extensions, auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    email_confirmed_at timestamptz,
    is_anonymous boolean not null default true,
    last_sign_in_at timestamptz,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated;
`);

const dir = join(here, "..", "migrations");
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(join(dir, f), "utf8"));
  console.log("✓ migration", f);
}

// --- Outils ------------------------------------------------------------------
let passed = 0;
let failed = 0;
const ok = (cond, label) => {
  if (cond) { passed++; console.log("  ✓", label); }
  else { failed++; console.log("  ✗", label); }
};

/** Exécute une requête en tant qu'utilisateur (rôle authenticated) ou anonyme (uid null). */
async function as(uid, sql, params = []) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
async function expectError(promise, code, label) {
  try { await promise; ok(false, `${label} (aucune erreur)`); }
  catch (e) { ok(String(e.message).includes(code), `${label} → ${code}${String(e.message).includes(code) ? "" : " (reçu : " + e.message + ")"}`); }
}
const one = async (uid, sql, params) => (await as(uid, sql, params))[0];
const rpc = async (uid, fn, args = {}) => {
  const keys = Object.keys(args);
  const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
  return (await one(uid, sql, Object.values(args))).r;
};
async function newAnonUser() {
  return (await db.query("insert into auth.users default values returning id")).rows[0].id;
}
async function confirmEmail(uid, email) {
  await db.query("update auth.users set email = $2, email_confirmed_at = now(), is_anonymous = false where id = $1", [uid, email]);
}
const PARIS = { p_source_ref: "relation/7444", p_name: "Paris", p_country_code: "fr", p_country_name: "France", p_lat: 48.8566, p_lng: 2.3522 };
const FULL = {
  situation: "employee", receive_frequency: "monthly", receive_countries: ["ci", "SN"],
  send_frequency: "never", send_countries: ["CI"], interest_transfers: "very",
  local_shop_frequency: "weekly", local_shop_spend: "100_249", interest_cashback: "fairly",
  services: ["account_card", "cashback"], willing_to_pay: "maybe", usage_intent: "primary",
};
async function register(uid, fullName, { code = null, email, confirmFirst = false } = {}) {
  const [first, ...rest] = fullName.split(" ");
  await rpc(uid, "start_registration", { p_first_name: first, p_last_name: rest.join(" "), p_accept_rules: true, p_consent_marketing: false, p_locale: "fr", p_referral_code: code });
  if (confirmFirst) await confirmEmail(uid, email);
  await rpc(uid, "set_my_city", PARIS);
  await rpc(uid, "save_questionnaire", { p_answers: JSON.stringify(FULL) });
  const res = await rpc(uid, "complete_questionnaire");
  if (!confirmFirst && email) await confirmEmail(uid, email);
  return res;
}
const total = async (uid) => (await db.query("select points from public.member_totals where id = $1", [uid])).rows[0]?.points ?? 0;

// --- Scénarios -----------------------------------------------------------------
console.log("\n1. Inscription standard (questionnaire puis e-mail)");
const A = await newAnonUser();
const resA = await register(A, "Amina Kouassi", { email: "amina@gmail.com" });
ok(resA.status === "awaiting_email", "questionnaire terminé → en attente de l'e-mail");
ok((await db.query("select status from public.profiles where id=$1", [A])).rows[0].status === "verified", "e-mail confirmé → inscription validée");
ok((await total(A)) === 170, "+170 points attribués");
await db.query("select public.finalize_registration($1)", [A]);
ok((await db.query("select count(*)::int n from public.point_events where user_id=$1 and kind='signup'", [A])).rows[0].n === 1, "pas de double attribution des 170 points");
const qA = (await db.query("select receive_countries, send_countries from public.questionnaire_responses where user_id=$1", [A])).rows[0];
ok(JSON.stringify(qA.receive_countries) === '["CI","SN"]', "pays normalisés en majuscules");
ok(qA.send_countries.length === 0, "« Jamais » efface les pays de la sous-question");
const codeA = (await db.query("select referral_code from public.profiles where id=$1", [A])).rows[0].referral_code;

console.log("\n2. Prénom et nom (migration 15)");
ok((await db.query("select pseudo, first_name, last_name from public.profiles where id=$1", [A])).rows[0].pseudo === "Amina K.", "nom public calculé « Amina K. »");
const B = await newAnonUser();
await expectError(rpc(B, "start_registration", { p_first_name: "A1", p_last_name: "Koné", p_accept_rules: true }), "first_name_invalid", "prénom avec chiffre refusé");
await expectError(rpc(B, "start_registration", { p_first_name: "Awa", p_last_name: "  ", p_accept_rules: true }), "last_name_invalid", "nom vide refusé");
await expectError(rpc(B, "start_registration", { p_first_name: "Awa", p_last_name: "Koné", p_accept_rules: false }), "rules_not_accepted", "règlement non accepté");

console.log("\n3. Parrainage (e-mail vérifié AVANT la fin du questionnaire)");
ok((await rpc(null, "get_referrer", { p_code: codeA.toLowerCase() })).pseudo === "Amina K.", "le code de parrainage affiche le pseudo du parrain");
const resB = await register(B, "Awa Koné", { code: codeA, email: "awa@gmail.com", confirmFirst: true });
ok(resB.status === "verified", "inscription validée directement à la fin du questionnaire");
ok((await total(B)) === 170, "filleul : +170");
ok((await total(A)) === 220, "parrain : +50");

console.log("\n4. Questionnaire incomplet");
const C = await newAnonUser();
await rpc(C, "start_registration", { p_first_name: "Kevin", p_last_name: "Coulibaly", p_accept_rules: true });
await rpc(C, "save_questionnaire", { p_answers: JSON.stringify({ situation: "student", receive_frequency: "rarely" }) });
const resC = await rpc(C, "complete_questionnaire");
ok(resC.status === "incomplete" && resC.missing.includes("q1") && resC.missing.includes("q3"), `questions manquantes : ${resC.missing.join(", ")}`);
await expectError(rpc(C, "save_questionnaire", { p_answers: JSON.stringify({ situation: "astronaut" }) }), "invalid_answer", "réponse hors liste refusée");

console.log("\n5. Anti-fraude du parrainage");
const E = await newAnonUser();
await register(E, "Promo Test", { code: codeA, email: "x7k2@tempmail.io" });
const evE = (await db.query("select status from public.point_events where kind='referral' and source_id=$1", [E])).rows[0];
ok(evE.status === "suspended", "e-mail jetable → points de parrainage suspendus");
ok((await total(A)) === 220, "les points suspendus ne comptent pas");

console.log("\n6. Commerces : proposition, doublon, validation");
const shop = { p_name: "Épicerie Chez Awa", p_category: "grocery", p_address: "14 rue Myrha, Paris", p_city_id: null, p_lat: 48.8867, p_lng: 2.3541 };
shop.p_city_id = (await db.query("select id from public.cities limit 1")).rows[0].id;
await expectError(rpc(C, "propose_shop", shop), "not_verified", "membre non vérifié");
const s1 = await rpc(B, "propose_shop", shop);
const F0 = A;
ok(s1.result === "created", "commerce créé");
ok((await db.query("select status from public.point_events where kind='shop' and source_id=$1", [s1.shop_id])).rows[0].status === "pending", "+20 en attente de vérification");
const pub=await as(null, "select * from public.get_map_shops($1)", [shop.p_city_id]);
ok(pub.length === 1 && pub[0].public_status === "proposed", "commerce proposé visible par tous en « Proposé »");
ok((await rpc(F0, "toggle_shop_vote", { p_shop_id: s1.shop_id })).voted === true, "un autre membre peut soutenir un commerce proposé");
await rpc(F0, "toggle_shop_vote", { p_shop_id: s1.shop_id });
const dup = await rpc(A, "propose_shop", { ...shop, p_name: "Epicerie chez awa", p_lat: 48.88675 });
ok(dup.result === "duplicate_candidate" && dup.shop.id === s1.shop_id, "nom proche à moins de 80 m → doublon proposé");
const s2 = await rpc(A, "propose_shop", { ...shop, p_name: "Epicerie chez awa", p_lat: 48.88675, p_force: true });
ok(s2.result === "created", "« Ce n'est pas le même commerce » → création forcée");

const D = await newAnonUser();
await confirmEmail(D, "ivan@krisma.com");
await db.query("insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [D]);
await expectError(rpc(B, "admin_review_shop", { p_shop_id: s1.shop_id, p_decision: "validate" }), "forbidden", "un membre ne peut pas valider");
await rpc(D, "admin_review_shop", { p_shop_id: s1.shop_id, p_decision: "validate" });
ok((await total(B)) === 190, "validation → +20 attribués à l'auteur");
ok((await db.query("select count(*)::int n from public.email_outbox where template='shop_validated'")).rows[0].n === 1, "e-mail « commerce validé » mis en file");
await rpc(D, "admin_review_shop", { p_shop_id: s2.shop_id, p_decision: "duplicate", p_duplicate_of: s1.shop_id });
ok((await db.query("select status from public.point_events where kind='shop' and source_id=$1", [s2.shop_id])).rows[0].status === "revoked", "doublon → points annulés");
ok((await db.query("select count(*)::int n from public.shop_votes where shop_id=$1", [s1.shop_id])).rows[0].n === 2, "soutiens du doublon reportés sur la fiche d'origine");

console.log("\n7. Carte publique et votes");
await rpc(D, "admin_set_shop_status", { p_shop_id: s1.shop_id, p_status: "cashback_active", p_cashback_rate: 5 });
let map = await as(null, "select * from public.get_map_shops($1)", [shop.p_city_id]);
ok(map.length === 1 && map[0].public_status === "validated", "partenariat non affiché sans l'accord du commerçant");
await rpc(D, "admin_set_shop_status", { p_shop_id: s1.shop_id, p_status: "cashback_active", p_partner_public: true });
map = await as(null, "select * from public.get_map_shops($1)", [shop.p_city_id]);
ok(map[0].public_status === "cashback_active" && Number(map[0].cashback_rate) === 5, "avec accord : « Cashback actif · 5 % »");
const v1 = await rpc(E, "toggle_shop_vote", { p_shop_id: s1.shop_id });
const v2 = await rpc(E, "toggle_shop_vote", { p_shop_id: s1.shop_id });
ok(v1.voted === true && v2.voted === false, "un vote, puis retrait du vote");
ok((await total(E)) === 170, "vote retiré → les 5 points du vote sont retirés");
const cities = await as(null, "select * from public.get_map_cities(null)");
ok(cities[0].name === "Paris" && cities[0].partners === 1, "liste des villes avec compteurs");

console.log("\n8. Classement et égalités");
const F = await newAnonUser(); await register(F, "Fatou Sow", { email: "fatou@gmail.com" });
const G = await newAnonUser(); await register(G, "Zaneb Elidrissi", { email: "zaneb@gmail.com" });
const board = await as(null, "select * from public.get_leaderboard(null, 50, 0)");
ok(board[0].pseudo === "Amina K." && board[0].rank === 1n || board[0].rank === 1, "1er : Amina K.");
const tied = board.filter((r) => r.points === 170);
ok(tied.length === 3 && new Set(tied.map((r) => Number(r.rank))).size === 3, "ex æquo : chacun a son propre rang");
ok(tied.map((r) => r.pseudo).join(",") === "Promo T.,Fatou S.,Zaneb E.", "à points égaux, le premier validé passe devant");
const top = await rpc(null, "get_top_threshold", { p_size: 3 });
ok(top.eligible === 3, `top 3 strict → ${top.eligible} membres retenus`);
ok(!("email" in board[0]), "le classement public n'expose pas d'e-mail");

console.log("\n9. Sécurité (RLS et droits)");
const rows = await as(B, "select pseudo from public.profiles");
ok(rows.length === 1 && rows[0].pseudo === "Awa K.", "un membre ne lit que son propre profil");
await expectError(as(B, "insert into public.point_events (user_id, kind, source_id, points, status) values ($1,'signup',$1,170,'awarded')", [B]), "permission denied", "écriture directe dans les points refusée");
await expectError(as(B, "select public.finalize_registration($1)", [B]), "permission denied", "fonction interne non appelable");
await expectError(as(null, "select * from public.member_ranking"), "permission denied", "vues internes non exposées");
await expectError(rpc(B, "admin_overview"), "forbidden", "statistiques réservées à l'équipe");
const ov = await rpc(D, "admin_overview");
ok(ov.verified === 5 && ov.shops_to_review === 0, "vue d'ensemble admin");
const users = await as(D, "select * from public.admin_list_users(null, null, null, true, 50, 0)");
ok(users.length === 1 && users[0].pseudo === "Amina K.", "filtre « suspects » : le parrain dont un filleul est suspendu");

console.log("\n10. Corrections par l'équipe");
const evId = (await db.query("select id from public.point_events where kind='referral' and source_id=$1", [E])).rows[0].id;
await expectError(rpc(D, "admin_set_point_status", { p_event_id: evId, p_status: "awarded", p_reason: "" }), "reason_required", "motif obligatoire");
await rpc(D, "admin_set_point_status", { p_event_id: evId, p_status: "revoked", p_reason: "Fraude confirmée" });
ok((await db.query("select count(*)::int n from public.point_event_history where event_id=$1", [evId])).rows[0].n === 2, "historique conservé (suspendu → annulé)");
await rpc(D, "admin_set_user_suspended", { p_user_id: E, p_suspended: true, p_reason: "Fraude" });
ok((await as(null, "select * from public.get_leaderboard(null, 50, 0)")).every((r) => r.pseudo !== "Promo T."), "membre suspendu retiré du classement");
const flagged = await as(D, "select * from public.admin_list_users(null, null, null, true, 50, 0)");
ok(flagged.length === 1 && flagged[0].email === "x7k2@tempmail.io", "suspects : le membre suspendu (le parrain sort de la liste une fois la fraude tranchée)");
ok((await db.query("select count(*)::int n from public.admin_audit_log")).rows[0].n >= 5, "opérations sensibles journalisées");

console.log("\n11. Tableau de bord");
const dash = await rpc(A, "get_my_dashboard");
ok(dash.points === 220 && Number(dash.rank) === 1, "points et rang");
ok(dash.referral_code === codeA, "lien de parrainage disponible une fois vérifié");
ok(dash.referees.length === 2, "liste des filleuls");
ok(dash.history.length === 5, "historique des points (inscription, 2 parrainages, commerce annulé, vote retiré)");
const dashC = await rpc(C, "get_my_dashboard");
ok(dashC.referral_code === null, "pas de lien de parrainage avant validation");

const stats = await rpc(D, "admin_questionnaire_stats");
ok(stats.situation.employee === 4 && stats.services.cashback === 4, "statistiques du questionnaire");

console.log("\n12. Espace membre (migration 5)");
const dash2 = await rpc(A, "get_my_dashboard");
ok(dash2.email === "amina@gmail.com" && dash2.notify_points === true && dash2.city.country_name === "France", "tableau de bord : e-mail, préférences, ville complète");
ok(dash2.rank_week_ago === null, "pas de rang d'il y a 7 jours pour un membre validé aujourd'hui");
await db.query("update public.profiles set verified_at = now() - interval '10 days' where id = $1", [G]);
await db.query("update public.point_events set created_at = now() - interval '10 days' where user_id = $1", [G]);
ok(Number((await rpc(G, "get_my_dashboard")).rank_week_ago) === 1, "rang d'il y a 7 jours (seul membre validé à cette date)");
ok((await rpc(null, "get_leaderboard_meta", {})).members === 4, "nombre de membres classés");
await expectError(rpc(B, "update_my_name", { p_first_name: "Awa", p_last_name: "K0né" }), "last_name_invalid", "nom invalide");
ok((await rpc(B, "update_my_name", { p_first_name: " awa  ", p_last_name: "N'Guessan" })) === "awa N.", "nom modifié (espaces nettoyés)");
await rpc(B, "update_my_name", { p_first_name: "Awa", p_last_name: "Koné" });
await rpc(B, "update_my_settings", { p_locale: "en", p_notify_points: false });
const prefsB = (await db.query("select locale, notify_points, consent_marketing from public.profiles where id = $1", [B])).rows[0];
ok(prefsB.locale === "en" && prefsB.notify_points === false && prefsB.consent_marketing === false, "réglages enregistrés, le reste inchangé");
const before = await total(A);
await rpc(B, "delete_my_account");
ok((await db.query("select count(*)::int n from auth.users where id = $1", [B])).rows[0].n === 0, "compte supprimé");
ok((await total(A)) === before - 50, "le parrain perd les 50 points du filleul supprimé");
ok((await db.query("select proposed_by from public.shops where id = $1", [s1.shop_id])).rows[0].proposed_by === null, "les commerces proposés restent, sans auteur");
await expectError(as(B, "select public.rank_at($1, now())", [B]), "permission denied", "fonction interne de rang non appelable");

console.log("\n13. KRISMA Map et export (migration 7)");
const mapRows = await as(null, "select * from public.get_map_shops($1)", [shop.p_city_id]);
ok(mapRows.length === 1 && mapRows[0].proposer === null && mapRows[0].address.includes("Myrha"), "fiche publique : adresse, auteur supprimé masqué");
const lyon = await rpc(A, "ensure_city", { p_source_ref: "relation/120965", p_name: "Lyon", p_country_code: "fr", p_country_name: "France", p_lat: 45.764, p_lng: 4.8357 });
ok(typeof lyon === "string" && (await rpc(A, "get_my_dashboard")).city.name === "Paris", "ville d'un commerce créée sans changer la ville du membre");
await expectError(rpc(C, "ensure_city", { p_source_ref: "relation/1", p_name: "X", p_country_code: "fr", p_country_name: "France", p_lat: 0, p_lng: 0 }), "not_verified", "ville réservée aux membres vérifiés");
await expectError(rpc(A, "propose_shop", { p_name: "Boulangerie Teranga", p_category: "bakery", p_address: "3 rue de la République, Lyon", p_city_id: lyon, p_lat: 45.7601, p_lng: 4.8357 }), "not_my_city", "proposition hors de sa ville refusée");
const paris = shop.p_city_id;
await db.query("update public.profiles set city_id = $1 where id in ($2, $3)", [lyon, A, F]);
const created = await rpc(A, "propose_shop", { p_name: "Boulangerie Teranga", p_category: "bakery", p_address: "3 rue de la République, Lyon", p_city_id: lyon, p_lat: 45.7601, p_lng: 4.8357 });
ok(created.result === "created", "commerce proposé dans une autre ville");
await db.query("update public.shops set status = 'partner', partner_public = false where id = $1", [created.shop_id]);
const dupL = await rpc(F, "propose_shop", { p_name: "Boulangerie Teranga", p_category: "bakery", p_address: "3 rue de la République", p_city_id: lyon, p_lat: 45.76012, p_lng: 4.8357 });
ok(dupL.result === "duplicate_candidate" && dupL.shop.public_status === "validated" && dupL.shop.category === "bakery" && dupL.shop.voted === false, "doublon : partenariat non public masqué, catégorie et vote");
ok((await as(A, "select * from public.get_map_shops($1)", [lyon]))[0].proposer === "Amina K.", "auteur affiché sur la carte");
await db.query("update public.profiles set city_id = $1 where id in ($2, $3)", [paris, A, F]);
const exp = await rpc(A, "export_my_data");
ok(exp.profile.city_name === "Paris" && exp.votes.some((v) => v.shop === "Boulangerie Teranga") && exp.points.some((e) => e.label === "Boulangerie Teranga"), "export lisible : ville, commerces soutenus, libellés des points");
await expectError(as(null, "select public.ensure_city('a','b','fr','c',0,0)"), "permission denied", "ensure_city non appelable par un visiteur");

console.log("\n14. Doublons élargis (migration 8)");
const bmk = { p_name: "BMK Paris-Bamako", p_category: "restaurant", p_address: "14 Rue de la Fidélité, 75010 Paris, France", p_city_id: shop.p_city_id, p_lat: 48.8537739, p_lng: 2.3460102 };
ok((await rpc(A, "propose_shop", bmk)).result === "created", "premier BMK créé");
const bmk2 = await rpc(G, "propose_shop", { ...bmk, p_lat: 48.8536405, p_lng: 2.3486066 });
ok(bmk2.result === "duplicate_candidate" && bmk2.shop.name === "BMK Paris-Bamako", "même nom et même adresse à ~190 m → doublon (cas réel)");
const bmk3 = await rpc(G, "propose_shop", { ...bmk, p_address: "Rue inconnue", p_lat: 48.8575, p_lng: 2.3460102 });
ok(bmk3.result === "duplicate_candidate", "même nom à ~420 m, adresse différente → doublon");
const far = await rpc(G, "propose_shop", { ...bmk, p_address: "Avenue de Clichy", p_lat: 48.8880, p_lng: 2.3200 });
ok(far.result === "created", "même nom à plusieurs km, autre adresse → nouvelle fiche (autre établissement)");
const other = await rpc(G, "propose_shop", { ...bmk, p_name: "Chez Fatou Traiteur", p_lat: 48.8537, p_lng: 2.3461 });
ok(other.result === "duplicate_candidate" ? false : other.result === "created", "autre nom à la même adresse → nouvelle fiche");

console.log("\n15. Doublon exact non contournable (migration 9)");
const exact = await rpc(G, "propose_shop", { ...bmk, p_lat: 48.8700, p_lng: 2.3700, p_force: true });
ok(exact.result === "duplicate_candidate" && exact.shop.blocked === true, "même nom + même adresse, repère déplacé à ~2 km et « forcer » → toujours refusé");
const nBmk = (await db.query("select count(*)::int n from public.shops where name = 'BMK Paris-Bamako' and status not in ('rejected','duplicate')")).rows[0].n;
ok(nBmk === 2, "aucune fiche BMK supplémentaire enregistrée (la 2e est l'autre établissement, à plusieurs km)");
const near = await rpc(G, "propose_shop", { ...bmk, p_name: "BMK Paris Bamako Traiteur", p_address: "20 rue du Faubourg Saint-Denis", p_lat: 48.8540, p_lng: 2.3462 });
ok(near.result === "duplicate_candidate" && near.shop.blocked === false, "nom proche, autre adresse → doublon possible, mais contournable");
const forced = await rpc(G, "propose_shop", { ...bmk, p_name: "BMK Paris Bamako Traiteur", p_address: "20 rue du Faubourg Saint-Denis", p_lat: 48.8540, p_lng: 2.3462, p_force: true });
ok(forced.result === "created", "cas ambigu : « ce n'est pas le même commerce » crée la fiche");

console.log("\n16. Administration (migration 10)");
ok((await rpc(D, "my_staff_role")) === "super_admin", "rôle du membre connecté");
ok((await rpc(A, "my_staff_role")) === null, "un membre sans rôle n'a pas de rôle d'équipe");
const ov2 = await rpc(D, "admin_overview", { p_days: 30 });
ok(ov2.daily.length === 30 && Array.isArray(ov2.cities) && ov2.answers.total >= 1, "vue d'ensemble : 30 jours, villes, réponses");
const mem = await as(D, "select * from public.admin_list_members(null, null, null, null, true, 50, 0)");
const e = mem.find((m) => m.pseudo === "Promo Test");
ok(e && e.flags.includes("disposable_email") && Number(e.total) === mem.length, "membres suspects : e-mail jetable signalé, total renvoyé");
const det = await rpc(D, "admin_member_detail", { p_user: A });
ok(det.email === "amina@gmail.com" && det.events.length >= 3 && det.questionnaire.situation === "employee", "fiche membre complète");
const dups = await as(D, "select * from public.admin_list_shops('duplicates', null, 50, 0)");
ok(dups.some((x) => x.name === "BMK Paris Bamako Traiteur" && x.dup_name === "BMK Paris-Bamako"), "onglet doublons : doublon probable et fiche d'origine");
const counts = await rpc(D, "admin_shop_counts");
ok(counts.review >= 1 && counts.duplicates >= 1, "compteurs des onglets commerces");
const pts = await as(D, "select * from public.admin_list_points('revoked', null, 50, 0)");
ok(pts.some((x) => x.actor === "ivan"), "historique des points : auteur de l'annulation");
ok((await rpc(D, "admin_points_summary")).revoked_month >= 1, "résumé des points");
const audit = await as(D, "select * from public.admin_list_audit(50)");
ok(audit.length >= 5 && audit.some((x) => x.action === "user_suspend" && x.target === "Promo T."), "journal lisible (cible nommée)");

// Équipe : invitation d'une personne sans compte, appliquée à la confirmation de l'adresse
ok((await rpc(D, "admin_invite_member", { p_email: "Yao@Krisma.io", p_role: "moderator" })) === "invited", "invitation enregistrée");
const yao = (await db.query("insert into auth.users (email) values ('yao@krisma.io') returning id")).rows[0].id;
await db.query("update auth.users set email_confirmed_at = now(), is_anonymous = false where id = $1", [yao]);
ok((await rpc(yao, "my_staff_role")) === "moderator", "rôle appliqué à la première connexion");
ok((await rpc(D, "admin_invite_member", { p_email: "fatou@gmail.com", p_role: "admin" })) === "granted", "membre existant : rôle donné immédiatement");
await expectError(rpc(yao, "admin_invite_member", { p_email: "x@krisma.io", p_role: "admin" }), "forbidden", "un modérateur ne gère pas l'équipe");
await expectError(rpc(D, "admin_set_member_role", { p_user: D, p_role: "moderator" }), "cannot_change_self", "on ne change pas son propre rôle");
await expectError(rpc(yao, "admin_set_point_status", { p_event_id: evId, p_status: "awarded", p_reason: "test" }), "forbidden", "un modérateur ne corrige pas les points");
await expectError(rpc(yao, "admin_set_user_suspended", { p_user_id: A, p_suspended: true }), "forbidden", "un modérateur ne suspend pas");
const team = await rpc(D, "admin_list_team");
ok(team.members.length === 3 && team.members[0].role === "super_admin" && team.invites.length === 0, "liste de l'équipe");
await rpc(D, "admin_remove_member", { p_user: yao });
ok((await rpc(yao, "my_staff_role")) === null, "retrait d'un membre de l'équipe");

// Exports réservés aux admins
await expectError(as(A, "select * from public.admin_export_members()"), "forbidden", "export des membres refusé hors équipe");
const exportRows = await as(D, "select * from public.admin_export_members()");
ok(exportRows.length >= 4 && exportRows.some((x) => x.situation === "employee"), "export des membres avec réponses");
const rankRows = await as(D, "select * from public.admin_export_ranking(2)");
ok(rankRows.length >= 2 && rankRows.every((r) => r.points >= rankRows[rankRows.length - 1].points), "classement final avec les ex æquo");
await expectError(as(null, "select public.admin_list_team()"), "permission denied", "fonctions admin fermées aux visiteurs");

console.log("\n17. File d'e-mails (migration 11)");
const svc = async (sql, params = []) => {
  await db.exec("set role service_role");
  try { return (await db.query(sql, params)).rows; } finally { await db.exec("reset role"); }
};
const queued = (await db.query("select count(*)::int n from public.email_outbox where status = 'queued'")).rows[0].n;
const batch = await svc("select * from public.claim_email_batch(100)");
ok(batch.length === queued && batch.length >= 3, `lot réservé : ${batch.length} e-mail(s) en attente`);
ok(batch.every((b) => b.email && b.locale && b.pseudo), "chaque e-mail a son destinataire, sa langue et son pseudo");
ok((await svc("select * from public.claim_email_batch(100)")).length === 0, "un e-mail réservé n'est pas repris tout de suite");
const w = batch.find((b) => b.template === "welcome");
await svc("select public.finish_email($1, 'sent')", [w.id]);
const f = batch.find((b) => b.id !== w.id);
await svc("select public.finish_email($1, 'failed', 'timeout')", [f.id]);
const st = (await db.query("select id, status, sent_at, last_error from public.email_outbox where id in ($1, $2) order by id", [w.id, f.id])).rows;
ok(st.find((x) => x.id === w.id).status === "sent" && st.find((x) => x.id === w.id).sent_at, "e-mail envoyé marqué « sent »");
ok(st.find((x) => x.id === f.id).status === "queued" && st.find((x) => x.id === f.id).last_error === "timeout", "échec : remis en file pour un nouvel essai");
await expectError(as(D, "select * from public.claim_email_batch(10)"), "permission denied", "la file n'est pas accessible depuis le navigateur");
// Parrainage suspendu puis attribué par l'équipe → e-mail au parrain
const susp = (await db.query("insert into public.point_events (user_id, kind, source_id, points, status) values ($1, 'referral', $2, 50, 'suspended') returning id", [G, F])).rows[0].id;
const before11 = (await db.query("select count(*)::int n from public.email_outbox where template = 'referral_awarded' and user_id = $1", [G])).rows[0].n;
await rpc(D, "admin_set_point_status", { p_event_id: susp, p_status: "awarded", p_reason: "Vérifié manuellement" });
const after11 = (await db.query("select count(*)::int n from public.email_outbox where template = 'referral_awarded' and user_id = $1", [G])).rows[0].n;
ok(after11 === before11 + 1, "parrainage débloqué par l'équipe : e-mail « parrainage validé » mis en file");

console.log("\n18. Axe des inscriptions (migration 12)");
const ov12 = await rpc(D, "admin_overview", { p_days: 30 });
const today = new Date().toISOString().slice(0, 10);
ok(ov12.daily.length === 30 && ov12.daily[0].day === today && ov12.daily[0].total > 0, "campagne d'un jour : la première barre (à gauche) est aujourd'hui");
ok(ov12.daily[1].future === true && ov12.daily[29].total === 0, "les jours suivants sont vides et marqués « à venir »");
await db.query("update public.profiles set created_at = now() - interval '45 days' where id = $1", [A]);
const ov12b = await rpc(D, "admin_overview", { p_days: 30 });
ok(ov12b.daily[29].day === today && ov12b.daily.every((d) => !d.future), "campagne plus longue que la période : les 30 derniers jours, aujourd'hui à droite");

console.log("\n19. Votes à 5 points, ville du membre, classement strict (migration 14)");
const H = await newAnonUser(); await register(H, "Hawa Diallo", { email: "hawa@gmail.com" });
const shopP = (await rpc(G, "propose_shop", { p_name: "Salon Nappy Queen", p_category: "hair_salon", p_address: "8 rue Polonceau, Paris", p_city_id: paris, p_lat: 48.8862, p_lng: 2.3532 })).shop_id;
ok((await db.query("select count(*)::int n from public.point_events where kind='vote' and user_id=$1", [G])).rows[0].n === 0, "le soutien automatique de l'auteur ne rapporte pas de points de vote");
await rpc(H, "toggle_shop_vote", { p_shop_id: shopP });
ok((await total(H)) === 175, "vote → +5 points immédiatement");
await rpc(H, "toggle_shop_vote", { p_shop_id: shopP });
ok((await total(H)) === 170, "vote retiré → −5");
await rpc(H, "toggle_shop_vote", { p_shop_id: shopP });
ok((await total(H)) === 175 && (await db.query("select count(*)::int n from public.point_events where kind='vote' and user_id=$1", [H])).rows[0].n === 1, "revote → points rendus, sans doublon dans le registre");
await expectError(rpc(H, "toggle_shop_vote", { p_shop_id: created.shop_id }), "not_my_city", "vote hors de sa ville refusé");
await rpc(D, "admin_review_shop", { p_shop_id: shopP, p_decision: "reject" });
ok((await total(H)) === 170, "commerce refusé → points des votes retirés");
await db.query("update public.shops set status = 'validated' where id = $1", [shopP]);
ok((await total(H)) === 175, "refus annulé par l'équipe → points rendus");
const hist = (await rpc(H, "get_my_dashboard")).history.find((x) => x.kind === "vote");
ok(hist && hist.label === "Salon Nappy Queen" && hist.points === 5, "historique : vote · Salon Nappy Queen · +5");
await expectError(as(H, "select public.vote_source_id($1, $1)", [H]), "permission denied", "fonction interne non appelable");
await db.query("update public.profiles set verified_at = now() - interval '1 hour' where id = $1", [H]);
const I = await newAnonUser(); await register(I, "Issa Traoré", { email: "issa@gmail.com" });
await rpc(I, "toggle_shop_vote", { p_shop_id: shopP });
const lb = await as(null, "select * from public.get_leaderboard(null, 50, 0)");
const rH = Number(lb.find((r) => r.pseudo === "Hawa D.").rank), rI = Number(lb.find((r) => r.pseudo === "Issa T.").rank);
ok(rH === rI - 1, "175 points chacun : hawa_d (validée plus tôt) juste devant issa_t");
ok(new Set(lb.map((r) => Number(r.rank))).size === lb.length, "aucun rang partagé dans tout le classement");

console.log("\n20. Chiffres publics (migration 15)");
const pub15 = await rpc(null, "get_public_stats");
ok(Number(pub15.members) >= 5 && Number(pub15.countries) === 1 && pub15.latest.length === 5, `compteur public : ${pub15.members} inscrits, ${pub15.countries} pays`);
ok(pub15.latest.every((x) => /^\S+ \S\.$/.test(x.name) && !("city" in x)), "derniers inscrits : « Prénom N. », sans ville");
ok(Number(pub15.today) >= 1, "inscrits validés aujourd'hui");
const nm = await rpc(B ? A : A, "get_my_name");
ok(nm.first_name === "Amina" && nm.last_name === "Kouassi", "le membre lit son prénom et son nom");
const det15 = await rpc(D, "admin_member_detail", { p_user: A });
ok(det15.first_name === "Amina" && det15.last_name === "Kouassi", "fiche admin : nom complet");
const found15 = await as(D, "select * from public.admin_list_members('Kouassi', null, null, null, false, 50, 0)");
ok(found15.length === 1 && found15[0].pseudo === "Amina Kouassi", "recherche admin par nom de famille");

await expectError(rpc(A, "set_my_city", PARIS), "city_locked", "ville verrouillée après la validation");
await rpc(A, "mark_password_set");
ok((await rpc(A, "get_my_name")).password_set === true, "mot de passe marqué comme choisi");
await expectError(as(null, "select public.mark_password_set()"), "permission denied", "mark_password_set fermé aux visiteurs");

console.log(`\n${passed} réussis, ${failed} échoués`);
process.exit(failed ? 1 : 0);
