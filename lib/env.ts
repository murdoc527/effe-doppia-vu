/**
 * Environment configuration with validation
 * Ensures type safety and provides defaults for all environment variables
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Public app configuration
  NEXT_PUBLIC_APP_NAME: z.string().default("Effe Doppia Vu"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("1.0.0"),

  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  NEXT_PUBLIC_DEBUG_FOOTER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Optional analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),

  // Optional error reporting
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables with proper defaults
 * Throws descriptive errors if required variables are missing or invalid
 */
function parseEnv(): Env {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_ERROR_REPORTING:
      process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
    NEXT_PUBLIC_DEBUG_FOOTER: process.env.NEXT_PUBLIC_DEBUG_FOOTER,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => err.path.join("."))
        .join(", ");
      throw new Error(
        `Environment validation failed. Missing or invalid: ${missingVars}`
      );
    }
    throw error;
  }
}

// Lazy initialization to avoid issues with server-side rendering
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
}

// Export validated environment variables (lazy)
export const env = new Proxy({} as Env, {
  get(target, prop) {
    return getEnv()[prop as keyof Env];
  },
});

// Utility functions
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";

// Feature flags (simplified for immediate use)
export const features = {
  analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
  debugFooter: process.env.NEXT_PUBLIC_DEBUG_FOOTER === "true",
} as const;
