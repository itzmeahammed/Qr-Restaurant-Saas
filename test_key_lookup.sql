-- Test restaurant key lookup
-- Run this in your Supabase SQL editor to verify the key exists

-- 1. Direct lookup with the exact key
SELECT 
  id, 
  name, 
  staff_signup_key,
  LENGTH(staff_signup_key) as key_length,
  owner_id
FROM restaurants 
WHERE staff_signup_key = 'DXP5-MFC-AHT';

-- 2. Check for any whitespace or special characters
SELECT 
  id, 
  name, 
  staff_signup_key,
  LENGTH(staff_signup_key) as key_length,
  ASCII(SUBSTRING(staff_signup_key, 1, 1)) as first_char_ascii,
  ASCII(SUBSTRING(staff_signup_key, -1, 1)) as last_char_ascii
FROM restaurants 
WHERE name = 'barbeque Nation';

-- 3. Case-insensitive search
SELECT 
  id, 
  name, 
  staff_signup_key,
  owner_id
FROM restaurants 
WHERE UPPER(staff_signup_key) = UPPER('DXP5-MFC-AHT');

-- 4. Pattern matching to find similar keys
SELECT 
  id, 
  name, 
  staff_signup_key,
  owner_id
FROM restaurants 
WHERE staff_signup_key LIKE '%DXP5%' 
   OR staff_signup_key LIKE '%MFC%' 
   OR staff_signup_key LIKE '%AHT%';

-- 5. Show all keys to compare
SELECT 
  id, 
  name, 
  staff_signup_key,
  owner_id
FROM restaurants 
WHERE staff_signup_key IS NOT NULL
ORDER BY created_at DESC;
