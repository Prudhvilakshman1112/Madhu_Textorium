/**
 * scripts/ingest-static-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed script to import all static menswear products and fabric swatches
 * from the Next.js codebase directly into your Supabase database.
 *
 * To run:
 *   1. Fill in your .env credentials
 *   2. Run `node scripts/ingest-static-data.js` from the project root.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Static data structure mirroring app/page.tsx
const PRODUCTS = [
  { id: 'p1', name: 'Royal Heritage Suit', category: 'Suits', price: 8500, is_top_seller: true,
    image: '/images/real/suits/royal-heritage-suit-2/IMG_20260702_130407.png.jpeg',
    image_fav: '/images/real/suits/royal-heritage-suit-1/IMG_20260702_130252.png.jpeg',
    sketch_image: '/images/sketches/sketch-suits.jpeg',
    description: 'Classic royal heritage 2-piece suit meticulously crafted from premium wool-blend suiting fabric. Fits flawlessly.' },
  { id: 'p2', name: 'Executive Slim Fit Suit', category: 'Suits', price: 7200, is_top_seller: false,
    image: '/images/real/suits/executive-slim-suit/IMG_20260702_130620.png.jpeg',
    sketch_image: '/images/sketches/sketch-suits.jpeg',
    description: 'Modern slim fit corporate suit offering structured shoulders and tapered lines for clean office presentation.' },
  { id: 'p3', name: 'Premium Oxford Shirt', category: 'Shirts', price: 2400, is_top_seller: false,
    image: '/images/real/shirts/oxford-shirt/IMG_20260702_134328.png.jpeg',
    sketch_image: '/images/sketches/sketch-shirts.jpeg',
    description: 'Premium pure-cotton Oxford dress shirt featuring a structured button-down collar and double-stitched durability.' },
  { id: 'p4', name: 'Modi Coat Ensemble', category: 'Modi Coat', price: 5500, is_top_seller: false,
    image: '/images/real/modi-coat/modi-coat-ensemble/IMG_20260702_130732.png.jpeg',
    sketch_image: '/images/sketches/sketch-modi-coat.jpeg',
    description: 'Refined royal bandhgala Modi coat paired with matching kurta pajamas. Exudes rich traditional grace.' },
  { id: 'p5', name: 'Jodhpuri Classic', category: 'Jodhpuri', price: 9500, is_top_seller: true,
    image: '/images/real/jodhpuri/jodhpuri-classic-2/IMG_20260702_130858.png.jpeg',
    image_fav: '/images/real/jodhpuri/jodhpuri-classic-1/IMG_20260702_130529.png.jpeg',
    sketch_image: '/images/sketches/sketch-jodhpuri.jpeg',
    description: 'Traditional Jodhpuri royal bandhgala suit with authentic buttons, matching trousers, and custom cuffs.' },
  { id: 'p6', name: 'Grand Sherwani Set', category: 'Sherwani', price: 12000, is_top_seller: true,
    image: '/images/real/sherwani/grand-sherwani-2/IMG_20260702_125944.png.jpeg',
    image_fav: '/images/real/sherwani/grand-sherwani-1/IMG_20260702_130111.png.jpeg',
    sketch_image: '/images/sketches/sketch-sherwani.jpeg',
    description: 'Magnificent golden silk wedding sherwani detailed with classic brocade motifs, matching pyjamas, and tailored shawl.' },
  { id: 'p7', name: 'Business Blazer', category: 'Blazers', price: 5800, is_top_seller: false,
    image: '/images/real/blazers/business-blazer/IMG_20260702_125737.png.jpeg',
    sketch_image: '/images/sketches/sketch-blazers.jpeg',
    description: 'Versatile smart-casual tweed business blazer featuring premium satin inner lining and notched collar.' },
  { id: 'p8', name: 'Festive Kurta Pajama', category: 'Kurta', price: 3200, is_top_seller: false,
    image: '/images/real/kurta/festive-kurta/IMG_20260702_130351.png.jpeg',
    sketch_image: '/images/sketches/sketch-kurta.jpeg',
    description: 'Comfy cotton ethnic kurta set perfect for festive gatherings, custom-tailored with premium stitch count.' },
  { id: 'p9', name: 'Merino Formal Trousers', category: 'Pants', price: 2800, is_top_seller: false,
    image: '/images/real/pants/merino-trousers/IMG_20260702_134403.png.jpeg',
    sketch_image: '/images/sketches/sketch-pants.jpeg',
    description: 'Bespoke merino wool trousers with standard front-crease fold, flat front profile and custom waist adjusters.' },
  { id: 'p10', name: 'Three-Piece Prestige Suit', category: 'Suits', price: 14000, is_top_seller: true,
    image: '/images/real/suits/three-piece-suit-2/IMG_20260702_125853.png.jpeg',
    image_fav: '/images/real/suits/three-piece-suit-1/IMG_20260702_130224.png.jpeg',
    sketch_image: '/images/sketches/sketch-suits.jpeg',
    description: 'Ultimate 3-piece prestige suiting ensemble complete with blazer, matching button waistcoat, and pleated formal trousers.' }
];

const FABRIC_SWATCHES = [
  { category: 'Suits', name: 'Charcoal Herringbone Wool', image: '/images/fabrics/fabric-suits.png' },
  { category: 'Shirts', name: 'White Oxford Cotton', image: '/images/fabrics/fabric-shirts.png' },
  { category: 'Pants', name: 'Navy Gabardine', image: '/images/fabrics/fabric-pants.png' },
  { category: 'Modi Coat', name: 'Royal Blue Brocade', image: '/images/fabrics/fabric-modi-coat.png' },
  { category: 'Jodhpuri', name: 'Deep Maroon Silk', image: '/images/fabrics/fabric-jodhpuri.png' },
  { category: 'Sherwani', name: 'Ivory Gold Brocade', image: '/images/fabrics/fabric-sherwani.png' },
  { category: 'Blazers', name: 'Navy Blue Tweed', image: '/images/fabrics/fabric-blazers.png' },
  { category: 'Kurta', name: 'White Cotton Mulmul', image: '/images/fabrics/fabric-kurta.png' }
];

async function run() {
  console.log('🏁 Starting static data ingestion to Supabase...');

  for (const product of PRODUCTS) {
    console.log(`\n📦 Processing Product: "${product.name}"...`);

    // Check if product exists already
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .maybeSingle();

    if (fetchErr) {
      console.error(`Error checking existing product "${product.name}":`, fetchErr);
      continue;
    }

    let productId;

    if (existing) {
      console.log(`ℹ️ Product exists (ID: ${existing.id}). Updating fields...`);
      productId = existing.id;
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          price: product.price,
          is_top_seller: product.is_top_seller,
          image: product.image,
          image_fav: product.image_fav,
          sketch_image: product.sketch_image,
          description: product.description
        })
        .eq('id', productId);

      if (updateErr) {
        console.error(`❌ Error updating "${product.name}":`, updateErr);
      }
    } else {
      console.log(`➕ Inserting new product "${product.name}"...`);
      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert([
          {
            name: product.name,
            category: product.category,
            price: product.price,
            is_top_seller: product.is_top_seller,
            image: product.image,
            image_fav: product.image_fav,
            sketch_image: product.sketch_image,
            description: product.description,
            colors: ['Charcoal', 'Navy', 'White', 'Ivory', 'Cream', 'Black'],
            fabrics: ['Premium Wool', 'Pure Cotton', 'Linen', 'Silk Blend'],
            features: [
              'Custom tailor measurements',
              'Premium quality stitching',
              'Choice of lining & interlining'
            ]
          }
        ])
        .select()
        .single();

      if (insertErr || !inserted) {
        console.error(`❌ Error inserting product "${product.name}":`, insertErr);
        continue;
      }
      productId = inserted.id;
      console.log(`✅ Inserted successfully (ID: ${productId})`);
    }

    // Process associated fabric swatches (clothes)
    const categorySwatches = FABRIC_SWATCHES.filter(sw => sw.category === product.category);
    for (const swatch of categorySwatches) {
      // Check if swatch exists
      const { data: existingSwatch, error: sFetchErr } = await supabase
        .from('fabric_swatches')
        .select('id')
        .eq('product_id', productId)
        .eq('name', swatch.name)
        .maybeSingle();

      if (sFetchErr) {
        console.error(`Error checking fabric swatch "${swatch.name}":`, sFetchErr);
        continue;
      }

      if (existingSwatch) {
        console.log(`  └─ Swatch "${swatch.name}" already linked.`);
      } else {
        console.log(`  └─ Linking fabric swatch "${swatch.name}"...`);
        const { error: sInsertErr } = await supabase
          .from('fabric_swatches')
          .insert([
            {
              product_id: productId,
              name: swatch.name,
              image: swatch.image
            }
          ]);

        if (sInsertErr) {
          console.error(`  ❌ Error linking swatch "${swatch.name}":`, sInsertErr);
        } else {
          console.log(`  ✅ Swatch linked successfully.`);
        }
      }
    }
  }

  console.log('\n🎉 Ingestion complete!');
}

run();
