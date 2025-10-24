# 🏗️ Multi-Restaurant Storage Management - Step-by-Step Implementation Guide

This guide provides a complete step-by-step process to implement the enhanced storage management system for multiple restaurants with proper organization, security, and type-specific handling.

## 📋 Prerequisites

- ✅ Supabase project set up
- ✅ Database schema deployed (restaurants, staff, menu_items, categories tables)
- ✅ Authentication system working
- ✅ React application running

## 🚀 Step 1: Create Storage Bucket

### 1.1 Create Bucket in Supabase Dashboard
1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Set bucket name: `restaurant-images`
4. Set as **Public**: ✅ Yes
5. Set file size limit: **5MB**
6. Set allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
7. Click **"Create bucket"**

### 1.2 Verify Bucket Creation
```javascript
// Test in browser console or component
import { supabase } from './config/supabase'

const testBucket = async () => {
  const { data, error } = await supabase.storage.listBuckets()
  console.log('Buckets:', data)
  console.log('restaurant-images exists:', data.some(b => b.name === 'restaurant-images'))
}
```

## 🔐 Step 2: Apply Storage Policies

### 2.1 Run SQL Policies
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire content from `SUPABASE_STORAGE_POLICIES.sql`
3. Click **"Run"** to execute all policies
4. Verify no errors in the output

### 2.2 Verify Policies Applied
```sql
-- Run this in SQL Editor to verify
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

Expected policies:
- ✅ `Authenticated users can upload restaurant images`
- ✅ `Public can view restaurant images`
- ✅ `Restaurant owners and staff can update images`
- ✅ `Restaurant owners and staff can delete images`

## 🛠️ Step 3: Update Storage Utils (Already Done)

The enhanced `storageUtils.js` includes:
- ✅ `uploadRestaurantImage()` - Restaurant-specific uploads
- ✅ `deleteRestaurantImage()` - Proper deletion
- ✅ `listRestaurantImages()` - List restaurant images
- ✅ `compressRestaurantImage()` - Type-specific compression
- ✅ Backward compatibility with legacy functions

## 📱 Step 4: Update Restaurant Onboarding

### 4.1 Update Import (Already Done)
```javascript
// In RestaurantOnboarding.jsx
import { uploadRestaurantImage, compressRestaurantImage, createStorageBucket } from '../utils/storageUtils'
```

### 4.2 Update Image Upload Function
```javascript
// Replace existing uploadImages function in RestaurantOnboarding.jsx
const uploadImages = async (restaurantId) => {
  const uploadPromises = []
  
  try {
    // Upload logo if exists
    if (formData.logoFile) {
      console.log('📸 Compressing and uploading logo...')
      const compressedLogo = await compressRestaurantImage(formData.logoFile, 'logo')
      const logoResult = await uploadRestaurantImage(compressedLogo, restaurantId, 'logo')
      console.log('✅ Logo uploaded:', logoResult.url)
      uploadPromises.push({ type: 'logo', url: logoResult.url, path: logoResult.path })
    }

    // Upload banner if exists
    if (formData.bannerFile) {
      console.log('📸 Compressing and uploading banner...')
      const compressedBanner = await compressRestaurantImage(formData.bannerFile, 'banner')
      const bannerResult = await uploadRestaurantImage(compressedBanner, restaurantId, 'banner')
      console.log('✅ Banner uploaded:', bannerResult.url)
      uploadPromises.push({ type: 'banner', url: bannerResult.url, path: bannerResult.path })
    }

    return uploadPromises
  } catch (error) {
    console.error('❌ Image upload failed:', error)
    toast.error(`Image upload failed: ${error.message}`)
    throw error
  }
}
```

## 🍽️ Step 5: Update Menu Management

### 5.1 Update MenuTab Component (Partially Done)
```javascript
// In MenuTab.jsx - Update imports (already done)
import { uploadRestaurantImage, deleteRestaurantImage, compressRestaurantImage } from '../../utils/storageUtils'

// Add restaurant context
const MenuTab = ({ menuItems, categories, onAddItem, onUpdateItem, onDeleteItem, onAddCategory, restaurantId }) => {
  // ... existing code

  // Update image upload for menu items
  const handleImageUpload = async (file, itemId = null) => {
    try {
      if (!restaurantId) {
        throw new Error('Restaurant ID is required')
      }

      const compressedImage = await compressRestaurantImage(file, 'menu-item')
      const result = await uploadRestaurantImage(compressedImage, restaurantId, 'menu-item')
      
      toast.success('Image uploaded successfully!')
      return result.url
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error(`Upload failed: ${error.message}`)
      throw error
    }
  }

  // Update image deletion
  const handleImageDelete = async (imageUrl) => {
    try {
      if (!imageUrl || !restaurantId) return
      
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop()
      await deleteRestaurantImage(restaurantId, 'menu-item', fileName)
      
      toast.success('Image deleted successfully!')
    } catch (error) {
      console.error('Image deletion failed:', error)
      toast.error(`Delete failed: ${error.message}`)
    }
  }
}
```

### 5.2 Pass Restaurant ID to MenuTab
```javascript
// In OwnerDashboard.jsx or wherever MenuTab is used
<MenuTab 
  menuItems={menuItems}
  categories={categories}
  restaurantId={restaurantData?.id} // Add this prop
  onAddItem={handleAddMenuItem}
  onUpdateItem={handleUpdateMenuItem}
  onDeleteItem={handleDeleteMenuItem}
  onAddCategory={handleAddCategory}
/>
```

## 🧪 Step 6: Test the Implementation

### 6.1 Test Restaurant Onboarding
1. **Create New Restaurant**:
   - Go to restaurant onboarding
   - Upload logo (should be compressed to 400x400)
   - Upload banner (should be compressed to 1200x400)
   - Complete onboarding
   - Verify images appear in dashboard

2. **Check Storage Structure**:
   ```
   restaurant-images/
   └── restaurants/
       └── {restaurant-id}/
           ├── logos/
           │   └── {timestamp}_{random}.{ext}
           └── banners/
               └── {timestamp}_{random}.{ext}
   ```

### 6.2 Test Menu Item Images
1. **Add Menu Item with Image**:
   - Go to Menu tab in dashboard
   - Add new menu item
   - Upload image (should be compressed to 800x600)
   - Save item
   - Verify image displays correctly

2. **Update/Delete Menu Item Images**:
   - Edit existing menu item
   - Change image
   - Verify old image is replaced
   - Delete menu item
   - Verify image is removed from storage

### 6.3 Test Permissions
1. **Owner Access**: ✅ Should upload/delete images
2. **Staff Access**: ✅ Should upload/delete images (if implemented)
3. **Public Access**: ✅ Should view images
4. **Unauthorized Access**: ❌ Should be blocked

## 🔍 Step 7: Verify Database Integration

### 7.1 Check Restaurant Records
```sql
-- Verify restaurant records have image URLs
SELECT id, name, logo_url, banner_url 
FROM restaurants 
WHERE owner_id = 'your-user-id';
```

### 7.2 Check Menu Item Records
```sql
-- Verify menu items have image URLs
SELECT mi.id, mi.name, mi.image_url, r.name as restaurant_name
FROM menu_items mi
JOIN restaurants r ON mi.restaurant_id = r.id
WHERE r.owner_id = 'your-user-id';
```

## 🚨 Step 8: Troubleshooting

### 8.1 Common Issues

**Issue**: `403 Forbidden` on upload
**Solution**: 
- Check RLS policies are applied
- Verify user is authenticated
- Ensure correct folder structure: `restaurants/{restaurant-id}/{type}s/`

**Issue**: Images not displaying
**Solution**:
- Check bucket is public
- Verify image URLs are correctly stored in database
- Test direct URL access in browser

**Issue**: Compression not working
**Solution**:
- Check file type is supported
- Verify browser supports Canvas API
- Test with different image formats

### 8.2 Debug Commands
```javascript
// Test storage access
const testStorage = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .list('restaurants', { limit: 10 })
    
    console.log('Storage test:', { data, error })
  } catch (err) {
    console.error('Storage error:', err)
  }
}

// Test image upload
const testUpload = async (file, restaurantId) => {
  try {
    const result = await uploadRestaurantImage(file, restaurantId, 'logo')
    console.log('Upload test:', result)
  } catch (err) {
    console.error('Upload error:', err)
  }
}
```

## ✅ Step 9: Production Checklist

- [ ] Storage bucket created and configured
- [ ] RLS policies applied and tested
- [ ] Restaurant onboarding uploads working
- [ ] Menu item image management working
- [ ] Image compression working for all types
- [ ] Permission system working (owner/staff/public)
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Toast notifications working
- [ ] Database records updated with image URLs
- [ ] Performance tested with multiple images
- [ ] Mobile responsiveness verified

## 🎯 Step 10: Optional Enhancements

### 10.1 Category Images
```javascript
// Add category image support
const uploadCategoryImage = async (file, restaurantId) => {
  const compressed = await compressRestaurantImage(file, 'category')
  return await uploadRestaurantImage(compressed, restaurantId, 'category')
}
```

### 10.2 Image Optimization
```javascript
// Add WebP format support
const optimizeImage = async (file, imageType) => {
  const compressed = await compressRestaurantImage(file, imageType, 0.9)
  // Convert to WebP if supported
  return compressed
}
```

### 10.3 Bulk Operations
```javascript
// Add bulk image upload
const uploadMultipleImages = async (files, restaurantId, imageType) => {
  const results = await Promise.all(
    files.map(file => uploadRestaurantImage(file, restaurantId, imageType))
  )
  return results
}
```

---

## 🎉 Congratulations!

You now have a complete multi-restaurant storage management system with:
- ✅ Proper folder organization
- ✅ Type-specific image compression
- ✅ Comprehensive security policies
- ✅ Database integration
- ✅ Error handling and user feedback
- ✅ Backward compatibility

Your QR Restaurant SaaS platform can now handle multiple restaurants with proper image management! 🚀
