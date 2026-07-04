import { resolveCorrelationId } from "../../../../http/correlation-id";

const SERVICE_NAME = "smartbuy-backend";

export function GET(request: Request): Response {
  const correlationId = resolveCorrelationId(request.headers);

  return Response.json(
    {
      data: {
        service: SERVICE_NAME,
        status: "ok",
        checkedAt: new Date().toISOString(),
      },
      meta: {
        correlationId,
      },
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-correlation-id": correlationId,
      },
    },
  );
}
