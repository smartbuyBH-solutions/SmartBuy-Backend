import { parseBearerToken } from "../../../http/bearer-token";
import { resolveCorrelationId } from "../../../http/correlation-id";
import {
  resolveOperatorSession,
  type ResolveOperatorSessionResult,
} from "../application/resolve-operator-session";
import { createIdentityDependencies } from "../infrastructure/identity-dependencies";

export type OperatorSessionResolver = (
  accessToken: string,
) => Promise<ResolveOperatorSessionResult>;

const AUTHENTICATION_ERROR = {
  code: "AUTHENTICATION_REQUIRED",
  message: "Authentication is required.",
} as const;

const ACCESS_ERROR = {
  code: "ACCESS_DENIED",
  message: "Access is denied.",
} as const;

const AVAILABILITY_ERROR = {
  code: "IDENTITY_SERVICE_UNAVAILABLE",
  message: "The identity service is temporarily unavailable.",
} as const;

function createResponseHeaders(correlationId: string, authenticationRequired = false): Headers {
  const headers = new Headers({
    "cache-control": "no-store",
    vary: "authorization",
    "x-correlation-id": correlationId,
  });

  if (authenticationRequired) {
    headers.set("www-authenticate", 'Bearer realm="smartbuy-backend"');
  }

  return headers;
}

function createJsonResponse(
  body: unknown,
  status: number,
  correlationId: string,
  authenticationRequired = false,
): Response {
  return Response.json(body, {
    status,
    headers: createResponseHeaders(correlationId, authenticationRequired),
  });
}

function createErrorResponse(
  error: typeof AUTHENTICATION_ERROR | typeof ACCESS_ERROR | typeof AVAILABILITY_ERROR,
  status: number,
  correlationId: string,
): Response {
  return createJsonResponse(
    {
      error,
      meta: {
        correlationId,
      },
    },
    status,
    correlationId,
    status === 401,
  );
}

async function resolveDefaultSession(accessToken: string): Promise<ResolveOperatorSessionResult> {
  const dependencies = createIdentityDependencies();

  return resolveOperatorSession(accessToken, dependencies);
}

function mapResolvedSession(result: ResolveOperatorSessionResult, correlationId: string): Response {
  switch (result.status) {
    case "authenticated":
      return createJsonResponse(
        {
          data: {
            capabilities: result.session.capabilities,
            displayName: result.session.displayName,
            role: result.session.role,
            userId: result.session.userId,
          },
          meta: {
            correlationId,
          },
        },
        200,
        correlationId,
      );

    case "unauthenticated":
      return createErrorResponse(AUTHENTICATION_ERROR, 401, correlationId);

    case "dependency_unavailable":
      return createErrorResponse(AVAILABILITY_ERROR, 503, correlationId);

    case "profile_not_found":
    case "profile_inactive":
    case "role_not_allowed":
    case "capability_missing":
      return createErrorResponse(ACCESS_ERROR, 403, correlationId);
  }
}

export function createSessionHandler(resolver: OperatorSessionResolver = resolveDefaultSession) {
  return async function GET(request: Request): Promise<Response> {
    const correlationId = resolveCorrelationId(request.headers);

    const bearerToken = parseBearerToken(request.headers);

    if (bearerToken.status !== "valid") {
      return createErrorResponse(AUTHENTICATION_ERROR, 401, correlationId);
    }

    try {
      const result = await resolver(bearerToken.token);

      return mapResolvedSession(result, correlationId);
    } catch {
      return createErrorResponse(AVAILABILITY_ERROR, 503, correlationId);
    }
  };
}
