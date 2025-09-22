-- Enhanced QR Restaurant Ordering SaaS Database Schema
-- PostgreSQL with Row Level Security (RLS)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'restaurant_owner', 'super_admin');
CREATE TYPE order_status AS ENUM ('pending', 'assigned', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'wallet');
CREATE TYPE staff_status AS ENUM ('online', 'offline', 'busy');

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    role user_role DEFAULT 'customer',
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    banner_url TEXT,
    cuisine_type VARCHAR(100),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant Tables
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    table_name VARCHAR(100),
    capacity INTEGER DEFAULT 4,
    qr_code_url TEXT,
    qr_code_data TEXT, -- JSON data for QR code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- Staff profiles (linked to restaurants)
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    position VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    status staff_status DEFAULT 'offline',
    last_login TIMESTAMP WITH TIME ZONE,
    total_orders_completed INTEGER DEFAULT 0,
    total_tips_received DECIMAL(10,2) DEFAULT 0,
    performance_rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, restaurant_id)
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    allergens TEXT[],
    preparation_time INTEGER, -- in minutes
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    estimated_preparation_time INTEGER, -- in minutes
    assigned_at TIMESTAMP WITH TIME ZONE,
    prepared_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    transaction_type VARCHAR(50), -- 'earned', 'redeemed', 'bonus', 'expired'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff work sessions (for tracking login/logout)
CREATE TABLE staff_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(5,2),
    orders_handled INTEGER DEFAULT 0,
    tips_earned DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurant_tables_restaurant_id ON restaurant_tables(restaurant_id);
CREATE INDEX idx_staff_profiles_restaurant_id ON staff_profiles(restaurant_id);
CREATE INDEX idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_assigned_staff_id ON orders(assigned_staff_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_loyalty_transactions_customer_id ON loyalty_transactions(customer_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants: Owners can manage their restaurants, staff can view their restaurant
CREATE POLICY "Restaurant owners can manage their restaurants" ON restaurants 
    FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Staff can view their restaurant" ON restaurants 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE staff_profiles.user_id = auth.uid() 
            AND staff_profiles.restaurant_id = restaurants.id
        )
    );
CREATE POLICY "Public can view active restaurants" ON restaurants 
    FOR SELECT USING (is_active = true);

-- Restaurant tables: Restaurant owners can manage, staff can view
CREATE POLICY "Restaurant owners can manage tables" ON restaurant_tables 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE restaurants.id = restaurant_tables.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );
CREATE POLICY "Staff can view restaurant tables" ON restaurant_tables 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE staff_profiles.user_id = auth.uid() 
            AND staff_profiles.restaurant_id = restaurant_tables.restaurant_id
        )
    );
CREATE POLICY "Public can view active tables" ON restaurant_tables 
    FOR SELECT USING (is_active = true);

-- Staff profiles: Restaurant owners can manage their staff, staff can view own profile
CREATE POLICY "Restaurant owners can manage staff" ON staff_profiles 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE restaurants.id = staff_profiles.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );
CREATE POLICY "Staff can view own profile" ON staff_profiles 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can update own status" ON staff_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

-- Menu categories and items: Restaurant owners can manage, public can view active items
CREATE POLICY "Restaurant owners can manage menu categories" ON menu_categories 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE restaurants.id = menu_categories.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );
CREATE POLICY "Public can view active menu categories" ON menu_categories 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage menu items" ON menu_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE restaurants.id = menu_items.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );
CREATE POLICY "Public can view available menu items" ON menu_items 
    FOR SELECT USING (is_available = true);

-- Orders: Customers can view their orders, staff can view assigned orders, owners can view restaurant orders
CREATE POLICY "Customers can view own orders" ON orders 
    FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create orders" ON orders 
    FOR INSERT WITH CHECK (auth.uid() = customer_id OR customer_id IS NULL);
CREATE POLICY "Staff can view assigned orders" ON orders 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE staff_profiles.id = orders.assigned_staff_id 
            AND staff_profiles.user_id = auth.uid()
        )
    );
CREATE POLICY "Restaurant owners can view restaurant orders" ON orders 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM restaurants 
            WHERE restaurants.id = orders.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );

-- Order items: Follow order permissions
CREATE POLICY "Order items follow order permissions" ON order_items 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                orders.customer_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM staff_profiles 
                    WHERE staff_profiles.id = orders.assigned_staff_id 
                    AND staff_profiles.user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM restaurants 
                    WHERE restaurants.id = orders.restaurant_id 
                    AND restaurants.owner_id = auth.uid()
                )
            )
        )
    );

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::user_role);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for testing
INSERT INTO user_profiles (id, full_name, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Super Admin', 'super_admin');

-- Insert sample restaurant (you'll need to create a real user first)
-- INSERT INTO restaurants (owner_id, name, slug, description, address, phone, email) VALUES 
--     ('your-user-id-here', 'Demo Restaurant', 'demo-restaurant', 'A sample restaurant for testing', '123 Main St, City', '+1234567890', 'demo@restaurant.com');
