/**
 * Environment variable validation using Zod.
 * Each app should create its own env.ts that extends this.
 *
 * Usage in an app:
 *   import { validateEnv } from "@repo/shared"
 *   import { z } from "zod"
 *   export const env = validateEnv(z.object({ MY_VAR: z.string() }))
 */
import type { z } from "zod"

export function validateEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `\n❌ Invalid environment variables:\n${missing}\n\nCheck .env.example for required variables.\n`,
    )
  }

  return parsed.data as z.infer<T>
}

/**
 * Core env vars required by all server-side code.
 * Import this where DATABASE_URL is needed.
 */
import { z as zod } from "zod"

export const coreEnvSchema = zod.object({
  NODE_ENV: zod.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: zod.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
})

export type CoreEnv = zod.infer<typeof coreEnvSchema>
