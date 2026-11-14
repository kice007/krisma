-- =============================================================================
-- KRISMA · Données de TEST (à supprimer avant le lancement : test-data-cleanup.sql)
--
-- Tous les comptes de test ont une adresse en @test.krisma.io. Les villes créées
-- ici ont source = 'test'. Aucun e-mail n'est mis en file : on insère
-- directement (sans passer par finalize_registration / admin_review_shop).
--
-- Compte de démonstration connectable : demo@test.krisma.io / KrismaDemo2026
--
-- Relançable : le script supprime d'abord les données de test existantes.
-- =============================================================================

begin;

-- Nettoyage préalable (même logique que test-data-cleanup.sql)
delete from public.shops where proposed_by in (select id from auth.users where email like '%@test.krisma.io')
   or details like '[test]%';
delete from auth.users where email like '%@test.krisma.io';

do $$
declare
  -- ville : nom, code pays, nom du pays, lat, lng, nombre de membres
  v_cities jsonb := '[
    ["Paris","FR","France",48.8566,2.3522,16],
    ["Lyon","FR","France",45.7640,4.8357,7],
    ["Saint-Denis","FR","France",48.9362,2.3574,5],
    ["Montreuil","FR","France",48.8638,2.4485,4],
    ["Marseille","FR","France",43.2965,5.3698,5],
    ["Bordeaux","FR","France",44.8378,-0.5792,4],
    ["Lille","FR","France",50.6292,3.0573,4],
    ["Toulouse","FR","France",43.6047,1.4442,3],
    ["Bruxelles","BE","Belgique",50.8503,4.3517,5],
    ["Montréal","CA","Canada",45.5017,-73.5673,5],
    ["Londres","GB","Royaume-Uni",51.5072,-0.1276,3],
    ["Nantes","FR","France",47.2184,-1.5536,2],
    ["Strasbourg","FR","France",48.5734,7.7521,1]
  ]';
  v_people text[][] := array[
    ['Awa','Koné'],['Aminata','Diallo'],['Youssef','Benali'],['Kofi','Asante'],['Fatou','Sow'],['Mamadou','Traoré'],
    ['Yasmine','El Amrani'],['Ibrahim','Keïta'],['Mariam','Diakité'],['Karim','Haddad'],['Adjoa','Mensah'],['Moussa','Coulibaly'],
    ['Leïla','Bouzid'],['Serge','Kouassi'],['Nadia','Cherif'],['Oumar','Ba'],['Salimata','Ouattara'],['Rachid','Mansouri'],
    ['Esther','Yao'],['Cheikh','Ndiaye'],['Inès','Belkacem'],['Christian','Ehouman'],['Bintou','Camara'],['Mehdi','Zerrouki'],
    ['Grâce','Nguessan'],['Amadou','Barry'],['Sarah','Kaboré'],['Hamza','Tazi'],['Rokia','Sanogo'],['Jean-Marc','Tano'],
    ['Khadija','Benjelloun'],['Ousmane','Sylla'],['Mariama','Bah'],['Bilal','Toumi'],['Aïcha','Konaté'],['Didier','Gnagne'],
    ['Nour','Haddad'],['Seydou','Diarra'],['Djeneba','Touré'],['Ali','Benyoucef'],['Prisca','Akissi'],['Lamine','Fofana'],
    ['Samira','Ouali'],['Eric','Kouamé'],['Hawa','Cissé'],['Omar','Lahlou'],['Ruth','Adjoumani'],['Ismaël','Dembélé'],
    ['Zineb','Alaoui'],['Patrick','Zadi'],['Kadiatou','Sangaré'],['Anas','Bennani'],['Marie','Gbagbo'],['Abdoulaye','Kane'],
    ['Sofia','Rahmani'],['Yves','Brou'],['Assétou','Coulibaly'],['Nabil','Saïdi'],['Clarisse','Ahoua'],['Boubacar','Diop'],
    ['Lina','Meziane'],['Arsène','Kra'],['Fanta','Doumbia'],['Walid','Chaoui']
  ];
  v_shops jsonb := '[
    ["Paris","Épicerie Chez Awa","grocery","14 rue Myrha"],
    ["Paris","Salon Nappy Queen","hair_salon","8 rue Polonceau"],
    ["Paris","Restaurant Le Baobab","restaurant","52 rue de Belleville"],
    ["Paris","Boucherie Al Baraka","butcher","31 rue Doudeauville"],
    ["Paris","Boulangerie Teranga","bakery","19 rue des Poissonniers"],
    ["Paris","Afro Market Château-Rouge","grocery","3 rue Poulet"],
    ["Paris","Chez Tantie Rose","restaurant","27 rue Myrha"],
    ["Paris","Coiffure Wax & Style","hair_salon","66 boulevard Barbès"],
    ["Paris","Le Petit Dakar","restaurant","6 rue Élisabeth Pitt"],
    ["Lyon","Saveurs d’Abidjan","restaurant","12 cours Gambetta"],
    ["Lyon","Épicerie Tropicale Guillotière","grocery","40 rue de Marseille"],
    ["Lyon","Boucherie du Maghreb","butcher","7 place Gabriel Péri"],
    ["Lyon","Salon Kitoko","hair_salon","88 grande rue de la Guillotière"],
    ["Saint-Denis","Marché d’Afrique","grocery","5 rue de la République"],
    ["Saint-Denis","Le Maquis du 93","restaurant","21 rue Gabriel Péri"],
    ["Saint-Denis","Boucherie Halal Basilique","butcher","2 rue de Strasbourg"],
    ["Montreuil","Chez Fatou Traiteur","restaurant","118 rue de Paris"],
    ["Montreuil","Épicerie Sahel","grocery","44 boulevard Rouget de Lisle"],
    ["Marseille","Restaurant La Medina","restaurant","9 rue d’Aubagne"],
    ["Marseille","Épicerie Noailles","grocery","15 rue Longue des Capucins"],
    ["Marseille","Boulangerie Belsunce","bakery","30 cours Belsunce"],
    ["Bordeaux","Le Comptoir Ivoirien","restaurant","17 cours de la Marne"],
    ["Bordeaux","Afro Beauté Capucins","hair_salon","4 place des Capucins"],
    ["Lille","Épicerie Wazemmes","grocery","61 rue des Sarrazins"],
    ["Lille","Le Yassa","restaurant","22 rue Léon Gambetta"],
    ["Toulouse","Boucherie Arnaud-Bernard","butcher","10 place Arnaud-Bernard"],
    ["Toulouse","Salon Black Beauty","hair_salon","35 rue des Lois"],
    ["Bruxelles","Matonge Market","grocery","12 chaussée de Wavre"],
    ["Bruxelles","Restaurant Inzia","restaurant","37 rue Longue Vie"],
    ["Bruxelles","Coiffure Kinshasa","hair_salon","5 galerie d’Ixelles"],
    ["Montréal","Épicerie Côte-des-Neiges","grocery","5200 chemin de la Côte-des-Neiges"],
    ["Montréal","Le Nil Bleu","restaurant","3706 rue Saint-Denis"],
    ["Montréal","Boucherie Atlas","butcher","6820 rue Saint-Hubert"],
    ["Londres","Peckham Afro Foods","grocery","88 Rye Lane"],
    ["Londres","Suya Spot","restaurant","14 Brixton Road"],
    ["Nantes","Épicerie Bouffay","grocery","3 rue de la Juiverie"],
    ["Strasbourg","Restaurant Le Sénégal","restaurant","9 rue des Juifs"]
  ]';
  v_status text[] := array['proposed','validated','contacted','partner','cashback_active','validated','proposed','rejected','validated','cashback_active','contacted'];
  c jsonb;
  s jsonb;
  i int := 0;
  k int;
  n int;
  v_city uuid;
  v_uid uuid;
  v_ids uuid[] := '{}';
  v_city_of uuid[] := '{}';
  v_status_of text[] := '{}';
  v_shop uuid;
  v_first_paris uuid;
  v_st text;
  v_verified timestamptz;
  v_ref uuid;
  v_voter uuid;
  v_proposer uuid;
  v_city_members uuid[];
  v_total int := array_length(v_people, 1);
begin
  perform setseed(0.42);

  -- Villes (réutilise celles qui existent déjà)
  create temp table t_city (name text primary key, id uuid, lat float8, lng float8, members int) on commit drop;
  for c in select * from jsonb_array_elements(v_cities) loop
    select id into v_city from public.cities where lower(name) = lower(c->>0) and country_code = c->>1 limit 1;
    if v_city is null then
      insert into public.cities (name, country_code, country_name, lat, lng, source, source_ref)
      values (c->>0, c->>1, c->>2, (c->>3)::float8, (c->>4)::float8, 'test', 'test/' || lower(c->>0))
      returning id into v_city;
    end if;
    insert into t_city values (c->>0, v_city, (c->>3)::float8, (c->>4)::float8, (c->>5)::int);
    v_city := null;
  end loop;

  -- Membres : comptes Auth + profils + questionnaires
  for c in select to_jsonb(t) from t_city t order by members desc loop
    for k in 1 .. (c->>'members')::int loop
      i := i + 1;
      exit when i > v_total;
      v_uid := gen_random_uuid();
      -- statut : les derniers sont en cours d'inscription, deux sont suspendus
      v_st := case
        when i in (v_total, v_total - 7, v_total - 15, v_total - 23) then 'draft'
        when i in (v_total - 3, v_total - 11, v_total - 19) then 'questionnaire_done'
        when i in (12, 37) then 'suspended'
        else 'verified' end;
      v_verified := now() - make_interval(days => (random() * 20)::int, hours => (random() * 23)::int, mins => (random() * 59)::int);

      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                              created_at, updated_at, last_sign_in_at, confirmation_token, recovery_token, email_change_token_new, email_change,
                              email_change_token_current, phone_change_token, reauthentication_token, is_anonymous)
      values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
              case when i = 1 then 'demo@test.krisma.io' else lower(translate(v_people[i][1], 'éèëïîçâ''-', 'eeeiica')) || '.' || i || '@test.krisma.io' end,
              case when i = 1 then extensions.crypt('KrismaDemo2026', extensions.gen_salt('bf')) else '' end,
              case when v_st in ('verified', 'suspended') then v_verified end,
              '{"provider":"email","providers":["email"]}', jsonb_build_object('locale', 'fr', 'pseudo', v_people[i][1]),
              v_verified - interval '20 minutes', v_verified, v_verified, '', '', '', '', '', '', '', false);
      if i = 1 then
        insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (v_uid::text, v_uid, jsonb_build_object('sub', v_uid::text, 'email', 'demo@test.krisma.io', 'email_verified', true), 'email', now(), now(), now());
      end if;

      -- parrain : un membre déjà validé (≈ 40 %)
      v_ref := null;
      if i > 6 and random() < 0.4 then
        v_ref := v_ids[1 + floor(random() * least(array_length(v_ids, 1), i - 1))::int];
      end if;

      insert into public.profiles (id, pseudo, first_name, last_name, locale, city_id, referred_by, status, consent_rules_at,
                                   consent_marketing, consent_marketing_at, questionnaire_completed_at, verified_at,
                                   suspended_at, suspension_reason, created_at, notify_points, password_set_at)
      values (v_uid, 'x', v_people[i][1], v_people[i][2], case when (c->>'name') in ('Londres', 'Montréal') and random() < 0.5 then 'en' else 'fr' end,
              (c->>'id')::uuid, v_ref, v_st::public.profile_status, v_verified - interval '20 minutes',
              random() < 0.6, case when random() < 0.6 then v_verified end,
              case when v_st <> 'draft' then v_verified - interval '5 minutes' end,
              case when v_st in ('verified', 'suspended') then v_verified end,
              case when v_st = 'suspended' then v_verified + interval '2 days' end,
              case when v_st = 'suspended' then 'Parrainages suspects (test)' end,
              v_verified - interval '20 minutes', random() < 0.85,
              case when v_st = 'verified' then v_verified end);

      insert into public.questionnaire_responses (user_id, situation, receive_frequency, receive_countries, send_frequency, send_countries,
             interest_transfers, local_shop_frequency, local_shop_spend, interest_cashback, services, willing_to_pay, usage_intent)
      values (v_uid,
        (array['student','employee','entrepreneur','job_seeker','other'])[1 + floor(random() * 5)::int],
        (array['several_per_month','monthly','few_per_year','rarely','never'])[1 + floor(random() * 5)::int],
        string_to_array((array['CI,SN','CI,ML','MA,DZ','CM,GA','SN,GN'])[1 + floor(random() * 5)::int], ','),
        (array['several_per_month','monthly','few_per_year','rarely','never'])[1 + floor(random() * 5)::int],
        string_to_array((array['CI','SN','MA','CM','ML,BF'])[1 + floor(random() * 5)::int], ','),
        case when v_st = 'draft' then null else (array['very','fairly','slightly','not_at_all','unsure'])[1 + floor(random() * 3)::int] end,
        case when v_st = 'draft' then null else (array['daily','several_per_week','weekly','few_per_month','rarely_never'])[1 + floor(random() * 5)::int] end,
        case when v_st = 'draft' then null else (array['lt_50','50_99','100_249','250_499','gte_500','unknown'])[1 + floor(random() * 6)::int] end,
        case when v_st = 'draft' then null else (array['very','fairly','slightly','not_at_all','unsure'])[1 + floor(random() * 3)::int] end,
        case when v_st = 'draft' then '{}' else string_to_array((array['account_card,cashback','send_to_africa','all','receive_from_africa,cashback','account_card,send_to_africa'])[1 + floor(random() * 5)::int], ',') end,
        case when v_st = 'draft' then null else (array['yes','maybe','no'])[1 + floor(random() * 3)::int] end,
        case when v_st = 'draft' then null else (array['primary','secondary','unsure'])[1 + floor(random() * 3)::int] end);

      if v_st in ('verified', 'suspended') then
        insert into public.point_events (user_id, kind, source_id, points, status, awarded_at, created_at)
        values (v_uid, 'signup', v_uid, 170, 'awarded', v_verified, v_verified);
        -- parrainage : +50 au parrain (quelques-uns en vérification)
        if v_ref is not null then
          insert into public.point_events (user_id, kind, source_id, points, status, awarded_at, reason, created_at)
          values (v_ref, 'referral', v_uid, 50,
                  case when i % 9 = 0 then 'suspended' else 'awarded' end::public.point_status,
                  case when i % 9 = 0 then null else v_verified end,
                  case when i % 9 = 0 then 'Contrôle anti-fraude automatique' end, v_verified);
        end if;
        v_ids := v_ids || v_uid;
        v_city_of := v_city_of || (c->>'id')::uuid;
        v_status_of := v_status_of || v_st;
      end if;
      if i = 1 then v_first_paris := v_uid; end if;
    end loop;
  end loop;

  -- Commerces, points de proposition et votes
  n := 0;
  for s in select * from jsonb_array_elements(v_shops) loop
    n := n + 1;
    select id into v_city from t_city where name = s->>0;
    select array_agg(x.id) into v_city_members
      from unnest(v_ids, v_city_of, v_status_of) as x(id, city, st)
     where x.city = v_city and x.st = 'verified';
    continue when v_city_members is null;
    v_proposer := case when n in (1, 4) then v_first_paris else v_city_members[1 + floor(random() * array_length(v_city_members, 1))::int] end;
    v_st := v_status[1 + (n - 1) % array_length(v_status, 1)];
    v_verified := now() - make_interval(days => (random() * 15)::int, hours => (random() * 23)::int);

    insert into public.shops (name, category, address, city_id, lat, lng, details, status, partner_public, cashback_rate,
                              proposed_by, reviewed_at, review_note, created_at)
    select s->>1, (s->>2)::public.shop_category, (s->>3) || ', ' || (s->>0), v_city,
           t.lat + (random() - 0.5) * 0.04, t.lng + (random() - 0.5) * 0.06,
           '[test] ' || (array['Ouvert 7j/7', 'Produits d’Afrique de l’Ouest', 'Livraison possible', 'Tenu par une famille du quartier', 'Spécialités maghrébines'])[1 + floor(random() * 5)::int],
           v_st::public.shop_status,
           v_st in ('cashback_active') or (v_st = 'partner' and random() < 0.5),
           case when v_st = 'cashback_active' then (array[2, 3, 3.5, 4, 5])[1 + floor(random() * 5)::int] end,
           v_proposer,
           case when v_st <> 'proposed' then v_verified + interval '1 day' end,
           case when v_st = 'rejected' then 'Commerce fermé définitivement (test)' end,
           v_verified
      from t_city t where t.id = v_city
    returning id into v_shop;

    insert into public.point_events (user_id, kind, source_id, shop_id, points, status, awarded_at, reason, created_at)
    values (v_proposer, 'shop', v_shop, v_shop, 20,
            case v_st when 'proposed' then 'pending' when 'rejected' then 'revoked' else 'awarded' end::public.point_status,
            case when v_st not in ('proposed', 'rejected') then v_verified + interval '1 day' end,
            case when v_st = 'rejected' then 'Commerce refusé' end, v_verified);

    -- soutien automatique de l'auteur (sans points)
    insert into public.shop_votes (shop_id, user_id, created_at) values (v_shop, v_proposer, v_verified);

    -- votes des membres de la ville (+5 chacun), sauf commerces refusés
    if v_st <> 'rejected' then
      foreach v_voter in array v_city_members loop
        continue when v_voter = v_proposer or random() > 0.55;
        insert into public.shop_votes (shop_id, user_id, created_at) values (v_shop, v_voter, v_verified + interval '3 hours')
        on conflict do nothing;
        insert into public.point_events (user_id, kind, source_id, shop_id, points, status, awarded_at, created_at)
        values (v_voter, 'vote', public.vote_source_id(v_shop, v_voter), v_shop, 5, 'awarded', v_verified + interval '3 hours', v_verified + interval '3 hours')
        on conflict (kind, source_id) do nothing;
      end loop;
    end if;
  end loop;

  -- Un doublon proposé à Paris, classé par l'équipe
  select id into v_shop from public.shops where name = 'Épicerie Chez Awa' and details like '[test]%';
  insert into public.shops (name, category, address, city_id, lat, lng, details, status, duplicate_of, proposed_by, reviewed_at, created_at)
  select 'Epicerie chez Awa', 'grocery', '14 rue Myrha, Paris', city_id, lat + 0.0003, lng, '[test] doublon', 'duplicate', v_shop,
         v_city_members[1], now() - interval '1 day', now() - interval '2 days'
    from public.shops where id = v_shop;
end $$;

-- Sécurité : aucun e-mail de test en file
delete from public.email_outbox where user_id in (select id from auth.users where email like '%@test.krisma.io');

commit;

-- Récapitulatif
select
  (select count(*) from auth.users where email like '%@test.krisma.io') as comptes_test,
  (select count(*) from public.profiles p join auth.users u on u.id = p.id where u.email like '%@test.krisma.io' and p.status = 'verified') as valides,
  (select count(*) from public.shops where details like '[test]%') as commerces_test,
  (select count(*) from public.shop_votes v join public.shops s on s.id = v.shop_id where s.details like '[test]%') as votes,
  (select count(*) from public.point_events e join auth.users u on u.id = e.user_id where u.email like '%@test.krisma.io') as evenements_points,
  (select count(*) from public.cities where source = 'test') as villes_creees;
