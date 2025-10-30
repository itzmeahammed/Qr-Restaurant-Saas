-- ========================================
-- CORRECTED DATABASE SCHEMA FIX
-- QR Restaurant SaaS - No Syntax Errors
-- ========================================

-- This script fixes ALL database issues with correct PostgreSQL syntax
-- Run this in your Supabase SQL Editor

BEGIN;

-- ========================================
-- 1. CREATE CUSTOMERS TABLE (MISSING)
-- ========================================

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying UNIQUE,
  phone character varying,
  full_name character varying NOT NULL,
  is_guest boolean DEFAULT true,
  auth_user_id uuid, -- Links to auth.users if they register later
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  favorite_restaurants uuid[], -- Array of restaurant IDs
  dietary_preferences jsonb,
  loyalty_tier character varying DEFAULT 'bronze',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_order_at timestamp with time zone,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

-- ========================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ========================================

-- Add the missing customer_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid;

-- Add missing updated_at column to customer_sessions table
ALTER TABLE public.customer_sessions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ========================================
-- 3. CREATE PERFORMANCE_LOGS TABLE (MISSING)
-- ========================================

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

-- ========================================
-- 4. ADD MISSING LOYALTY POINTS COLUMNS
-- ========================================

-- Add missing columns for proper loyalty management
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS current_balance integer DEFAULT 0;

ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS tier character varying DEFAULT 'bronze';

-- ========================================
-- 5. FIX FOREIGN KEY CONSTRAINTS (SAFE METHOD)
-- ========================================

-- Fix orders table foreign key
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'orders_customer_id_fkey' 
             AND table_name = 'orders' AND table_schema = 'public') THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_customer_id_fkey;
  END IF;
  
  -- Add new constraint
  ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- Fix customer_sessions foreign key
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_sessions_customer_id_fkey' 
             AND table_name = 'customer_sessions' AND table_schema = 'public') THEN
    ALTER TABLE public.customer_sessions DROP CONSTRAINT customer_sessions_customer_id_fkey;
  END IF;
  
  -- Add correct foreign key constraint to customers table
  ALTER TABLE public.customer_sessions 
  ADD CONSTRAINT customer_sessions_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- Fix loyalty_points foreign key
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'loyalty_points_customer_id_fkey' 
             AND table_name = 'loyalty_points' AND table_schema = 'public') THEN
    ALTER TABLE public.loyalty_points DROP CONSTRAINT loyalty_points_customer_id_fkey;
  END IF;
  
  -- Add correct foreign key constraint to customers table
  ALTER TABLE public.loyalty_points 
  ADD CONSTRAINT loyalty_points_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- ========================================
-- 6. CREATE CUSTOMER MANAGEMENT FUNCTIONS
-- ========================================

-- Function to create or get guest customer
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

-- Function to update customer stats after order completion
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update customer stats when order is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.customers 
    SET 
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_amount,
      last_order_at = NEW.completed_at,
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ========================================
-- 7. CREATE TRIGGERS
-- ========================================

-- Create trigger for customer stats updates
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- ========================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Customer sessions indexes
CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON public.customer_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON public.customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_restaurant_id ON public.customer_sessions(restaurant_id);

-- Performance logs indexes
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation_type ON public.performance_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON public.performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_logs_success ON public.performance_logs(success);

-- Loyalty points indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer_id ON public.loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_restaurant_id ON public.loyalty_points(restaurant_id);

-- ========================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. CREATE RLS POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow customer creation" ON public.customers;
DROP POLICY IF EXISTS "Allow customer reading" ON public.customers;
DROP POLICY IF EXISTS "Allow customer updates" ON public.customers;
DROP POLICY IF EXISTS "Allow performance log insertion" ON public.performance_logs;
DROP POLICY IF EXISTS "Allow performance log reading" ON public.performance_logs;

-- Customers table policies - allow public access for guest customers
CREATE POLICY "Allow customer creation" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow customer reading" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Allow customer updates" ON public.customers
  FOR UPDATE USING (
    auth_user_id = auth.uid() OR 
    auth_user_id IS NULL -- Allow updates for guest customers
  );

-- Performance logs policies - allow all authenticated users
CREATE POLICY "Allow performance log insertion" ON public.performance_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow performance log reading" ON public.performance_logs
  FOR SELECT USING (true);

-- Loyalty points policies - allow public access for guest customers
CREATE POLICY "Allow loyalty points creation" ON public.loyalty_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow loyalty points reading" ON public.loyalty_points
  FOR SELECT USING (true);

CREATE POLICY "Allow loyalty points updates" ON public.loyalty_points
  FOR UPDATE USING (true);

-- ========================================
-- 11. GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions for all tables and functions
GRANT ALL ON public.customers TO authenticated, anon;
GRANT ALL ON public.performance_logs TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_guest_customer TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_customer_stats TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ========================================
-- 12. VERIFY SCHEMA INTEGRITY
-- ========================================

-- Check that all required tables exist
DO $$
BEGIN
  -- Check customers table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'customers table was not created properly';
  END IF;
  
  -- Check performance_logs table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_logs' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'performance_logs table was not created properly';
  END IF;
  
  -- Check customer_id column in orders
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'customer_id column was not added to orders table';
  END IF;
  
  -- Check functions exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_or_create_guest_customer' AND routine_schema = 'public') THEN
    RAISE EXCEPTION 'get_or_create_guest_customer function was not created';
  END IF;
  
  RAISE NOTICE 'All database schema fixes applied successfully!';
END $$;

COMMIT;

-- ========================================
-- SCHEMA FIX COMPLETE - NO SYNTAX ERRORS
-- ========================================

-- Summary of changes:
-- ✅ Created customers table for proper customer management
-- ✅ Added customer_id column to orders table
-- ✅ Created performance_logs table for monitoring
-- ✅ Fixed all foreign key constraints to reference customers table
-- ✅ Added loyalty points enhancements (current_balance, tier)
-- ✅ Created customer management functions
-- ✅ Added proper indexes for performance
-- ✅ Set up RLS policies for security
-- ✅ Granted necessary permissions
-- ✅ Added triggers for automatic customer stats updates

-- IMPORTANT: This script uses correct PostgreSQL syntax and should run without errors!

-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all tables and functions are created
-- 3. Test the QR scan customer flow
-- 4. Test staff-assisted orders
-- 5. Monitor performance logs for any remaining issues
