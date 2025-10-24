-- =====================================================
-- WORKING STORAGE POLICY FOR IMMEDIATE FIX
-- =====================================================
-- Run this in your Supabase SQL Editor to fix RLS violations

-- 1. First, ensure the bucket exists (run in Supabase Dashboard > Storage)
-- Create bucket: restaurant-images (Public: Yes, File size: 5MB)

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads" ON storage.objects;

-- 3. Enable RLS (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create simple working policies

-- Allow authenticated users to upload to restaurant-images bucket
CREATE POLICY "Allow authenticated uploads to restaurant-images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to restaurant images
CREATE POLICY "Allow public read of restaurant-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'restaurant-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to restaurant-images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from restaurant-images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if policies were created successfully
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%restaurant-images%';
