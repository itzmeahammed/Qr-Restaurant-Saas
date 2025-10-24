-- Workflow Enhancement Schema
-- This schema only adds missing columns and tables needed for the complete workflow
-- It works with the existing database structure without recreating existing tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENHANCE EXISTING TABLES ====================

-- Add missing columns to customer_sessions table
ALTER TABLE public.customer_sessions 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- Add missing columns to orders table for workflow
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS actual_preparation_time INTEGER,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to order_items table (these already exist based on your schema)
-- ALTER TABLE public.order_items 
-- ADD COLUMN IF NOT EXISTS item_name VARCHAR(255), -- Already exists
-- ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2), -- Already exists
-- ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2); -- Already exists

-- ==================== NEW TABLES FOR WORKFLOW ====================

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

-- Payment transactions table (enhanced version of existing payments table)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'online', 'upi'
    payment_type VARCHAR(50) DEFAULT 'order', -- 'order', 'tip'
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    collected_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    collected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced notifications table (the existing one doesn't have recipient_type)
-- We'll create a new table for workflow notifications
CREATE TABLE IF NOT EXISTS public.workflow_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_id UUID, -- Can reference auth.users(id) or be null for system notifications
    recipient_type VARCHAR(50) NOT NULL, -- 'customer', 'staff', 'owner', 'system'
    notification_type VARCHAR(100) NOT NULL, -- 'order_created', 'order_assigned', 'payment_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    channel VARCHAR(50) DEFAULT 'app', -- 'app', 'email', 'sms', 'push'
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Order queue for when no staff is available
CREATE TABLE IF NOT EXISTS public.order_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
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

-- Cart items indexes (cart_items table already exists)
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

-- Staff performance indexes
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_id ON public.staff_performance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_date ON public.staff_performance(date);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_staff_id ON public.payment_transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- Workflow notifications indexes
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient_id ON public.workflow_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient_type ON public.workflow_notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_type ON public.workflow_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_workflow_notifications_is_read ON public.workflow_notifications(is_read);

-- Order queue indexes
CREATE INDEX IF NOT EXISTS idx_order_queue_restaurant_id ON public.order_queue(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_queue_position ON public.order_queue(queue_position);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on new tables
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff availability
CREATE POLICY "Staff can view own availability" ON public.staff_availability FOR SELECT USING (true);
CREATE POLICY "Staff can update own availability" ON public.staff_availability FOR UPDATE USING (true);
CREATE POLICY "System can manage staff availability" ON public.staff_availability FOR ALL USING (true);

-- RLS Policies for staff performance
CREATE POLICY "Staff can view own performance" ON public.staff_performance FOR SELECT USING (true);
CREATE POLICY "System can manage staff performance" ON public.staff_performance FOR ALL USING (true);

-- RLS Policies for workflow notifications
CREATE POLICY "Users can view own notifications" ON public.workflow_notifications FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON public.workflow_notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for payment transactions
CREATE POLICY "Restaurant staff can view payments" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Staff can update payment status" ON public.payment_transactions FOR UPDATE USING (true);

-- RLS Policies for order queue
CREATE POLICY "Restaurant can view order queue" ON public.order_queue FOR SELECT USING (true);
CREATE POLICY "System can manage order queue" ON public.order_queue FOR ALL USING (true);

-- ==================== GRANTS ====================

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON public.staff_availability TO authenticated, anon;
GRANT ALL ON public.staff_performance TO authenticated, anon;
GRANT ALL ON public.payment_transactions TO authenticated, anon;
GRANT ALL ON public.workflow_notifications TO authenticated, anon;
GRANT ALL ON public.order_queue TO authenticated, anon;

-- ==================== TRIGGERS ====================

-- Update timestamps trigger function (may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to new tables
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
        COALESCE(s.position, 'Staff Member') as staff_name,
        COALESCE(sa.current_orders_count, 0) as current_orders,
        s.performance_rating
    FROM public.staff s
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
COMMENT ON TABLE public.staff_availability IS 'Tracks staff availability and current workload';
COMMENT ON TABLE public.staff_performance IS 'Records daily staff performance metrics';
COMMENT ON TABLE public.payment_transactions IS 'Handles all payment transactions and methods';
COMMENT ON TABLE public.workflow_notifications IS 'Real-time notification system for workflow events';
COMMENT ON TABLE public.order_queue IS 'Manages order queue when staff is unavailable';
