-- Script to delete specific users from Supabase
-- Run this in your Supabase SQL Editor

-- WARNING: This will permanently delete users and all their associated data
-- Make sure you have backups before running this script

BEGIN;

-- Delete user: givegainz (sumaiya27khan@gmail.com)
-- User ID: 9a02203f-66f0-405d-a987-ad7a6105fbba
DELETE FROM auth.users 
WHERE id = '9a02203f-66f0-405d-a987-ad7a6105fbba' 
AND email = 'sumaiya27khan@gmail.com';

-- Delete user: Ahammed S (givegainz3@gmail.com)  
-- User ID: 9b2cde97-6305-4419-9b51-2a9eaf81a8e1
DELETE FROM auth.users 
WHERE id = '9b2cde97-6305-4419-9b51-2a9eaf81a8e1' 
AND email = 'givegainz3@gmail.com';

-- Note: user_profiles table doesn't exist in this schema
-- Skipping user_profiles deletion

-- Clean up any staff records associated with these users
DELETE FROM public.staff 
WHERE user_id IN (
    '9a02203f-66f0-405d-a987-ad7a6105fbba',
    '9b2cde97-6305-4419-9b51-2a9eaf81a8e1'
);

-- Clean up any restaurant ownership (if they own restaurants)
UPDATE public.restaurants 
SET owner_id = NULL 
WHERE owner_id IN (
    '9a02203f-66f0-405d-a987-ad7a6105fbba',
    '9b2cde97-6305-4419-9b51-2a9eaf81a8e1'
);

COMMIT;

-- Verify deletion (run this after the above script)
-- SELECT id, email, raw_user_meta_data->>'full_name' as full_name 
-- FROM auth.users 
-- WHERE id IN (
--     '9a02203f-66f0-405d-a987-ad7a6105fbba',
--     '9b2cde97-6305-4419-9b51-2a9eaf81a8e1'
-- );
