import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.info outputs JSON to console.log", () => {
    logger.info("test_event", { key: "value" });

    expect(logSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("test_event");
    expect(parsed.key).toBe("value");
    expect(parsed.timestamp).toBeDefined();
  });

  it("logger.warn outputs JSON to console.warn", () => {
    logger.warn("warn_event");

    expect(warnSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("warn");
    expect(parsed.event).toBe("warn_event");
  });

  it("logger.error outputs JSON to console.error", () => {
    logger.error("error_event", { requestId: "abc" });

    expect(errorSpy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe("error");
    expect(parsed.event).toBe("error_event");
    expect(parsed.requestId).toBe("abc");
  });

  it("serializes Error objects in data.error", () => {
    const err = new Error("something broke");
    logger.error("fail", { error: err });

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed.errorName).toBe("Error");
    expect(parsed.errorMessage).toBe("something broke");
    expect(parsed.stack).toBeDefined();
    // error 키 자체는 제거됨
    expect(parsed.error).toBeUndefined();
  });

  it("serializes non-Error values in data.error", () => {
    logger.error("fail", { error: "string error" });

    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed.errorMessage).toBe("string error");
  });

  it("includes ISO timestamp", () => {
    logger.info("timestamp_test");

    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(() => new Date(parsed.timestamp)).not.toThrow();
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
