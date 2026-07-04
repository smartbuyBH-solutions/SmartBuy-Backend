import {
  ACTIVE_OPERATOR_STATUS,
  ERP_ACCESS_CAPABILITY,
  OPERATOR_ROLE,
  type OperatorSession,
} from "../domain/operator-session";
import type { AuthGateway } from "./auth-gateway";
import type { OperatorProfileRepository } from "./operator-profile-repository";

export type ResolveOperatorSessionDependencies = Readonly<{
  authGateway: AuthGateway;
  profileRepository: OperatorProfileRepository;
}>;

export type ResolveOperatorSessionResult =
  | Readonly<{
      session: OperatorSession;
      status: "authenticated";
    }>
  | Readonly<{
      status: "unauthenticated";
    }>
  | Readonly<{
      status: "profile_not_found";
    }>
  | Readonly<{
      status: "profile_inactive";
    }>
  | Readonly<{
      status: "role_not_allowed";
    }>
  | Readonly<{
      status: "capability_missing";
    }>
  | Readonly<{
      status: "dependency_unavailable";
    }>;

export async function resolveOperatorSession(
  accessToken: string,
  dependencies: ResolveOperatorSessionDependencies,
): Promise<ResolveOperatorSessionResult> {
  const authResult = await dependencies.authGateway.verifyAccessToken(accessToken);

  if (authResult.status === "unauthenticated") {
    return {
      status: "unauthenticated",
    };
  }

  if (authResult.status === "unavailable") {
    return {
      status: "dependency_unavailable",
    };
  }

  const profileResult = await dependencies.profileRepository.findByUser({
    accessToken,
    userId: authResult.userId,
  });

  if (profileResult.status === "not_found") {
    return {
      status: "profile_not_found",
    };
  }

  if (profileResult.status === "unavailable") {
    return {
      status: "dependency_unavailable",
    };
  }

  if (profileResult.profile.status !== ACTIVE_OPERATOR_STATUS) {
    return {
      status: "profile_inactive",
    };
  }

  if (profileResult.profile.role !== OPERATOR_ROLE) {
    return {
      status: "role_not_allowed",
    };
  }

  if (!profileResult.capabilities.includes(ERP_ACCESS_CAPABILITY)) {
    return {
      status: "capability_missing",
    };
  }

  return {
    status: "authenticated",
    session: {
      capabilities: profileResult.capabilities,
      displayName: profileResult.profile.displayName,
      role: profileResult.profile.role,
      userId: profileResult.profile.userId,
    },
  };
}
