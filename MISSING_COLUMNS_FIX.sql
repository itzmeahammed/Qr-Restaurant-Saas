-- ========================================
-- MISSING TIMESTAMP COLUMNS FIX
-- Add missing timestamp columns to orders table
-- ========================================

BEGIN;

-- Add missing timestamp columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

-- Update existing orders to have proper timestamps based on status
UPDATE public.orders 
SET 
  assigned_at = CASE WHEN status IN ('assigned', 'accepted', 'preparing', 'ready', 'delivered', 'completed') THEN created_at ELSE NULL END,
  started_at = CASE WHEN status IN ('accepted', 'preparing', 'ready', 'delivered', 'completed') THEN created_at ELSE NULL END,
  ready_at = CASE WHEN status IN ('ready', 'delivered', 'completed') THEN created_at ELSE NULL END,
  completed_at = CASE WHEN status IN ('completed', 'delivered') THEN created_at ELSE NULL END
WHERE assigned_at IS NULL;

COMMIT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN ('assigned_at', 'started_at', 'ready_at', 'completed_at', 'delivered_at')
ORDER BY column_name;
