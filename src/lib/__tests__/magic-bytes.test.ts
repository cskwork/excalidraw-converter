import { describe, it, expect } from "vitest";
import { validateImageMagicBytes } from "../magic-bytes";

// 실제 파일 헤더 시그니처
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF89_HEADER = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
const GIF87_HEADER = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00]);
// RIFF????WEBP
const WEBP_HEADER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // file size (placeholder)
  0x57, 0x45, 0x42, 0x50, // WEBP
]);

describe("validateImageMagicBytes", () => {
  describe("PNG", () => {
    it("accepts valid PNG header", () => {
      expect(validateImageMagicBytes(PNG_HEADER, "image/png")).toBe(true);
    });

    it("rejects JPEG bytes declared as PNG", () => {
      expect(validateImageMagicBytes(JPEG_HEADER, "image/png")).toBe(false);
    });

    it("rejects buffer too short for PNG", () => {
      expect(validateImageMagicBytes(Buffer.from([0x89, 0x50]), "image/png")).toBe(false);
    });
  });

  describe("JPEG", () => {
    it("accepts valid JPEG header", () => {
      expect(validateImageMagicBytes(JPEG_HEADER, "image/jpeg")).toBe(true);
    });

    it("rejects PNG bytes declared as JPEG", () => {
      expect(validateImageMagicBytes(PNG_HEADER, "image/jpeg")).toBe(false);
    });
  });

  describe("GIF", () => {
    it("accepts GIF89a header", () => {
      expect(validateImageMagicBytes(GIF89_HEADER, "image/gif")).toBe(true);
    });

    it("accepts GIF87a header", () => {
      expect(validateImageMagicBytes(GIF87_HEADER, "image/gif")).toBe(true);
    });

    it("rejects non-GIF bytes", () => {
      expect(validateImageMagicBytes(PNG_HEADER, "image/gif")).toBe(false);
    });
  });

  describe("WebP", () => {
    it("accepts valid WebP header (RIFF...WEBP)", () => {
      expect(validateImageMagicBytes(WEBP_HEADER, "image/webp")).toBe(true);
    });

    it("rejects RIFF without WEBP marker", () => {
      const aviHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x00, 0x00, 0x00, 0x00,
        0x41, 0x56, 0x49, 0x20, // AVI instead of WEBP
      ]);
      expect(validateImageMagicBytes(aviHeader, "image/webp")).toBe(false);
    });
  });

  describe("unsupported type", () => {
    it("rejects unknown MIME type", () => {
      expect(validateImageMagicBytes(PNG_HEADER, "image/svg+xml")).toBe(false);
    });
  });

  describe("empty buffer", () => {
    it("rejects empty buffer for all types", () => {
      const empty = Buffer.alloc(0);
      expect(validateImageMagicBytes(empty, "image/png")).toBe(false);
      expect(validateImageMagicBytes(empty, "image/jpeg")).toBe(false);
      expect(validateImageMagicBytes(empty, "image/gif")).toBe(false);
      expect(validateImageMagicBytes(empty, "image/webp")).toBe(false);
    });
  });
});
