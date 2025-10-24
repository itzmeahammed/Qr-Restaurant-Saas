-- Cart Items Table for Customer Cart Management
-- This table stores customer cart items persistently across sessions

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id character varying NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  special_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE,
  CONSTRAINT cart_items_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.customer_sessions(session_id) ON DELETE CASCADE,
  CONSTRAINT cart_items_quantity_check CHECK (quantity > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item_id ON public.cart_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON public.cart_items(created_at);

-- Enable Row Level Security
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies for cart access
CREATE POLICY "Users can view their own cart items" ON public.cart_items
  FOR SELECT USING (true); -- Allow all reads for now, can be restricted by session

CREATE POLICY "Users can insert their own cart items" ON public.cart_items
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "Users can update their own cart items" ON public.cart_items
  FOR UPDATE USING (true); -- Allow all updates for now

CREATE POLICY "Users can delete their own cart items" ON public.cart_items
  FOR DELETE USING (true); -- Allow all deletes for now

-- Grant permissions
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO anon;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_updated_at_trigger
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Comments
COMMENT ON TABLE public.cart_items IS 'Stores customer cart items persistently across sessions';
COMMENT ON COLUMN public.cart_items.session_id IS 'Links to customer_sessions.session_id';
COMMENT ON COLUMN public.cart_items.menu_item_id IS 'Links to menu_items.id';
COMMENT ON COLUMN public.cart_items.quantity IS 'Number of items in cart';
COMMENT ON COLUMN public.cart_items.special_instructions IS 'Customer special instructions for this item';
