// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const queryMock = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({ query: queryMock }));

import { POST } from "../route";

const RECT = {
  type: "rectangle",
  id: "r1",
  x: 0,
  y: 0,
  width: 120,
  height: 60,
};

function agentReplies(...messages: unknown[]) {
  queryMock.mockReturnValue(
    (async function* () {
      for (const m of messages) yield m;
    })(),
  );
}

function post(fields: Record<string, string | File>): Promise<Response> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return POST(new NextRequest("http://localhost/api/convert", { method: "POST", body: form }));
}

describe("POST /api/convert", () => {
  beforeEach(() => {
    queryMock.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects an unknown input type with 400", async () => {
    const res = await post({ type: "video" });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejects blank text with 400", async () => {
    const res = await post({ type: "text", text: "   " });
    expect(res.status).toBe(400);
  });

  it("refuses to call the model when ANTHROPIC_API_KEY is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    const res = await post({ type: "text", text: "a -> b" });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("wraps user text as data and returns validated elements from a fenced JSON reply", async () => {
    agentReplies({
      type: "result",
      subtype: "success",
      result: "Here you go:\n```json\n" + JSON.stringify([RECT]) + "\n```",
    });
    const res = await post({ type: "text", text: "a box" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.elements).toHaveLength(1);
    expect(body.elements[0]).toMatchObject({ type: "rectangle", id: "r1" });
    expect(body.summary).toBe("Generated diagram with 1 shapes and 0 connections (1 total elements)");

    const { prompt, options } = queryMock.mock.calls[0][0];
    expect(prompt).toContain("<user_content>\na box\n</user_content>");
    expect(options).toMatchObject({ maxTurns: 1, allowedTools: [], maxBudgetUsd: 0.25 });
  });

  it("maps an unparsable model reply to 502", async () => {
    agentReplies({ type: "result", subtype: "success", result: "I cannot draw that." });
    const res = await post({ type: "text", text: "a box" });
    expect(res.status).toBe(502);
  });

  it("maps an agent error result to 502", async () => {
    agentReplies({ type: "result", subtype: "error_max_budget_usd" });
    const res = await post({ type: "text", text: "a box" });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("Claude Agent error: error_max_budget_usd");
  });

  it("rejects an image whose bytes do not match its declared type", async () => {
    const fake = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "x.png", { type: "image/png" });
    const res = await post({ type: "image", file: fake });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it.each([
    ["diagram.xml", "text/xml"],
    ["NOTES.MD", ""],
    ["page.html", ""],
  ])("accepts a document the upload panel accepts (%s, type %j)", async (name, type) => {
    agentReplies({ type: "result", subtype: "success", result: JSON.stringify([RECT]) });
    const res = await post({ type: "file", file: new File(["<a/>"], name, { type }) });
    expect(res.status).toBe(200);
  });

  it("still rejects a document format the upload panel rejects", async () => {
    const res = await post({ type: "file", file: new File(["x"], "slides.pdf", { type: "application/pdf" }) });
    expect(res.status).toBe(415);
  });
});
