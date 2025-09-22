-- Safe Database Setup - Handles existing tables and policies
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Restaurant owners can manage their restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant owners can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Restaurant staff can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Order items follow order policies" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Restaurant owners can view their reviews" ON public.reviews;

-- Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    banner_url TEXT,
    cuisine_type VARCHAR(100),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    preparation_time INTEGER,
    ingredients TEXT[],
    allergens TEXT[],
    nutritional_info JSONB,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    qr_code TEXT,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    total_orders_completed INTEGER DEFAULT 0,
    total_tips_received DECIMAL(10,2) DEFAULT 0,
    performance_rating DECIMAL(3,2) DEFAULT 5.0,
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    special_instructions TEXT,
    estimated_time INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    ambiance_rating INTEGER CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (with IF NOT EXISTS equivalent)
CREATE POLICY "Restaurant owners can manage their restaurants" ON public.restaurants
    FOR ALL USING (auth.uid() = owner_id OR auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "Public can view active restaurants" ON public.restaurants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

CREATE POLICY "Restaurant owners can manage menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

CREATE POLICY "Public can view available menu items" ON public.menu_items
    FOR SELECT USING (is_available = true);

CREATE POLICY "Restaurant owners can manage tables" ON public.tables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

CREATE POLICY "Restaurant owners can manage staff" ON public.staff
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

CREATE POLICY "Restaurant staff can manage orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        ) OR
        EXISTS (
            SELECT 1 FROM public.staff 
            WHERE restaurant_id = orders.restaurant_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Order items follow order policies" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.restaurants r ON o.restaurant_id = r.id
            WHERE o.id = order_id 
            AND (r.owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

CREATE POLICY "Anyone can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurant owners can view their reviews" ON public.reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = restaurant_id 
            AND (owner_id = auth.uid() OR auth.jwt()->>'role' = 'super_admin')
        )
    );

-- Insert sample restaurant with your user ID
INSERT INTO public.restaurants (id, name, description, address, phone, email, owner_id, cuisine_type, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Demo Restaurant',
    'A beautiful demo restaurant for testing',
    '123 Demo Street, Demo City',
    '+1234567890',
    'demo@restaurant.com',
    '928e9173-b876-412a-acc3-c38cd4078a34',
    'Multi-Cuisine',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    owner_id = EXCLUDED.owner_id,
    cuisine_type = EXCLUDED.cuisine_type,
    is_active = EXCLUDED.is_active;

-- Insert sample categories
INSERT INTO public.categories (restaurant_id, name, description, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Appetizers', 'Start your meal with our delicious appetizers', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Main Course', 'Our signature main dishes', 2),
('550e8400-e29b-41d4-a716-446655440000', 'Desserts', 'Sweet endings to your meal', 3),
('550e8400-e29b-41d4-a716-446655440000', 'Beverages', 'Refreshing drinks', 4)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
WITH category_data AS (
    SELECT id, name FROM public.categories WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
)
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_available) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    c.id,
    CASE 
        WHEN c.name = 'Appetizers' THEN 'Chicken Wings'
        WHEN c.name = 'Main Course' THEN 'Butter Chicken'
        WHEN c.name = 'Desserts' THEN 'Chocolate Cake'
        WHEN c.name = 'Beverages' THEN 'Fresh Lime Soda'
    END,
    CASE 
        WHEN c.name = 'Appetizers' THEN 'Crispy chicken wings with spicy sauce'
        WHEN c.name = 'Main Course' THEN 'Creamy butter chicken with rice'
        WHEN c.name = 'Desserts' THEN 'Rich chocolate cake with vanilla ice cream'
        WHEN c.name = 'Beverages' THEN 'Refreshing lime soda with mint'
    END,
    CASE 
        WHEN c.name = 'Appetizers' THEN 299.00
        WHEN c.name = 'Main Course' THEN 450.00
        WHEN c.name = 'Desserts' THEN 199.00
        WHEN c.name = 'Beverages' THEN 89.00
    END,
    true
FROM category_data c
ON CONFLICT DO NOTHING;

-- Insert sample tables
INSERT INTO public.tables (restaurant_id, table_number, capacity, qr_code) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'T1', 4, 'QR_TABLE_1'),
('550e8400-e29b-41d4-a716-446655440000', 'T2', 2, 'QR_TABLE_2'),
('550e8400-e29b-41d4-a716-446655440000', 'T3', 6, 'QR_TABLE_3'),
('550e8400-e29b-41d4-a716-446655440000', 'T4', 4, 'QR_TABLE_4'),
('550e8400-e29b-41d4-a716-446655440000', 'T5', 8, 'QR_TABLE_5')
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- Insert sample orders with proper order numbers
INSERT INTO public.orders (restaurant_id, customer_name, order_number, status, total_amount, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'ORD-20250119-0001', 'completed', 750.00, NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655440000', 'Jane Smith', 'ORD-20250119-0002', 'completed', 450.00, NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440000', 'Bob Wilson', 'ORD-20250119-0003', 'pending', 299.00, NOW() - INTERVAL '30 minutes'),
('550e8400-e29b-41d4-a716-446655440000', 'Alice Brown', 'ORD-20250119-0004', 'preparing', 650.00, NOW() - INTERVAL '15 minutes')
ON CONFLICT (order_number) DO NOTHING;

SELECT 'Database setup completed successfully!' as message;
