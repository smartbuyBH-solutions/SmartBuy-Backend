import { describe, expect, it } from "vitest";

import document from "../../openapi/openapi.json";

describe("OpenAPI contract", () => {
  it("publishes the second approved contract", () => {
    expect(document.openapi).toBe("3.1.0");
    expect(document.info.version).toBe("0.2.0");
    expect(document.info["x-contract-id"]).toBe("SBH-OPENAPI-002");
  });

  it("publishes only approved routes", () => {
    expect(Object.keys(document.paths).sort()).toEqual(["/api/v1/health", "/api/v1/session"]);
  });

  it("protects the session operation with bearer authentication", () => {
    const operation = document.paths["/api/v1/session"].get;

    expect(operation.security).toEqual([
      {
        bearerAuth: [],
      },
    ]);

    expect(document.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: "Supabase Auth access token.",
    });
  });

  it("documents the complete session response matrix", () => {
    const responses = document.paths["/api/v1/session"].get.responses;

    expect(Object.keys(responses).sort()).toEqual(["200", "401", "403", "503"]);

    expect(responses["401"].headers["WWW-Authenticate"]).toEqual({
      $ref: "#/components/headers/BearerChallenge",
    });

    expect(responses["403"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/AccessErrorResponse",
    });

    expect(responses["503"].content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/AvailabilityErrorResponse",
    });
  });

  it("documents correlation and non-cacheable session responses", () => {
    const responses = document.paths["/api/v1/session"].get.responses;

    for (const response of Object.values(responses)) {
      expect(response.headers["Cache-Control"]).toEqual({
        $ref: "#/components/headers/NoStore",
      });

      expect(response.headers["X-Correlation-ID"]).toEqual({
        $ref: "#/components/headers/CorrelationId",
      });
    }
  });

  it("does not expose secret credentials or internal denial reasons", () => {
    const serialized = JSON.stringify(document);

    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("sb_secret_");
    expect(serialized).not.toContain("profile_inactive");
    expect(serialized).not.toContain("capability_missing");
  });
});
