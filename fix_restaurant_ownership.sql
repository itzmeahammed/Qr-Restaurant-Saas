-- Fix Restaurant Ownership Mismatch
-- This SQL script fixes the owner_id mismatch for "barbeque Nation" restaurant

-- Current situation:
-- Restaurant ID: 4340aba7-e3f0-464a-b761-b45abc7761cf
-- Current owner_id: 75a5a84a-2589-43d9-b480-9b9f76e6c828
-- Should be owner_id: 4340aba7-e3f0-464a-b761-b45abc7761cf

-- Step 1: Update restaurant ownership
UPDATE public.restaurants 
SET owner_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  AND name = 'barbeque Nation';

-- Step 2: Update related tables that reference restaurant_id as user_id (per schema)
-- Categories table (restaurant_id references users.id)
UPDATE public.categories 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Menu items table (restaurant_id references users.id)
UPDATE public.menu_items 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Tables table (restaurant_id references users.id)
UPDATE public.tables 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Step 3: Verify the fix
SELECT 
  'restaurants' as table_name,
  id,
  name,
  owner_id
FROM public.restaurants 
WHERE owner_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'

UNION ALL

SELECT 
  'categories' as table_name,
  id,
  name,
  restaurant_id as owner_id
FROM public.categories 
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'

UNION ALL

SELECT 
  'menu_items' as table_name,
  id,
  name,
  restaurant_id as owner_id
FROM public.menu_items 
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'

UNION ALL

SELECT 
  'tables' as table_name,
  id,
  table_number as name,
  restaurant_id as owner_id
FROM public.tables 
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Final test query (this should return your restaurant)
SELECT * FROM public.restaurants 
WHERE owner_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';
