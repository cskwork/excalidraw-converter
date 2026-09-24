/**
 * A bundled sample diagram (Excalidraw element skeletons) describing how this
 * app works. It lets visitors try the editor without running a conversion,
 * which matters on the hosted demo where the Claude engine is unavailable.
 *
 * Skeletons are expanded into full elements with Excalidraw's
 * `convertToExcalidrawElements` in the browser.
 */

export interface SampleNode {
  readonly id: string;
  readonly label: string;
  readonly fill: string;
  readonly shape: "rectangle" | "ellipse" | "diamond";
}

export const SAMPLE_TITLE = "Sample: how Excalidraw Converter works";

export const SAMPLE_NODES: readonly SampleNode[] = [
  { id: "sample-input", label: "Your input\ntext, file or image", fill: "#ffec99", shape: "rectangle" },
  { id: "sample-route", label: "/api/convert", fill: "#e9ecef", shape: "rectangle" },
  { id: "sample-agent", label: "Claude Agent SDK\nwrites elements", fill: "#ffd8a8", shape: "rectangle" },
  { id: "sample-valid", label: "Valid\nelements?", fill: "#d0bfff", shape: "diamond" },
  { id: "sample-layout", label: "Auto layout", fill: "#a5d8ff", shape: "rectangle" },
  { id: "sample-editor", label: "Excalidraw editor\nfully editable", fill: "#b2f2bb", shape: "ellipse" },
];

const NODE_WIDTH = 210;
const NODE_HEIGHT = 96;
const GAP_X = 90;
const ROW_GAP_Y = 120;
const PER_ROW = 3;

/**
 * Snake layout: three nodes per row, the first row left to right and the next
 * right to left, so every arrow is a short straight segment.
 */
export function samplePositions(): ReadonlyArray<{ readonly id: string; readonly x: number; readonly y: number }> {
  return SAMPLE_NODES.map((node, index) => {
    const row = Math.floor(index / PER_ROW);
    const step = index % PER_ROW;
    const col = row % 2 === 0 ? step : PER_ROW - 1 - step;
    return { id: node.id, x: col * (NODE_WIDTH + GAP_X), y: 90 + row * (NODE_HEIGHT + ROW_GAP_Y) };
  });
}

type Skeleton = Record<string, unknown>;

/** Element skeletons ready for `convertToExcalidrawElements`. */
export function buildSampleSkeleton(): Skeleton[] {
  const positions = samplePositions();
  const skeletons: Skeleton[] = [
    {
      type: "text",
      id: "sample-title",
      x: 0,
      y: 0,
      text: SAMPLE_TITLE,
      fontSize: 28,
      strokeColor: "#1e1e1e",
    },
  ];

  SAMPLE_NODES.forEach((node, index) => {
    const pos = positions[index];
    skeletons.push({
      type: node.shape,
      id: node.id,
      x: pos.x,
      y: pos.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      backgroundColor: node.fill,
      fillStyle: "solid",
      strokeColor: "#1e1e1e",
      strokeWidth: 2,
      roughness: 1,
      label: { text: node.label, fontSize: 20 },
    });
  });

  for (let i = 0; i < SAMPLE_NODES.length - 1; i += 1) {
    const from = positions[i];
    const to = positions[i + 1];
    const sameRow = Math.abs(from.y - to.y) < 1;
    const rightward = to.x > from.x;
    const start = !sameRow
      ? { x: from.x + NODE_WIDTH / 2, y: from.y + NODE_HEIGHT }
      : { x: rightward ? from.x + NODE_WIDTH : from.x, y: from.y + NODE_HEIGHT / 2 };
    const end = !sameRow
      ? { x: to.x + NODE_WIDTH / 2, y: to.y }
      : { x: rightward ? to.x : to.x + NODE_WIDTH, y: to.y + NODE_HEIGHT / 2 };
    const arrow: Skeleton = {
      type: "arrow",
      id: `sample-arrow-${i}`,
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
      points: [
        [0, 0],
        [end.x - start.x, end.y - start.y],
      ],
      strokeColor: "#1e1e1e",
      strokeWidth: 2,
      start: { id: SAMPLE_NODES[i].id },
      end: { id: SAMPLE_NODES[i + 1].id },
    };
    if (SAMPLE_NODES[i].id === "sample-valid") arrow.label = { text: "yes" };
    skeletons.push(arrow);
  }

  return skeletons;
}
