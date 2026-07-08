/**
 * scripts/update-r2-urls.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Updates all image/swatch URLs in Supabase from relative local paths
 * (e.g. /images/real/suits/...) to full Cloudflare R2 CDN URLs
 * (e.g. https://pub-xxx.r2.dev/images/real/suits/...)
 *
 * Run: node scripts/update-r2-urls.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const r2PublicUrl      = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_URL;

if (!supabaseUrl || !supabaseKey || !r2PublicUrl) {
  console.error('❌ Missing env vars. Check your .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert a local relative path to a full R2 URL
// e.g.  /images/real/suits/... → https://pub-xxx.r2.dev/images/real/suits/...
function toR2(localPath) {
  if (!localPath) return null;
  if (localPath.startsWith('http')) return localPath; // already absolute
  return `${r2PublicUrl}${localPath}`;
}

async function run() {
  console.log(`\n🔗 R2 Base URL: ${r2PublicUrl}\n`);

  // ── 1. Update products table ────────────────────────────────────────────────
  console.log('📦 Fetching all products from Supabase...');
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, image, image_fav, sketch_image');

  if (fetchErr) { console.error('❌ Failed to fetch products:', fetchErr); process.exit(1); }
  console.log(`   Found ${products.length} products.\n`);

  for (const p of products) {
    const updated = {
      image:        toR2(p.image),
      image_fav:    toR2(p.image_fav),
      sketch_image: toR2(p.sketch_image),
    };

    const { error: updateErr } = await supabase
      .from('products')
      .update(updated)
      .eq('id', p.id);

    if (updateErr) {
      console.error(`❌ Failed to update "${p.name}":`, updateErr);
    } else {
      console.log(`✅ Updated: "${p.name}"`);
      console.log(`   image        → ${updated.image}`);
      if (updated.image_fav)    console.log(`   image_fav    → ${updated.image_fav}`);
      if (updated.sketch_image) console.log(`   sketch_image → ${updated.sketch_image}`);
    }
  }

  // ── 2. Update fabric_swatches table ────────────────────────────────────────
  console.log('\n🧵 Fetching all fabric swatches...');
  const { data: swatches, error: swFetchErr } = await supabase
    .from('fabric_swatches')
    .select('id, name, image');

  if (swFetchErr) { console.error('❌ Failed to fetch swatches:', swFetchErr); process.exit(1); }
  console.log(`   Found ${swatches.length} swatches.\n`);

  for (const sw of swatches) {
    const { error: swUpdateErr } = await supabase
      .from('fabric_swatches')
      .update({ image: toR2(sw.image) })
      .eq('id', sw.id);

    if (swUpdateErr) {
      console.error(`❌ Failed to update swatch "${sw.name}":`, swUpdateErr);
    } else {
      console.log(`✅ Swatch updated: "${sw.name}" → ${toR2(sw.image)}`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('🎉 All URLs updated to R2 CDN!');
  console.log('   Images are now served 100% from Cloudflare R2.');
  console.log('   You can safely delete public/images/ locally.');
  console.log('─────────────────────────────────────────\n');
}

run();
