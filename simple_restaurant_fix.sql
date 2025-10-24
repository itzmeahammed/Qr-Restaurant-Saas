-- Simple Fix: Update your application code to use the existing owner_id
-- Instead of changing database constraints, let's work with what we have

-- Step 1: Find the actual owner_id that exists in auth.users
SELECT 
  'Restaurant Info' as type,
  r.id as restaurant_id,
  r.name,
  r.owner_id as existing_auth_owner_id,
  'This is the ID your app should use' as note
FROM public.restaurants r
WHERE r.name = 'barbeque Nation';

-- Step 2: Find your user record in public.users  
SELECT 
  'User Info' as type,
  u.id as public_user_id,
  u.full_name,
  u.email,
  'This is your current user ID' as note
FROM public.users u
WHERE u.id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Step 3: Update your public.users record to reference the correct restaurant
UPDATE public.users 
SET restaurant_id = (
  SELECT id 
  FROM public.restaurants 
  WHERE name = 'barbeque Nation'
)
WHERE id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Step 4: Verification - Check the linkage
SELECT 
  'Final Check' as info,
  u.id as user_id,
  u.full_name,
  u.restaurant_id,
  r.id as restaurant_id,
  r.name as restaurant_name,
  r.owner_id as restaurant_owner_id
FROM public.users u
LEFT JOIN public.restaurants r ON r.id = u.restaurant_id
WHERE u.id = '4340aba7-e3f0-464a-b761-b45abc7761cf';
