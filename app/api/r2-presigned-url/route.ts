import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configured for Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { folder, publicId, contentType } = await request.json();

    if (!folder || !publicId || !contentType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const key = `${folder}/${publicId}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    // Cloudflare public serving URL structure (using custom domain or pub-xxx.r2.dev domain)
    const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    console.error('R2 signature error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
