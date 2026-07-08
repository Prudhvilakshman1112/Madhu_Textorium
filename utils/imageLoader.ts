// utils/imageLoader.ts
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Serve local public folder assets directly
  if (src.startsWith('/') && !src.startsWith('//')) {
    return src;
  }
  
  // Route external images through the free Weserv CDN for on-the-fly resize and WebP conversion
  const encodedSrc = encodeURIComponent(src);
  return `https://images.weserv.nl/?url=${encodedSrc}&w=${width}&output=webp&q=${quality || 75}`;
}
