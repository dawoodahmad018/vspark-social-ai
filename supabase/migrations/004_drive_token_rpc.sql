-- Apply after 003. Adds only service-role token RPC; no existing table changes.
begin;
create function public.drive_connection(p_user_id text, p_action text, p_token text default null, p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  if p_user_id is null or char_length(p_user_id) not between 1 and 128 then raise exception 'Invalid owner'; end if;
  if p_action='read' then
    select jsonb_build_object('encrypted_token',encrypted_token,'expires_at',expires_at)
    into result from private.google_connections where user_id=p_user_id;
    return result;
  elsif p_action='write' then
    if p_token is null then raise exception 'Missing encrypted token'; end if;
    insert into private.google_connections(user_id,encrypted_token,expires_at)
    values(p_user_id,p_token,p_expires_at) on conflict(user_id) do update
      set encrypted_token=excluded.encrypted_token,expires_at=excluded.expires_at,updated_at=now();
  elsif p_action='delete' then
    delete from private.google_connections where user_id=p_user_id;
  else raise exception 'Invalid action'; end if;
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.drive_connection(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.drive_connection(text,text,text,timestamptz) to service_role;
commit;
