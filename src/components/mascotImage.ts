/**
 * Loads the AQUASCAPE brand logo PNG and prepares a fish-only sprite for the
 * mascot: the light-blue diamond background is chroma-keyed out and the image is
 * cropped to the fish's bounding box, so the origami fish can be drawn directly
 * on the canvas and matches the logo exactly (no hand-drawn approximation).
 *
 * The sprite draws facing +X (right), same convention as the canvas mascot, so
 * the existing horizontal-flip logic for leftward swimming still applies.
 */

let mascotSprite: HTMLCanvasElement | null = null;
let mascotAspect = 1; // width / height of the cropped sprite
let loadStarted = false;

function processLogo(img: HTMLImageElement): void {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return;

  const work = document.createElement('canvas');
  work.width = w;
  work.height = h;
  const ctx = work.getContext('2d');
  if (!ctx) return;
  ctx.drawImage(img, 0, 0);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return; // canvas tainted (shouldn't happen for a same-origin asset)
  }
  const d = imageData.data;

  // Chroma-key the light-cyan diamond background and find the fish bbox.
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const a = d[i + 3];
    const isBackground = a < 10 || (r > 150 && g > 210 && b > 225);
    if (isBackground) {
      d[i + 3] = 0;
    } else {
      const px = (i / 4) % w;
      const py = Math.floor(i / 4 / w);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  if (maxX <= minX || maxY <= minY) return; // nothing detected

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const sprite = document.createElement('canvas');
  sprite.width = cropW;
  sprite.height = cropH;
  const sctx = sprite.getContext('2d');
  if (!sctx) return;
  sctx.drawImage(work, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  mascotSprite = sprite;
  mascotAspect = cropW / cropH;
}

/** Kicks off loading once; safe to call repeatedly. No-op outside the browser. */
export function ensureMascotSprite(): void {
  if (loadStarted || typeof document === 'undefined') return;
  loadStarted = true;
  const img = new Image();
  img.onload = () => processLogo(img);
  // Served from /public; the space in the filename must be encoded.
  img.src = './static/aquascape%20logo.png';
}

/** The prepared fish-only sprite, or null until it has loaded/processed. */
export function getMascotSprite(): HTMLCanvasElement | null {
  return mascotSprite;
}

/** width / height of the cropped sprite, for aspect-correct drawing. */
export function getMascotAspect(): number {
  return mascotAspect;
}
