-- Alternative Fix: Work with existing data structure
-- Since the user exists in public.users but not in auth.users,
-- we need to use the existing owner_id that's already in auth.users

-- First, let's check what we have:
SELECT 
  'Current restaurant data' as info,
  r.id as restaurant_id,
  r.name,
  r.owner_id as current_owner_id,
  'Target user in public.users:' as target_info,
  u.id as target_user_id,
  u.full_name,
  u.email
FROM public.restaurants r
CROSS JOIN public.users u
WHERE r.name = 'barbeque Nation'
  AND u.id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Solution 1: Update the public.users table to match the existing auth owner_id
-- This way we don't break foreign key constraints
UPDATE public.users 
SET id = (
  SELECT owner_id 
  FROM public.restaurants 
  WHERE name = 'barbeque Nation'
)
WHERE id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Solution 2: If that doesn't work, let's create a mapping approach
-- Update all references to use the existing owner_id instead

-- Update categories to use the existing owner_id
UPDATE public.categories 
SET restaurant_id = (
  SELECT owner_id 
  FROM public.restaurants 
  WHERE name = 'barbeque Nation'
)
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Update menu_items to use the existing owner_id  
UPDATE public.menu_items 
SET restaurant_id = (
  SELECT owner_id 
  FROM public.restaurants 
  WHERE name = 'barbeque Nation'
)
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Update tables to use the existing owner_id
UPDATE public.tables 
SET restaurant_id = (
  SELECT owner_id 
  FROM public.restaurants 
  WHERE name = 'barbeque Nation'
)
WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Final verification - this should now work
SELECT 
  r.*,
  u.full_name as owner_name,
  u.email as owner_email
FROM public.restaurants r
LEFT JOIN public.users u ON u.id = r.owner_id
WHERE r.name = 'barbeque Nation';
