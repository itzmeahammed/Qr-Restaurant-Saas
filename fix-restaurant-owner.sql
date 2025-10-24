-- Fix restaurant owner_id mismatch
-- This updates the restaurant to be owned by the correct user

-- Current situation:
-- Restaurant ID: 4340aba7-e3f0-464a-b761-b45abc7761cf
-- Current owner_id: 75a5a84a-2589-43d9-b480-9b9f76e6c828
-- Should be owner_id: 4340aba7-e3f0-464a-b761-b45abc7761cf

-- Update the restaurant owner_id to match the current user
UPDATE restaurants 
SET owner_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
AND owner_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Verify the update
SELECT id, name, owner_id, is_active 
FROM restaurants 
WHERE id = '4340aba7-e3f0-464a-b761-b45abc7761cf';

-- Also check if there are any categories that need updating
-- Categories.restaurant_id should reference the user_id (owner)
SELECT id, name, restaurant_id 
FROM categories 
WHERE restaurant_id IN ('4340aba7-e3f0-464a-b761-b45abc7761cf', '75a5a84a-2589-43d9-b480-9b9f76e6c828');

-- Update categories if needed (they should reference the user_id, not restaurant_id)
-- Based on your schema: categories.restaurant_id references public.users(id)
UPDATE categories 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Update menu_items if needed (they should also reference the user_id)
UPDATE menu_items 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Update tables if needed (they should also reference the user_id)
UPDATE tables 
SET restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
WHERE restaurant_id = '75a5a84a-2589-43d9-b480-9b9f76e6c828';

-- Final verification
SELECT 'restaurants' as table_name, id, owner_id as user_ref FROM restaurants WHERE owner_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
UNION ALL
SELECT 'categories' as table_name, id, restaurant_id as user_ref FROM categories WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
UNION ALL
SELECT 'menu_items' as table_name, id, restaurant_id as user_ref FROM menu_items WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf'
UNION ALL
SELECT 'tables' as table_name, id, restaurant_id as user_ref FROM tables WHERE restaurant_id = '4340aba7-e3f0-464a-b761-b45abc7761cf';
