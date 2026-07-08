/**
 * lib/compressImage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side image compression using the browser Canvas API.
 * Zero dependencies — runs fully inside the customer's browser.
 *
 * Flow:
 *  1. Decode image into a canvas, scale down to maximum width/height (1920px)
 *  2. Binary-search for the highest quality (0.92 down to 0.50) where size <= 200KB
 *  3. Convert to WebP format (30-50% smaller than JPEG/PNG)
 *  4. Returns a new File object ready for direct upload to R2
 */

const DIMENSION_STEPS = [1920, 1600, 1280, 960, 800];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function drawScaled(img: HTMLImageElement, maxDim: number) {
  const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const width  = Math.round(img.naturalWidth  * ratio);
  const height = Math.round(img.naturalHeight * ratio);
  
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
  }
  return { canvas, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob | null; mimeType: string }> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, mimeType: 'image/webp' });
        } else {
          // Fallback to JPEG if WebP is not supported by the browser canvas
          canvas.toBlob(
            (jpegBlob) => resolve({ blob: jpegBlob, mimeType: 'image/jpeg' }),
            'image/jpeg',
            quality
          );
        }
      },
      'image/webp',
      quality
    );
  });
}

async function binarySearchQuality(canvas: HTMLCanvasElement, targetBytes: number, minQuality: number, maxQuality: number) {
  let lo = minQuality;
  let hi = maxQuality;
  let best: { blob: Blob; mimeType: string; quality: number } | null = null;

  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const { blob, mimeType } = await canvasToBlob(canvas, mid);
    if (blob && blob.size <= targetBytes) {
      best = { blob, mimeType, quality: mid };
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.02) break;
  }

  if (!best) {
    const { blob, mimeType } = await canvasToBlob(canvas, minQuality);
    if (blob) {
      best = { blob, mimeType, quality: minQuality };
    }
  }

  return best;
}

export async function compressImage(file: File, opts: { targetBytes?: number; maxWidth?: number } = {}) {
  const { targetBytes = 200_000, maxWidth = 1920 } = opts;
  const originalSize = file.size;

  // Skip compression for files already under the target limit
  if (originalSize <= targetBytes) {
    return file;
  }

  try {
    const img = await loadImage(file);

    for (const maxDim of DIMENSION_STEPS) {
      if (maxDim > maxWidth && maxDim !== DIMENSION_STEPS[0]) continue;

      const { canvas } = drawScaled(img, maxDim);
      const result = await binarySearchQuality(canvas, targetBytes, 0.50, 0.92);

      if (result && (result.blob.size <= targetBytes || maxDim === DIMENSION_STEPS[DIMENSION_STEPS.length - 1])) {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const ext = result.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const newName = `${baseName}_opt.${ext}`;
        return new File([result.blob], newName, { type: result.mimeType });
      }
    }
  } catch (err) {
    console.error('Browser image compression failed, uploading original file:', err);
  }

  return file;
}
