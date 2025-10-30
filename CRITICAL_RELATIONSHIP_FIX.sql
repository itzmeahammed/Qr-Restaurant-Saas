-- ========================================
-- CRITICAL DATABASE RELATIONSHIP FIX
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ========================================

BEGIN;

-- 1. Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying UNIQUE,
  phone character varying,
  full_name character varying NOT NULL,
  is_guest boolean DEFAULT true,
  auth_user_id uuid,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  favorite_restaurants uuid[],
  dietary_preferences jsonb,
  loyalty_tier character varying DEFAULT 'bronze',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_order_at timestamp with time zone,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

-- 2. Add customer_id column to orders if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid;

-- 3. Add updated_at column to customer_sessions if it doesn't exist
ALTER TABLE public.customer_sessions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 4. Create performance_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  operation_id character varying NOT NULL,
  operation_type character varying NOT NULL,
  duration_ms numeric NOT NULL,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT performance_logs_pkey PRIMARY KEY (id)
);

-- 5. Add missing columns to loyalty_points
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS current_balance integer DEFAULT 0;

ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS tier character varying DEFAULT 'bronze';

-- 6. Drop existing foreign key constraints if they exist (to recreate them properly)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'orders_customer_id_fkey' 
             AND table_name = 'orders' AND table_schema = 'public') THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_customer_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_sessions_customer_id_fkey' 
             AND table_name = 'customer_sessions' AND table_schema = 'public') THEN
    ALTER TABLE public.customer_sessions DROP CONSTRAINT customer_sessions_customer_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'loyalty_points_customer_id_fkey' 
             AND table_name = 'loyalty_points' AND table_schema = 'public') THEN
    ALTER TABLE public.loyalty_points DROP CONSTRAINT loyalty_points_customer_id_fkey;
  END IF;
END $$;

-- 7. Create proper foreign key relationships
ALTER TABLE public.orders 
ADD CONSTRAINT orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.customer_sessions 
ADD CONSTRAINT customer_sessions_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.loyalty_points 
ADD CONSTRAINT loyalty_points_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- 8. Create the customer management function
CREATE OR REPLACE FUNCTION public.get_or_create_guest_customer(
  p_email character varying DEFAULT NULL,
  p_phone character varying DEFAULT NULL,
  p_full_name character varying DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_uuid uuid;
BEGIN
  -- Try to find existing customer by email first
  IF p_email IS NOT NULL THEN
    SELECT id INTO customer_uuid 
    FROM public.customers 
    WHERE email = p_email 
    LIMIT 1;
  END IF;
  
  -- If not found by email, try phone
  IF customer_uuid IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO customer_uuid 
    FROM public.customers 
    WHERE phone = p_phone 
    LIMIT 1;
  END IF;
  
  -- Create new customer if not found
  IF customer_uuid IS NULL THEN
    INSERT INTO public.customers (
      email, 
      phone, 
      full_name, 
      is_guest
    ) VALUES (
      p_email, 
      p_phone, 
      COALESCE(p_full_name, 'Guest Customer'), 
      true
    ) RETURNING id INTO customer_uuid;
  ELSE
    -- Update existing customer with any new info
    UPDATE public.customers 
    SET 
      full_name = COALESCE(p_full_name, full_name),
      updated_at = now()
    WHERE id = customer_uuid;
  END IF;
  
  RETURN customer_uuid;
END;
$$;

-- 9. Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- 10. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow customer creation" ON public.customers;
DROP POLICY IF EXISTS "Allow customer reading" ON public.customers;
DROP POLICY IF EXISTS "Allow customer updates" ON public.customers;
DROP POLICY IF EXISTS "Allow performance log insertion" ON public.performance_logs;
DROP POLICY IF EXISTS "Allow performance log reading" ON public.performance_logs;
DROP POLICY IF EXISTS "Allow loyalty points creation" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow loyalty points reading" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow loyalty points updates" ON public.loyalty_points;

-- 11. Create RLS policies for public access
CREATE POLICY "Allow customer creation" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow customer reading" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Allow customer updates" ON public.customers
  FOR UPDATE USING (true);

CREATE POLICY "Allow performance log insertion" ON public.performance_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow performance log reading" ON public.performance_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow loyalty points creation" ON public.loyalty_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow loyalty points reading" ON public.loyalty_points
  FOR SELECT USING (true);

CREATE POLICY "Allow loyalty points updates" ON public.loyalty_points
  FOR UPDATE USING (true);

-- 12. Grant all necessary permissions
GRANT ALL ON public.customers TO authenticated, anon;
GRANT ALL ON public.performance_logs TO authenticated, anon;
GRANT ALL ON public.loyalty_points TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_guest_customer TO authenticated, anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_id ON public.orders(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON public.customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);

-- 14. Create a default guest customer for existing orders without customer_id
DO $$
DECLARE
  default_customer_id uuid;
BEGIN
  -- Create a default guest customer
  INSERT INTO public.customers (full_name, email, phone, is_guest, created_at)
  VALUES ('Guest Customer', NULL, NULL, true, now())
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_customer_id;
  
  -- If no ID was returned (conflict), get the existing one
  IF default_customer_id IS NULL THEN
    SELECT id INTO default_customer_id 
    FROM public.customers 
    WHERE full_name = 'Guest Customer' AND email IS NULL AND phone IS NULL
    LIMIT 1;
  END IF;
  
  -- Update orders without customer_id to use the default guest customer
  UPDATE public.orders 
  SET customer_id = default_customer_id
  WHERE customer_id IS NULL;
END $$;

COMMIT;

-- Verification queries
SELECT 'Database relationships fixed successfully!' as status;

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('orders', 'customer_sessions', 'loyalty_points')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check that customers table exists and has data
SELECT 
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE is_guest = true) as guest_customers,
  COUNT(*) FILTER (WHERE is_guest = false) as registered_customers
FROM public.customers;
