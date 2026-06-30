export const dynamic = "force-dynamic";

const SERVICE_NAME = "smartbuy-backend";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveCorrelationId(request: Request): string {
  const receivedCorrelationId = request.headers
    .get("x-correlation-id")
    ?.trim();

  if (
    receivedCorrelationId &&
    UUID_PATTERN.test(receivedCorrelationId)
  ) {
    return receivedCorrelationId;
  }

  return crypto.randomUUID();
}

export function GET(request: Request): Response {
  const correlationId = resolveCorrelationId(request);

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