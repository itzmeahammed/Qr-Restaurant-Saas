-- Fix Row Level Security policies for customer_sessions table
-- This allows staff members to create table reservations on behalf of customers

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customer_sessions';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only access their own sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON customer_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON customer_sessions;

-- Create new policies that allow both customers and staff to manage sessions

-- 1. Allow authenticated users to view all customer sessions (needed for table status checks)
CREATE POLICY "Allow authenticated users to view customer sessions" ON customer_sessions
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Allow anonymous users to view customer sessions (for QR code scanning)
CREATE POLICY "Allow anonymous users to view customer sessions" ON customer_sessions
    FOR SELECT
    TO anon
    USING (true);

-- 3. Allow authenticated users to insert customer sessions (both customers and staff)
CREATE POLICY "Allow authenticated users to create customer sessions" ON customer_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. Allow anonymous users to insert customer sessions (for QR code scanning)
CREATE POLICY "Allow anonymous users to create customer sessions" ON customer_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 5. Allow authenticated users to update customer sessions
CREATE POLICY "Allow authenticated users to update customer sessions" ON customer_sessions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Allow anonymous users to update customer sessions (for order completion)
CREATE POLICY "Allow anonymous users to update customer sessions" ON customer_sessions
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Add columns to customer_sessions table if they don't exist
ALTER TABLE customer_sessions 
ADD COLUMN IF NOT EXISTS created_by_staff BOOLEAN DEFAULT FALSE;

ALTER TABLE customer_sessions 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_sessions_table_status 
ON customer_sessions(table_id, status, ended_at);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_staff 
ON customer_sessions(staff_id) WHERE staff_id IS NOT NULL;

-- Grant necessary permissions
GRANT ALL ON customer_sessions TO authenticated;
GRANT ALL ON customer_sessions TO anon;

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customer_sessions';

-- Test the policies by attempting a sample insert (this should now work)
-- Note: This is just a test query, remove the comment to run it
/*
INSERT INTO customer_sessions (
    session_id, 
    restaurant_id, 
    table_id, 
    customer_name, 
    status, 
    started_at,
    created_by_staff,
    staff_id
) VALUES (
    'test_staff_session_' || extract(epoch from now()),
    (SELECT id FROM restaurants LIMIT 1),
    (SELECT id FROM tables LIMIT 1),
    'Test Customer',
    'active',
    now(),
    true,
    (SELECT id FROM staff LIMIT 1)
);
*/

COMMIT;
