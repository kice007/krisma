-- =============================================================================
-- KRISMA · Migration 19 : plafonds globaux du chat (anti-inondation)
--
-- En plus des limites par conversation et par IP (migration 17), le chat
-- refuse les messages au-delà de plafonds globaux, pour qu'un réseau de
-- machines (beaucoup d'IP différentes) ne puisse pas remplir la base :
-- - 60 nouvelles conversations anonymes par tranche de 10 minutes ;
-- - 300 messages de visiteurs par tranche de 10 minutes.
-- Les réponses de l'équipe ne sont jamais bloquées.
-- =============================================================================

create or replace function public.chat_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'chat_threads' then
    if new.user_id is null and (
      select count(*) from public.chat_threads t
       where t.user_id is null and t.created_at > now() - interval '10 minutes') >= 60 then
      raise exception 'rate_limited';
    end if;
  elsif new.sender = 'visitor' then
    if (select count(*) from public.chat_messages m
         where m.sender = 'visitor' and m.created_at > now() - interval '10 minutes') >= 300 then
      raise exception 'rate_limited';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.chat_flood_guard() from public, anon, authenticated;

create index if not exists chat_threads_created_idx on public.chat_threads (created_at);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at) where sender = 'visitor';

drop trigger if exists chat_threads_flood on public.chat_threads;
create trigger chat_threads_flood before insert on public.chat_threads
  for each row execute function public.chat_flood_guard();

drop trigger if exists chat_messages_flood on public.chat_messages;
create trigger chat_messages_flood before insert on public.chat_messages
  for each row execute function public.chat_flood_guard();
