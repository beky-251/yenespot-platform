YeneSpot Supabase Backend
Project: YeneSpot (chvmjmmavcpumpeqinrn)
Environment audited: Production
Audit date: 13 November 2026
Scope: Shared Supabase backend for the YeneSpot web and mobile applications.

1. Current backend status
The production database currently contains 12 application tables. All 12 have Row Level Security (RLS) enabled. Six original migrations and one corrective privilege migration are recorded as applied.
Area	Status	Notes
Production migration history	Verified	Six original migrations and corrective migration 20261112225500 are applied.
Core schema	Present	12 application tables are present.
RLS enabled	Verified	Enabled on all 12 application tables.
Table privileges	Corrected and verified	Anonymous users have read access only to selected public tables; authenticated privileges are narrowed by table and operation.
Column-level notification updates	Verified	Authenticated users can update only is_read and read_at.
Primary/foreign/unique/check constraints	Inspected	Constraints were queried from production.
Indexes	Inspected	38 indexes were queried from production.
Business photo storage	Partially verified	Public bucket, 5 MiB limit, JPEG/PNG/WebP; upload/delete policies exist.
Trigger behavior	Defined in migrations; not independently re-queried in the final audit	See section 8.
Database lint	Passed	supabase db lint --remote --schema public --level error --fail-on error reported no schema errors.
Seed categories	Verified	All 10 expected categories exist and are active.
Full application security testing	Not completed	Metadata inspection is not a substitute for testing with real customer, owner, and admin accounts.


This document distinguishes verified production facts from items that still need implementation or runtime testing.
2. Production tables
profiles
One profile per Supabase Auth user.
Column	Type	Null	Default / notes
id	uuid	No	Primary key; references auth.users(id) with ON DELETE CASCADE
full_name	text	Yes	
phone	text	Yes	
avatar_url	text	Yes	
preferred_language	text	No	en; allowed values en, am
created_at	timestamptz	No	now()
updated_at	timestamptz	No	now()


user_roles
Application roles associated with Auth users.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
user_id	uuid	No	References auth.users(id) with cascade delete
role	text	No	Allowed: customer, business_owner, admin, super_admin
created_at	timestamptz	No	now()


Unique: (user_id, role).
business_categories
Public business categories.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
name	text	No	
name_am	text	Yes	Amharic category name
slug	text	No	Unique
description	text	Yes	
icon	text	Yes	
sort_order	integer	No	0
is_active	boolean	No	true
created_at	timestamptz	No	now()
updated_at	timestamptz	No	now()


businesses
Business listings.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
owner_id	uuid	No	References auth.users(id); delete restricted
category_id	uuid	Yes	References categories; ON DELETE SET NULL
name	text	No	
slug	text	No	Unique
description	text	Yes	
phone, email, website	text	Yes	Contact information
address	text	Yes	
city	text	No	Jimma
neighborhood	text	Yes	
latitude	double precision	Yes	Range -90 to 90
longitude	double precision	Yes	Range -180 to 180
status	text	No	pending; allowed: pending, approved, rejected, suspended
verified	boolean	No	false
approved_at	timestamptz	Yes	
approved_by	uuid	Yes	References auth.users(id); ON DELETE SET NULL
average_rating	numeric	No	0; constrained to 0–5
review_count	integer	No	0; constrained to non-negative
created_at, updated_at	timestamptz	No	now()


business_photos
Photos attached to a business.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
business_id	uuid	No	Business FK; cascade delete
image_url	text	No	
storage_path	text	Yes	
caption	text	Yes	
is_cover	boolean	No	false
sort_order	integer	No	0
created_at	timestamptz	No	now()


business_hours
Weekly opening hours.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
business_id	uuid	No	Business FK; cascade delete
day_of_week	integer	No	0–6
opens_at, closes_at	time	Yes	Required when not closed
is_closed	boolean	No	false
created_at, updated_at	timestamptz	No	now()


Unique: (business_id, day_of_week).
business_services
Services offered by a business.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
business_id	uuid	No	Business FK; cascade delete
name	text	No	
description	text	Yes	
price	numeric	Yes	Must be non-negative when supplied
currency	text	No	ETB
is_available	boolean	No	true
sort_order	integer	No	0
created_at, updated_at	timestamptz	No	now()


favorites
Customer-saved businesses.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
user_id	uuid	No	Auth user FK; cascade delete
business_id	uuid	No	Business FK; cascade delete
created_at	timestamptz	No	now()


Unique: (user_id, business_id).
reviews
Customer reviews.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
user_id	uuid	No	Auth user FK; cascade delete
business_id	uuid	No	Business FK; cascade delete
rating	integer	No	1–5
comment	text	Yes	
created_at, updated_at	timestamptz	No	now()


Unique: (user_id, business_id); one review per customer per business. Composite unique (id, business_id) supports the response foreign key.
review_responses
A business owner's response to a review.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
review_id	uuid	No	
business_id	uuid	No	
user_id	uuid	No	Auth user FK; cascade delete
response	text	No	
created_at, updated_at	timestamptz	No	now()


Composite FK (review_id, business_id) references reviews(id, business_id) with cascade delete. Unique review_id means one response per review.
business_owner_applications
Applications to create a new business listing and become a business owner.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
user_id	uuid	No	Auth user FK; cascade delete
business_name	text	No	Trimmed length 2–150
category_id	uuid	No	Category FK
description	text	Yes	Maximum 3000 characters
phone	text	No	Trimmed length 7–30
email, website	text	Yes	
city	text	No	Jimma
neighborhood, address	text	Yes	
status	text	No	pending; allowed: pending, approved, rejected
rejection_reason	text	Yes	
reviewed_by	uuid	Yes	Auth user FK; ON DELETE SET NULL
reviewed_at	timestamptz	Yes	
business_id	uuid	Yes	Business FK; ON DELETE SET NULL; unique
created_at, updated_at	timestamptz	No	now()


A check constraint requires pending applications to have no reviewed_at, and approved/rejected applications to have one. A partial unique index allows only one pending application per user.
notifications
In-app notifications.
Column	Type	Null	Default / notes
id	uuid	No	gen_random_uuid(), primary key
user_id	uuid	No	Auth user FK; cascade delete
type	text	No	review_received or review_response_received
title, message	text	No	
business_id	uuid	No	Business FK; cascade delete
review_id	uuid	Yes	Review FK; cascade delete
is_read	boolean	No	false
read_at	timestamptz	Yes	
created_at	timestamptz	No	now()


Authenticated users may read their own notifications and update only is_read and read_at.
3. Key constraints and relationships
- Every application table has a primary key.
- Business slugs and category slugs are unique.
- A customer can save a business only once.
- A customer can submit at most one review per business.
- A review can have at most one owner response.
- Business hours have one row per business/day.
- Ratings must be 1–5; business aggregate rating is constrained to 0–5.
- Coordinates are range-checked.
- Service prices cannot be negative.
- Deleting a business cascades to its photos, hours, services, favorites, reviews, and notifications.
- Deleting an Auth user cascades to their profile, roles, applications, favorites, reviews, and notifications, except business ownership is RESTRICT.
- Application review metadata and status are constrained for consistency.
4. Indexes
Production inspection found 38 indexes. Important indexes include:
- businesses: category, city, owner, status, unique slug, full-text GIN index on name.
- business_owner_applications: user, status, unique business_id, partial unique pending-per-user.
- business_photos: business_id.
- business_services: business_id.
- business_hours: unique (business_id, day_of_week).
- reviews: business_id, user_id, unique (user_id, business_id), unique (id, business_id).
- review_responses: business_id, unique review_id.
- favorites: user_id, unique (user_id, business_id).
- notifications: (user_id, created_at DESC) and partial unread index (user_id, is_read).
- user_roles: user_id and unique (user_id, role).
Potential index additions should be based on actual query plans and workload. Foreign-key columns without a dedicated index include some notification references, favorites.business_id, application category/reviewer references, and businesses.approved_by. Do not add all of these automatically.
5. Roles and access control
Roles stored in user_roles:
- customer
- business_owner
- admin
- super_admin
The initial migration defines helper functions including has_role(text), is_admin(), and owns_business(uuid). A new Auth user receives a profile and customer role through an Auth-user trigger.

Business-owner application approval is handled by the database function approve_business_owner_application(uuid). It checks admin authority, locks the application row, creates a pending business, switches the user's role from customer to business_owner, and records the resulting business. Rejection is handled by reject_business_owner_application(uuid, text) and requires a reason.

The business guard trigger prevents ordinary users from changing protected ownership, approval, status, and verification fields. Review and review-response guard triggers protect identity and relationship fields.
6. RLS and table privileges
RLS is enabled on all 12 production application tables.

High-level policy intent:
- Categories: public can read active categories; admins manage categories.
- Businesses: public can read approved businesses; owners/admins can read their own or administrative records; owners submit pending listings; owners/admins update under guarded rules; admins delete.
- Photos, hours, services: public visibility is limited to approved businesses; owners/admins manage their own records.
- Applications: applicants create/read their own applications; admins can review them.
- Favorites: users manage their own favorites.
- Reviews: public can read reviews for approved businesses; customers manage their own reviews subject to policy checks.
- Review responses: business owners respond to reviews for their businesses; public can read responses for approved businesses.
- Profiles: users read/update their own profile; admins have administrative access.
- Roles: users can read their own roles; role assignment is not open to ordinary users.
- Notifications: users read and update their own notification read-state only.
Corrective privilege migration
Migration 20261112225500_fix_public_table_privileges.sql narrowed table privileges and default privileges.

Verified production outcome:
- anon has SELECT only on public-facing categories, businesses, photos, hours, services, reviews, and review responses.
- anon has no INSERT, UPDATE, DELETE, or TRUNCATE rights on application tables.
- authenticated receives only the table-level operations needed by the app and is still constrained by RLS.
- Notifications: authenticated SELECT plus column-level UPDATE on is_read and read_at only.
- Authenticated cannot update notification message/title/type or delete notifications.
- Default privileges for future objects created by postgres in public no longer automatically grant broad table, sequence, or function privileges to anon and authenticated.
RLS and SQL privileges are separate layers: both must be correct. Recheck grants whenever adding a table, sequence, or function.
7. Storage
Production has a public Storage bucket named business-photos.

Verified bucket settings:
- Public downloads enabled.
- Maximum file size: 5,242,880 bytes (5 MiB).
- Allowed MIME types: image/jpeg, image/png, image/webp.
Storage object policies permit authenticated business owners to upload/delete within their business folder and admins to manage objects. Public image retrieval is enabled by the public bucket setting.

Implementation note: storage paths are expected to use the business UUID as the first folder segment. The policy casts that segment to UUID; malformed folder names may cause a database cast error. Consider a defensive UUID-format check in a future corrective migration.
8. Database functions and triggers
The migrations define:
- set_updated_at() for maintaining updated_at timestamps.
- handle_new_user() for creating a profile and customer role after Auth user creation.
- has_role(text), is_admin(), and owns_business(uuid) access helpers.
- A business guard trigger for protected business fields.
- Review and review-response guard triggers for protected identity/relationship fields.
- approve_business_owner_application(uuid) and reject_business_owner_application(uuid, text) for admin application decisions.
- get_public_reviewers(uuid) for public reviewer display on approved businesses.
- notify_business_owner_new_review() for review notifications.
- notify_customer_review_response() for owner-response notifications.
The trigger inventory was not independently queried after the migration review. Confirm the live trigger list before relying on exact trigger names or deployment-specific details.

Important unresolved behavior: businesses.average_rating and businesses.review_count are stored columns with range checks. The reviewed migrations do not establish an aggregate-maintenance trigger for them. Confirm whether the web/mobile server logic updates these values. If not, add a database-owned aggregate mechanism in a new migration and test insert, update, and delete cases. Do not assume these values update automatically.
9. Seed data
supabase/seed.sql defines ten categories and uses ON CONFLICT (slug) DO UPDATE.

Categories:
1. Coffee Shops
2. Restaurants
3. Hotels
4. Cake Houses
5. Cafes
6. Juice Houses
7. Bars
8. Fast Food
9. Bakeries
10. Other Businesses
Production inspection confirmed all ten expected categories exist and are active.

Caution: because the seed uses DO UPDATE, rerunning it can overwrite existing category names, descriptions, and other seeded fields for matching slugs. Review seed behavior before running it against production again.
10. Migration history
The following migrations were verified in local and remote migration history:
1. 20261108170000_initial_core_schema.sql
2. 20261108200000_business_owner_applications.sql
3. 20261109130000_business_photo_storage_policies.sql
4. 20261109140000_public_reviewers.sql
5. 20261109150000_notifications.sql
6. 20261109170000_customer_review_response_notifications.sql
7. 20261112225500_fix_public_table_privileges.sql
Do not edit migrations already applied to production. Make schema changes through new, timestamped migrations. Backups of the six original migrations were created under supabase/migration-backups/before-privilege-fix-20261113/.
11. Gaps against the YeneSpot product requirements
The master product plan calls for more capabilities than currently exist in production. These are not present among the 12 audited application tables:
Planned capability/table	Current state	Recommended next action
business_menus	Missing	Design menu items/categories and prices; do not assume services are a menu.
business_claims	Missing	Design a separate workflow for claiming an existing listing; owner applications currently create a new listing.
subscription_plans	Missing	Design configurable free/premium plans and entitlements.
subscriptions	Missing	Design lifecycle, status, dates, renewal, and business linkage.
payments	Missing	Design payment records and provider references; payment provider integration is not yet verified.
reports	Missing	Design customer/admin reporting and moderation workflow.
featured_listings	Missing	Design paid/administrative promotion windows and ranking rules.
business_views	Missing	Design privacy-aware view/event analytics and retention.
audit_logs	Missing	Design append-only administrative/security audit records.
platform_settings	Missing	Design tightly permissioned platform configuration.


Other future considerations:
- Optional PostGIS support or a spatial index for efficient map-radius search. Current coordinates are separate latitude/longitude columns.
- Search indexing for descriptions and Amharic text, based on real search requirements.
- Review aggregate maintenance.
- Rate limiting and server-side input validation for public endpoints and sensitive actions.
- Verify image ownership and deletion lifecycle, including cleanup of orphaned storage objects.
12. Recommended remaining Phase 3 work
1. Verify the live trigger inventory and function definitions.
2. Confirm how review aggregate fields are maintained; implement a safe database mechanism if missing.
3. Review application queries against indexes and add only evidence-based indexes.
4. Test RLS using separate customer, business-owner, admin, and anonymous sessions.
5. Test application approval/rejection and role switching.
6. Test photo upload, public display, and owner/admin deletion.
7. Add the missing product tables in small, sequenced migrations, beginning with business menus and business claims before subscription/payment functionality.
8. Update this document whenever a migration changes production.
13. Safe operational commands
Run from the repository root in PowerShell.

Check migration history:
pnpm exec supabase migration list --remote
Preview pending migrations:
pnpm exec supabase db push --remote --dry-run
Lint the remote public schema:
pnpm exec supabase db lint --remote --schema public --level error --fail-on error
Apply migrations only after reviewing the dry-run and explicitly deciding to deploy:
pnpm exec supabase db push --remote
Never place a Supabase service-role key in frontend/mobile code or expose it in logs. Keep secrets in server-side environment variables.