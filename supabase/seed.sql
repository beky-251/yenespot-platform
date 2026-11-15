-- ============================================================
-- YeneSpot - Initial Business Categories
-- English and Amharic
-- ============================================================

insert into public.business_categories
  (name, name_am, slug, description, icon, sort_order, is_active)
values
  (
    'Coffee Shops',
    'ቡና ቤቶች',
    'coffee-shops',
    'Discover traditional and modern coffee shops.',
    'coffee',
    1,
    true
  ),
  (
    'Restaurants',
    'ምግብ ቤቶች',
    'restaurants',
    'Find restaurants serving local and international food.',
    'utensils',
    2,
    true
  ),
  (
    'Hotels',
    'ሆቴሎች',
    'hotels',
    'Find hotels and accommodation.',
    'bed',
    3,
    true
  ),
  (
    'Cake Houses',
    'ኬክ ቤቶች',
    'cake-houses',
    'Discover cake shops and dessert businesses.',
    'cake-slice',
    4,
    true
  ),
  (
    'Cafes',
    'ካፌዎች',
    'cafes',
    'Find cafes and comfortable places to relax.',
    'coffee',
    5,
    true
  ),
  (
    'Juice Houses',
    'ጭማቂ ቤቶች',
    'juice-houses',
    'Discover fresh juice and smoothie shops.',
    'glass-water',
    6,
    true
  ),
  (
    'Bars',
    'መጠጥ ቤቶች',
    'bars',
    'Find local bars and nightlife businesses.',
    'wine',
    7,
    true
  ),
  (
    'Fast Food',
    'ፈጣን ምግብ ቤቶች',
    'fast-food',
    'Discover fast food and takeaway businesses.',
    'sandwich',
    8,
    true
  ),
  (
    'Bakeries',
    'ዳቦ ቤቶች',
    'bakeries',
    'Find bakeries and freshly baked products.',
    'croissant',
    9,
    true
  ),
  (
    'Other Businesses',
    'ሌሎች ንግዶች',
    'other-businesses',
    'Discover other local businesses and services.',
    'store',
    10,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  name_am = excluded.name_am,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- ============================================================
-- End of YeneSpot category seed data
-- ============================================================
