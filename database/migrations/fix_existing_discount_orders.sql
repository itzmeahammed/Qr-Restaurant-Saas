-- Fix existing orders that have discount applied but not tracked in customer_offers
-- This script will insert records into customer_offers for orders that have discount_amount > 0

-- Step 1: Find the FIRST_ORDER_10 offer ID
-- You'll need to replace 'YOUR_OFFER_ID' with the actual offer ID from your database
-- Run this first to get the offer ID:
-- SELECT id FROM offers WHERE offer_code = 'FIRST_ORDER_10';

-- Step 2: Insert records for existing orders with discount
-- This will create customer_offers records for orders that have discount but no tracking

INSERT INTO customer_offers (customer_id, offer_id, order_id, discount_amount, used_at)
SELECT 
  o.customer_id,
  (SELECT id FROM offers WHERE offer_code = 'FIRST_ORDER_10' LIMIT 1) as offer_id,
  o.id as order_id,
  o.discount_amount,
  o.created_at as used_at
FROM orders o
WHERE o.discount_amount > 0
  AND o.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM customer_offers co 
    WHERE co.order_id = o.id
  )
ORDER BY o.created_at ASC;

-- Step 3: Verify the fix
-- Run this to see which customers now have offer usage tracked:
-- SELECT 
--   co.*,
--   c.full_name,
--   c.email,
--   o.order_number,
--   o.total_amount
-- FROM customer_offers co
-- JOIN customers c ON c.id = co.customer_id
-- JOIN orders o ON o.id = co.order_id
-- WHERE co.offer_id = (SELECT id FROM offers WHERE offer_code = 'FIRST_ORDER_10')
-- ORDER BY co.used_at DESC;

-- Step 4: Check for customers who used the discount multiple times
-- This will show customers who have multiple discount orders:
-- SELECT 
--   c.id,
--   c.full_name,
--   c.email,
--   COUNT(*) as discount_order_count,
--   SUM(o.discount_amount) as total_discount_received
-- FROM customers c
-- JOIN orders o ON o.customer_id = c.id
-- WHERE o.discount_amount > 0
-- GROUP BY c.id, c.full_name, c.email
-- HAVING COUNT(*) > 1
-- ORDER BY discount_order_count DESC;
