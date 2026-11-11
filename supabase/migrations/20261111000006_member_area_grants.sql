-- =============================================================================
-- KRISMA · Waitlist — 6 : droits d'appel des fonctions de la migration 5
--
-- Sur Supabase, une fonction créée hérite du droit EXECUTE pour PUBLIC (donc
-- pour les visiteurs « anon »), malgré la révocation par défaut de la
-- migration 3. Ces trois fonctions refusaient déjà d'agir sans session
-- (« not_authenticated ») ; on retire tout de même l'accès aux visiteurs.
-- Règle pour la suite : chaque nouvelle fonction commence par
-- « revoke execute ... from public, anon » avant ses « grant ».
-- =============================================================================

revoke execute on function
  public.update_my_pseudo(text),
  public.update_my_settings(text, boolean, boolean),
  public.delete_my_account()
from public, anon;

grant execute on function
  public.update_my_pseudo(text),
  public.update_my_settings(text, boolean, boolean),
  public.delete_my_account()
to authenticated;
