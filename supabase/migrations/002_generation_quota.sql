begin;
create table public.generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  requests integer not null default 0,
  primary key(user_id,bucket,window_start)
);
alter table public.generation_usage enable row level security;
revoke all on public.generation_usage from public,anon,authenticated;
create function public.claim_generation_slot() returns boolean
language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); claimed integer;
begin
  if uid is null then return false; end if;
  insert into public.generation_usage(user_id,bucket,window_start,requests)
  values(uid,'minute',date_trunc('minute',now()),1)
  on conflict(user_id,bucket,window_start) do update set requests=public.generation_usage.requests+1
    where public.generation_usage.requests<3;
  get diagnostics claimed=row_count;
  if claimed=0 then return false; end if;
  insert into public.generation_usage(user_id,bucket,window_start,requests)
  values(uid,'day',date_trunc('day',now()),1)
  on conflict(user_id,bucket,window_start) do update set requests=public.generation_usage.requests+1
    where public.generation_usage.requests<40;
  get diagnostics claimed=row_count;
  return claimed=1;
end $$;
revoke all on function public.claim_generation_slot() from public,anon;
grant execute on function public.claim_generation_slot() to authenticated;
grant all on public.posts,public.notification_preferences to service_role;
commit;
