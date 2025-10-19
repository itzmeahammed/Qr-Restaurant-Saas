# 🗄️ Storage Bucket Setup Guide

## Quick Setup Steps

### 1. Create Storage Bucket

**Option A: Run the setup script**
```bash
node setup-storage.js
```

**Option B: Manual creation in Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `restaurant-images`
   - **Public**: ✅ Yes (checked)
   - **File size limit**: 5MB
   - **Allowed file types**: `image/jpeg, image/png, image/webp, image/gif`

### 2. Set Up Storage Policies

Copy and run this SQL in your **Supabase SQL Editor**:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'restaurant-images' 
  AND auth.role() = 'authenticated'
);

-- Policy for public read access
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'restaurant-images');

-- Policy for users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'restaurant-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Verify Setup

Test the storage by uploading an image through your application:

1. Go to Restaurant Onboarding
2. Try uploading a logo or banner image
3. Check if the image appears correctly

## 📁 Storage Structure

Your images will be organized as:
```
restaurant-images/
├── restaurants/
│   └── {user_id}/
│       ├── logos/
│       │   └── logo_image.jpg
│       └── banners/
│           └── banner_image.jpg
└── menu-items/
    └── {restaurant_id}/
        └── item_image.jpg
```

## 🔧 Storage Features

Your `storageUtils.js` provides:

- ✅ **Image Upload** with compression
- ✅ **File Validation** (type, size)
- ✅ **Automatic Bucket Creation**
- ✅ **Image Compression** (max 1200x800, 80% quality)
- ✅ **File Deletion**
- ✅ **Signed URLs** for private access
- ✅ **Error Handling**

## 🚨 Troubleshooting

### Permission Errors
If you get permission errors when running the script:
1. Create the bucket manually in Supabase Dashboard
2. Run the SQL policies manually
3. Make sure your user has the necessary permissions

### Upload Failures
- Check file size (max 5MB)
- Verify file type (images only)
- Ensure bucket exists and is public
- Check storage policies are applied

### Image Not Displaying
- Verify the bucket is set to **Public**
- Check the public URL is correctly generated
- Ensure storage policies allow public read access

## ✅ Success Indicators

You'll know the setup worked when:
- ✅ Bucket appears in Supabase Storage dashboard
- ✅ Images upload successfully from your app
- ✅ Images display correctly in the UI
- ✅ No console errors during upload/display
