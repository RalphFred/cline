import { getServerEnv } from "@/lib/env"

export function getAppwriteIds() {
  const env = getServerEnv()

  return {
    databaseId: env.APPWRITE_DATABASE_ID,
    buckets: {
      invoices: env.APPWRITE_INVOICES_BUCKET_ID,
      proofs: env.APPWRITE_PROOFS_BUCKET_ID,
      orgDocuments: env.APPWRITE_ORG_DOCUMENTS_BUCKET_ID,
    },
    collections: {
      organizations: env.APPWRITE_COLLECTION_ORGANIZATIONS_ID,
      orgMembers: env.APPWRITE_COLLECTION_ORG_MEMBERS_ID,
      departments: env.APPWRITE_COLLECTION_DEPARTMENTS_ID,
      budgets: env.APPWRITE_COLLECTION_BUDGETS_ID,
      spendPolicies: env.APPWRITE_COLLECTION_SPEND_POLICIES_ID,
      userProfiles: env.APPWRITE_COLLECTION_USER_PROFILES_ID,
      employeeBankProfiles: env.APPWRITE_COLLECTION_EMPLOYEE_BANK_PROFILES_ID,
      vendors: env.APPWRITE_COLLECTION_VENDORS_ID,
      vendorAliases: env.APPWRITE_COLLECTION_VENDOR_ALIASES_ID,
      paymentRequests: env.APPWRITE_COLLECTION_PAYMENT_REQUESTS_ID,
      requestEvidence: env.APPWRITE_COLLECTION_REQUEST_EVIDENCE_ID,
      verificationRuns: env.APPWRITE_COLLECTION_VERIFICATION_RUNS_ID,
      approvalDecisions: env.APPWRITE_COLLECTION_APPROVAL_DECISIONS_ID,
      transfers: env.APPWRITE_COLLECTION_TRANSFERS_ID,
      ledgerEntries: env.APPWRITE_COLLECTION_LEDGER_ENTRIES_ID,
      webhookEvents: env.APPWRITE_COLLECTION_WEBHOOK_EVENTS_ID,
      auditEvents: env.APPWRITE_COLLECTION_AUDIT_EVENTS_ID,
      alerts: env.APPWRITE_COLLECTION_ALERTS_ID,
      frankThreads: env.APPWRITE_COLLECTION_FRANK_THREADS_ID,
      frankMessages: env.APPWRITE_COLLECTION_FRANK_MESSAGES_ID,
      reportExports: env.APPWRITE_COLLECTION_REPORT_EXPORTS_ID,
    },
  }
}
