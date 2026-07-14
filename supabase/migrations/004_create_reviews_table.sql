-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) DEFAULT 'Customer',
  review TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  initials VARCHAR(10),
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved reviews
DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
CREATE POLICY "Allow public read access to reviews" ON reviews
  FOR SELECT USING (is_approved = true);

-- Allow anyone to submit reviews
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON reviews;
CREATE POLICY "Allow public insert access to reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Seed initial static reviews
INSERT INTO reviews (name, role, review, stars, initials, is_approved)
VALUES
  ('Ravi Shankar P.', 'Corporate Professional, Vizag', 'Absolutely stunning suit! The fit was perfect on the first try. Madhu Textorium''s craftsmanship is unmatched in all of Visakhapatnam.', 5, 'RS', true),
  ('Anil Kumar M.', 'Wedding Client', 'Got my Sherwani done for my wedding — every single guest complimented it. The fabric quality and stitching precision is top notch!', 5, 'AK', true),
  ('Suresh Babu G.', 'Business Owner', 'I''ve been a regular customer for 6 years. The Modi coat they made for my daughter''s wedding was the talk of the ceremony.', 5, 'SB', true),
  ('Venkat Rao T.', 'Software Engineer', 'Ordered 3 shirts via WhatsApp with my measurements. All three fit like they were made by machine — with human precision!', 5, 'VR', true),
  ('Prakash Reddy', 'Retired IAS Officer', 'The Jodhpuri suit for my son''s wedding was breathtaking. Attention to every detail — buttons, lining, embroidery — simply masterful.', 5, 'PR', true)
ON CONFLICT DO NOTHING;
