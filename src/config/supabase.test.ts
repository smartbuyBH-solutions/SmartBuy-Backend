import { describe, expect, it } from "vitest";

import { resolveSupabaseConfig } from "./supabase";

describe("Supabase configuration", () => {
  it("normalizes an approved HTTP origin", () => {
    expect(
      resolveSupabaseConfig({
        SUPABASE_URL: " http://127.0.0.1:54321/ ",
        SUPABASE_PUBLISHABLE_KEY: " local-publishable-key ",
      }),
    ).toEqual({
      publishableKey: "local-publishable-key",
      url: "http://127.0.0.1:54321",
    });
  });

  it("rejects a URL containing a path", () => {
    expect(() =>
      resolveSupabaseConfig({
        SUPABASE_URL: "https://example.test/project",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toThrow("Invalid Supabase configuration.");
  });

  it("rejects missing configuration without exposing values", () => {
    expect(() => resolveSupabaseConfig({})).toThrow("Invalid Supabase configuration.");
  });
});
