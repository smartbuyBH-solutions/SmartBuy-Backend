import { describe, expect, it } from "vitest";

import { GET } from "./route";

const VALID_CORRELATION_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HealthPayload = Readonly<{
  data: Readonly<{
    service: string;
    status: string;
    checkedAt: string;
  }>;
  meta: Readonly<{
    correlationId: string;
  }>;
}>;

async function readHealthPayload(response: Response): Promise<HealthPayload> {
  return (await response.json()) as HealthPayload;
}

describe("GET /api/v1/health", () => {
  it("returns operational status and preserves a valid correlation ID", async () => {
    const request = new Request("http://localhost/api/v1/health", {
      headers: {
        "x-correlation-id": VALID_CORRELATION_ID,
      },
    });

    const response = GET(request);
    const payload = await readHealthPayload(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe(VALID_CORRELATION_ID);
    expect(payload).toMatchObject({
      data: {
        service: "smartbuy-backend",
        status: "ok",
      },
      meta: {
        correlationId: VALID_CORRELATION_ID,
      },
    });
    expect(Date.parse(payload.data.checkedAt)).not.toBeNaN();
  });

  it("replaces an invalid correlation ID with a generated UUID", async () => {
    const request = new Request("http://localhost/api/v1/health", {
      headers: {
        "x-correlation-id": "invalid-correlation-id",
      },
    });

    const response = GET(request);
    const payload = await readHealthPayload(response);
    const generatedCorrelationId = response.headers.get("x-correlation-id");

    if (generatedCorrelationId === null) {
      throw new Error("The response did not expose a correlation ID.");
    }

    expect(response.status).toBe(200);
    expect(generatedCorrelationId).not.toBe("invalid-correlation-id");
    expect(generatedCorrelationId).toMatch(UUID_PATTERN);
    expect(payload.meta.correlationId).toBe(generatedCorrelationId);
  });
});
