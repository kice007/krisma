-- =============================================================================
-- KRISMA · Suppression des données de TEST (avant le lancement public)
-- Supprime les comptes @test.krisma.io (profils, questionnaires, points et votes
-- suivent par cascade), les commerces de test et les villes créées pour le test
-- qui ne servent plus à personne.
-- =============================================================================

begin;

delete from public.shops
 where details like '[test]%'
    or proposed_by in (select id from auth.users where email like '%@test.krisma.io');

delete from auth.users where email like '%@test.krisma.io';

delete from public.cities c
 where c.source = 'test'
   and not exists (select 1 from public.profiles p where p.city_id = c.id)
   and not exists (select 1 from public.shops s where s.city_id = c.id);

commit;

select
  (select count(*) from auth.users where email like '%@test.krisma.io') as comptes_test_restants,
  (select count(*) from public.shops where details like '[test]%') as commerces_test_restants;
