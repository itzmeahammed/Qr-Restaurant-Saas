-- Create staff_applications table and related functionality
-- Run this SQL in your Supabase SQL editor

-- 1. Add unique key column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS staff_signup_key VARCHAR(14) UNIQUE;

-- 2. Create staff applications table
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

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_applications_restaurant_id ON staff_applications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_applications_status ON staff_applications(status);
CREATE INDEX IF NOT EXISTS idx_staff_applications_user_id ON staff_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_staff_signup_key ON restaurants(staff_signup_key);

-- 4. Add approval tracking to staff table
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES staff_applications(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 5. Generate unique keys for existing restaurants
UPDATE restaurants 
SET staff_signup_key = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || name), 1, 4) || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || created_at::TEXT), 1, 4)
)
WHERE staff_signup_key IS NULL;

-- 6. Enable RLS (Row Level Security) for staff_applications
ALTER TABLE staff_applications ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Restaurant owners can view their staff applications" ON staff_applications
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update their staff applications" ON staff_applications
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own staff applications" ON staff_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create staff applications" ON staff_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE ON staff_applications TO authenticated;

-- 9. Create function to update timestamps
CREATE OR REPLACE FUNCTION update_staff_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for timestamp updates
DROP TRIGGER IF EXISTS trigger_update_staff_applications_updated_at ON staff_applications;
CREATE TRIGGER trigger_update_staff_applications_updated_at
  BEFORE UPDATE ON staff_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_applications_updated_at();

-- 11. Show existing restaurants with their new keys
SELECT 
  id,
  name,
  staff_signup_key,
  'Share this key: ' || staff_signup_key as instruction
FROM restaurants
WHERE staff_signup_key IS NOT NULL
ORDER BY name;
