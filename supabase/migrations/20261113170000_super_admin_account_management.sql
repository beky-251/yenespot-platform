create or replace function public.manage_administrator_role(
  target_user_id uuid,
  new_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_role text;
  role_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role('super_admin') then
    raise exception 'Only super administrators can manage administrator roles';
  end if;

  if new_role is null or new_role not in ('customer', 'admin') then
    raise exception 'Invalid target role';
  end if;

  if target_user_id is null then
    raise exception 'Target user is required';
  end if;

  perform 1
  from public.profiles
  where id = target_user_id
  for update;

  if not found then
    raise exception 'Target user does not exist';
  end if;

  select count(*), min(role)
  into role_count, current_role
  from public.user_roles
  where user_id = target_user_id;

  if role_count <> 1 then
    raise exception 'Target user must have exactly one role';
  end if;

  if current_role not in ('customer', 'admin') then
    raise exception 'This account role cannot be changed here';
  end if;

  if current_role = new_role then
    raise exception 'Target user already has this role';
  end if;

  delete from public.user_roles
  where user_id = target_user_id
    and role = current_role;

  insert into public.user_roles (user_id, role)
  values (target_user_id, new_role);

  return jsonb_build_object(
    'user_id', target_user_id,
    'previous_role', current_role,
    'new_role', new_role
  );
end;
$$;

revoke all on function public.manage_administrator_role(uuid, text) from public;
revoke all on function public.manage_administrator_role(uuid, text) from anon;
grant execute on function public.manage_administrator_role(uuid, text) to authenticated;