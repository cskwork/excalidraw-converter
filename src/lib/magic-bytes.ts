/**
 * 이미지 파일의 magic bytes를 검증하여 MIME spoofing 방어
 * 브라우저가 보내는 Content-Type은 위조 가능하므로 실제 바이트와 교차 검증
 */

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff]);
const GIF87_MAGIC = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
const GIF89_MAGIC = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
// WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
const RIFF_MAGIC = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
const WEBP_MAGIC = new Uint8Array([0x57, 0x45, 0x42, 0x50]);

function startsWith(buf: Uint8Array, signature: Uint8Array): boolean {
  if (buf.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[i] !== signature[i]) return false;
  }
  return true;
}

function sliceEquals(
  buf: Uint8Array,
  offset: number,
  signature: Uint8Array,
): boolean {
  if (buf.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[offset + i] !== signature[i]) return false;
  }
  return true;
}

export function validateImageMagicBytes(
  buffer: Buffer,
  mimeType: string,
): boolean {
  const bytes = new Uint8Array(buffer);

  switch (mimeType) {
    case "image/png":
      return startsWith(bytes, PNG_MAGIC);
    case "image/jpeg":
      return startsWith(bytes, JPEG_MAGIC);
    case "image/gif":
      return startsWith(bytes, GIF87_MAGIC) || startsWith(bytes, GIF89_MAGIC);
    case "image/webp":
      return startsWith(bytes, RIFF_MAGIC) && sliceEquals(bytes, 8, WEBP_MAGIC);
    default:
      return false;
  }
}
