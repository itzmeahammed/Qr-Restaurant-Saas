-- Create storage bucket for restaurant images
-- Run this in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-images',
  'restaurant-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create RLS policies for the bucket
CREATE POLICY "Restaurant owners can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Restaurant owners can view their images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'restaurant-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Restaurant owners can update their images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Restaurant owners can delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to view images
CREATE POLICY "Public can view restaurant images" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-images');
