import { describe, expect, it } from "vitest";

import type { AuthGateway, AuthGatewayResult } from "./auth-gateway";
import type {
  OperatorProfileLookupResult,
  OperatorProfileRepository,
} from "./operator-profile-repository";
import { resolveOperatorSession } from "./resolve-operator-session";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function createDependencies(input: {
  authResult: AuthGatewayResult;
  profileResult: OperatorProfileLookupResult;
}) {
  const authGateway: AuthGateway = {
    async verifyAccessToken() {
      return input.authResult;
    },
  };

  const profileRepository: OperatorProfileRepository = {
    async findByUser() {
      return input.profileResult;
    },
  };

  return {
    authGateway,
    profileRepository,
  };
}

const AUTHENTICATED = {
  email: "operator@example.test",
  status: "authenticated",
  userId: USER_ID,
} as const;

const ACTIVE_PROFILE = {
  capabilities: ["overview:read"],
  profile: {
    displayName: "Operator",
    role: "operator",
    status: "active",
    userId: USER_ID,
  },
  status: "found",
} as const;

describe("operator session resolution", () => {
  it("returns an authorized operational session", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: ACTIVE_PROFILE,
        }),
      ),
    ).resolves.toEqual({
      session: {
        capabilities: ["overview:read"],
        displayName: "Operator",
        role: "operator",
        userId: USER_ID,
      },
      status: "authenticated",
    });
  });

  it("rejects an invalid identity", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: {
            status: "unauthenticated",
          },
          profileResult: ACTIVE_PROFILE,
        }),
      ),
    ).resolves.toEqual({
      status: "unauthenticated",
    });
  });

  it("rejects a missing profile", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: {
            status: "not_found",
          },
        }),
      ),
    ).resolves.toEqual({
      status: "profile_not_found",
    });
  });

  it("rejects an inactive profile", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: {
            ...ACTIVE_PROFILE,
            profile: {
              ...ACTIVE_PROFILE.profile,
              status: "inactive",
            },
          },
        }),
      ),
    ).resolves.toEqual({
      status: "profile_inactive",
    });
  });

  it("rejects an unsupported role", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: {
            ...ACTIVE_PROFILE,
            profile: {
              ...ACTIVE_PROFILE.profile,
              role: "administrator",
            },
          },
        }),
      ),
    ).resolves.toEqual({
      status: "role_not_allowed",
    });
  });

  it("rejects a missing access capability", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: {
            ...ACTIVE_PROFILE,
            capabilities: [],
          },
        }),
      ),
    ).resolves.toEqual({
      status: "capability_missing",
    });
  });

  it("maps an unavailable Auth service", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: {
            status: "unavailable",
          },
          profileResult: ACTIVE_PROFILE,
        }),
      ),
    ).resolves.toEqual({
      status: "dependency_unavailable",
    });
  });

  it("maps an unavailable profile repository", async () => {
    await expect(
      resolveOperatorSession(
        "access-token",
        createDependencies({
          authResult: AUTHENTICATED,
          profileResult: {
            status: "unavailable",
          },
        }),
      ),
    ).resolves.toEqual({
      status: "dependency_unavailable",
    });
  });
});
