-- ============================================================
-- YeneSpot - Migration 1: Core Platform Schema
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Updated-at trigger function
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. Profiles
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'am')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. User roles
-- ------------------------------------------------------------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('customer', 'business_owner', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx
  on public.user_roles(user_id);

-- ------------------------------------------------------------
-- 4. Authorization helper functions
-- ------------------------------------------------------------

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;



revoke all on function public.has_role(text) from public;
revoke all on function public.is_admin() from public;


grant execute on function public.has_role(text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;


-- ------------------------------------------------------------
-- 5. Business categories
-- ------------------------------------------------------------

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_am text,
  slug text not null unique,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. Businesses
-- ------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  category_id uuid references public.business_categories(id) on delete set null,

  name text not null,
  slug text not null unique,
  description text,

  phone text,
  email text,
  website text,

  address text,
  city text not null default 'Jimma',
  neighborhood text,

  latitude double precision
    check (latitude is null or latitude between -90 and 90),
  longitude double precision
    check (longitude is null or longitude between -180 and 180),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),

  verified boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,

  average_rating numeric(3,2) not null default 0
    check (average_rating between 0 and 5),
  review_count integer not null default 0
    check (review_count >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx
  on public.businesses(owner_id);

create index businesses_category_id_idx
  on public.businesses(category_id);

create index businesses_city_idx
  on public.businesses(city);

create index businesses_status_idx
  on public.businesses(status);

create index businesses_name_idx
  on public.businesses using gin (to_tsvector('simple', name));

-- ------------------------------------------------------------
create or replace function public.owns_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.businesses
    where id = target_business_id
      and owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_business(uuid) from public;
grant execute on function public.owns_business(uuid) to anon, authenticated;
-- 7. Protect business ownership and approval fields
-- ------------------------------------------------------------

create or replace function public.guard_business_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then

    if tg_op = 'INSERT' then
      if not public.has_role('business_owner') then
        raise exception 'Only approved business owners can submit business listings';
      end if;

      if new.owner_id <> auth.uid() then
        raise exception 'You can only create a business for yourself';
      end if;

      if new.status <> 'pending' or new.verified then
        raise exception 'New businesses must be submitted for approval';
      end if;

      new.approved_at := null;
      new.approved_by := null;
    else
      if new.owner_id is distinct from old.owner_id
        or new.status is distinct from old.status
        or new.verified is distinct from old.verified
        or new.approved_at is distinct from old.approved_at
        or new.approved_by is distinct from old.approved_by
      then
        raise exception 'Only administrators can change ownership or approval status';
      end if;
    end if;

  end if;

  return new;
end;
$$;

create trigger businesses_guard_changes
before insert or update on public.businesses
for each row execute function public.guard_business_changes();

-- ------------------------------------------------------------
-- 8. Business photos
-- ------------------------------------------------------------

create table public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null,
  storage_path text,
  caption text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index business_photos_business_id_idx
  on public.business_photos(business_id);

-- ------------------------------------------------------------
-- 9. Business opening hours
-- ------------------------------------------------------------

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, day_of_week),
  check (
    is_closed
    or (opens_at is not null and closes_at is not null)
  )
);

-- ------------------------------------------------------------
-- 10. Business services
-- ------------------------------------------------------------

create table public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) check (price is null or price >= 0),
  currency text not null default 'ETB',
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_services_business_id_idx
  on public.business_services(business_id);

-- ------------------------------------------------------------
-- 11. Customer favorites
-- ------------------------------------------------------------

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, business_id)
);

create index favorites_user_id_idx
  on public.favorites(user_id);

-- ------------------------------------------------------------
-- 12. Customer reviews
-- ------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, business_id),
  unique (id, business_id)
);

create index reviews_business_id_idx
  on public.reviews(business_id);

create index reviews_user_id_idx
  on public.reviews(user_id);

-- ------------------------------------------------------------
-- 13. Business-owner review responses
-- ------------------------------------------------------------

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null,
  business_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id),
  foreign key (review_id, business_id)
    references public.reviews(id, business_id)
    on delete cascade
);

create index review_responses_business_id_idx
  on public.review_responses(business_id);

-- ------------------------------------------------------------
-- 14. New account registration
-- Every new account receives customer role only.
-- Administrative roles must be assigned separately.
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 15. Updated-at triggers
-- ------------------------------------------------------------

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_updated_at
before update on public.business_categories
for each row execute function public.set_updated_at();

create trigger businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create trigger business_hours_updated_at
before update on public.business_hours
for each row execute function public.set_updated_at();

create trigger business_services_updated_at
before update on public.business_services
for each row execute function public.set_updated_at();

create trigger reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create trigger review_responses_updated_at
before update on public.review_responses
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 16. Enable Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_photos enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_services enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;

-- ------------------------------------------------------------
-- 17. Profiles policies
-- ------------------------------------------------------------

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- 18. User roles policies
-- Clients can read their own roles but cannot assign roles.
-- ------------------------------------------------------------

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- 19. Category policies
-- ------------------------------------------------------------

create policy "Public can view active categories"
on public.business_categories for select
to anon, authenticated
using (is_active or public.is_admin());

create policy "Administrators manage categories"
on public.business_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ------------------------------------------------------------
-- 20. Business policies
-- ------------------------------------------------------------

create policy "Public can view approved businesses"
on public.businesses for select
to anon, authenticated
using (
  status = 'approved'
  or owner_id = (select auth.uid())
  or public.is_admin()
);

create policy "Business owners can submit businesses"
on public.businesses for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and public.has_role('business_owner')
  and status = 'pending'
  and verified = false
);

create policy "Owners and administrators can update businesses"
on public.businesses for update
to authenticated
using (owner_id = (select auth.uid()) or public.is_admin())
with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "Administrators can delete businesses"
on public.businesses for delete
to authenticated
using (public.is_admin());

-- ------------------------------------------------------------
-- 21. Business child-table policies
-- ------------------------------------------------------------

create policy "Public can view visible business photos"
on public.business_photos for select
to anon, authenticated
using (
  public.owns_business(business_id)
  or public.is_admin()
  or exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'approved'
  )
);

create policy "Owners manage business photos"
on public.business_photos for all
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

create policy "Public can view visible business hours"
on public.business_hours for select
to anon, authenticated
using (
  public.owns_business(business_id)
  or public.is_admin()
  or exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'approved'
  )
);

create policy "Owners manage business hours"
on public.business_hours for all
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

create policy "Public can view available business services"
on public.business_services for select
to anon, authenticated
using (
  public.owns_business(business_id)
  or public.is_admin()
  or (
    is_available
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'approved'
    )
  )
);

create policy "Owners manage business services"
on public.business_services for all
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

-- ------------------------------------------------------------
-- 22. Favorites policies
-- ------------------------------------------------------------

create policy "Users view their own favorites"
on public.favorites for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users add their own favorites"
on public.favorites for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'approved'
  )
);

create policy "Users remove their own favorites"
on public.favorites for delete
to authenticated
using (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- 23. Review policies
-- ------------------------------------------------------------

create policy "Public can view reviews of approved businesses"
on public.reviews for select
to anon, authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'approved'
  )
);

create policy "Customers can review approved businesses"
on public.reviews for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.has_role('customer')
  and exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.status = 'approved'
      and b.owner_id <> (select auth.uid())
  )
);

create policy "Users update their own reviews"
on public.reviews for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "Users or administrators delete reviews"
on public.reviews for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

-- ------------------------------------------------------------
-- 24. Review response policies
-- ------------------------------------------------------------

create policy "Public can view visible review responses"
on public.review_responses for select
to anon, authenticated
using (
  public.owns_business(business_id)
  or public.is_admin()
  or exists (
    select 1 from public.businesses b
    where b.id = business_id and b.status = 'approved'
  )
);

create policy "Business owners respond to reviews"
on public.review_responses for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.owns_business(business_id)
);

create policy "Owners update their review responses"
on public.review_responses for update
to authenticated
using (public.owns_business(business_id) or public.is_admin())
with check (public.owns_business(business_id) or public.is_admin());

create policy "Owners or administrators delete review responses"
on public.review_responses for delete
to authenticated
using (public.owns_business(business_id) or public.is_admin());

-- ------------------------------------------------------------
-- 25. Explicit table permissions
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.business_categories to anon, authenticated;
grant select on public.businesses to anon, authenticated;
grant select on public.business_photos to anon, authenticated;
grant select on public.business_hours to anon, authenticated;
grant select on public.business_services to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant select on public.review_responses to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

grant insert, update, delete on public.business_categories to authenticated;
grant insert, update, delete on public.businesses to authenticated;
grant insert, update, delete on public.business_photos to authenticated;
grant insert, update, delete on public.business_hours to authenticated;
grant insert, update, delete on public.business_services to authenticated;

grant select, insert, delete on public.favorites to authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant insert, update, delete on public.review_responses to authenticated;

-- ------------------------------------------------------------
-- End of Migration 1
-- ------------------------------------------------------------

-- ============================================================
-- SECURITY HARDENING
-- ============================================================


-- Prevent customers from changing the identity or business
-- associated with an existing review.
create or replace function public.guard_review_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
      or new.user_id is distinct from old.user_id
      or new.business_id is distinct from old.business_id
    then
      raise exception 'Review identity and business cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

create trigger reviews_guard_changes
before update on public.reviews
for each row execute function public.guard_review_changes();

-- Prevent changing the author, review or business associated
-- with an existing business-owner response.
create or replace function public.guard_review_response_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
      or new.review_id is distinct from old.review_id
      or new.business_id is distinct from old.business_id
      or new.user_id is distinct from old.user_id
    then
      raise exception 'Review response ownership cannot be changed';
    end if;
  end if;

  return new;
end;
$$;

create trigger review_responses_guard_changes
before update on public.review_responses
for each row execute function public.guard_review_response_changes();

-- ============================================================
-- END SECURITY HARDENING
-- ============================================================






-- Restrict direct execution of trigger-only functions.
-- PostgreSQL triggers can continue invoking these functions.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.guard_business_changes() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_review_changes() from public, anon, authenticated;
revoke all on function public.guard_review_response_changes() from public, anon, authenticated;
