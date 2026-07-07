/**
 * chromaKey.ts
 *
 * Removes a key colour (default: magenta #FF00FF) from an image
 * and returns a data URL (PNG with alpha channel) suitable for
 * use as a transparent overlay on any background.
 *
 * Works in-browser via Canvas 2D API. Pass the result directly
 * as an <img> src — no server round-trip needed.
 */

export interface ChromaKeyOptions {
  /** The colour to make transparent. Default: magenta #FF00FF */
  keyColor?: { r: number; g: number; b: number };
  /** Pixel distance from keyColor that is fully removed. Default: 60 */
  tolerance?: number;
  /** Extra range beyond tolerance for feathered (anti-aliased) edges. Default: 20 */
  softEdge?: number;
}

export async function chromaKeyToTransparent(
  imageUrl: string,
  options: ChromaKeyOptions = {}
): Promise<string> {
  const {
    keyColor = { r: 255, g: 0, b: 255 }, // magenta
    tolerance = 60,
    softEdge  = 20,
  } = options;

  return new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas 2d context unavailable')); return; }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Euclidean distance from the key colour
        const dist = Math.sqrt(
          (r - keyColor.r) ** 2 +
          (g - keyColor.g) ** 2 +
          (b - keyColor.b) ** 2
        );

        if (dist < tolerance) {
          // Fully inside key colour range → make transparent
          d[i + 3] = 0;
        } else if (dist < tolerance + softEdge) {
          // Feathered edge → partial transparency for smooth anti-aliasing
          const alpha = (dist - tolerance) / softEdge;
          d[i + 3] = Math.round(alpha * 255);
        }
        // else: leave pixel fully opaque — drawn exactly as-is
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (e) => reject(e);
    img.src = imageUrl;
  });
}
