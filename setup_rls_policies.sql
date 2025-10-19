-- Setup Row Level Security (RLS) policies for the restaurant system
-- Run this in your Supabase SQL editor
-- This version safely handles existing policies

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow public read for restaurant signup" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can manage their staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can read their own records" ON public.staff;
DROP POLICY IF EXISTS "Anyone can create staff applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Restaurant owners can manage applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Applicants can read their own applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Restaurant owners can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read for categories" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow public read for menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant owners and staff can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Allow public read for tables" ON public.tables;

-- 1. RESTAURANTS TABLE POLICIES
-- Allow public read access for restaurant signup key validation
CREATE POLICY "Allow public read for restaurant signup" ON public.restaurants
  FOR SELECT USING (true);

-- Allow restaurant owners to manage their own restaurants
CREATE POLICY "Restaurant owners can manage their restaurants" ON public.restaurants
  FOR ALL USING (auth.uid() = owner_id);

-- 2. STAFF TABLE POLICIES
-- Allow restaurant owners to manage their staff
CREATE POLICY "Restaurant owners can manage their staff" ON public.staff
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Allow staff to read their own records
CREATE POLICY "Staff can read their own records" ON public.staff
  FOR SELECT USING (user_id = auth.uid());

-- 3. STAFF APPLICATIONS POLICIES
-- Allow anyone to create applications (for staff signup)
CREATE POLICY "Anyone can create staff applications" ON public.staff_applications
  FOR INSERT WITH CHECK (true);

-- Allow restaurant owners to manage applications for their restaurants
CREATE POLICY "Restaurant owners can manage applications" ON public.staff_applications
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Allow applicants to read their own applications
CREATE POLICY "Applicants can read their own applications" ON public.staff_applications
  FOR SELECT USING (user_id = auth.uid());

-- 4. CATEGORIES TABLE POLICIES
-- Allow restaurant owners to manage their categories
CREATE POLICY "Restaurant owners can manage categories" ON public.categories
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Allow public read access for menu browsing
CREATE POLICY "Allow public read for categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- 5. MENU ITEMS TABLE POLICIES
-- Allow restaurant owners to manage their menu items
CREATE POLICY "Restaurant owners can manage menu items" ON public.menu_items
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Allow public read access for menu browsing
CREATE POLICY "Allow public read for menu items" ON public.menu_items
  FOR SELECT USING (is_available = true);

-- 6. ORDERS TABLE POLICIES
-- Allow restaurant owners and their staff to manage orders
CREATE POLICY "Restaurant owners and staff can manage orders" ON public.orders
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    ) OR
    restaurant_id IN (
      SELECT restaurant_id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- Allow customers to create orders (for customer sessions)
CREATE POLICY "Allow order creation" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 7. TABLES TABLE POLICIES
-- Allow restaurant owners to manage their tables
CREATE POLICY "Restaurant owners can manage tables" ON public.tables
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
    )
  );

-- Allow public read access for QR code scanning
CREATE POLICY "Allow public read for tables" ON public.tables
  FOR SELECT USING (is_active = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.tables TO anon;
GRANT INSERT ON public.staff_applications TO anon;
GRANT INSERT ON public.orders TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_staff_signup_key ON public.restaurants(staff_signup_key);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant_id ON public.staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_applications_restaurant_id ON public.staff_applications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_applications_user_id ON public.staff_applications(user_id);
