-- Debug script to check restaurant signup keys
-- Run this in your Supabase SQL editor

-- 1. Check all restaurants and their signup keys
SELECT 
  id,
  name,
  staff_signup_key,
  created_at,
  owner_id
FROM restaurants
ORDER BY created_at DESC;

-- 2. Check if the specific key exists anywhere
SELECT 
  id,
  name,
  staff_signup_key,
  owner_id
FROM restaurants 
WHERE staff_signup_key = 'DXP5-MFC-AHT';

-- 3. Check for any restaurants without signup keys
SELECT 
  id,
  name,
  owner_id,
  created_at
FROM restaurants 
WHERE staff_signup_key IS NULL;

-- 4. Generate keys for restaurants that don't have them
-- (Uncomment and run if needed)
/*
UPDATE restaurants 
SET staff_signup_key = 
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || name::TEXT) FROM 1 FOR 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || owner_id::TEXT) FROM 1 FOR 4)
WHERE staff_signup_key IS NULL;
*/

-- 5. Check the column definition
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name = 'staff_signup_key';
