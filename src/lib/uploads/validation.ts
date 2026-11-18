export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export function detectUpload(bytes: Uint8Array, declaredType: string) {
  const starts = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start+length));
  const detected = starts([137,80,78,71,13,10,26,10]) ? { type: 'image/png', extension: 'png' }
    : starts([255,216,255]) ? { type: 'image/jpeg', extension: 'jpg' }
    : ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP' ? { type: 'image/webp', extension: 'webp' }
    : ascii(0,5) === '%PDF-' ? { type: 'application/pdf', extension: 'pdf' } : null;
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES || !detected || detected.type !== declaredType) throw new Error('Choose a matching PNG, JPEG, WebP or PDF file up to 4 MB.');
  return detected;
}
