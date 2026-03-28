import crypto from "crypto";
import type {
  ExcalidrawElement,
  ShapeElement,
  TextElement,
  ArrowElement,
  ElementType,
} from "@/types/excalidraw";

export function generateId(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 8);
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2_000_000_000) + 1;
}

export function createRectangle(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color = "#a5d8ff"
): readonly [ShapeElement, TextElement] {
  const textId = generateId();
  const rect: ShapeElement = {
    type: "rectangle",
    id,
    x,
    y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: color,
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: randomSeed(),
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: [{ id: textId, type: "text" }],
    link: null,
    locked: false,
    roundness: { type: 3 },
  };

  const text: TextElement = {
    type: "text",
    id: textId,
    x: x + 10,
    y: y + h / 2 - 12,
    width: w - 20,
    height: 25,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: randomSeed(),
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    text: label,
    fontSize: 20,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: id,
    originalText: label,
    autoResize: true,
    lineHeight: 1.25,
  };

  return [rect, text] as const;
}

export function createText(
  id: string,
  x: number,
  y: number,
  text: string,
  fontSize = 20
): TextElement {
  return {
    type: "text",
    id,
    x,
    y,
    width: text.length * 10,
    height: fontSize * 1.25,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: randomSeed(),
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    text,
    fontSize,
    fontFamily: 1,
    textAlign: "left",
    verticalAlign: "top",
    containerId: null,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  };
}

export function createArrow(
  id: string,
  startId: string,
  endId: string,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): ArrowElement {
  const dx = endX - startX;
  const dy = endY - startY;
  return {
    type: "arrow",
    id,
    x: startX,
    y: startY,
    width: Math.abs(dx),
    height: Math.abs(dy),
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: randomSeed(),
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    points: [
      [0, 0],
      [dx, dy],
    ],
    startBinding: { elementId: startId, focus: 0, gap: 8 },
    endBinding: { elementId: endId, focus: 0, gap: 8 },
    startArrowhead: null,
    endArrowhead: "arrow",
    roundness: { type: 2 },
  };
}

const VALID_TYPES: ReadonlySet<ElementType> = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "text",
  "arrow",
  "line",
]);

function isValidElement(el: unknown): el is Record<string, unknown> {
  if (typeof el !== "object" || el === null) return false;
  const obj = el as Record<string, unknown>;
  return (
    typeof obj.type === "string" &&
    VALID_TYPES.has(obj.type as ElementType) &&
    typeof obj.id === "string" &&
    typeof obj.x === "number" &&
    typeof obj.y === "number"
  );
}

function withDefaults(el: Record<string, unknown>): ExcalidrawElement {
  const base = {
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid" as const,
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: randomSeed(),
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    width: (el.width as number) ?? 160,
    height: (el.height as number) ?? 80,
    ...el,
  };

  return base as unknown as ExcalidrawElement;
}

export function validateElements(elements: unknown[]): ExcalidrawElement[] {
  const seen = new Set<string>();
  const valid: ExcalidrawElement[] = [];

  for (const el of elements) {
    if (!isValidElement(el)) continue;

    // Deduplicate IDs without mutating input
    const resolvedId = seen.has(el.id as string) ? generateId() : (el.id as string);
    seen.add(resolvedId);

    valid.push(withDefaults({ ...el, id: resolvedId }));
  }

  return valid;
}

interface PositionedElement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function overlaps(a: PositionedElement, b: PositionedElement): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function autoLayout(elements: ExcalidrawElement[]): ExcalidrawElement[] {
  const shapes = elements.filter(
    (el) =>
      el.type !== "text" &&
      el.type !== "arrow" &&
      el.type !== "line"
  );

  // Check for overlapping shapes
  let hasOverlap = false;
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      if (overlaps(shapes[i], shapes[j])) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) break;
  }

  if (!hasOverlap) return elements;

  // Re-layout shapes in a grid
  const cols = Math.ceil(Math.sqrt(shapes.length));
  const cellW = 360;
  const cellH = 230;
  const startX = 100;
  const startY = 100;

  const positionMap = new Map<string, { x: number; y: number }>();

  const repositionedShapes = shapes.map((shape, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const newX = startX + col * cellW;
    const newY = startY + row * cellH;
    positionMap.set(shape.id, { x: newX, y: newY });
    return { ...shape, x: newX, y: newY };
  });

  // Rebuild full list with updated positions
  return elements.map((el) => {
    if (el.type !== "text" && el.type !== "arrow" && el.type !== "line") {
      const pos = positionMap.get(el.id);
      if (pos) return { ...el, x: pos.x, y: pos.y };
    }

    // Update bound text positions
    if (el.type === "text" && "containerId" in el) {
      const containerId = (el as unknown as { containerId: string | null }).containerId;
      if (containerId && positionMap.has(containerId)) {
        const parentPos = positionMap.get(containerId)!;
        const parent = repositionedShapes.find((s) => s.id === containerId);
        if (parent) {
          return {
            ...el,
            x: parentPos.x + 10,
            y: parentPos.y + parent.height / 2 - 12,
          };
        }
      }
    }

    return el;
  });
}
