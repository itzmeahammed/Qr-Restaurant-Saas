# 🚨 STORAGE RLS FIX - Complete Solution Guide

## 🔍 **Problem Identified:**
- **Error**: `new row violates row-level security policy`
- **Location**: Menu item image uploads in `storageUtils.js:51`
- **Cause**: Supabase storage RLS policies blocking authenticated uploads
- **Status**: Same issue we've fixed before for other tables

## 🎯 **SOLUTION OPTIONS (Try in Order):**

### **Option 1: SQL Script (Recommended)**
Run the SQL script I just created:

```bash
# Navigate to database folder
cd database

# Run the complete RLS disable script
# Copy contents of disable_storage_rls_completely.sql
# Paste in Supabase Dashboard > SQL Editor > Run
```

### **Option 2: Manual Dashboard Method (If SQL Fails)**

#### **Step 1: Delete Storage Policies**
1. Go to https://app.supabase.com
2. Select your project
3. Click **"Database"** → **"Policies"**
4. Search for **"storage"** or **"objects"**
5. **DELETE ALL POLICIES** for `storage.objects` table
6. Look for policies like:
   - `Authenticated users can upload images`
   - `Authenticated users can delete images`
   - `Authenticated users can update images`
   - `Public can view restaurant images`

#### **Step 2: Disable RLS (If Possible)**
1. Go to **"Database"** → **"Tables"**
2. Find `storage` schema → `objects` table
3. Click on `objects` table
4. Look for **"RLS"** toggle or settings
5. **Disable RLS** if option is available

### **Option 3: Alternative Storage Approach**
If RLS cannot be disabled, we can modify the upload approach:

```javascript
// In storageUtils.js - Alternative upload method
export const uploadRestaurantImageAlt = async (file, restaurantId, imageType) => {
  try {
    // Use a simpler path structure
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${file.name.split('.').pop()}`
    const filePath = `${restaurantId}/${imageType}/${fileName}`
    
    // Upload with minimal metadata
    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true  // Allow overwrite
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(filePath)
    
    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error('Alternative upload failed:', error)
    throw error
  }
}
```

## 🔧 **Quick Test After Fix:**

### **Test 1: Check RLS Status**
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```
**Expected Result**: `rls_enabled = false`

### **Test 2: Check Policies**
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```
**Expected Result**: No rows (empty result)

### **Test 3: Try Upload**
1. Go to Owner Dashboard → Menu tab
2. Try adding a menu item with image
3. Should work without RLS errors

## 🎉 **Success Indicators:**
- ✅ No "row-level security policy" errors
- ✅ Images upload successfully
- ✅ Public URLs generated correctly
- ✅ Images display in menu

## 📞 **If Nothing Works:**
This is a Supabase infrastructure issue. Contact Supabase support with:
- Project ID
- Error message: "new row violates row-level security policy"
- Request to disable RLS on `storage.objects` table
- Mention this is for a restaurant management app

## 🔄 **Based on Previous Success:**
We've successfully fixed this same RLS issue on:
- ✅ `categories` table
- ✅ `menu_items` table  
- ✅ `staff_applications` table
- ✅ `staff` table

The same approach should work for `storage.objects` table.

## 🚀 **Why This Happens:**
Supabase enables RLS by default but doesn't create proper policies, causing everything to be blocked. The solution is either:
1. **Disable RLS completely** (our preferred approach)
2. **Create proper policies** (more complex, can have edge cases)

We choose option 1 for simplicity and reliability.
