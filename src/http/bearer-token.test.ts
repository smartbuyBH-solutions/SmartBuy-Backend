import { describe, expect, it } from "vitest";

import { parseBearerToken } from "./bearer-token";

describe("Bearer token parsing", () => {
  it("reports a missing authorization header", () => {
    expect(parseBearerToken(new Headers())).toEqual({
      status: "missing",
    });
  });

  it("extracts a valid bearer token", () => {
    const headers = new Headers({
      authorization: "Bearer access-token",
    });

    expect(parseBearerToken(headers)).toEqual({
      status: "valid",
      token: "access-token",
    });
  });

  it("accepts a case-insensitive scheme", () => {
    const headers = new Headers({
      authorization: "bearer access-token",
    });

    expect(parseBearerToken(headers)).toEqual({
      status: "valid",
      token: "access-token",
    });
  });

  it("rejects another authorization scheme", () => {
    const headers = new Headers({
      authorization: "Basic credential",
    });

    expect(parseBearerToken(headers)).toEqual({
      status: "invalid",
    });
  });

  it("rejects malformed whitespace", () => {
    const headers = new Headers({
      authorization: "Bearer token with spaces",
    });

    expect(parseBearerToken(headers)).toEqual({
      status: "invalid",
    });
  });
});
