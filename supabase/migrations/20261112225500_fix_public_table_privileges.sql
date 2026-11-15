begin;

revoke all privileges on table
  public.business_categories,
  public.business_hours,
  public.business_owner_applications,
  public.business_photos,
  public.business_services,
  public.businesses,
  public.favorites,
  public.notifications,
  public.profiles,
  public.review_responses,
  public.reviews,
  public.user_roles
from anon, authenticated;

revoke update (is_read, read_at)
on public.notifications from authenticated;

grant select on
  public.business_categories,
  public.businesses,
  public.business_photos,
  public.business_hours,
  public.business_services,
  public.reviews,
  public.review_responses
to anon, authenticated;

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

grant select, insert on public.business_owner_applications to authenticated;

grant select on public.notifications to authenticated;
grant update (is_read, read_at)
on public.notifications to authenticated;

alter default privileges for role postgres in schema public
revoke all privileges on tables from anon, authenticated;

alter default privileges for role postgres in schema public
revoke all privileges on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
revoke execute on functions from anon, authenticated;

commit;