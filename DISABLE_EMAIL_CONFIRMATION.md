# 🔧 Selective Email Confirmation Setup

## Issue
- **Restaurant owners** need email confirmation for security and verification
- **Staff accounts** should work without email confirmation for easy onboarding
- Current setup: All accounts require email confirmation (causing staff creation to fail)

## Solution: Configure Selective Email Confirmation

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **Qr-Restaurant-Saas**

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click **Authentication**
2. Click **Settings** tab
3. Scroll down to **User Signups** section

### Step 3: Option A - Disable Global Email Confirmation (Simplest)
1. Find **"Enable email confirmations"** toggle
2. **Turn OFF** the toggle (disable it)
3. Click **Save** button

**Result**: No email confirmation for any users (restaurant owners or staff)

### Step 4: Option B - Keep Email Confirmation + Manual Verification (Recommended)
1. Find **"Enable email confirmations"** - keep this **ON**
2. Find **"Enable manual linking"** - turn this **ON** 
3. Click **Save** button

**Result**: 
- Restaurant owners: Can confirm email for full verification
- Staff accounts: Can login without email confirmation
- Best of both worlds!

### Step 5: Option C - Custom Email Confirmation (Advanced)
Use database triggers or Edge Functions to selectively require email confirmation based on user role:

```sql
-- Example: Auto-confirm staff accounts
CREATE OR REPLACE FUNCTION auto_confirm_staff()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm if user has staff role
  IF NEW.raw_user_meta_data->>'role' = 'staff' THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_confirm_staff_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_staff();
```

## ✅ Results by Option

### Option A (Global Disable):
- ✅ Staff accounts work immediately
- ⚠️ Restaurant owners don't get email verification
- ✅ Simplest to implement

### Option B (Manual Linking - Recommended):
- ✅ Staff accounts work immediately  
- ✅ Restaurant owners can still verify emails
- ✅ Flexible verification process
- ✅ Best user experience

### Option C (Custom Triggers):
- ✅ Staff accounts auto-confirmed
- ✅ Restaurant owners require email confirmation
- ✅ Most secure and flexible
- ⚠️ Requires SQL knowledge

## 🔄 Alternative: Use Environment Variables
If you prefer to handle this programmatically, you can also:

1. Set up a server-side function with service role key
2. Use `supabase.auth.admin.createUser()` with `email_confirm: true`
3. This requires backend implementation

## 📝 Current Code Behavior
The current code handles both scenarios:
- ✅ **Email confirmation disabled**: Creates staff account with login credentials
- ✅ **Email confirmation enabled**: Creates staff record, shows appropriate message

## 🎯 Recommended Action

**Use Option B (Manual Linking)** for the best balance:

1. **Keep email confirmation ON** for restaurant owner security
2. **Enable manual linking** for staff account flexibility  
3. **Restaurant owners**: Get email verification for security
4. **Staff accounts**: Can login immediately without email confirmation

This gives you:
- ✅ **Security**: Restaurant owners must verify emails
- ✅ **Convenience**: Staff can start working immediately
- ✅ **Flexibility**: Manual verification when needed
- ✅ **No code changes required**: Current implementation handles both cases

### Quick Setup:
1. Supabase Dashboard → Authentication → Settings
2. **"Enable email confirmations"** → Keep **ON**
3. **"Enable manual linking"** → Turn **ON**
4. Save changes

Perfect solution for your restaurant SaaS! 🎉
