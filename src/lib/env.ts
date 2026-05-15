import { z } from "zod"

import {
  defaultAppwriteBucketIds,
  defaultAppwriteCollectionIds,
} from "@/lib/appwrite/schema"

const optionalNonEmptyString = () =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value
    }

    const trimmedValue = value.trim()
    return trimmedValue.length === 0 ? undefined : trimmedValue
  }, z.string().min(1).optional())

const optionalEmail = () =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value
    }

    const trimmedValue = value.trim()
    return trimmedValue.length === 0 ? undefined : trimmedValue
  }, z.string().email().optional())

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
  APPWRITE_API_KEY: optionalNonEmptyString(),
  APPWRITE_DATABASE_ID: z.string().min(1).default("cline"),
  APPWRITE_BUCKET_REQUEST_EVIDENCE_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteBucketIds.requestEvidence),
  APPWRITE_BUCKET_ORG_DOCUMENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteBucketIds.orgDocuments),
  APPWRITE_BUCKET_TRAINING_ARTIFACTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteBucketIds.trainingArtifacts),
  APPWRITE_COLLECTION_ORGANIZATIONS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.organizations),
  APPWRITE_COLLECTION_USER_PROFILES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.userProfiles),
  APPWRITE_COLLECTION_ORG_MEMBERS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.orgMembers),
  APPWRITE_COLLECTION_DEPARTMENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.departments),
  APPWRITE_COLLECTION_VENDORS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.vendors),
  APPWRITE_COLLECTION_INVENTORY_ITEMS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.inventoryItems),
  APPWRITE_COLLECTION_STOCK_MOVEMENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.stockMovements),
  APPWRITE_COLLECTION_SALES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.sales),
  APPWRITE_COLLECTION_SALE_LINES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.saleLines),
  APPWRITE_COLLECTION_INCOMING_PAYMENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.incomingPayments),
  APPWRITE_COLLECTION_RECONCILIATION_EVENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.reconciliationEvents),
  APPWRITE_COLLECTION_PAYMENT_REQUESTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.paymentRequests),
  APPWRITE_COLLECTION_REQUEST_EVIDENCE_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.requestEvidence),
  APPWRITE_COLLECTION_APPROVAL_DECISIONS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.approvalDecisions),
  APPWRITE_COLLECTION_RISK_EVALUATIONS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.riskEvaluations),
  APPWRITE_COLLECTION_MODEL_SCORES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.modelScores),
  APPWRITE_COLLECTION_RULE_RESULTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.ruleResults),
  APPWRITE_COLLECTION_TRANSFERS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.transfers),
  APPWRITE_COLLECTION_LEDGER_ENTRIES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.ledgerEntries),
  APPWRITE_COLLECTION_WEBHOOK_EVENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.webhookEvents),
  APPWRITE_COLLECTION_AUDIT_EVENTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.auditEvents),
  APPWRITE_COLLECTION_ALERTS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.alerts),
  APPWRITE_COLLECTION_FRANK_THREADS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.frankThreads),
  APPWRITE_COLLECTION_FRANK_MESSAGES_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.frankMessages),
  APPWRITE_COLLECTION_TRAINING_DATASET_RUNS_ID: z
    .string()
    .min(1)
    .default(defaultAppwriteCollectionIds.trainingDatasetRuns),
  SQUAD_BASE_URL: z
    .string()
    .url()
    .default("https://sandbox-api-d.squadco.com"),
  SQUAD_SOFTPOS_BASE_URL: z
    .string()
    .url()
    .default("https://api-d.squadco.com/softpos"),
  SQUAD_SECRET_KEY: optionalNonEmptyString(),
  SQUAD_PUBLIC_KEY: optionalNonEmptyString(),
  SQUAD_MERCHANT_ID: optionalNonEmptyString(),
  SQUAD_POS_TERMINAL_ID: optionalNonEmptyString(),
  SQUAD_WEBHOOK_SECRET: optionalNonEmptyString(),
  SQUAD_STATIC_VIRTUAL_ACCOUNT_CUSTOMER_IDENTIFIER: optionalNonEmptyString(),
  SQUAD_VIRTUAL_ACCOUNT_BUSINESS_NAME: optionalNonEmptyString(),
  SQUAD_VIRTUAL_ACCOUNT_MOBILE_NUM: optionalNonEmptyString(),
  SQUAD_VIRTUAL_ACCOUNT_BVN: optionalNonEmptyString(),
  SQUAD_VIRTUAL_ACCOUNT_BENEFICIARY_ACCOUNT: optionalNonEmptyString(),
  GEMINI_API_KEY: optionalNonEmptyString(),
  RESEND_API_KEY: optionalNonEmptyString(),
  RESEND_FROM_EMAIL: optionalEmail(),
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
