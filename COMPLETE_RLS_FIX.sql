-- =====================================================
-- COMPLETE RLS FIX FOR QR RESTAURANT SAAS
-- =====================================================
-- This addresses all RLS policy violations for storage and database tables
-- Run these commands in your Supabase SQL Editor

-- =====================================================
-- PART 1: STORAGE POLICIES FIX
-- =====================================================

-- Create the storage bucket if it doesn't exist (run in Dashboard > Storage)
-- Bucket name: restaurant-images
-- Public: Yes, File size limit: 5MB

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to restaurant-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of restaurant-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to restaurant-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from restaurant-images" ON storage.objects;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simple, working storage policies
CREATE POLICY "restaurant_images_upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

CREATE POLICY "restaurant_images_select" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'restaurant-images');

CREATE POLICY "restaurant_images_update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

CREATE POLICY "restaurant_images_delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'restaurant-images' AND auth.role() = 'authenticated');

-- =====================================================
-- PART 2: DATABASE TABLE POLICIES FIX
-- =====================================================

-- Fix restaurants table RLS policies
DROP POLICY IF EXISTS "Users can insert their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Users can view restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON public.restaurants;

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create permissive restaurant policies
CREATE POLICY "restaurants_insert" 
ON public.restaurants FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "restaurants_select" 
ON public.restaurants FOR SELECT 
USING (true); -- Allow public read for customer discovery

CREATE POLICY "restaurants_update" 
ON public.restaurants FOR UPDATE 
USING (owner_id = auth.uid());

-- Fix categories table RLS policies
DROP POLICY IF EXISTS "Users can insert categories for their restaurant" ON public.categories;
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories for their restaurant" ON public.categories;

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create permissive category policies
CREATE POLICY "categories_insert" 
ON public.categories FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_select" 
ON public.categories FOR SELECT 
USING (true); -- Allow public read for customer menus

CREATE POLICY "categories_update" 
ON public.categories FOR UPDATE 
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- PART 3: STAFF TABLE POLICIES (if needed)
-- =====================================================

-- Enable RLS on staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing staff policies
DROP POLICY IF EXISTS "staff_insert" ON public.staff;
DROP POLICY IF EXISTS "staff_select" ON public.staff;
DROP POLICY IF EXISTS "staff_update" ON public.staff;

-- Create staff policies
CREATE POLICY "staff_insert" 
ON public.staff FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "staff_select" 
ON public.staff FOR SELECT 
USING (
  user_id = auth.uid() OR 
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "staff_update" 
ON public.staff FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- PART 4: VERIFICATION QUERIES
-- =====================================================

-- Check storage policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check restaurant policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'restaurants' AND schemaname = 'public';

-- Check category policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'categories' AND schemaname = 'public';

-- =====================================================
-- EMERGENCY FALLBACK (if still having issues)
-- =====================================================
-- Uncomment these lines ONLY if you're still getting RLS violations
-- and need to temporarily disable RLS for testing

-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
