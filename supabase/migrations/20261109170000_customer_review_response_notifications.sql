-- ============================================================
-- YeneSpot: Customer notifications for business replies
-- ============================================================

-- 1. Allow customer review-response notifications

alter table public.notifications
drop constraint notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (
  type in (
    'review_received',
    'review_response_received'
  )
);

-- 2. Notify customers when a business replies to their review

create or replace function public.notify_customer_review_response()
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
    r.user_id,
    'review_response_received',
    'Business replied to your review',
    b.name || ' replied to your review.',
    b.id,
    r.id
  from public.reviews r
  join public.businesses b
    on b.id = new.business_id
  where r.id = new.review_id
    and r.business_id = new.business_id
    and r.user_id <> new.user_id;

  return new;
end;
$$;

-- 3. Restrict direct access to the trigger function

revoke all on function public.notify_customer_review_response()
from public, anon, authenticated;

-- 4. Automatically notify customers after a response is published

create trigger review_responses_notify_customer
after insert on public.review_responses
for each row
execute function public.notify_customer_review_response();