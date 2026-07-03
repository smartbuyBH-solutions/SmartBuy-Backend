export const OPERATOR_ROLE = "operator";

export const ACTIVE_OPERATOR_STATUS = "active";

export const ERP_ACCESS_CAPABILITY = "overview:read";

export type OperatorProfile = Readonly<{
  displayName: string;
  role: string;
  status: string;
  userId: string;
}>;

export type OperatorSession = Readonly<{
  capabilities: readonly string[];
  displayName: string;
  role: string;
  userId: string;
}>;
