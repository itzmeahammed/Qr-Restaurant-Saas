-- Migration: Add coins_redeemed column to orders table
-- Purpose: Track Ordyrr Coins redeemed for each order to distinguish from first order discount
-- Date: 2025-10-31

-- Add coins_redeemed column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coins_redeemed INTEGER DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN orders.coins_redeemed IS 'Number of Ordyrr Coins redeemed for this order';

-- Create index for better query performance when filtering by coins redemption
CREATE INDEX IF NOT EXISTS idx_orders_coins_redeemed ON orders(coins_redeemed) WHERE coins_redeemed > 0;

-- Update existing orders with discount_amount > 0 to check if they used coins
-- This is a one-time data migration to backfill existing orders
-- Orders with coins redemption will have a matching loyalty_points record
UPDATE orders o
SET coins_redeemed = COALESCE(
  (SELECT lp.points_redeemed 
   FROM loyalty_points lp 
   WHERE lp.order_id = o.id 
   AND lp.transaction_type = 'redemption' 
   LIMIT 1), 
  0
)
WHERE o.discount_amount > 0 
AND o.coins_redeemed = 0;

-- Verify the migration
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN coins_redeemed > 0 THEN 1 END) as orders_with_coins,
  SUM(coins_redeemed) as total_coins_redeemed
FROM orders;
