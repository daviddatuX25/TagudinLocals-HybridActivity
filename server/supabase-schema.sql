-- TagudinLocals Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  category TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  delivery_services JSONB DEFAULT '[]',
  available_delivery_services JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart items (session-based)
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_info JSONB NOT NULL,
  delivery_service_id TEXT,
  delivery_fee INTEGER DEFAULT 0,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  order_date TIMESTAMPTZ DEFAULT now()
);

-- Delivery services
CREATE TABLE delivery_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  coverage_areas JSONB DEFAULT '[]',
  pricing INTEGER DEFAULT 0,
  estimated_time TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 0,
  image TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_services ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (service_role key bypasses RLS, anon key needs policies)
CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Public read delivery_services" ON delivery_services FOR SELECT TO anon USING (true);
CREATE POLICY "Public read cart_items" ON cart_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert cart_items" ON cart_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update cart_items" ON cart_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public delete cart_items" ON cart_items FOR DELETE TO anon USING (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public insert products" ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public delete products" ON products FOR DELETE TO anon USING (true);
CREATE POLICY "Public insert delivery_services" ON delivery_services FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update delivery_services" ON delivery_services FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public delete delivery_services" ON delivery_services FOR DELETE TO anon USING (true);