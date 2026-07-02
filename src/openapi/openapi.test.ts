import { describe, expect, it } from "vitest";

import openApiDocument from "../../openapi/openapi.json";

const healthOperation = openApiDocument.paths["/api/v1/health"].get;
const okResponse = healthOperation.responses["200"];

describe("initial OpenAPI contract", () => {
  it("declares the canonical OpenAPI identity and version", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");
    expect(openApiDocument["x-contract-id"]).toBe("SBH-OPENAPI-001");
    expect(openApiDocument.info).toMatchObject({
      title: "SmartBuy Backend API",
      version: "0.1.0",
    });
    expect(Object.keys(openApiDocument.paths)).toEqual(["/api/v1/health"]);
  });

  it("documents the public GET health operation", () => {
    expect(healthOperation.operationId).toBe("getHealth");
    expect(healthOperation.security).toEqual([]);
    expect(healthOperation.parameters).toEqual([
      {
        $ref: "#/components/parameters/CorrelationIdHeader",
      },
    ]);
    expect(Object.keys(healthOperation.responses)).toEqual(["200"]);
    expect(openApiDocument.components.parameters.CorrelationIdHeader).toMatchObject({
      name: "x-correlation-id",
      in: "header",
      required: false,
      schema: {
        type: "string",
      },
    });
  });

  it("matches the runtime response payload and headers", () => {
    expect(okResponse.headers).toEqual({
      "cache-control": {
        $ref: "#/components/headers/CacheControlHeader",
      },
      "x-correlation-id": {
        $ref: "#/components/headers/CorrelationIdHeader",
      },
    });
    expect(okResponse.content["application/json"].schema).toEqual({
      $ref: "#/components/schemas/HealthResponse",
    });

    const schemas = openApiDocument.components.schemas;

    expect(schemas.HealthResponse).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["data", "meta"],
    });
    expect(schemas.HealthData).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["service", "status", "checkedAt"],
      properties: {
        service: {
          type: "string",
          const: "smartbuy-backend",
        },
        status: {
          type: "string",
          const: "ok",
        },
        checkedAt: {
          type: "string",
          format: "date-time",
        },
      },
    });
    expect(schemas.ResponseMeta).toMatchObject({
      type: "object",
      additionalProperties: false,
      required: ["correlationId"],
      properties: {
        correlationId: {
          type: "string",
          format: "uuid",
        },
      },
    });
  });
});
