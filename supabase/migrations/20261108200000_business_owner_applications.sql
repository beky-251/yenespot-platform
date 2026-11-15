-- ============================================================
-- YeneSpot: Business Owner Applications
-- Migration: 20261108200000
-- ============================================================

begin;

-- 1. Business owner applications
create table public.business_owner_applications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  business_name text not null
    check (char_length(trim(business_name)) between 2 and 150),

  category_id uuid not null
    references public.business_categories(id),

  description text
    check (description is null or char_length(description) <= 3000),

  phone text not null
    check (char_length(trim(phone)) between 7 and 30),

  email text,
  website text,

  city text not null default 'Jimma',
  neighborhood text,
  address text,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  rejection_reason text,

  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  business_id uuid unique
    references public.businesses(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint application_review_consistency check (
    (status = 'pending' and reviewed_at is null)
    or
    (status in ('approved', 'rejected') and reviewed_at is not null)
  )
);

-- 2. Indexes
create index business_owner_applications_user_id_idx
  on public.business_owner_applications(user_id);

create index business_owner_applications_status_idx
  on public.business_owner_applications(status);

create unique index one_pending_application_per_user
  on public.business_owner_applications(user_id)
  where status = 'pending';

-- 3. Enable Row Level Security
alter table public.business_owner_applications
  enable row level security;

-- 4. Grant table permissions
grant select, insert on public.business_owner_applications
  to authenticated;

-- 5. Applicants can view their own applications
create policy "Applicants can view own applications"
on public.business_owner_applications
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
);

-- 6. Customers can submit their own applications
create policy "Customers can submit applications"
on public.business_owner_applications
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.has_role('customer')
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
  and business_id is null
);

-- ============================================================
-- 7. Secure admin approval and rejection functions
-- ============================================================

begin;

-- Approve an application:
-- 1. Verify the caller is an admin.
-- 2. Lock and validate the application.
-- 3. Create a pending business listing.
-- 4. Replace the customer's role with business_owner.
-- 5. Record the approval.

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

  return v_business_id;
end;
$$;


-- Reject an application:
-- Only an administrator can reject a pending application.
-- A reason is required and recorded for the applicant.

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
end;
$$;


-- Functions must never be executable by anonymous users
-- or by callers without authenticated admin authorization.

revoke all on function
  public.approve_business_owner_application(uuid)
  from public, anon;

revoke all on function
  public.reject_business_owner_application(uuid, text)
  from public, anon;

grant execute on function
  public.approve_business_owner_application(uuid)
  to authenticated;

grant execute on function
  public.reject_business_owner_application(uuid, text)
  to authenticated;

commit;