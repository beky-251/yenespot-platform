begin;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
create index audit_logs_actor_user_id_idx
  on public.audit_logs (actor_user_id);
create index audit_logs_action_idx
  on public.audit_logs (action);

alter table public.audit_logs enable row level security;

revoke all on table public.audit_logs from public, anon, authenticated;
grant select on table public.audit_logs to authenticated;

create policy "Super administrators can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.has_role('super_admin'));

-- Record changes to business status and verification.
create or replace function public.log_business_audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_changes jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or not public.is_admin() then
    return new;
  end if;

  if old.status is distinct from new.status then
    v_changes := v_changes || jsonb_build_object(
      'status',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;

  if old.verified is distinct from new.verified then
    v_changes := v_changes || jsonb_build_object(
      'verified',
      jsonb_build_object('from', old.verified, 'to', new.verified)
    );
  end if;

  if v_changes <> '{}'::jsonb then
    insert into public.audit_logs (
      actor_user_id, action, entity_type, entity_id, details
    )
    values (
      auth.uid(),
      'business.updated',
      'business',
      new.id,
      jsonb_build_object('changes', v_changes)
    );
  end if;

  return new;
end;
$$;

revoke all on function public.log_business_audit_changes() from public, anon, authenticated;

create trigger businesses_audit_changes
  after update of status, verified on public.businesses
  for each row
  when (
    old.status is distinct from new.status
    or old.verified is distinct from new.verified
  )
  execute function public.log_business_audit_changes();

-- Preserve application approval behavior and record the approval atomically.
create or replace function public.approve_business_owner_application(
  p_application_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_application public.business_owner_applications%rowtype;
  v_business_id uuid;
  v_slug text;
  v_role_count integer;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only administrators can approve applications';
  end if;

  select *
  into v_application
  from public.business_owner_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if v_application.status <> 'pending' then
    raise exception 'This application has already been reviewed';
  end if;

  select count(*)
  into v_role_count
  from public.user_roles
  where user_id = v_application.user_id;

  if v_role_count <> 1
     or not exists (
       select 1
       from public.user_roles
       where user_id = v_application.user_id
         and role = 'customer'
     ) then
    raise exception 'Applicant must have exactly one customer role';
  end if;

  v_slug :=
    coalesce(
      nullif(
        trim(
          both '-' from regexp_replace(
            lower(v_application.business_name),
            '[^a-z0-9]+',
            '-',
            'g'
          )
        ),
        ''
      ),
      'business'
    )
    || '-'
    || left(v_application.id::text, 8);

  insert into public.businesses (
    owner_id,
    category_id,
    name,
    slug,
    description,
    phone,
    email,
    website,
    address,
    city,
    neighborhood,
    status,
    verified
  )
  values (
    v_application.user_id,
    v_application.category_id,
    v_application.business_name,
    v_slug,
    v_application.description,
    v_application.phone,
    v_application.email,
    v_application.website,
    v_application.address,
    v_application.city,
    v_application.neighborhood,
    'pending',
    false
  )
  returning id into v_business_id;

  delete from public.user_roles
  where user_id = v_application.user_id
    and role = 'customer';

  insert into public.user_roles (user_id, role)
  values (v_application.user_id, 'business_owner');

  update public.business_owner_applications
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    business_id = v_business_id,
    rejection_reason = null,
    updated_at = now()
  where id = p_application_id;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, details
  )
  values (
    auth.uid(),
    'business_application.approved',
    'business_owner_application',
    p_application_id,
    jsonb_build_object('business_id', v_business_id)
  );

  return v_business_id;
end;
$$;

-- Preserve application rejection behavior without copying the rejection reason
-- or other applicant-provided personal information into the audit log.
create or replace function public.reject_business_owner_application(
  p_application_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_application public.business_owner_applications%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only administrators can reject applications';
  end if;

  if p_reason is null
     or char_length(trim(p_reason)) = 0
     or char_length(trim(p_reason)) > 1000 then
    raise exception 'A rejection reason between 1 and 1000 characters is required';
  end if;

  select *
  into v_application
  from public.business_owner_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if v_application.status <> 'pending' then
    raise exception 'This application has already been reviewed';
  end if;

  update public.business_owner_applications
  set
    status = 'rejected',
    rejection_reason = trim(p_reason),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_application_id;

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, details
  )
  values (
    auth.uid(),
    'business_application.rejected',
    'business_owner_application',
    p_application_id,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.approve_business_owner_application(uuid) from public, anon;
revoke all on function public.reject_business_owner_application(uuid, text) from public, anon;
grant execute on function public.approve_business_owner_application(uuid) to authenticated;
grant execute on function public.reject_business_owner_application(uuid, text) to authenticated;

-- Preserve role-management safeguards and record the old and new roles atomically.
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

  insert into public.audit_logs (
    actor_user_id, action, entity_type, entity_id, details
  )
  values (
    auth.uid(),
    'administrator.role_changed',
    'user',
    target_user_id,
    jsonb_build_object(
      'previous_role', current_role,
      'new_role', new_role
    )
  );

  return jsonb_build_object(
    'user_id', target_user_id,
    'previous_role', current_role,
    'new_role', new_role
  );
end;
$$;

revoke all on function public.manage_administrator_role(uuid, text) from public, anon;
grant execute on function public.manage_administrator_role(uuid, text) to authenticated;

commit;
