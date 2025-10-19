-- Unified Users Table Schema
-- This replaces the complex auth system with a simple, role-based approach

-- Drop existing tables if they exist (be careful in production)
-- DROP TABLE IF EXISTS staff CASCADE;
-- DROP TABLE IF EXISTS restaurants CASCADE;

-- Create unified users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('restaurant_owner', 'staff', 'super_admin')),
  
  -- Restaurant owner specific fields
  restaurant_name VARCHAR(255),
  restaurant_description TEXT,
  restaurant_address TEXT,
  restaurant_phone VARCHAR(20),
  restaurant_email VARCHAR(255),
  cuisine_type VARCHAR(100),
  logo_url TEXT,
  banner_url TEXT,
  
  -- Staff specific fields
  restaurant_id UUID REFERENCES users(id), -- Links staff to restaurant owner
  position VARCHAR(100),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  total_orders_completed INTEGER DEFAULT 0,
  total_tips_received DECIMAL(10,2) DEFAULT 0,
  performance_rating DECIMAL(3,2) DEFAULT 5.0,
  
  -- Common fields
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, password_hash, full_name, phone, role, restaurant_name, restaurant_description, restaurant_address, cuisine_type) 
VALUES 
  ('owner@restaurant.com', '$2b$10$example_hash', 'Restaurant Owner', '+1234567890', 'restaurant_owner', 'Sample Restaurant', 'Best food in town', '123 Main St', 'Indian'),
  ('admin@system.com', '$2b$10$example_hash', 'Super Admin', '+1234567891', 'super_admin', NULL, NULL, NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- Create views for easier querying
CREATE OR REPLACE VIEW restaurant_owners AS
SELECT 
  id, email, full_name, phone, 
  restaurant_name, restaurant_description, restaurant_address, 
  restaurant_phone, restaurant_email, cuisine_type, 
  logo_url, banner_url, is_active, created_at
FROM users 
WHERE role = 'restaurant_owner';

CREATE OR REPLACE VIEW staff_members AS
SELECT 
  id, email, full_name, phone, restaurant_id,
  position, hourly_rate, is_available, 
  total_orders_completed, total_tips_received, performance_rating,
  is_active, created_at
FROM users 
WHERE role = 'staff';

-- MIGRATION STEP: Migrate existing restaurant data to users table
DO $$
DECLARE
  migration_query TEXT;
BEGIN
  -- Check if restaurants table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN
    RAISE NOTICE 'Migrating restaurants table to users table...';
    
    -- Build dynamic query based on available columns
    migration_query := '
    INSERT INTO users (
      id, email, password_hash, full_name, role,
      restaurant_name, is_active, created_at';
    
    -- Add optional columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'phone') THEN
      migration_query := migration_query || ', phone, restaurant_phone';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'description') THEN
      migration_query := migration_query || ', restaurant_description';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'address') THEN
      migration_query := migration_query || ', restaurant_address';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'email') THEN
      migration_query := migration_query || ', restaurant_email';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'cuisine_type') THEN
      migration_query := migration_query || ', cuisine_type';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'logo_url') THEN
      migration_query := migration_query || ', logo_url';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'banner_url') THEN
      migration_query := migration_query || ', banner_url';
    END IF;
    
    migration_query := migration_query || '
    )
    SELECT 
      r.id,
      COALESCE(r.email, CONCAT(r.id::text, ''@restaurant.com'')) as email,
      ''$2b$10$temp.password.hash.needs.to.be.reset'' as password_hash,
      COALESCE(r.name, ''Restaurant Owner'') as full_name,
      ''restaurant_owner'' as role,
      COALESCE(r.name, ''Restaurant'') as restaurant_name,
      COALESCE(r.is_active, true) as is_active,
      COALESCE(r.created_at, NOW()) as created_at';
    
    -- Add optional column values
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'phone') THEN
      migration_query := migration_query || ', r.phone, r.phone';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'description') THEN
      migration_query := migration_query || ', r.description';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'address') THEN
      migration_query := migration_query || ', r.address';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'email') THEN
      migration_query := migration_query || ', r.email';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'cuisine_type') THEN
      migration_query := migration_query || ', r.cuisine_type';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'logo_url') THEN
      migration_query := migration_query || ', r.logo_url';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'banner_url') THEN
      migration_query := migration_query || ', r.banner_url';
    END IF;
    
    migration_query := migration_query || '
    FROM restaurants r
    WHERE r.id NOT IN (SELECT id FROM users WHERE role = ''restaurant_owner'')
    ON CONFLICT (id) DO NOTHING';
    
    -- Execute the dynamic query
    EXECUTE migration_query;
    
    RAISE NOTICE 'Migrated restaurant data to users table';
  END IF;
  
  -- Check if staff table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
    RAISE NOTICE 'Migrating staff table to users table...';
    
    -- Simplified staff migration - only migrate basic required fields
    INSERT INTO users (
      id, email, password_hash, full_name, role, is_active, created_at
    )
    SELECT 
      s.id,
      CONCAT(s.id::text, '@staff.com') as email,
      '$2b$10$temp.password.hash.needs.to.be.reset' as password_hash,
      'Staff Member' as full_name,
      'staff' as role,
      true as is_active,
      NOW() as created_at
    FROM staff s
    WHERE s.id NOT IN (SELECT id FROM users WHERE role = 'staff')
    ON CONFLICT (id) DO NOTHING;
    
    -- Update additional fields if columns exist in staff table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'restaurant_id') THEN
      UPDATE users SET restaurant_id = s.restaurant_id 
      FROM staff s 
      WHERE users.id = s.id AND users.role = 'staff';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'position') THEN
      UPDATE users SET position = s.position 
      FROM staff s 
      WHERE users.id = s.id AND users.role = 'staff';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'hourly_rate') THEN
      UPDATE users SET hourly_rate = COALESCE(s.hourly_rate, 0) 
      FROM staff s 
      WHERE users.id = s.id AND users.role = 'staff';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'is_available') THEN
      UPDATE users SET is_available = COALESCE(s.is_available, true) 
      FROM staff s 
      WHERE users.id = s.id AND users.role = 'staff';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'phone') THEN
      UPDATE users SET phone = s.phone 
      FROM staff s 
      WHERE users.id = s.id AND users.role = 'staff';
    END IF;
    
    RAISE NOTICE 'Migrated staff data to users table';
  END IF;
END $$;

-- Now safely update existing tables to reference the new users table
-- Drop existing foreign key constraints first
DO $$
BEGIN
  -- Drop constraints from orders table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_staff_id_fkey;
  END IF;
  
  -- Drop constraints from menu_items table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_restaurant_id_fkey;
  END IF;
  
  -- Drop constraints from categories table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_restaurant_id_fkey;
  END IF;
  
  -- Drop constraints from tables table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
    ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_restaurant_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraints pointing to users table
DO $$
BEGIN
  -- Add constraints to orders table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_restaurant_id_fkey 
      FOREIGN KEY (restaurant_id) REFERENCES users(id);
    
    -- Only add staff_id constraint if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'staff_id') THEN
      ALTER TABLE orders ADD CONSTRAINT orders_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES users(id);
    END IF;
  END IF;
  
  -- Add constraints to menu_items table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
    ALTER TABLE menu_items ADD CONSTRAINT menu_items_restaurant_id_fkey 
      FOREIGN KEY (restaurant_id) REFERENCES users(id);
  END IF;
  
  -- Add constraints to categories table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_restaurant_id_fkey 
      FOREIGN KEY (restaurant_id) REFERENCES users(id);
  END IF;
  
  -- Add constraints to tables table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
    ALTER TABLE tables ADD CONSTRAINT tables_restaurant_id_fkey 
      FOREIGN KEY (restaurant_id) REFERENCES users(id);
  END IF;
END $$;

-- Enable Row Level Security (optional - uncomment if using Supabase)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment if using Supabase)
-- CREATE POLICY "Users can view their own data" ON users
--   FOR SELECT USING (auth.uid()::text = id::text OR role = 'super_admin');

-- CREATE POLICY "Users can update their own data" ON users
--   FOR UPDATE USING (auth.uid()::text = id::text OR role = 'super_admin');

-- Restaurant owners can view their staff (uncomment if using Supabase)
-- CREATE POLICY "Restaurant owners can view their staff" ON users
--   FOR SELECT USING (
--     role = 'staff' AND restaurant_id IN (
--       SELECT id FROM users WHERE auth.uid()::text = id::text AND role = 'restaurant_owner'
--     )
--   );
