create or replace function public.get_public_reviewers(p_business_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct
    p.id,
    p.full_name,
    p.avatar_url
  from public.profiles p
  inner join public.reviews r
    on r.user_id = p.id
  inner join public.businesses b
    on b.id = r.business_id
  where r.business_id = p_business_id
    and b.status = 'approved';
$$;

revoke all on function public.get_public_reviewers(uuid) from public;

grant execute on function public.get_public_reviewers(uuid)
to anon, authenticated;
