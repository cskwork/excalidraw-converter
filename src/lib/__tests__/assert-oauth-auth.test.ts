import { describe, it, expect, vi, afterEach } from "vitest";
import { assertOAuthAuth } from "../assert-oauth-auth";

describe("assertOAuthAuth", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws when ANTHROPIC_API_KEY is set", () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: "sk-ant-test-key" };

    expect(() => assertOAuthAuth()).toThrowError(
      /ANTHROPIC_API_KEY.*OAuth/i,
    );
  });

  it("throws with an actionable message mentioning unset", () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: "any-value" };

    expect(() => assertOAuthAuth()).toThrowError(/unset/i);
  });

  it("does not throw when ANTHROPIC_API_KEY is absent", () => {
    process.env = { ...originalEnv };
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => assertOAuthAuth()).not.toThrow();
  });

  it("does not throw when ANTHROPIC_API_KEY is empty string", () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: "" };

    expect(() => assertOAuthAuth()).not.toThrow();
  });
});
