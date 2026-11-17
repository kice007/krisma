-- =============================================================================
-- KRISMA · Migration 18 : double authentification obligatoire pour l'équipe
--
-- Les droits d'équipe (is_staff, is_admin, is_super_admin) ne sont accordés
-- que si la session a été confirmée par un code d'application d'authentification
-- (niveau « aal2 » dans le jeton Supabase). Un lien magique seul (aal1) ne
-- suffit plus : un accès à la boîte mail d'un membre de l'équipe ne donne plus
-- accès aux données.
-- my_staff_role() reste lisible en aal1 : l'admin sait ainsi qu'il doit
-- demander le code (ou enregistrer l'application la première fois).
-- =============================================================================

-- Niveau d'authentification de la session en cours.
create or replace function public.session_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.session_aal2()
     and exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.session_aal2()
     and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'super_admin'));
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.session_aal2()
     and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'super_admin');
$$;

revoke execute on function public.session_aal2() from public, anon, authenticated;
