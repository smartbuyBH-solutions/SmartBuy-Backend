import type { SupabaseConfig } from "../../../config/supabase";
import type { OperatorProfileRepository } from "../application/operator-profile-repository";
import { createSupabaseClient, type SupabaseClientFactory } from "./create-supabase-client";

type OperatorProfileRow = {
  display_name: string;
  role_code: string;
  status: string;
  user_id: string;
};

type OperatorCapabilityRow = {
  capability_code: string;
};

export function createOperatorProfileRepository(
  config: SupabaseConfig,
  clientFactory: SupabaseClientFactory = createSupabaseClient,
): OperatorProfileRepository {
  return {
    async findByUser(input) {
      try {
        const client = clientFactory(config, input.accessToken);

        const profileResult = await client
          .from("operator_profiles")
          .select("user_id,display_name,role_code,status")
          .eq("user_id", input.userId)
          .maybeSingle();

        if (profileResult.error) {
          return {
            status: "unavailable",
          };
        }

        const profile = profileResult.data as OperatorProfileRow | null;

        if (!profile) {
          return {
            status: "not_found",
          };
        }

        const capabilityResult = await client
          .from("operator_capabilities")
          .select("capability_code")
          .eq("user_id", input.userId)
          .order("capability_code", {
            ascending: true,
          });

        if (capabilityResult.error) {
          return {
            status: "unavailable",
          };
        }

        const capabilityRows = (capabilityResult.data ?? []) as OperatorCapabilityRow[];

        return {
          capabilities: capabilityRows.map((row) => row.capability_code),
          profile: {
            displayName: profile.display_name,
            role: profile.role_code,
            status: profile.status,
            userId: profile.user_id,
          },
          status: "found",
        };
      } catch {
        return {
          status: "unavailable",
        };
      }
    },
  };
}
