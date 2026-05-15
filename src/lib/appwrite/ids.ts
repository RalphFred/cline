import {
  defaultAppwriteBucketIds,
  defaultAppwriteCollectionIds,
} from "@/lib/appwrite/schema"
import { getServerEnv } from "@/lib/env"

export function getAppwriteIds() {
  const env = getServerEnv()

  return {
    databaseId: env.APPWRITE_DATABASE_ID,
    buckets: {
      requestEvidence:
        env.APPWRITE_BUCKET_REQUEST_EVIDENCE_ID ??
        defaultAppwriteBucketIds.requestEvidence,
      orgDocuments:
        env.APPWRITE_BUCKET_ORG_DOCUMENTS_ID ??
        defaultAppwriteBucketIds.orgDocuments,
      trainingArtifacts:
        env.APPWRITE_BUCKET_TRAINING_ARTIFACTS_ID ??
        defaultAppwriteBucketIds.trainingArtifacts,
    },
    collections: {
      organizations:
        env.APPWRITE_COLLECTION_ORGANIZATIONS_ID ??
        defaultAppwriteCollectionIds.organizations,
      userProfiles:
        env.APPWRITE_COLLECTION_USER_PROFILES_ID ??
        defaultAppwriteCollectionIds.userProfiles,
      orgMembers:
        env.APPWRITE_COLLECTION_ORG_MEMBERS_ID ??
        defaultAppwriteCollectionIds.orgMembers,
      departments:
        env.APPWRITE_COLLECTION_DEPARTMENTS_ID ??
        defaultAppwriteCollectionIds.departments,
      vendors:
        env.APPWRITE_COLLECTION_VENDORS_ID ??
        defaultAppwriteCollectionIds.vendors,
      inventoryItems:
        env.APPWRITE_COLLECTION_INVENTORY_ITEMS_ID ??
        defaultAppwriteCollectionIds.inventoryItems,
      stockMovements:
        env.APPWRITE_COLLECTION_STOCK_MOVEMENTS_ID ??
        defaultAppwriteCollectionIds.stockMovements,
      sales: env.APPWRITE_COLLECTION_SALES_ID ?? defaultAppwriteCollectionIds.sales,
      saleLines:
        env.APPWRITE_COLLECTION_SALE_LINES_ID ??
        defaultAppwriteCollectionIds.saleLines,
      incomingPayments:
        env.APPWRITE_COLLECTION_INCOMING_PAYMENTS_ID ??
        defaultAppwriteCollectionIds.incomingPayments,
      reconciliationEvents:
        env.APPWRITE_COLLECTION_RECONCILIATION_EVENTS_ID ??
        defaultAppwriteCollectionIds.reconciliationEvents,
      paymentRequests:
        env.APPWRITE_COLLECTION_PAYMENT_REQUESTS_ID ??
        defaultAppwriteCollectionIds.paymentRequests,
      requestEvidence:
        env.APPWRITE_COLLECTION_REQUEST_EVIDENCE_ID ??
        defaultAppwriteCollectionIds.requestEvidence,
      approvalDecisions:
        env.APPWRITE_COLLECTION_APPROVAL_DECISIONS_ID ??
        defaultAppwriteCollectionIds.approvalDecisions,
      riskEvaluations:
        env.APPWRITE_COLLECTION_RISK_EVALUATIONS_ID ??
        defaultAppwriteCollectionIds.riskEvaluations,
      modelScores:
        env.APPWRITE_COLLECTION_MODEL_SCORES_ID ??
        defaultAppwriteCollectionIds.modelScores,
      ruleResults:
        env.APPWRITE_COLLECTION_RULE_RESULTS_ID ??
        defaultAppwriteCollectionIds.ruleResults,
      transfers:
        env.APPWRITE_COLLECTION_TRANSFERS_ID ??
        defaultAppwriteCollectionIds.transfers,
      ledgerEntries:
        env.APPWRITE_COLLECTION_LEDGER_ENTRIES_ID ??
        defaultAppwriteCollectionIds.ledgerEntries,
      webhookEvents:
        env.APPWRITE_COLLECTION_WEBHOOK_EVENTS_ID ??
        defaultAppwriteCollectionIds.webhookEvents,
      auditEvents:
        env.APPWRITE_COLLECTION_AUDIT_EVENTS_ID ??
        defaultAppwriteCollectionIds.auditEvents,
      alerts:
        env.APPWRITE_COLLECTION_ALERTS_ID ?? defaultAppwriteCollectionIds.alerts,
      frankThreads:
        env.APPWRITE_COLLECTION_FRANK_THREADS_ID ??
        defaultAppwriteCollectionIds.frankThreads,
      frankMessages:
        env.APPWRITE_COLLECTION_FRANK_MESSAGES_ID ??
        defaultAppwriteCollectionIds.frankMessages,
      trainingDatasetRuns:
        env.APPWRITE_COLLECTION_TRAINING_DATASET_RUNS_ID ??
        defaultAppwriteCollectionIds.trainingDatasetRuns,
    },
  }
}
