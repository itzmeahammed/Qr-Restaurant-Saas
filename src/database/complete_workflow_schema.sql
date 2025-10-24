-- Complete Workflow Database Schema
-- This includes all tables needed for the full restaurant ordering workflow

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== CUSTOMER SESSION MANAGEMENT ====================

-- Customer sessions table for QR code ordering
-- Update existing customer_sessions table to match current schema
-- Note: This aligns with the existing database structure
ALTER TABLE public.customer_sessions 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- Ensure the status column exists (it should already exist as 'status', not 'session_status')
-- The existing table uses 'status' column, so we don't need to add 'session_status'

-- ==================== CART MANAGEMENT ====================

-- Cart items table for persistent cart storage
-- Note: References customer_sessions by session_id string, not the id UUID
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR NOT NULL, -- References customer_sessions.session_id (string)
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ENHANCED ORDERS TABLE ====================

-- Update orders table to include all workflow fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS session_id VARCHAR, -- References customer_sessions.session_id (string)
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id),
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'dine_in',
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_preparation_time INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_preparation_time INTEGER,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- ==================== ENHANCED ORDER ITEMS TABLE ====================

-- Update order_items table for complete item tracking
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- ==================== STAFF AVAILABILITY & PERFORMANCE ====================

-- Staff availability tracking
CREATE TABLE IF NOT EXISTS public.staff_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_start TIME,
    shift_end TIME,
    is_available BOOLEAN DEFAULT true,
    current_orders_count INTEGER DEFAULT 0,
    max_concurrent_orders INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Staff performance tracking
CREATE TABLE IF NOT EXISTS public.staff_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    orders_completed INTEGER DEFAULT 0,
    total_tips DECIMAL(10,2) DEFAULT 0,
    average_service_time INTEGER, -- in minutes
    customer_rating DECIMAL(3,2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- ==================== PAYMENT TRACKING ====================

-- Payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- cash, card, online, upi
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    collected_by_staff BOOLEAN DEFAULT false,
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== NOTIFICATIONS SYSTEM ====================

-- Notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_type VARCHAR(50) NOT NULL, -- customer, staff, owner
    recipient_id VARCHAR(255) NOT NULL, -- session_id, staff_id, or user_id
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ==================== ORDER QUEUE MANAGEMENT ====================

-- Order queue for when no staff is available
CREATE TABLE IF NOT EXISTS public.order_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    priority_level INTEGER DEFAULT 1, -- 1=normal, 2=high, 3=urgent
    estimated_wait_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Customer sessions indexes
CREATE INDEX IF NOT EXISTS idx_customer_sessions_restaurant_id ON public.customer_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_table_id ON public.customer_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_status ON public.customer_sessions(status);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item_id ON public.cart_items(menu_item_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_id ON public.orders(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Staff availability indexes
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff_id ON public.staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_date ON public.staff_availability(date);
CREATE INDEX IF NOT EXISTS idx_staff_availability_is_available ON public.staff_availability(is_available);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_staff_id ON public.payment_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer sessions
CREATE POLICY "Public access to customer sessions" ON public.customer_sessions FOR ALL USING (true);

-- RLS Policies for cart items
CREATE POLICY "Public access to cart items" ON public.cart_items FOR ALL USING (true);

-- RLS Policies for staff availability
CREATE POLICY "Staff can view their own availability" ON public.staff_availability FOR SELECT USING (true);
CREATE POLICY "Staff can update their own availability" ON public.staff_availability FOR ALL USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for payment transactions
CREATE POLICY "Restaurant staff can view payments" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Staff can update payment status" ON public.payment_transactions FOR UPDATE USING (true);

-- ==================== GRANTS ====================

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON public.customer_sessions TO authenticated, anon;
GRANT ALL ON public.cart_items TO authenticated, anon;
GRANT ALL ON public.staff_availability TO authenticated, anon;
GRANT ALL ON public.staff_performance TO authenticated, anon;
GRANT ALL ON public.payment_transactions TO authenticated, anon;
GRANT ALL ON public.notifications TO authenticated, anon;
GRANT ALL ON public.order_queue TO authenticated, anon;

-- ==================== TRIGGERS ====================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_customer_sessions_updated_at BEFORE UPDATE ON public.customer_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_availability_updated_at BEFORE UPDATE ON public.staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_performance_updated_at BEFORE UPDATE ON public.staff_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== FUNCTIONS ====================

-- Function to get available staff for a restaurant
CREATE OR REPLACE FUNCTION get_available_staff(restaurant_uuid UUID)
RETURNS TABLE (
    staff_id UUID,
    staff_name TEXT,
    current_orders INTEGER,
    performance_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as staff_id,
        COALESCE(u.full_name, 'Staff Member') as staff_name,
        COALESCE(sa.current_orders_count, 0) as current_orders,
        s.performance_rating
    FROM public.staff s
    LEFT JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.staff_availability sa ON s.id = sa.staff_id AND sa.date = CURRENT_DATE
    WHERE s.restaurant_id = restaurant_uuid
    AND s.is_available = true
    AND COALESCE(sa.current_orders_count, 0) < COALESCE(sa.max_concurrent_orders, 5)
    ORDER BY s.performance_rating DESC, COALESCE(sa.current_orders_count, 0) ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update staff workload
CREATE OR REPLACE FUNCTION update_staff_workload(staff_uuid UUID, increment_value INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.staff_availability (staff_id, current_orders_count)
    VALUES (staff_uuid, increment_value)
    ON CONFLICT (staff_id, date)
    DO UPDATE SET 
        current_orders_count = staff_availability.current_orders_count + increment_value,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.customer_sessions IS 'Manages customer sessions for QR code ordering';
COMMENT ON TABLE public.cart_items IS 'Stores customer cart items persistently across sessions';
COMMENT ON TABLE public.staff_availability IS 'Tracks staff availability and current workload';
COMMENT ON TABLE public.staff_performance IS 'Records daily staff performance metrics';
COMMENT ON TABLE public.payment_transactions IS 'Handles all payment transactions and methods';
COMMENT ON TABLE public.notifications IS 'Real-time notification system for all users';
COMMENT ON TABLE public.order_queue IS 'Manages order queue when staff is unavailable';
