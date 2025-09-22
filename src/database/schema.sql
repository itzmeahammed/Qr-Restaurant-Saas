-- QR Restaurant Ordering SaaS Database Schema
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

-- Users table (customers, staff, owners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'customer',
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    loyalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff profiles with additional info
CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    position VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    login_time TIMESTAMP WITH TIME ZONE,
    logout_time TIMESTAMP WITH TIME ZONE,
    total_orders_completed INTEGER DEFAULT 0,
    total_tips_received DECIMAL(10,2) DEFAULT 0,
    performance_rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
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
    ingredients TEXT[],
    allergens TEXT[],
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_number VARCHAR(10),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    transaction_type VARCHAR(50), -- 'earned', 'redeemed', 'bonus', 'expired'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR codes for tables
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(10) NOT NULL,
    qr_code_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- Inventory management
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50), -- kg, liters, pieces, etc.
    current_stock DECIMAL(10,2) DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2),
    supplier_info JSONB,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_staff_profiles_restaurant ON staff_profiles(restaurant_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
INSERT INTO restaurants (name, slug, description, address, phone, email) VALUES
('Awesome Cafe', 'awesome-cafe', 'A modern cafe with amazing food and ambiance', '123 Main Street, City', '+1234567890', 'info@awesomecafe.com'),
('Spice Junction', 'spice-junction', 'Authentic Indian cuisine with a modern twist', '456 Food Street, City', '+1234567891', 'hello@spicejunction.com');

INSERT INTO menu_categories (restaurant_id, name, description, sort_order) VALUES
((SELECT id FROM restaurants WHERE slug = 'awesome-cafe'), 'Appetizers', 'Start your meal with our delicious appetizers', 1),
((SELECT id FROM restaurants WHERE slug = 'awesome-cafe'), 'Main Course', 'Hearty main dishes to satisfy your hunger', 2),
((SELECT id FROM restaurants WHERE slug = 'awesome-cafe'), 'Beverages', 'Refreshing drinks and hot beverages', 3),
((SELECT id FROM restaurants WHERE slug = 'awesome-cafe'), 'Desserts', 'Sweet treats to end your meal perfectly', 4);
