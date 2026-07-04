import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { SupabaseConfig } from "../../../config/supabase";

export type SupabaseClientFactory = (
  config: SupabaseConfig,
  accessToken?: string,
) => SupabaseClient;

export function createSupabaseClient(config: SupabaseConfig, accessToken?: string): SupabaseClient {
  const authOptions = {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  };

  if (accessToken) {
    return createClient(config.url, config.publishableKey, {
      auth: authOptions,
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  return createClient(config.url, config.publishableKey, {
    auth: authOptions,
  });
}
