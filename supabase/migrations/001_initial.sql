-- Lead-owned migration. Run once in Supabase SQL Editor on a new project.
begin;
create extension if not exists pgcrypto;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 3 and 1000),
  caption text not null check (char_length(caption) between 1 and 5000),
  platform text not null check (platform in ('instagram','linkedin','x')),
  scheduled_at timestamptz,
  timezone text not null default 'Asia/Karachi',
  status text not null default 'draft' check (status in ('draft','scheduled','archived')),
  drive_file_id text,
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'scheduled' or scheduled_at is not null),
  check (attachment_path is null or split_part(attachment_path, '/', 1) = user_id::text)
);
create index posts_user_created on public.posts(user_id,created_at desc);
create index posts_due on public.posts(scheduled_at) where status = 'scheduled';
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end $$;
create trigger touch_posts before update on public.posts for each row execute function public.touch_updated_at();
alter table public.posts enable row level security;
create policy posts_select on public.posts for select to authenticated using ((select auth.uid()) = user_id);
create policy posts_insert on public.posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy posts_update on public.posts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy posts_delete on public.posts for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.posts from anon, authenticated;
grant select,delete on public.posts to authenticated;
grant insert(user_id,prompt,caption,platform,scheduled_at,timezone,status,attachment_path) on public.posts to authenticated;
grant update(prompt,caption,platform,scheduled_at,timezone,status,attachment_path) on public.posts to authenticated;

create table public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  recipient_email text not null check (char_length(recipient_email) between 3 and 254),
  lead_minutes integer not null default 0 check (lead_minutes between 0 and 1440),
  include_caption boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger touch_preferences before update on public.notification_preferences for each row execute function public.touch_updated_at();
alter table public.notification_preferences enable row level security;
create policy preferences_owner on public.notification_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.notification_preferences from anon,authenticated;
grant select,insert,update,delete on public.notification_preferences to authenticated;

create table public.notification_dispatches (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_for timestamptz not null,
  recipient_email text not null,
  post_version timestamptz not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','sending','accepted','delivered','failed','canceled','uncertain')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  locked_until timestamptz,
  provider_id text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(post_id,scheduled_for,recipient_email)
);
alter table public.notification_dispatches enable row level security;
revoke all on public.notification_dispatches from anon,authenticated;
grant all on public.notification_dispatches to service_role;
create index dispatches_due on public.notification_dispatches(status,next_attempt_at);

-- Caller must first enqueue jobs derived from current owned posts/preferences.
-- Expired sending leases become UNCERTAIN, never blindly retried after a timeout.
create function public.claim_notification_dispatches(batch_size integer default 20)
returns setof public.notification_dispatches language plpgsql security definer set search_path = '' as $$
begin
  update public.notification_dispatches set status='uncertain', updated_at=now()
    where status='sending' and locked_until < now();
  return query
  with ready as (
    select id from public.notification_dispatches
    where status in ('pending','failed') and attempts < 5 and next_attempt_at <= now()
    order by next_attempt_at for update skip locked limit least(greatest(batch_size,1),50)
  )
  update public.notification_dispatches d
    set status='sending', attempts=d.attempts+1, lease_token=gen_random_uuid(),
        locked_until=now()+interval '5 minutes', updated_at=now()
    from ready where d.id=ready.id returning d.*;
end $$;
revoke all on function public.claim_notification_dispatches(integer) from public,anon,authenticated;
grant execute on function public.claim_notification_dispatches(integer) to service_role;

create function public.complete_notification_dispatch(job_id uuid, token uuid, result_status text, provider_reference text default null, error_code text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if result_status not in ('accepted','failed','canceled','uncertain') then raise exception 'Invalid completion status'; end if;
  update public.notification_dispatches set status=result_status, provider_id=provider_reference,
    last_error_code=error_code, next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,attempts)::integer)),
    locked_until=null, updated_at=now()
    where id=job_id and lease_token=token and status='sending' and locked_until>=now();
  get diagnostics changed = row_count;
  return changed=1;
end $$;
revoke all on function public.complete_notification_dispatch(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_notification_dispatch(uuid,uuid,text,text,text) to service_role;

create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table private.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_token text not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table private.google_connections enable row level security;
revoke all on private.google_connections from public,anon,authenticated;
-- D must add reviewed service-role-only RPCs; do not expose this schema publicly.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('post-assets','post-assets',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=5242880,
 allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];
create policy assets_read on storage.objects for select to authenticated
using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assets_insert on storage.objects for insert to authenticated
with check (bucket_id='post-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assets_update on storage.objects for update to authenticated
using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='post-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assets_delete on storage.objects for delete to authenticated
using (bucket_id='post-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
