import { describe, it, expect, vi } from "vitest";
import {
  generateId,
  createRectangle,
  createText,
  createArrow,
  validateElements,
  autoLayout,
} from "../element-helpers";
import type { ExcalidrawElement, ShapeElement, TextElement } from "@/types/excalidraw";

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe("generateId", () => {
  it("returns an 8-character string", () => {
    expect(generateId()).toHaveLength(8);
  });

  it("contains only base64url-safe characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{8}$/);
  });

  it("generates unique values on successive calls", () => {
    const ids = Array.from({ length: 100 }, () => generateId());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  it("never returns an empty string", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateId().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// createRectangle
// ---------------------------------------------------------------------------
describe("createRectangle", () => {
  const id = "rect0001";
  const [rect, text] = createRectangle(id, 10, 20, 160, 80, "Hello");

  it("returns a tuple of [ShapeElement, TextElement]", () => {
    expect(rect.type).toBe("rectangle");
    expect(text.type).toBe("text");
  });

  it("rectangle has correct position and size", () => {
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(20);
    expect(rect.width).toBe(160);
    expect(rect.height).toBe(80);
  });

  it("rectangle carries the provided id", () => {
    expect(rect.id).toBe(id);
  });

  it("rectangle uses the default background color when none supplied", () => {
    expect(rect.backgroundColor).toBe("#a5d8ff");
  });

  it("rectangle accepts a custom background color", () => {
    const [r] = createRectangle("id000002", 0, 0, 100, 50, "X", "#ff0000");
    expect(r.backgroundColor).toBe("#ff0000");
  });

  it("rectangle has roundness type 3", () => {
    expect(rect.roundness).toEqual({ type: 3 });
  });

  it("rectangle lists the text element in boundElements", () => {
    expect(rect.boundElements).toContainEqual({ id: text.id, type: "text" });
  });

  it("rectangle has a positive seed", () => {
    expect(rect.seed).toBeGreaterThan(0);
  });

  it("text element containerId points to rect id", () => {
    expect(text.containerId).toBe(id);
  });

  it("text element carries the label", () => {
    expect(text.text).toBe("Hello");
    expect(text.originalText).toBe("Hello");
  });

  it("text element has fontSize 20 and fontFamily 1", () => {
    expect(text.fontSize).toBe(20);
    expect(text.fontFamily).toBe(1);
  });

  it("text x is offset 10px from rect x", () => {
    expect(text.x).toBe(rect.x + 10);
  });

  it("text y is vertically centered within rect", () => {
    expect(text.y).toBe(rect.y + rect.height / 2 - 12);
  });

  it("text width equals rect width minus 20", () => {
    expect(text.width).toBe(rect.width - 20);
  });
});

// ---------------------------------------------------------------------------
// createText
// ---------------------------------------------------------------------------
describe("createText", () => {
  const el = createText("txt00001", 50, 60, "Hello World");

  it("has type 'text'", () => {
    expect(el.type).toBe("text");
  });

  it("uses the provided id, position, and text", () => {
    expect(el.id).toBe("txt00001");
    expect(el.x).toBe(50);
    expect(el.y).toBe(60);
    expect(el.text).toBe("Hello World");
    expect(el.originalText).toBe("Hello World");
  });

  it("has default fontSize of 20", () => {
    expect(el.fontSize).toBe(20);
  });

  it("accepts a custom fontSize", () => {
    const big = createText("txt00002", 0, 0, "X", 36);
    expect(big.fontSize).toBe(36);
  });

  it("width is proportional to text length (10px per char)", () => {
    const label = "Hello World";
    expect(el.width).toBe(label.length * 10);
  });

  it("height is fontSize * 1.25", () => {
    expect(el.height).toBe(20 * 1.25);
  });

  it("containerId is null (standalone text)", () => {
    expect(el.containerId).toBeNull();
  });

  it("textAlign is left, verticalAlign is top", () => {
    expect(el.textAlign).toBe("left");
    expect(el.verticalAlign).toBe("top");
  });

  it("has a positive seed", () => {
    expect(el.seed).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// createArrow
// ---------------------------------------------------------------------------
describe("createArrow", () => {
  const arrow = createArrow("arr00001", "src00001", "dst00001", 0, 0, 100, 200);

  it("has type 'arrow'", () => {
    expect(arrow.type).toBe("arrow");
  });

  it("starts at the given origin", () => {
    expect(arrow.x).toBe(0);
    expect(arrow.y).toBe(0);
  });

  it("width equals abs(dx) and height equals abs(dy)", () => {
    expect(arrow.width).toBe(100);
    expect(arrow.height).toBe(200);
  });

  it("points array has two entries: [0,0] and [dx,dy]", () => {
    expect(arrow.points).toHaveLength(2);
    expect(arrow.points[0]).toEqual([0, 0]);
    expect(arrow.points[1]).toEqual([100, 200]);
  });

  it("startBinding references the source element", () => {
    expect(arrow.startBinding?.elementId).toBe("src00001");
    expect(arrow.startBinding?.gap).toBe(8);
    expect(arrow.startBinding?.focus).toBe(0);
  });

  it("endBinding references the destination element", () => {
    expect(arrow.endBinding?.elementId).toBe("dst00001");
  });

  it("endArrowhead is 'arrow', startArrowhead is null", () => {
    expect(arrow.endArrowhead).toBe("arrow");
    expect(arrow.startArrowhead).toBeNull();
  });

  it("roundness is type 2", () => {
    expect(arrow.roundness).toEqual({ type: 2 });
  });

  it("handles negative direction correctly (dx < 0, dy < 0)", () => {
    const reversed = createArrow("arr00002", "s", "d", 100, 100, 0, 0);
    expect(reversed.width).toBe(100);  // abs(-100)
    expect(reversed.height).toBe(100); // abs(-100)
    expect(reversed.points[1]).toEqual([-100, -100]);
  });
});

// ---------------------------------------------------------------------------
// validateElements
// ---------------------------------------------------------------------------
describe("validateElements", () => {
  it("returns empty array for empty input", () => {
    expect(validateElements([])).toEqual([]);
  });

  it("filters out null values", () => {
    expect(validateElements([null])).toEqual([]);
  });

  it("filters out non-object primitives", () => {
    expect(validateElements([42, "hello", true])).toEqual([]);
  });

  it("filters out elements with invalid type strings", () => {
    const el = { type: "hexagon", id: "id000001", x: 0, y: 0 };
    expect(validateElements([el])).toEqual([]);
  });

  it("filters out elements missing a string id", () => {
    const el = { type: "rectangle", id: 123, x: 0, y: 0 };
    expect(validateElements([el])).toEqual([]);
  });

  it("filters out elements with non-numeric x or y", () => {
    const noX = { type: "rectangle", id: "id000001", x: "bad", y: 0 };
    const noY = { type: "rectangle", id: "id000002", x: 0, y: "bad" };
    expect(validateElements([noX, noY])).toEqual([]);
  });

  it("accepts all valid element types", () => {
    const types = ["rectangle", "ellipse", "diamond", "text", "arrow", "line"];
    const elements = types.map((type, i) => ({
      type,
      id: `id${String(i).padStart(6, "0")}`,
      x: i * 200,
      y: 0,
    }));
    const result = validateElements(elements);
    expect(result).toHaveLength(6);
  });

  it("applies default width of 160 when width is missing", () => {
    const el = { type: "rectangle", id: "id000001", x: 0, y: 0 };
    const [result] = validateElements([el]);
    expect(result.width).toBe(160);
  });

  it("applies default height of 80 when height is missing", () => {
    const el = { type: "rectangle", id: "id000001", x: 0, y: 0 };
    const [result] = validateElements([el]);
    expect(result.height).toBe(80);
  });

  it("preserves explicit width and height when provided", () => {
    const el = { type: "rectangle", id: "id000001", x: 0, y: 0, width: 300, height: 150 };
    const [result] = validateElements([el]);
    expect(result.width).toBe(300);
    expect(result.height).toBe(150);
  });

  it("adds default fields: strokeColor, opacity, version, etc.", () => {
    const el = { type: "rectangle", id: "id000001", x: 0, y: 0 };
    const [result] = validateElements([el]);
    expect(result.strokeColor).toBe("#1e1e1e");
    expect(result.opacity).toBe(100);
    expect(result.version).toBe(1);
    expect(result.isDeleted).toBe(false);
    expect(result.locked).toBe(false);
    expect(result.groupIds).toEqual([]);
    expect(result.boundElements).toBeNull();
    expect(result.link).toBeNull();
    expect(result.angle).toBe(0);
  });

  it("adds a positive seed when seed is missing", () => {
    const el = { type: "rectangle", id: "id000001", x: 0, y: 0 };
    const [result] = validateElements([el]);
    expect(result.seed).toBeGreaterThan(0);
  });

  it("deduplicates elements with identical ids by generating a new id", () => {
    const el1 = { type: "rectangle", id: "duplicate", x: 0, y: 0 };
    const el2 = { type: "ellipse", id: "duplicate", x: 200, y: 0 };
    const result = validateElements([el1, el2]);
    expect(result).toHaveLength(2);
    const ids = result.map((e) => e.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("preserves the first occurrence's id when deduplicating", () => {
    const el1 = { type: "rectangle", id: "dup00001", x: 0, y: 0 };
    const el2 = { type: "ellipse", id: "dup00001", x: 200, y: 0 };
    const result = validateElements([el1, el2]);
    expect(result[0].id).toBe("dup00001");
  });

  it("mixed valid and invalid elements — only keeps valid ones", () => {
    const valid = { type: "rectangle", id: "id000001", x: 0, y: 0 };
    const invalid = { type: "unknown", id: "id000002", x: 0, y: 0 };
    const result = validateElements([valid, invalid]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("id000001");
  });
});

// ---------------------------------------------------------------------------
// autoLayout
// ---------------------------------------------------------------------------

function makeShape(id: string, x: number, y: number, w = 160, h = 80): ShapeElement {
  return {
    type: "rectangle",
    id,
    x,
    y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 1,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    roundness: { type: 3 },
  };
}

function makeText(id: string, containerId: string | null, x: number, y: number): TextElement {
  return {
    type: "text",
    id,
    x,
    y,
    width: 100,
    height: 25,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 1,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    text: "label",
    fontSize: 20,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId,
    originalText: "label",
    autoResize: true,
    lineHeight: 1.25,
  };
}

describe("autoLayout", () => {
  it("returns the same elements when there are no overlaps", () => {
    const elements: ExcalidrawElement[] = [
      makeShape("s1", 0, 0),
      makeShape("s2", 400, 0),
      makeShape("s3", 800, 0),
    ];
    const result = autoLayout(elements);
    // Positions should be unchanged
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBe(400);
    expect(result[2].x).toBe(800);
  });

  it("repositions overlapping shapes so they no longer overlap", () => {
    // All three shapes placed at the same coordinates — guaranteed overlap
    const elements: ExcalidrawElement[] = [
      makeShape("s1", 0, 0),
      makeShape("s2", 0, 0),
      makeShape("s3", 0, 0),
    ];
    const result = autoLayout(elements);
    const shapes = result.filter((e) => e.type !== "text" && e.type !== "arrow" && e.type !== "line");

    // No two shapes should overlap after layout
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i];
        const b = shapes[j];
        const overlapping =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlapping).toBe(false);
      }
    }
  });

  it("uses grid layout starting at (100, 100) with expected cell sizes", () => {
    // Two shapes overlapping — forces grid layout
    const elements: ExcalidrawElement[] = [
      makeShape("s1", 0, 0),
      makeShape("s2", 0, 0),
    ];
    const result = autoLayout(elements);
    const shapes = result.filter((e) => e.type !== "text" && e.type !== "arrow" && e.type !== "line");

    // First shape lands at (100, 100)
    expect(shapes[0].x).toBe(100);
    expect(shapes[0].y).toBe(100);
  });

  it("does not move arrows", () => {
    const arrow: ExcalidrawElement = {
      type: "arrow",
      id: "a1",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      seed: 1,
      version: 1,
      isDeleted: false,
      groupIds: [],
      boundElements: null,
      link: null,
      locked: false,
      points: [[0, 0], [100, 100]],
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: "arrow",
      roundness: { type: 2 },
    };
    const s1 = makeShape("s1", 0, 0);
    const s2 = makeShape("s2", 0, 0);
    const elements: ExcalidrawElement[] = [s1, s2, arrow];
    const result = autoLayout(elements);
    const resultArrow = result.find((e) => e.id === "a1")!;
    expect(resultArrow.x).toBe(50);
    expect(resultArrow.y).toBe(50);
  });

  it("updates bound text element position when parent shape is repositioned", () => {
    const shape = makeShape("s1", 0, 0, 160, 80);
    const text = makeText("t1", "s1", 10, 28); // initially at (10, 28) inside s1

    // Second shape to force overlap
    const shape2 = makeShape("s2", 0, 0, 160, 80);

    const elements: ExcalidrawElement[] = [shape, shape2, text];
    const result = autoLayout(elements);
    const resultText = result.find((e) => e.id === "t1") as TextElement;
    const resultShape = result.find((e) => e.id === "s1")!;

    // Text should follow parent shape's new position
    expect(resultText.x).toBe(resultShape.x + 10);
    expect(resultText.y).toBe(resultShape.y + shape.height / 2 - 12);
  });

  it("returns an empty array for empty input", () => {
    expect(autoLayout([])).toEqual([]);
  });

  it("handles single element with no overlap — returns unchanged", () => {
    const elements: ExcalidrawElement[] = [makeShape("s1", 100, 100)];
    const result = autoLayout(elements);
    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(100);
  });

  it("does not move standalone text elements (no containerId) when shapes are repositioned", () => {
    const s1 = makeShape("s1", 0, 0);
    const s2 = makeShape("s2", 0, 0);
    const standaloneText = makeText("t1", null, 500, 500); // no containerId
    const elements: ExcalidrawElement[] = [s1, s2, standaloneText];
    const result = autoLayout(elements);
    const resultText = result.find((e) => e.id === "t1")!;
    // Standalone text is not repositioned
    expect(resultText.x).toBe(500);
    expect(resultText.y).toBe(500);
  });
});
