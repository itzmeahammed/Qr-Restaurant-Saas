-- Staff Self-Signup System Database Schema
-- This creates the infrastructure for staff to self-signup with restaurant keys

-- 1. Add unique key column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS staff_signup_key VARCHAR(12) UNIQUE;

-- 2. Generate unique keys for existing restaurants
UPDATE restaurants 
SET staff_signup_key = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || name), 1, 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || created_at::TEXT), 1, 4)
)
WHERE staff_signup_key IS NULL;

-- 3. Create staff applications table for pending requests
CREATE TABLE IF NOT EXISTS staff_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100) NOT NULL,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_applications_restaurant_id ON staff_applications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_applications_status ON staff_applications(status);
CREATE INDEX IF NOT EXISTS idx_staff_applications_user_id ON staff_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_staff_signup_key ON restaurants(staff_signup_key);

-- 5. Add approval status to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES staff_applications(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 6. Create function to generate unique restaurant keys
CREATE OR REPLACE FUNCTION generate_restaurant_key()
RETURNS TEXT AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 12-character key in format XXXX-XXXX-XXXX
    new_key := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT), 1, 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT), 1, 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)
    );
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM restaurants WHERE staff_signup_key = new_key) INTO key_exists;
    
    -- If key doesn't exist, we can use it
    IF NOT key_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_key;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-generate keys for new restaurants
CREATE OR REPLACE FUNCTION set_restaurant_signup_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_signup_key IS NULL THEN
    NEW.staff_signup_key := generate_restaurant_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_restaurant_signup_key ON restaurants;
CREATE TRIGGER trigger_set_restaurant_signup_key
  BEFORE INSERT ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION set_restaurant_signup_key();

-- 8. Create function to update staff applications timestamp
CREATE OR REPLACE FUNCTION update_staff_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_applications_updated_at ON staff_applications;
CREATE TRIGGER trigger_update_staff_applications_updated_at
  BEFORE UPDATE ON staff_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_applications_updated_at();

-- 9. Create view for staff applications with restaurant info
CREATE OR REPLACE VIEW staff_applications_with_restaurant AS
SELECT 
  sa.*,
  r.name as restaurant_name,
  r.owner_id as restaurant_owner_id
FROM staff_applications sa
JOIN restaurants r ON sa.restaurant_id = r.id;

-- 10. Enable RLS (Row Level Security) for staff_applications
ALTER TABLE staff_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can see applications for their restaurants
CREATE POLICY "Restaurant owners can view their staff applications" ON staff_applications
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Restaurant owners can update applications for their restaurants
CREATE POLICY "Restaurant owners can update their staff applications" ON staff_applications
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can view their own applications
CREATE POLICY "Users can view their own staff applications" ON staff_applications
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own applications
CREATE POLICY "Users can create staff applications" ON staff_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 11. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON staff_applications TO authenticated;
GRANT SELECT ON staff_applications_with_restaurant TO authenticated;

-- 12. Create notification function for new applications
CREATE OR REPLACE FUNCTION notify_new_staff_application()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with a notification system
  -- For now, we'll just log it
  RAISE NOTICE 'New staff application: % applied to restaurant %', NEW.full_name, NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_staff_application ON staff_applications;
CREATE TRIGGER trigger_notify_new_staff_application
  AFTER INSERT ON staff_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_staff_application();

-- 13. Sample data for testing (optional)
-- This will show restaurant keys for existing restaurants
SELECT 
  id,
  name,
  staff_signup_key,
  'Staff can use this key to apply: ' || staff_signup_key as instruction
FROM restaurants
WHERE staff_signup_key IS NOT NULL
ORDER BY name;
