import { resolveSupabaseConfig } from "../../../config/supabase";
import type { ResolveOperatorSessionDependencies } from "../application/resolve-operator-session";
import { createOperatorProfileRepository } from "./operator-profile-repository";
import { createSupabaseAuthGateway } from "./supabase-auth-gateway";

export function createIdentityDependencies(
  environment: NodeJS.ProcessEnv = process.env,
): ResolveOperatorSessionDependencies {
  const config = resolveSupabaseConfig(environment);

  return {
    authGateway: createSupabaseAuthGateway(config),
    profileRepository: createOperatorProfileRepository(config),
  };
}
