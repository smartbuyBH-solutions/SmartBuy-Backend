import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/v1/session", () => {
  it("exposes a protected endpoint", async () => {
    const response = await GET(new Request("http://localhost/api/v1/session"));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
      },
    });
  });
});
