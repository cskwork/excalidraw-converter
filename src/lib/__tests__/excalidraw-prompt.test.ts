import { describe, it, expect } from "vitest";
import { buildConversionPrompt } from "../excalidraw-prompt";

// ---------------------------------------------------------------------------
// buildConversionPrompt
// ---------------------------------------------------------------------------
describe("buildConversionPrompt", () => {
  // --- Base schema fields present in every prompt ---
  const BASE_SCHEMA_FIELDS = ["type", "id", "x", "y", "width", "height"];

  for (const inputType of ["text", "image", "file"]) {
    describe(`inputType: "${inputType}"`, () => {
      const prompt = buildConversionPrompt(inputType);

      it("returns a non-empty string", () => {
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(0);
      });

      it("instructs to return only a JSON array", () => {
        expect(prompt).toMatch(/JSON array/i);
        expect(prompt).toContain("[");
        expect(prompt).toContain("]");
      });

      for (const field of BASE_SCHEMA_FIELDS) {
        it(`contains base schema field "${field}"`, () => {
          expect(prompt).toContain(`"${field}"`);
        });
      }

      it("mentions unique 8-char alphanumeric IDs", () => {
        expect(prompt).toMatch(/8.*(alphanumeric|char)/i);
      });

      it("mentions seed values", () => {
        expect(prompt).toContain("seed");
      });

      it("mentions layout rules (spacing or grid)", () => {
        expect(prompt).toMatch(/layout|grid|spacing/i);
      });

      it("instructs no markdown or code fences in output", () => {
        expect(prompt).toMatch(/no.*markdown|no.*code.*fence|no.*explanation/i);
      });

      it("defines element count bounds (at least 3, no more than 50)", () => {
        expect(prompt).toMatch(/at least 3/i);
        expect(prompt).toMatch(/50/);
      });
    });
  }

  // --- Text-specific strategy ---
  describe('inputType: "text" — strategy keywords', () => {
    const prompt = buildConversionPrompt("text");

    it("mentions analyzing text for key concepts", () => {
      expect(prompt).toMatch(/Key concepts|entities|topics/i);
    });

    it("mentions relationships (causes, depends-on, leads-to)", () => {
      expect(prompt).toMatch(/relationship|causes|depends|leads-to/i);
    });

    it("mentions flowchart or mind map output", () => {
      expect(prompt).toMatch(/flowchart|mind map/i);
    });

    it("mentions color coding for concepts", () => {
      expect(prompt).toMatch(/#a5d8ff|#d0bfff|#b2f2bb/i);
    });
  });

  // --- Image-specific strategy ---
  describe('inputType: "image" — strategy keywords', () => {
    const prompt = buildConversionPrompt("image");

    it("mentions examining the image visually", () => {
      expect(prompt).toMatch(/image|visual/i);
    });

    it("mentions preserving spatial layout or relative positioning", () => {
      expect(prompt).toMatch(/spatial|relative positioning|layout/i);
    });

    it("mentions converting visual regions to shapes", () => {
      expect(prompt).toMatch(/shape|region|rectangle|ellipse/i);
    });

    it("mentions matching colors from the original", () => {
      expect(prompt).toMatch(/color|hex/i);
    });

    it("does NOT contain text-strategy-specific keywords (flowchart/mind map)", () => {
      // Image strategy should not bleed text-specific wording
      expect(prompt).not.toContain("flowchart");
      expect(prompt).not.toContain("mind map");
    });
  });

  // --- File-specific strategy ---
  describe('inputType: "file" — strategy keywords', () => {
    const prompt = buildConversionPrompt("file");

    it("mentions parsing document structure", () => {
      expect(prompt).toMatch(/document|structure|section|heading/i);
    });

    it("mentions organizational chart or structured flowchart", () => {
      expect(prompt).toMatch(/organizational chart|flowchart/i);
    });

    it("mentions hierarchical heading levels", () => {
      expect(prompt).toMatch(/heading|sub-section|top-level/i);
    });

    it("mentions diamond shapes for decision points", () => {
      expect(prompt).toMatch(/diamond/i);
    });

    it("does NOT contain image-strategy-specific keywords (examine the image)", () => {
      expect(prompt).not.toMatch(/Examine the image/i);
    });
  });

  // --- Unknown / fallback input type ---
  describe('unknown inputType falls back to text strategy', () => {
    const prompt = buildConversionPrompt("unknown_type");

    it("returns a non-empty string (does not throw)", () => {
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });

    it("falls back to text strategy keywords", () => {
      expect(prompt).toMatch(/Key concepts|entities|topics/i);
    });
  });

  // --- Arrow element schema ---
  describe("arrow element schema is present", () => {
    const prompt = buildConversionPrompt("text");

    it("defines arrow type", () => {
      expect(prompt).toContain('"arrow"');
    });

    it("defines startBinding and endBinding", () => {
      expect(prompt).toContain("startBinding");
      expect(prompt).toContain("endBinding");
    });

    it("defines points array", () => {
      expect(prompt).toContain("points");
    });
  });

  // --- Text element schema ---
  describe("text element schema is present", () => {
    const prompt = buildConversionPrompt("text");

    it("defines containerId field", () => {
      expect(prompt).toContain("containerId");
    });

    it("defines fontSize and fontFamily", () => {
      expect(prompt).toContain("fontSize");
      expect(prompt).toContain("fontFamily");
    });

    it("defines originalText", () => {
      expect(prompt).toContain("originalText");
    });
  });
});
