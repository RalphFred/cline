import { z } from "zod"

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z
    .string()
    .url()
    .default("https://fra.cloud.appwrite.io/v1"),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1).default("cline"),
  NEXT_PUBLIC_APPWRITE_PROJECT_NAME: z.string().min(1).default("Cline"),
})

const serverEnvSchema = publicEnvSchema.extend({
  APPWRITE_API_KEY: z.string().min(1).optional(),
  APPWRITE_DATABASE_ID: z.string().min(1).default("cline"),
  APPWRITE_INVOICES_BUCKET_ID: z.string().min(1).default("invoices"),
  APPWRITE_PROOFS_BUCKET_ID: z.string().min(1).default("proofs"),
  APPWRITE_ORG_DOCUMENTS_BUCKET_ID: z.string().min(1).default("org-documents"),
  APPWRITE_COLLECTION_ORGANIZATIONS_ID: z
    .string()
    .min(1)
    .default("organizations"),
  APPWRITE_COLLECTION_ORG_MEMBERS_ID: z.string().min(1).default("org-members"),
  APPWRITE_COLLECTION_DEPARTMENTS_ID: z.string().min(1).default("departments"),
  APPWRITE_COLLECTION_BUDGETS_ID: z.string().min(1).default("budgets"),
  APPWRITE_COLLECTION_SPEND_POLICIES_ID: z
    .string()
    .min(1)
    .default("spend-policies"),
  APPWRITE_COLLECTION_USER_PROFILES_ID: z
    .string()
    .min(1)
    .default("user-profiles"),
  APPWRITE_COLLECTION_EMPLOYEE_BANK_PROFILES_ID: z
    .string()
    .min(1)
    .default("employee-bank-profiles"),
  APPWRITE_COLLECTION_VENDORS_ID: z.string().min(1).default("vendors"),
  APPWRITE_COLLECTION_VENDOR_ALIASES_ID: z
    .string()
    .min(1)
    .default("vendor-aliases"),
  APPWRITE_COLLECTION_PAYMENT_REQUESTS_ID: z
    .string()
    .min(1)
    .default("payment-requests"),
  APPWRITE_COLLECTION_REQUEST_EVIDENCE_ID: z
    .string()
    .min(1)
    .default("request-evidence"),
  APPWRITE_COLLECTION_VERIFICATION_RUNS_ID: z
    .string()
    .min(1)
    .default("verification-runs"),
  APPWRITE_COLLECTION_APPROVAL_DECISIONS_ID: z
    .string()
    .min(1)
    .default("approval-decisions"),
  APPWRITE_COLLECTION_TRANSFERS_ID: z.string().min(1).default("transfers"),
  APPWRITE_COLLECTION_LEDGER_ENTRIES_ID: z
    .string()
    .min(1)
    .default("ledger-entries"),
  APPWRITE_COLLECTION_WEBHOOK_EVENTS_ID: z
    .string()
    .min(1)
    .default("webhook-events"),
  APPWRITE_COLLECTION_AUDIT_EVENTS_ID: z
    .string()
    .min(1)
    .default("audit-events"),
  APPWRITE_COLLECTION_ALERTS_ID: z.string().min(1).default("alerts"),
  APPWRITE_COLLECTION_FRANK_THREADS_ID: z
    .string()
    .min(1)
    .default("frank-threads"),
  APPWRITE_COLLECTION_FRANK_MESSAGES_ID: z
    .string()
    .min(1)
    .default("frank-messages"),
  APPWRITE_COLLECTION_REPORT_EXPORTS_ID: z
    .string()
    .min(1)
    .default("report-exports"),
  SQUAD_BASE_URL: z
    .string()
    .url()
    .default("https://sandbox-api-d.squadco.com"),
  SQUAD_SECRET_KEY: z.string().min(1).optional(),
  SQUAD_MERCHANT_ID: z.string().min(1).optional(),
  SQUAD_WEBHOOK_SECRET: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedPublicEnv: PublicEnv | null = null
let cachedServerEnv: ServerEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) {
    return cachedPublicEnv
  }

  cachedPublicEnv = publicEnvSchema.parse(process.env)
  return cachedPublicEnv
}

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv
  }

  cachedServerEnv = serverEnvSchema.parse(process.env)
  return cachedServerEnv
}
