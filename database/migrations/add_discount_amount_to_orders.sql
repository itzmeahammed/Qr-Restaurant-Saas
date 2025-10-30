-- Add discount_amount column to orders table
-- This column stores the discount amount applied to an order (e.g., first order discount)

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to the column
COMMENT ON COLUMN orders.discount_amount IS 'Discount amount applied to the order (e.g., first order discount, promotional discount)';

-- Update existing orders to have 0.00 discount if null
UPDATE orders 
SET discount_amount = 0.00 
WHERE discount_amount IS NULL;
