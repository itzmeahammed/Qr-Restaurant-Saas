-- =====================================================
-- SIMPLIFIED SUPABASE STORAGE POLICIES FOR QR RESTAURANT SAAS
-- =====================================================
-- Run these commands in your Supabase SQL Editor
-- This version avoids complex table references that cause RLS violations

-- 1. CREATE STORAGE BUCKET (Run in Supabase Dashboard > Storage)
-- Bucket name: restaurant-images
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- 2. ENABLE RLS ON STORAGE OBJECTS (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES (if any)
DROP POLICY IF EXISTS "Restaurant owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can view their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads" ON storage.objects;

-- 4. CREATE SIMPLIFIED STORAGE POLICIES

-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to their folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'restaurants'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Allow public read access to all restaurant images
CREATE POLICY "Public can view restaurant images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'restaurant-images');

-- Policy 3: Allow users to update their own uploads
CREATE POLICY "Users can update their uploads" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'restaurants'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own uploads
CREATE POLICY "Users can delete their uploads" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'restaurants'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your policies are working:

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test upload path (replace 'your-user-id' with actual auth.uid())
-- Expected path: restaurant-images/restaurants/your-user-id/logos/image.jpg
-- Expected path: restaurant-images/restaurants/your-user-id/banners/image.jpg

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================
-- If you still get RLS violations:

-- Option 1: Temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a super permissive policy for testing
-- CREATE POLICY "Allow all for testing" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- Option 3: Check your bucket exists and is public
-- SELECT * FROM storage.buckets WHERE name = 'restaurant-images';
