-- QR Restaurant Ordering System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    banner_url TEXT,
    opening_time TIME,
    closing_time TIME,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant tables (physical tables with QR codes)
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(20) NOT NULL,
    table_name VARCHAR(100),
    capacity INTEGER DEFAULT 4,
    qr_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    is_occupied BOOLEAN DEFAULT false,
    current_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- Staff members
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'waiter', -- waiter, chef, manager
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT false,
    current_orders_count INTEGER DEFAULT 0,
    total_orders_served INTEGER DEFAULT 0,
    total_tips_received DECIMAL(10, 2) DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_logout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
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
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    image_url TEXT,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    calories INTEGER,
    ingredients TEXT[],
    allergens TEXT[],
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer sessions (for guest ordering)
CREATE TABLE customer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) UNIQUE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    session_id UUID REFERENCES customer_sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    order_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, served, completed, cancelled
    order_type VARCHAR(50) DEFAULT 'dine_in', -- dine_in, takeaway, delivery
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tip_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- cash, card, upi, wallet
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    special_instructions TEXT,
    estimated_preparation_time INTEGER, -- in minutes
    actual_preparation_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    prepared_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL, -- Store name in case menu item is deleted
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, refunded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tips
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    ambience_rating INTEGER CHECK (ambience_rating >= 1 AND ambience_rating <= 5),
    overall_rating DECIMAL(3, 2),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty points
CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, restaurant_id)
);

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, bonus, expired
    points INTEGER NOT NULL,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50), -- kg, liters, pieces, etc.
    current_stock DECIMAL(10, 2) DEFAULT 0,
    minimum_stock DECIMAL(10, 2) DEFAULT 0,
    cost_per_unit DECIMAL(10, 2),
    supplier_name VARCHAR(255),
    supplier_contact VARCHAR(20),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- page_view, menu_view, item_click, order_placed, etc.
    event_data JSONB,
    session_id UUID,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order_received, order_ready, payment_received, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_tables_restaurant ON restaurant_tables(restaurant_id);
CREATE INDEX idx_staff_restaurant ON staff(restaurant_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_staff ON orders(assigned_staff_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_loyalty_customer ON loyalty_points(customer_id);
CREATE INDEX idx_analytics_restaurant ON analytics_events(restaurant_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
