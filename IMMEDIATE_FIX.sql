-- ========================================
-- IMMEDIATE DATABASE FIX - RUN THIS NOW
-- Fixes all remaining database issues
-- ========================================

BEGIN;

-- 1. Add missing updated_at column to customer_sessions
ALTER TABLE public.customer_sessions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Add missing customer_id column to orders (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid;

-- 3. Create customers table if not exists
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

-- 4. Create performance_logs table if not exists
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

-- 5. Add missing loyalty points columns
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS current_balance integer DEFAULT 0;

ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS tier character varying DEFAULT 'bronze';

-- 6. Fix foreign key constraints safely
DO $$
BEGIN
  -- Fix orders customer_id constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'orders_customer_id_fkey' 
             AND table_name = 'orders' AND table_schema = 'public') THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_customer_id_fkey;
  END IF;
  
  ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

DO $$
BEGIN
  -- Fix customer_sessions customer_id constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_sessions_customer_id_fkey' 
             AND table_name = 'customer_sessions' AND table_schema = 'public') THEN
    ALTER TABLE public.customer_sessions DROP CONSTRAINT customer_sessions_customer_id_fkey;
  END IF;
  
  ALTER TABLE public.customer_sessions 
  ADD CONSTRAINT customer_sessions_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

DO $$
BEGIN
  -- Fix loyalty_points customer_id constraint
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'loyalty_points_customer_id_fkey' 
             AND table_name = 'loyalty_points' AND table_schema = 'public') THEN
    ALTER TABLE public.loyalty_points DROP CONSTRAINT loyalty_points_customer_id_fkey;
  END IF;
  
  ALTER TABLE public.loyalty_points 
  ADD CONSTRAINT loyalty_points_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- 7. Create customer management function
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

-- 8. Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow customer creation" ON public.customers;
DROP POLICY IF EXISTS "Allow customer reading" ON public.customers;
DROP POLICY IF EXISTS "Allow customer updates" ON public.customers;
DROP POLICY IF EXISTS "Allow performance log insertion" ON public.performance_logs;
DROP POLICY IF EXISTS "Allow performance log reading" ON public.performance_logs;
DROP POLICY IF EXISTS "Allow loyalty points creation" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow loyalty points reading" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow loyalty points updates" ON public.loyalty_points;

-- 10. Create RLS policies for public access
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

-- Enable RLS on loyalty_points if not already enabled
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow loyalty points creation" ON public.loyalty_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow loyalty points reading" ON public.loyalty_points
  FOR SELECT USING (true);

CREATE POLICY "Allow loyalty points updates" ON public.loyalty_points
  FOR UPDATE USING (true);

-- 11. Grant permissions
GRANT ALL ON public.customers TO authenticated, anon;
GRANT ALL ON public.performance_logs TO authenticated, anon;
GRANT ALL ON public.loyalty_points TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_guest_customer TO authenticated, anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON public.customer_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON public.customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation_type ON public.performance_logs(operation_type);

COMMIT;

-- Verification
SELECT 'Database fix completed successfully!' as status;

-- Check that all required tables and columns exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_sessions' AND column_name = 'updated_at') 
    THEN '✅ customer_sessions.updated_at exists'
    ELSE '❌ customer_sessions.updated_at missing'
  END as updated_at_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') 
    THEN '✅ orders.customer_id exists'
    ELSE '❌ orders.customer_id missing'
  END as customer_id_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
    THEN '✅ customers table exists'
    ELSE '❌ customers table missing'
  END as customers_table_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_logs') 
    THEN '✅ performance_logs table exists'
    ELSE '❌ performance_logs table missing'
  END as performance_logs_check;
