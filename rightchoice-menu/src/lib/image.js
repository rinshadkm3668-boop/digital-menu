// Resize + compress an image file in the browser before upload.
// Output: WebP (falls back to JPEG), max 1000px on the longest side.
export async function optimizeImage(file, maxSide = 1000, quality = 0.82) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  let ext = 'webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
    ext = 'jpg';
  }
  if (!blob) throw new Error('Could not process this image.');
  return { blob, ext, contentType: blob.type };
}
