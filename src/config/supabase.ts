import { z } from "zod";

const httpOriginSchema = z
  .string()
  .trim()
  .url()
  .superRefine((value, context) => {
    const url = new URL(value);

    const isHttpProtocol = url.protocol === "http:" || url.protocol === "https:";

    const isOriginOnly =
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.pathname === "/" &&
      url.search.length === 0 &&
      url.hash.length === 0;

    if (!isHttpProtocol || !isOriginOnly) {
      context.addIssue({
        code: "custom",
        message: "Expected an HTTP(S) origin.",
      });
    }
  })
  .transform((value) => new URL(value).origin);

const supabaseEnvironmentSchema = z.object({
  SUPABASE_URL: httpOriginSchema,
  SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
});

export type SupabaseEnvironment = Readonly<Record<string, string | undefined>>;

export type SupabaseConfig = Readonly<{
  publishableKey: string;
  url: string;
}>;

export function resolveSupabaseConfig(
  environment: SupabaseEnvironment = process.env,
): SupabaseConfig {
  const parsed = supabaseEnvironmentSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error("Invalid Supabase configuration.");
  }

  return Object.freeze({
    publishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
    url: parsed.data.SUPABASE_URL,
  });
}
