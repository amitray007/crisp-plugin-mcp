import * as z from "zod";

const ConfigSchema = z.object({
  CRISP_TOKEN_IDENTIFIER: z.string().min(1),
  CRISP_TOKEN_KEY: z.string().min(1),
  CRISP_WEBSITE_ID: z.string().min(1),
});

export interface Config {
  identifier: string;
  key: string;
  websiteId: string;
}

export function readConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or empty environment variables: ${missing}`);
  }
  return {
    identifier: parsed.data.CRISP_TOKEN_IDENTIFIER,
    key: parsed.data.CRISP_TOKEN_KEY,
    websiteId: parsed.data.CRISP_WEBSITE_ID,
  };
}
