import { describe, expect, it } from "vitest";

import type { ResolveOperatorSessionResult } from "../application/resolve-operator-session";
import { createSessionHandler, type OperatorSessionResolver } from "./session-handler";

const REQUEST_URL = "http://localhost/api/v1/session";

const CORRELATION_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const AUTHENTICATED_RESULT = {
  session: {
    capabilities: ["overview:read"],
    displayName: "Operator",
    role: "operator",
    userId: "11111111-1111-4111-8111-111111111111",
  },
  status: "authenticated",
} as const;

const FORBIDDEN_CASES: ReadonlyArray<readonly [string, ResolveOperatorSessionResult]> = [
  [
    "missing profile",
    {
      status: "profile_not_found",
    },
  ],
  [
    "inactive profile",
    {
      status: "profile_inactive",
    },
  ],
  [
    "unsupported role",
    {
      status: "role_not_allowed",
    },
  ],
  [
    "missing capability",
    {
      status: "capability_missing",
    },
  ],
];

function createRequest(authorization?: string): Request {
  const headers = new Headers({
    "x-correlation-id": CORRELATION_ID,
  });

  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request(REQUEST_URL, {
    headers,
  });
}

function createResolver(result: ResolveOperatorSessionResult): OperatorSessionResolver {
  return async () => result;
}

describe("protected session handler", () => {
  it("returns the authorized session", async () => {
    const handler = createSessionHandler(createResolver(AUTHENTICATED_RESULT));

    const response = await handler(createRequest("Bearer access-token"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe(CORRELATION_ID);
    expect(response.headers.get("vary")).toBe("authorization");

    await expect(response.json()).resolves.toEqual({
      data: {
        capabilities: ["overview:read"],
        displayName: "Operator",
        role: "operator",
        userId: "11111111-1111-4111-8111-111111111111",
      },
      meta: {
        correlationId: CORRELATION_ID,
      },
    });
  });

  it("rejects a missing bearer token without resolving a session", async () => {
    let resolverCalls = 0;

    const handler = createSessionHandler(async () => {
      resolverCalls += 1;

      return AUTHENTICATED_RESULT;
    });

    const response = await handler(createRequest());

    expect(response.status).toBe(401);
    expect(resolverCalls).toBe(0);
    expect(response.headers.get("www-authenticate")).toBe('Bearer realm="smartbuy-backend"');

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
      meta: {
        correlationId: CORRELATION_ID,
      },
    });
  });

  it("rejects a malformed bearer token without resolving a session", async () => {
    let resolverCalls = 0;

    const handler = createSessionHandler(async () => {
      resolverCalls += 1;

      return AUTHENTICATED_RESULT;
    });

    const response = await handler(createRequest("Basic credential"));

    expect(response.status).toBe(401);
    expect(resolverCalls).toBe(0);
  });

  it("maps an unauthenticated identity to 401", async () => {
    const handler = createSessionHandler(
      createResolver({
        status: "unauthenticated",
      }),
    );

    const response = await handler(createRequest("Bearer invalid-token"));

    expect(response.status).toBe(401);

    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
      },
    });
  });

  it.each(FORBIDDEN_CASES)("maps %s to a generic 403 response", async (_description, result) => {
    const handler = createSessionHandler(createResolver(result));

    const response = await handler(createRequest("Bearer access-token"));

    expect(response.status).toBe(403);
    expect(response.headers.has("www-authenticate")).toBe(false);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "ACCESS_DENIED",
        message: "Access is denied.",
      },
      meta: {
        correlationId: CORRELATION_ID,
      },
    });
  });

  it("maps an unavailable dependency to 503", async () => {
    const handler = createSessionHandler(
      createResolver({
        status: "dependency_unavailable",
      }),
    );

    const response = await handler(createRequest("Bearer access-token"));

    expect(response.status).toBe(503);

    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "IDENTITY_SERVICE_UNAVAILABLE",
      },
    });
  });

  it("maps an unexpected resolver failure to 503", async () => {
    const handler = createSessionHandler(async () => {
      throw new Error("Unexpected failure");
    });

    const response = await handler(createRequest("Bearer access-token"));

    expect(response.status).toBe(503);

    const serializedBody = JSON.stringify(await response.json());

    expect(serializedBody).not.toContain("Unexpected failure");
    expect(serializedBody).not.toContain("access-token");
  });
});
