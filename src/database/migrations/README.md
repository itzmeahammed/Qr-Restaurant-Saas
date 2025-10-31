# Database Migrations

This folder contains SQL migration scripts for the Qr-Restaurant-Saas database.

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and run the SQL script
5. Verify the results

### Option 2: Using Supabase CLI
```bash
supabase db push
```

## Available Migrations

### `add_coins_redeemed_to_orders.sql`
**Purpose:** Add `coins_redeemed` column to track Ordyrr Coins redemption per order

**What it does:**
- Adds `coins_redeemed` INTEGER column to `orders` table
- Creates an index for better query performance
- Backfills existing orders with coin redemption data from `loyalty_points` table
- Allows order history to distinguish between:
  - 🎉 First Order Discount (10%)
  - 🪙 Ordyrr Coins Redemption

**When to run:** Before deploying the Ordyrr Coins redemption feature

**Rollback (if needed):**
```sql
DROP INDEX IF EXISTS idx_orders_coins_redeemed;
ALTER TABLE orders DROP COLUMN IF EXISTS coins_redeemed;
```

## Migration Status

- ✅ `add_coins_redeemed_to_orders.sql` - Ready to run
