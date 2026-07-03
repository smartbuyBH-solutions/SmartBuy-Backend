import { describe, expect, it } from "vitest";

import { resolveCorrelationId } from "./correlation-id";

const VALID_CORRELATION_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("correlation ID resolution", () => {
  it("preserves a valid identifier", () => {
    const headers = new Headers({
      "x-correlation-id": VALID_CORRELATION_ID,
    });

    expect(resolveCorrelationId(headers)).toBe(VALID_CORRELATION_ID);
  });

  it("generates an identifier when absent", () => {
    expect(resolveCorrelationId(new Headers())).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("replaces an invalid identifier", () => {
    const headers = new Headers({
      "x-correlation-id": "invalid",
    });

    expect(resolveCorrelationId(headers)).not.toBe("invalid");
  });
});
