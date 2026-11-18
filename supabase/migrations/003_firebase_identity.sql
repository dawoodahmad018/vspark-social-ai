-- Apply AFTER 001 and 002. Firebase UIDs are strings, not auth.users UUIDs.
-- Requires Supabase Authentication > Third-party Auth > Firebase project configured.
-- Firebase users must receive role=authenticated through trusted Admin tooling.
begin;
drop policy posts_select on public.posts;
drop policy posts_insert on public.posts;
drop policy posts_update on public.posts;
drop policy posts_delete on public.posts;
drop policy preferences_owner on public.notification_preferences;
drop policy assets_read on storage.objects;
drop policy assets_insert on storage.objects;
drop policy assets_update on storage.objects;
drop policy assets_delete on storage.objects;

alter table public.posts drop constraint posts_user_id_fkey, alter column user_id drop default;
alter table public.notification_preferences drop constraint notification_preferences_user_id_fkey, alter column user_id drop default;
alter table public.notification_dispatches drop constraint notification_dispatches_user_id_fkey;
alter table public.generation_usage drop constraint generation_usage_user_id_fkey;
alter table private.google_connections drop constraint google_connections_user_id_fkey;
alter table public.posts alter column user_id type text using user_id::text;
alter table public.notification_preferences alter column user_id type text using user_id::text;
alter table public.notification_dispatches alter column user_id type text using user_id::text;
alter table public.generation_usage alter column user_id type text using user_id::text;
alter table private.google_connections alter column user_id type text using user_id::text;

-- Supabase verifies issuer/audience/signature against the configured Firebase project.
-- Reject non-Firebase sessions even if they have the authenticated role.
create function public.request_user_id() returns text language sql stable
set search_path = '' as $$
  select case when auth.jwt()->>'iss' = 'https://securetoken.google.com/' || (auth.jwt()->>'aud')
    and coalesce(auth.jwt()->>'sub','') <> '' then auth.jwt()->>'sub' else null end
$$;
revoke all on function public.request_user_id() from public,anon;
grant execute on function public.request_user_id() to authenticated;
alter table public.posts alter column user_id set default public.request_user_id();
alter table public.notification_preferences alter column user_id set default public.request_user_id();
create policy posts_select on public.posts for select to authenticated using ((select public.request_user_id()) = user_id);
create policy posts_insert on public.posts for insert to authenticated with check ((select public.request_user_id()) = user_id);
create policy posts_update on public.posts for update to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy posts_delete on public.posts for delete to authenticated using ((select public.request_user_id()) = user_id);
create policy preferences_owner on public.notification_preferences for all to authenticated using ((select public.request_user_id()) = user_id) with check ((select public.request_user_id()) = user_id);
create policy assets_read on storage.objects for select to authenticated using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select public.request_user_id()));
create policy assets_insert on storage.objects for insert to authenticated with check (bucket_id='post-assets' and (storage.foldername(name))[1]=(select public.request_user_id()));
create policy assets_update on storage.objects for update to authenticated using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select public.request_user_id())) with check (bucket_id='post-assets' and (storage.foldername(name))[1]=(select public.request_user_id()));
create policy assets_delete on storage.objects for delete to authenticated using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select public.request_user_id()));

create or replace function public.claim_generation_slot() returns boolean
language plpgsql security definer set search_path='' as $$
declare uid text := public.request_user_id(); claimed integer;
begin
  if uid is null then return false; end if;
  insert into public.generation_usage(user_id,bucket,window_start,requests)
  values(uid,'minute',date_trunc('minute',now()),1)
  on conflict(user_id,bucket,window_start) do update set requests=public.generation_usage.requests+1 where public.generation_usage.requests<3;
  get diagnostics claimed=row_count;
  if claimed=0 then return false; end if;
  insert into public.generation_usage(user_id,bucket,window_start,requests)
  values(uid,'day',date_trunc('day',now()),1)
  on conflict(user_id,bucket,window_start) do update set requests=public.generation_usage.requests+1 where public.generation_usage.requests<40;
  get diagnostics claimed=row_count;
  return claimed=1;
end $$;
commit;
