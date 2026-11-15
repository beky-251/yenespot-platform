-- ============================================================
-- YeneSpot: Business-owner notifications
-- ============================================================

-- 1. Notifications table

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  type text not null
    check (type in ('review_received')),

  title text not null,
  message text not null,

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  review_id uuid
    references public.reviews(id) on delete cascade,

  is_read boolean not null default false,
  read_at timestamptz,

  created_at timestamptz not null default now()
);

-- 2. Indexes

create index notifications_user_created_idx
on public.notifications(user_id, created_at desc);

create index notifications_user_unread_idx
on public.notifications(user_id, is_read)
where is_read = false;

-- 3. Enable Row Level Security

alter table public.notifications enable row level security;

-- 4. Users can only read their own notifications

create policy "Users can view their own notifications"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()));

-- 5. Users can only update their own notifications

create policy "Users can update their own notifications"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- 6. Explicit permissions

revoke all on public.notifications from anon, authenticated;

grant select on public.notifications to authenticated;

grant update (is_read, read_at)
on public.notifications to authenticated;

-- 7. Automatically notify business owners about new reviews

create or replace function public.notify_business_owner_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    business_id,
    review_id
  )
  select
    b.owner_id,
    'review_received',
    'New customer review',
    'A customer left a new review for ' || b.name || '.',
    b.id,
    new.id
  from public.businesses b
  where b.id = new.business_id
    and b.owner_id <> new.user_id;

  return new;
end;
$$;

revoke all on function public.notify_business_owner_new_review()
from public, anon, authenticated;

create trigger reviews_notify_business_owner
after insert on public.reviews
for each row
execute function public.notify_business_owner_new_review();