-- Fix Row Level Security (RLS) policies for customer_offers table
-- The frontend can't read customer_offers records due to RLS restrictions

-- Step 1: Check current RLS status
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'customer_offers';

-- Step 2: Disable RLS temporarily to test (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE customer_offers DISABLE ROW LEVEL SECURITY;

-- Step 3: Create proper RLS policies for customer_offers table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read their own offer usage" ON customer_offers;
DROP POLICY IF EXISTS "Allow service role to insert offer usage" ON customer_offers;
DROP POLICY IF EXISTS "Allow users to read offer usage" ON customer_offers;

-- Enable RLS on customer_offers table
ALTER TABLE customer_offers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read their own offer usage
CREATE POLICY "Allow authenticated users to read their own offer usage"
ON customer_offers
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR
  customer_id IN (
    SELECT id FROM customers WHERE id = auth.uid()
  )
);

-- Policy 2: Allow service role and authenticated users to insert offer usage
CREATE POLICY "Allow service role to insert offer usage"
ON customer_offers
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Policy 3: Allow service role to read all offer usage (for admin purposes)
CREATE POLICY "Allow service role to read all offer usage"
ON customer_offers
FOR SELECT
TO service_role
USING (true);

-- Step 4: Verify the policies are created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'customer_offers';

-- Step 5: Test the query that's failing in the frontend
-- This should now return results:
-- SELECT *
-- FROM customer_offers
-- WHERE customer_id = '9e30b42f-48a6-4be3-ab5b-0c4598354f0f'
--   AND offer_id = '48d14e60-9088-40a1-8163-deef2ab302e9';
