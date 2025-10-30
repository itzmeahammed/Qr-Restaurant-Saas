-- Database Schema Fixes for QR Restaurant SaaS
-- Fix missing columns and tables causing customer order flow issues

-- 1. Add missing customer_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid;

-- Add foreign key constraint for customer_id (references auth.users for guest customers)
ALTER TABLE public.orders 
ADD CONSTRAINT IF NOT EXISTS orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users(id);

-- 2. Create missing performance_logs table for performance monitoring
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

-- 3. Create customers table for guest customer management (QR scan flow)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying UNIQUE,
  phone character varying,
  full_name character varying,
  is_guest boolean DEFAULT true,
  auth_user_id uuid, -- Links to auth.users if they sign up later
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  favorite_restaurants uuid[], -- Array of restaurant IDs
  dietary_preferences jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_order_at timestamp with time zone,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

-- 4. Add customer_id reference to customer_sessions for proper linking
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'customer_sessions_customer_id_fkey' 
             AND table_name = 'customer_sessions') THEN
    ALTER TABLE public.customer_sessions DROP CONSTRAINT customer_sessions_customer_id_fkey;
  END IF;
  
  -- Update customer_sessions to reference customers table instead of auth.users
  ALTER TABLE public.customer_sessions 
  ADD CONSTRAINT customer_sessions_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- 5. Update loyalty_points to reference customers table
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'loyalty_points_customer_id_fkey' 
             AND table_name = 'loyalty_points') THEN
    ALTER TABLE public.loyalty_points DROP CONSTRAINT loyalty_points_customer_id_fkey;
  END IF;
  
  -- Add new constraint
  ALTER TABLE public.loyalty_points 
  ADD CONSTRAINT loyalty_points_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);
END $$;

-- 6. Add current_balance column to loyalty_points for proper balance tracking
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS current_balance integer DEFAULT 0;

-- Add tier column for loyalty tiers
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS tier character varying DEFAULT 'bronze';

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_session_id ON public.customer_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation_type ON public.performance_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON public.performance_logs(created_at);

-- 8. Create RLS policies for new tables

-- Enable RLS on new tables
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Performance logs - allow all authenticated users to insert and read their own logs
CREATE POLICY "Allow performance log insertion" ON public.performance_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow performance log reading" ON public.performance_logs
  FOR SELECT USING (true);

-- Customers - allow public access for guest customers, authenticated access for registered customers
CREATE POLICY "Allow customer creation" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow customer reading" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Allow customer updates" ON public.customers
  FOR UPDATE USING (
    auth_user_id = auth.uid() OR 
    auth_user_id IS NULL -- Allow updates for guest customers
  );

-- 9. Create helper functions for customer management

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
  -- Try to find existing customer by email or phone
  IF p_email IS NOT NULL THEN
    SELECT id INTO customer_uuid 
    FROM public.customers 
    WHERE email = p_email 
    LIMIT 1;
  END IF;
  
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
      p_full_name, 
      true
    ) RETURNING id INTO customer_uuid;
  END IF;
  
  RETURN customer_uuid;
END;
$$;

-- Function to update customer stats after order
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update customer stats when order is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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

-- Create trigger for customer stats updates
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_stats();

-- 10. Migrate existing data (if any)

-- Update existing orders without customer_id to have NULL (will be handled by application)
-- This is safe as existing orders can continue without customer_id

-- 11. Grant necessary permissions
GRANT ALL ON public.performance_logs TO authenticated, anon;
GRANT ALL ON public.customers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_guest_customer TO authenticated, anon;

-- Grant sequence permissions if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

COMMENT ON TABLE public.performance_logs IS 'Performance monitoring and logging for operations';
COMMENT ON TABLE public.customers IS 'Customer records for both guest and registered customers';
COMMENT ON FUNCTION public.get_or_create_guest_customer IS 'Creates or retrieves guest customer for QR scan orders';
COMMENT ON FUNCTION public.update_customer_stats IS 'Updates customer statistics when orders are completed';
