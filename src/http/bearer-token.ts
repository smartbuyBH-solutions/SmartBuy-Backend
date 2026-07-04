const BEARER_PATTERN = /^Bearer ([^\s]+)$/i;

export type BearerTokenResult =
  | Readonly<{
      status: "valid";
      token: string;
    }>
  | Readonly<{
      status: "missing";
    }>
  | Readonly<{
      status: "invalid";
    }>;

export function parseBearerToken(headers: Headers): BearerTokenResult {
  const authorization = headers.get("authorization");

  if (authorization === null) {
    return {
      status: "missing",
    };
  }

  const match = BEARER_PATTERN.exec(authorization.trim());

  if (!match?.[1]) {
    return {
      status: "invalid",
    };
  }

  return {
    status: "valid",
    token: match[1],
  };
}
