import type { OperatorProfile } from "../domain/operator-session";

export type OperatorProfileLookupResult =
  | Readonly<{
      capabilities: readonly string[];
      profile: OperatorProfile;
      status: "found";
    }>
  | Readonly<{
      status: "not_found";
    }>
  | Readonly<{
      status: "unavailable";
    }>;

export interface OperatorProfileRepository {
  findByUser(
    input: Readonly<{
      accessToken: string;
      userId: string;
    }>,
  ): Promise<OperatorProfileLookupResult>;
}
