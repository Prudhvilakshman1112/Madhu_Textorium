/**
 * scripts/upload-to-r2.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Uploads all images from public/images/ to your Cloudflare R2 bucket,
 * preserving the exact folder structure so existing image paths in the
 * codebase continue to work unchanged.
 *
 * Run: node scripts/upload-to-r2.js
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const ACCOUNT_ID   = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY   = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_KEY   = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME  = process.env.CLOUDFLARE_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY || !BUCKET_NAME) {
  console.error('❌ Missing one or more Cloudflare R2 env vars. Check your .env.local');
  process.exit(1);
}

// Cloudflare R2 uses the S3-compatible API
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// Root folder to scan
const LOCAL_ROOT = path.join(__dirname, '../public/images');

// Mime type lookup
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
  };
  return map[ext] || 'application/octet-stream';
}

// Recursively collect all files
function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// Check if file already exists in R2 (skip re-upload)
async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log(`\n☁️  Starting upload to R2 bucket: "${BUCKET_NAME}"\n`);

  const allFiles = collectFiles(LOCAL_ROOT);
  console.log(`📂 Found ${allFiles.length} files to process.\n`);

  let uploaded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const localPath of allFiles) {
    // R2 key = relative path from public/ (e.g. images/fabrics/fabric-suits.png)
    const r2Key = localPath
      .replace(path.join(__dirname, '../public') + path.sep, '')
      .replace(/\\/g, '/');  // Windows → forward slashes

    const alreadyExists = await existsInR2(r2Key);
    if (alreadyExists) {
      console.log(`⏭️  Skipping (already in R2): ${r2Key}`);
      skipped++;
      continue;
    }

    try {
      const fileBuffer  = fs.readFileSync(localPath);
      const contentType = getMimeType(localPath);

      await r2.send(new PutObjectCommand({
        Bucket:      BUCKET_NAME,
        Key:         r2Key,
        Body:        fileBuffer,
        ContentType: contentType,
      }));

      console.log(`✅ Uploaded: ${r2Key}`);
      uploaded++;
    } catch (err) {
      console.error(`❌ Failed: ${r2Key} — ${err.message}`);
      failed++;
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`🎉 Upload complete!`);
  console.log(`   ✅ Uploaded : ${uploaded}`);
  console.log(`   ⏭️  Skipped  : ${skipped}`);
  console.log(`   ❌ Failed   : ${failed}`);
  console.log('─────────────────────────────────────────\n');
}

run();
