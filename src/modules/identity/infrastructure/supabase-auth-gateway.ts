import type { SupabaseConfig } from "../../../config/supabase";
import type { AuthGateway } from "../application/auth-gateway";
import { createSupabaseClient, type SupabaseClientFactory } from "./create-supabase-client";

function isServiceFailure(status: number | undefined): boolean {
  return status !== undefined && status >= 500;
}

export function createSupabaseAuthGateway(
  config: SupabaseConfig,
  clientFactory: SupabaseClientFactory = createSupabaseClient,
): AuthGateway {
  const client = clientFactory(config);

  return {
    async verifyAccessToken(accessToken) {
      try {
        const { data, error } = await client.auth.getUser(accessToken);

        if (error) {
          return {
            status: isServiceFailure(error.status) ? "unavailable" : "unauthenticated",
          };
        }

        if (!data.user) {
          return {
            status: "unauthenticated",
          };
        }

        return {
          email: data.user.email ?? null,
          status: "authenticated",
          userId: data.user.id,
        };
      } catch {
        return {
          status: "unavailable",
        };
      }
    },
  };
}
