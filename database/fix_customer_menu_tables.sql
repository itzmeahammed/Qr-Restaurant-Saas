-- Fix Customer Menu Database Issues
-- This script ensures all required tables exist with proper structure and policies

-- 1. Ensure tables table exists with correct structure
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 2,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure categories table exists with correct structure
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure menu_items table has correct structure
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
    is_gluten_free BOOLEAN DEFAULT false,
    preparation_time INTEGER DEFAULT 15,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view active tables" ON public.tables;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant owners can manage tables" ON public.tables;
DROP POLICY IF EXISTS "Restaurant owners can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage menu items" ON public.menu_items;

-- 6. Create public read policies for customer menu access
CREATE POLICY "Public can view active tables" ON public.tables
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view available menu items" ON public.menu_items
    FOR SELECT USING (is_available = true);

-- 7. Create owner management policies
CREATE POLICY "Restaurant owners can manage tables" ON public.tables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE restaurants.id = tables.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE restaurants.id = categories.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant owners can manage menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE restaurants.id = menu_items.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_active ON public.tables(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);

-- 9. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
CREATE TRIGGER update_tables_updated_at 
    BEFORE UPDATE ON public.tables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON public.menu_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create orders table with proper structure
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'dine_in',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    special_instructions TEXT,
    estimated_preparation_time INTEGER DEFAULT 20,
    assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    prepared_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Enable RLS for orders tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 13. Create policies for orders (public read for customer tracking)
DROP POLICY IF EXISTS "Public can view orders by session" ON public.orders;
CREATE POLICY "Public can view orders by session" ON public.orders
    FOR SELECT USING (session_id IS NOT NULL);

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Restaurant owners can manage orders" ON public.orders;
CREATE POLICY "Restaurant owners can manage orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE restaurants.id = orders.restaurant_id 
            AND restaurants.owner_id = auth.uid()
        )
    );

-- 14. Create policies for order_items
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.session_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- 15. Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 16. Create triggers for orders updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Insert sample data if tables are empty (for testing)
DO $$
DECLARE
    sample_restaurant_id UUID;
    sample_category_id UUID;
BEGIN
    -- Get first restaurant for sample data
    SELECT id INTO sample_restaurant_id FROM public.restaurants LIMIT 1;
    
    IF sample_restaurant_id IS NOT NULL THEN
        -- Insert sample categories if none exist
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE restaurant_id = sample_restaurant_id) THEN
            INSERT INTO public.categories (restaurant_id, name, description, sort_order) VALUES
            (sample_restaurant_id, 'Appetizers', 'Start your meal right', 1),
            (sample_restaurant_id, 'Main Course', 'Our signature dishes', 2),
            (sample_restaurant_id, 'Beverages', 'Refreshing drinks', 3),
            (sample_restaurant_id, 'Desserts', 'Sweet endings', 4);
        END IF;
        
        -- Insert sample tables if none exist
        IF NOT EXISTS (SELECT 1 FROM public.tables WHERE restaurant_id = sample_restaurant_id) THEN
            INSERT INTO public.tables (restaurant_id, table_number, capacity, location) VALUES
            (sample_restaurant_id, '1', 2, 'Window Side'),
            (sample_restaurant_id, '2', 4, 'Center'),
            (sample_restaurant_id, '3', 6, 'Private Corner'),
            (sample_restaurant_id, '4', 2, 'Bar Counter');
        END IF;
        
        -- Insert sample menu items if none exist
        SELECT id INTO sample_category_id FROM public.categories WHERE restaurant_id = sample_restaurant_id LIMIT 1;
        
        IF sample_category_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.menu_items WHERE restaurant_id = sample_restaurant_id) THEN
            INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, is_vegetarian) VALUES
            (sample_restaurant_id, sample_category_id, 'Caesar Salad', 'Fresh romaine lettuce with parmesan and croutons', 12.99, true),
            (sample_restaurant_id, sample_category_id, 'Grilled Chicken', 'Tender grilled chicken breast with herbs', 18.99, false),
            (sample_restaurant_id, sample_category_id, 'Pasta Primavera', 'Fresh vegetables with pasta in light sauce', 15.99, true);
        END IF;
    END IF;
END $$;

COMMIT;
