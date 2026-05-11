import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url().optional(),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_APPWRITE_PROJECT_NAME: z.string().optional(),
  APPWRITE_API_KEY: z.string().optional(),
  APPWRITE_DATABASE_ID: z.string().optional(),
  APPWRITE_INVOICES_BUCKET_ID: z.string().optional(),
  APPWRITE_PROOFS_BUCKET_ID: z.string().optional(),
  APPWRITE_ORG_DOCUMENTS_BUCKET_ID: z.string().optional(),
  SQUAD_BASE_URL: z
    .string()
    .url()
    .default("https://sandbox-api-d.squadco.com"),
  SQUAD_SECRET_KEY: z.string().optional(),
  SQUAD_MERCHANT_ID: z.string().optional(),
  SQUAD_WEBHOOK_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
})

export function getEnv() {
  return envSchema.parse(process.env)
}
