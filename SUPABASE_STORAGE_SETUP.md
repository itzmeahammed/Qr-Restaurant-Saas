# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for the QR Restaurant SaaS application to handle image uploads.

## Prerequisites

- Supabase project created and configured
- Admin access to your Supabase dashboard

## Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Use the following settings:
   - **Name**: `restaurant-images`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif`

## Step 2: Set Up Storage Policies

Go to **Storage** > **Policies** and create the following policies:

### Policy 1: Allow authenticated users to upload images

```sql
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);
```

### Policy 2: Allow public read access to images

```sql
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-images');
```

### Policy 3: Allow users to update their own images

```sql
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 4: Allow users to delete their own images

```sql
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Enable Row Level Security (if not already enabled)

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Step 4: Verify Setup

1. The application will automatically create the bucket if it doesn't exist
2. Test image upload functionality in the Restaurant Onboarding flow
3. Check the Storage dashboard to see uploaded files

## Folder Structure

The application organizes images in the following structure:

```
restaurant-images/
├── restaurants/
│   └── {user_id}/
│       ├── logos/
│       │   └── logo_{timestamp}.{ext}
│       └── banners/
│           └── banner_{timestamp}.{ext}
```

## Features Implemented

- ✅ Automatic bucket creation
- ✅ Image compression before upload
- ✅ Secure file naming with timestamps
- ✅ User-specific folder organization
- ✅ Proper error handling
- ✅ Progress indicators
- ✅ File type and size validation
- ✅ Public URL generation

## Security Features

- Row Level Security (RLS) enabled
- User-specific access controls
- File type restrictions
- File size limits
- Secure folder structure

## Troubleshooting

### Common Issues

1. **Upload fails with permission error**
   - Ensure all storage policies are created correctly
   - Verify RLS is enabled on storage.objects table

2. **Bucket creation fails**
   - Check if user has sufficient permissions
   - Verify bucket name doesn't already exist

3. **Images not displaying**
   - Ensure public read policy is active
   - Check if bucket is set to public

### Debug Steps

1. Check browser console for detailed error messages
2. Verify Supabase project URL and anon key
3. Test policies in Supabase SQL editor
4. Check Storage logs in Supabase dashboard

## Additional Configuration

### Environment Variables

Make sure these are set in your environment:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional: Custom Storage Configuration

You can customize storage settings in `src/utils/storageUtils.js`:

- Change bucket name
- Modify compression settings
- Adjust file size limits
- Update folder structure

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase Storage logs
3. Verify all policies are correctly applied
4. Test with a simple upload first

The application includes comprehensive error handling and will provide detailed error messages to help with troubleshooting.
