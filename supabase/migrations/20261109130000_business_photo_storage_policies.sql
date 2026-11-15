-- Secure YeneSpot business photo storage.
-- Storage paths must begin with the business UUID.

create policy "Business owners and admins upload business photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-photos'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 1
  and (
    public.is_admin()
    or public.owns_business(
      (storage.foldername(name))[1]::uuid
    )
  )
);

create policy "Business owners and admins delete business photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-photos'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 1
  and (
    public.is_admin()
    or public.owns_business(
      (storage.foldername(name))[1]::uuid
    )
  )
);
