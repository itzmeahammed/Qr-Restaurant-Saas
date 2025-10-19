# Manual Fix for Staff Login Issue

## Problem
Staff member `givegainz3@gmail.com` cannot login with password `12345678` - getting "Invalid login credentials" error.

## Root Cause
The auth user was not created properly during the staff signup process, or the password is different than expected.

## Solution Steps

### Step 1: Run Diagnostic Script
Run the `fix_staff_auth_user.sql` script in Supabase SQL editor to check the current status.

### Step 2: Manual Auth User Creation (Most Likely Fix)

1. **Go to Supabase Dashboard**
   - Navigate to Authentication → Users
   - Click "Add User" button

2. **Create the Auth User**
   - **Email**: `givegainz3@gmail.com`
   - **Password**: `12345678`
   - **Auto Confirm User**: ✅ (Check this box)
   - **User Metadata** (click "Add metadata"):
     ```json
     {
       "full_name": "staff 1",
       "phone": "87928345234",
       "role": "staff"
     }
     ```

3. **Get the New User ID**
   - After creating, note the new user ID (will be different from current one)
   - Copy this ID

### Step 3: Update Staff Application with New User ID

Run this SQL in Supabase SQL editor (replace `NEW_USER_ID` with the actual ID):

```sql
-- Update staff application with new user ID
UPDATE public.staff_applications 
SET user_id = 'NEW_USER_ID_HERE'
WHERE email = 'givegainz3@gmail.com';

-- Update staff record with new user ID
UPDATE public.staff 
SET user_id = 'NEW_USER_ID_HERE'
WHERE user_id = '5ce5737e-b426-4f4b-b0bd-04068999a0f6';
```

### Step 4: Test Login
- Try logging in with `givegainz3@gmail.com` / `12345678`
- Should now work successfully

## Alternative: Reset Existing User Password

If the auth user exists but password is wrong:

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Find** `givegainz3@gmail.com`
3. **Click the user** → "Update User"
4. **Set new password** to `12345678`
5. **Confirm email** if not already confirmed
6. **Test login**

## Prevention for Future

The enhanced `handleApproveApplication` function in `StaffApplicationsTab.jsx` now has better error handling to prevent this issue from happening again.

## Verification

After fixing, the staff member should be able to:
1. ✅ Login with `givegainz3@gmail.com` / `12345678`
2. ✅ Access the staff dashboard
3. ✅ See their application as approved
4. ✅ Have full staff functionality
