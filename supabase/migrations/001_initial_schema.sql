-- 1. Create categories table (Optional parent categorization)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL, -- e.g. 'Suits', 'Shirts', 'Pants', etc.
  price NUMERIC NOT NULL,
  is_top_seller BOOLEAN DEFAULT FALSE,
  image VARCHAR(1024), -- URL path to image (R2)
  image_fav VARCHAR(1024), -- Favorite preview image URL (R2)
  sketch_image VARCHAR(1024), -- Outline sketch overlay URL (R2)
  description TEXT,
  colors TEXT[], -- Array of available color tags
  fabrics TEXT[], -- Array of available fabric options
  features TEXT[], -- Array of features
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create fabric_swatches table (the "clothes" per product)
CREATE TABLE IF NOT EXISTS fabric_swatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Swatch name (e.g. Charcoal Herringbone)
  image VARCHAR(1024) NOT NULL, -- Swatch texture URL (R2)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create orders table (stores custom orders & R2 uploaded user photos)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  garment_type VARCHAR(255) NOT NULL, -- e.g. 'shirt', 'suit'
  fabric_preference VARCHAR(255),
  color_preference VARCHAR(255),
  
  -- Style Choices JSON
  style_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Body Measurements JSON
  measurements JSONB DEFAULT '{}'::jsonb,
  
  -- R2 Uploaded Photos URLs
  photo_front_url VARCHAR(1024),
  photo_back_url VARCHAR(1024),
  photo_side_url VARCHAR(1024),
  
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Set up performance indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_fabric_swatches_product ON fabric_swatches(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name, customer_phone);

-- 6. Insert default categories if using parent lookup
INSERT INTO categories (name, slug) VALUES
  ('Suits', 'suits'),
  ('Shirts', 'shirts'),
  ('Pants', 'pants'),
  ('Modi Coat', 'modi-coat'),
  ('Jodhpuri', 'jodhpuri'),
  ('Sherwani', 'sherwani'),
  ('Blazers', 'blazer'),
  ('Kurta', 'kurta'),
  ('Indo Western', 'indo-western')
ON CONFLICT (slug) DO NOTHING;
