import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_ADAPTER: z.enum(["local", "postgres"]).default("local"),
    DATABASE_URL: z.string().optional().default(""),
    DATA_DIR: z.string().default(".data"),
    OWNER_EMAIL: z.string().email(),
    OWNER_PASSWORD: z.string().min(8),
    SESSION_SECRET: z.string().min(32),
    APP_URL: z.string().url().default("http://localhost:3000"),
    /** Shared HMAC secret for the editor/agent evidence bridge. Empty disables ingest. */
    RELEASE_ROOM_EVIDENCE_SECRET: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.DATABASE_ADAPTER === "postgres" && !value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when DATABASE_ADAPTER=postgres",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

function readRawEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_ADAPTER: process.env.DATABASE_ADAPTER,
    DATABASE_URL: process.env.DATABASE_URL,
    DATA_DIR: process.env.DATA_DIR,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
    OWNER_PASSWORD: process.env.OWNER_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_URL: process.env.APP_URL,
    RELEASE_ROOM_EVIDENCE_SECRET: process.env.RELEASE_ROOM_EVIDENCE_SECRET,
  };
}

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  const parsed = envSchema.safeParse(readRawEnv());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  cached = parsed.data;
  return cached;
}

/** Test helper — clears the memoized env parse. */
export function resetEnvCache(): void {
  cached = null;
}

export function formatEnvIssues(error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${issue.path.join(".") || "env"}: ${issue.message}`,
  );
}

export { envSchema };
