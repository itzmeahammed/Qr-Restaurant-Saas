-- Debug script to check staff approval process
-- Run this after attempting to approve a staff application

-- 1. Check the latest staff application
SELECT 
  'Latest Staff Application:' as info,
  id,
  email,
  full_name,
  user_id,
  status,
  applied_at,
  reviewed_at,
  reviewed_by
FROM public.staff_applications 
ORDER BY applied_at DESC 
LIMIT 1;

-- 2. Check if auth user exists for the application
SELECT 
  'Auth User Check:' as info,
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created,
  sa.email as application_email,
  sa.user_id as application_user_id,
  CASE 
    WHEN au.id IS NULL THEN 'AUTH USER MISSING'
    WHEN au.email_confirmed_at IS NULL THEN 'EMAIL NOT CONFIRMED'
    WHEN sa.user_id != au.id THEN 'USER ID MISMATCH'
    ELSE 'AUTH USER OK'
  END as auth_status
FROM public.staff_applications sa
LEFT JOIN auth.users au ON sa.user_id = au.id
WHERE sa.email = (
  SELECT email FROM public.staff_applications 
  ORDER BY applied_at DESC 
  LIMIT 1
);

-- 3. Check if public user exists
SELECT 
  'Public User Check:' as info,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.full_name,
  pu.role,
  pu.is_active,
  sa.email as application_email,
  sa.user_id as application_user_id,
  CASE 
    WHEN pu.id IS NULL THEN 'PUBLIC USER MISSING'
    WHEN sa.user_id != pu.id THEN 'USER ID MISMATCH'
    ELSE 'PUBLIC USER OK'
  END as public_status
FROM public.staff_applications sa
LEFT JOIN public.users pu ON sa.user_id = pu.id
WHERE sa.email = (
  SELECT email FROM public.staff_applications 
  ORDER BY applied_at DESC 
  LIMIT 1
);

-- 4. Check if staff record exists
SELECT 
  'Staff Record Check:' as info,
  s.id as staff_id,
  s.user_id as staff_user_id,
  s.position,
  s.approved_at,
  sa.email as application_email,
  sa.user_id as application_user_id,
  CASE 
    WHEN s.id IS NULL THEN 'STAFF RECORD MISSING'
    WHEN sa.user_id != s.user_id THEN 'USER ID MISMATCH'
    ELSE 'STAFF RECORD OK'
  END as staff_status
FROM public.staff_applications sa
LEFT JOIN public.staff s ON sa.user_id = s.user_id
WHERE sa.email = (
  SELECT email FROM public.staff_applications 
  ORDER BY applied_at DESC 
  LIMIT 1
);

-- 5. Complete status summary
SELECT 
  'COMPLETE STATUS SUMMARY:' as info,
  sa.email,
  sa.status as application_status,
  CASE 
    WHEN au.id IS NULL THEN '❌ AUTH USER MISSING'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
    ELSE '✅ AUTH USER OK'
  END as auth_status,
  CASE 
    WHEN pu.id IS NULL THEN '❌ PUBLIC USER MISSING'
    ELSE '✅ PUBLIC USER OK'
  END as public_user_status,
  CASE 
    WHEN s.id IS NULL THEN '❌ STAFF RECORD MISSING'
    ELSE '✅ STAFF RECORD OK'
  END as staff_record_status,
  CASE 
    WHEN au.id IS NOT NULL AND pu.id IS NOT NULL AND s.id IS NOT NULL 
    THEN '🎉 COMPLETE - SHOULD BE ABLE TO LOGIN'
    ELSE '🔧 INCOMPLETE - LOGIN WILL FAIL'
  END as overall_status
FROM public.staff_applications sa
LEFT JOIN auth.users au ON sa.user_id = au.id
LEFT JOIN public.users pu ON sa.user_id = pu.id
LEFT JOIN public.staff s ON sa.user_id = s.user_id
WHERE sa.email = (
  SELECT email FROM public.staff_applications 
  ORDER BY applied_at DESC 
  LIMIT 1
);

-- 6. Show what needs to be done
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM auth.users au 
      JOIN public.staff_applications sa ON sa.user_id = au.id 
      WHERE sa.email = (
        SELECT email FROM public.staff_applications 
        ORDER BY applied_at DESC 
        LIMIT 1
      )
    ) THEN 'NEXT STEP: Create auth user in Supabase Dashboard'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.users pu 
      JOIN public.staff_applications sa ON sa.user_id = pu.id 
      WHERE sa.email = (
        SELECT email FROM public.staff_applications 
        ORDER BY applied_at DESC 
        LIMIT 1
      )
    ) THEN 'NEXT STEP: Create public.users record'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.staff s 
      JOIN public.staff_applications sa ON sa.user_id = s.user_id 
      WHERE sa.email = (
        SELECT email FROM public.staff_applications 
        ORDER BY applied_at DESC 
        LIMIT 1
      )
    ) THEN 'NEXT STEP: Create staff record'
    ELSE 'ALL GOOD: Staff should be able to login'
  END as recommended_action;
