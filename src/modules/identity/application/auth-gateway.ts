export type AuthGatewayResult =
  | Readonly<{
      email: string | null;
      status: "authenticated";
      userId: string;
    }>
  | Readonly<{
      status: "unauthenticated";
    }>
  | Readonly<{
      status: "unavailable";
    }>;

export interface AuthGateway {
  verifyAccessToken(accessToken: string): Promise<AuthGatewayResult>;
}
