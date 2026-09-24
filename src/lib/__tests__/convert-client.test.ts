import { describe, it, expect } from "vitest";
import {
  describeHttpFailure,
  describeThrownFailure,
  ENGINE_UNAVAILABLE_MESSAGE,
  validateDocument,
  validatePicture,
  formatBytes,
  formatClock,
  countScene,
  liveElements,
  MAX_UPLOAD_BYTES,
} from "../convert-client";

describe("describeHttpFailure", () => {
  it("maps a generic 500 to the engine-unavailable guidance", () => {
    expect(describeHttpFailure(500, "Internal server error")).toEqual({
      kind: "engine",
      message: ENGINE_UNAVAILABLE_MESSAGE,
    });
  });

  it("maps a 5xx without a body to the engine-unavailable guidance", () => {
    expect(describeHttpFailure(504, null).kind).toBe("engine");
    expect(describeHttpFailure(502, "  ").kind).toBe("engine");
  });

  it("keeps a specific server message on 5xx", () => {
    expect(describeHttpFailure(502, "Claude Agent error: error_max_turns")).toEqual({
      kind: "server",
      message: "Claude Agent error: error_max_turns",
    });
  });

  it("treats 4xx as an input problem and keeps the server message", () => {
    expect(describeHttpFailure(415, "Unsupported image type: image/bmp")).toEqual({
      kind: "input",
      message: "Unsupported image type: image/bmp",
    });
  });

  it("falls back to a status message when a 4xx has no body", () => {
    expect(describeHttpFailure(413, undefined).message).toContain("413");
  });

  it("falls back to a status message for non-error-range statuses without a body", () => {
    expect(describeHttpFailure(302, "")).toEqual({ kind: "server", message: "Conversion failed (302)." });
  });
});

describe("describeThrownFailure", () => {
  const abort = new DOMException("aborted", "AbortError");

  it("reports a user cancel", () => {
    expect(describeThrownFailure(abort, true)).toEqual({ kind: "cancelled", message: "Conversion cancelled." });
  });

  it("reports a timeout when the abort was not the user's", () => {
    expect(describeThrownFailure(abort, false).message).toBe("Conversion timed out. Try simpler or shorter input.");
  });

  it("reports network failures", () => {
    expect(describeThrownFailure(new TypeError("Failed to fetch"), false).kind).toBe("network");
  });

  it("passes other errors through", () => {
    expect(describeThrownFailure(new Error("boom"), false)).toEqual({ kind: "server", message: "boom" });
    expect(describeThrownFailure("weird", false).message).toBe("An unexpected error occurred");
  });
});

describe("upload validation", () => {
  it("accepts supported documents", () => {
    expect(validateDocument({ name: "Notes.MD", size: 10, type: "" })).toBeNull();
  });

  it("rejects unsupported, empty and oversized documents", () => {
    expect(validateDocument({ name: "slides.pdf", size: 10, type: "application/pdf" })).toMatch(/Unsupported format/);
    expect(validateDocument({ name: "empty.txt", size: 0, type: "text/plain" })).toMatch(/empty/);
    expect(validateDocument({ name: "big.csv", size: MAX_UPLOAD_BYTES + 1, type: "text/csv" })).toMatch(/10MB/);
  });

  it("accepts supported pictures and rejects others", () => {
    expect(validatePicture({ name: "a.png", size: 10, type: "image/png" })).toBeNull();
    expect(validatePicture({ name: "a.bmp", size: 10, type: "image/bmp" })).toMatch(/Unsupported format/);
    expect(validatePicture({ name: "a.jpg", size: MAX_UPLOAD_BYTES + 1, type: "image/jpeg" })).toMatch(/10MB/);
  });
});

describe("formatters", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("formats the clock as mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(75)).toBe("01:15");
    expect(formatClock(-3)).toBe("00:00");
  });
});

describe("scene counting", () => {
  const scene = [
    { type: "rectangle" },
    { type: "diamond" },
    { type: "ellipse", isDeleted: true },
    { type: "arrow" },
    { type: "text" },
  ];

  it("ignores deleted elements", () => {
    expect(liveElements(scene)).toHaveLength(4);
  });

  it("counts shapes and arrows", () => {
    expect(countScene(scene)).toEqual({ shapes: 2, arrows: 1 });
  });
});
