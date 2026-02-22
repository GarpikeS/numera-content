import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  OWNER_ID: z.coerce.number().int().positive(),
  TG_CHANNEL_ID: z.string().min(1),
  LLM_PROVIDER: z.enum(['openrouter']).default('openrouter'),
  LLM_MODEL: z.string().default('google/gemini-2.0-flash-exp:free'),
  OPENROUTER_API_KEY: z.string().min(1),
  KANDINSKY_API_KEY: z.string().default(''),
  KANDINSKY_SECRET_KEY: z.string().default(''),
  RSSHUB_BASE_URL: z.string().url().default('https://rsshub.app'),
  SCAN_CRON: z.string().default('0 */2 * * *'),
  DIGEST_CRON: z.string().default('0 5 * * *'),
  POST_GEN_CRON: z.string().default('30 5,9,14 * * *'),
  PUBLISH_CHECK_CRON: z.string().default('*/10 * * * *'),
  DB_PATH: z.string().default('./data/numera-content.db'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type Config = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const config: Config = parsed.data;
