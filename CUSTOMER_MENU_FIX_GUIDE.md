# Customer Menu Database Issues - Fix Guide

## 🚨 Issues Identified

1. **406 Error on tables**: Table structure or RLS policy issues
2. **404 Error on menu_categories**: Wrong table name (should be `categories`)
3. **Empty session ID**: Session initialization timing issue

## ✅ Fixes Applied

### 1. Database Table Name Consistency
**Problem**: CustomerMenu.jsx was querying `menu_categories` but the actual table is `categories`

**Fix**: Updated CustomerMenu.jsx to use correct table name:
```javascript
// Before (WRONG)
.from('menu_categories')

// After (CORRECT)
.from('categories')
```

### 2. Enhanced Error Handling
**Problem**: Poor error handling causing crashes when tables don't exist

**Fix**: Added comprehensive try-catch blocks:
```javascript
// Graceful handling of missing tables/data
try {
  const { data, error } = await supabase.from('categories')...
  if (error) {
    console.warn('Categories fetch error:', error)
    setCategories([])
  } else {
    setCategories(data || [])
  }
} catch (err) {
  console.warn('Error fetching categories:', err)
  setCategories([])
}
```

### 3. Session Initialization Fix
**Problem**: Session was being initialized before restaurantId was available

**Fix**: Added restaurantId check:
```javascript
const initializeCustomerSession = async () => {
  try {
    if (restaurantId) {  // ← Added this check
      const sessionToken = initializeSession(restaurantId, finalTableId)
      setSessionId(sessionToken)
      console.log('✅ Customer session initialized:', sessionToken)
    }
  } catch (error) {
    console.error('Session initialization error:', error)
  }
}
```

## 🛠️ Database Setup Required

### Step 1: Run the Database Fix Script
Execute the SQL script to ensure all tables exist with correct structure:

```bash
# Run this in your Supabase SQL editor
# File: database/fix_customer_menu_tables.sql
```

### Step 2: Verify Table Structure
The script creates/fixes these tables:
- ✅ `tables` - Restaurant tables with QR codes
- ✅ `categories` - Menu categories 
- ✅ `menu_items` - Menu items with categories

### Step 3: Check RLS Policies
The script sets up proper Row Level Security:
- 🔓 **Public READ access** for customer menu viewing
- 🔒 **Owner FULL access** for restaurant management

## 🧪 Testing Steps

### 1. Test Restaurant Data Loading
```
URL: http://localhost:3000/menu/{restaurant_id}?table=1&tableId={table_id}
Expected: Restaurant name and details load
```

### 2. Test Categories Loading
```
Expected: Menu categories appear as tabs
Fallback: If no categories, shows "No items available" message
```

### 3. Test Menu Items Loading
```
Expected: Menu items display in grid
Fallback: If no items, shows helpful empty state
```

### 4. Test Session Initialization
```
Expected: Console shows "✅ Customer session initialized: session_xxx"
Expected: No empty session ID in realtime service
```

## 🔍 Debug Information

### Check Console Logs
Look for these success messages:
```
✅ Customer session initialized: session_xxx
✅ Subscribed to session: session_xxx
```

### Check Network Tab
Verify these API calls succeed:
- ✅ `GET /restaurants?id=eq.{restaurant_id}` → 200 OK
- ✅ `GET /categories?restaurant_id=eq.{restaurant_id}` → 200 OK  
- ✅ `GET /menu_items?restaurant_id=eq.{restaurant_id}` → 200 OK
- ✅ `GET /tables?id=eq.{table_id}` → 200 OK (optional)

## 🚀 Expected Results After Fix

1. **QR Code Scan** → Menu loads successfully
2. **Restaurant Info** → Name and details display
3. **Categories** → Menu tabs appear (or graceful empty state)
4. **Menu Items** → Items display in grid (or helpful empty message)
5. **Session** → Real-time connection established
6. **Cart** → Add to cart functionality works
7. **Orders** → Order placement with staff assignment

## 📝 Sample Data

The fix script includes sample data creation:
- 4 default categories (Appetizers, Main Course, Beverages, Desserts)
- 4 sample tables (different capacities and locations)
- 3 sample menu items for testing

This ensures the menu has content to display immediately after setup.

## 🔧 Manual Verification

If issues persist, manually check in Supabase dashboard:
1. **Tables exist**: `restaurants`, `categories`, `menu_items`, `tables`
2. **RLS enabled**: All tables have Row Level Security enabled
3. **Policies exist**: Public read policies for customer access
4. **Sample data**: At least one restaurant with categories and items

The customer menu should now work end-to-end from QR code scan to order placement! 🎉
