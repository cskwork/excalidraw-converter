import { describe, it, expect } from "vitest";
import { buildSampleSkeleton, samplePositions, SAMPLE_NODES, SAMPLE_TITLE } from "../sample-diagram";

describe("sample diagram", () => {
  it("contains a title, every node and one arrow between consecutive nodes", () => {
    const skeleton = buildSampleSkeleton();
    expect(skeleton[0]).toMatchObject({ type: "text", text: SAMPLE_TITLE });
    const arrows = skeleton.filter((el) => el.type === "arrow");
    expect(arrows).toHaveLength(SAMPLE_NODES.length - 1);
    expect(skeleton).toHaveLength(1 + SAMPLE_NODES.length + arrows.length);
  });

  it("binds each arrow to existing nodes", () => {
    const ids = new Set(SAMPLE_NODES.map((n) => n.id));
    for (const arrow of buildSampleSkeleton().filter((el) => el.type === "arrow")) {
      const start = arrow.start as { id: string };
      const end = arrow.end as { id: string };
      expect(ids.has(start.id)).toBe(true);
      expect(ids.has(end.id)).toBe(true);
    }
  });

  it("lays nodes out as a snake so the row change is a straight drop", () => {
    const positions = samplePositions();
    expect(positions[2].x).toBe(positions[3].x);
    expect(positions[3].y).toBeGreaterThan(positions[2].y);
    expect(positions[5].x).toBe(positions[0].x);
  });

  it("gives node ids unique values", () => {
    expect(new Set(SAMPLE_NODES.map((n) => n.id)).size).toBe(SAMPLE_NODES.length);
  });
});
