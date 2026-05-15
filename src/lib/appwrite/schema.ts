export const defaultAppwriteBucketIds = {
  requestEvidence: "request-evidence",
  orgDocuments: "org-documents",
  trainingArtifacts: "training-artifacts",
} as const

export const defaultAppwriteCollectionIds = {
  organizations: "organizations",
  userProfiles: "user-profiles",
  orgMembers: "org-members",
  departments: "departments",
  vendors: "vendors",
  inventoryItems: "inventory-items",
  stockMovements: "stock-movements",
  sales: "sales",
  saleLines: "sale-lines",
  incomingPayments: "incoming-payments",
  reconciliationEvents: "reconciliation-events",
  paymentRequests: "payment-requests",
  requestEvidence: "request-evidence",
  approvalDecisions: "approval-decisions",
  riskEvaluations: "risk-evaluations",
  modelScores: "model-scores",
  ruleResults: "rule-results",
  transfers: "transfers",
  ledgerEntries: "ledger-entries",
  webhookEvents: "webhook-events",
  auditEvents: "audit-events",
  alerts: "alerts",
  frankThreads: "frank-threads",
  frankMessages: "frank-messages",
  trainingDatasetRuns: "training-dataset-runs",
} as const

export type AppwriteCollectionKey = keyof typeof defaultAppwriteCollectionIds

type BaseAttribute = {
  key: string
  required?: boolean
  array?: boolean
}

type StringAttribute = BaseAttribute & {
  type: "string"
  size: number
  default?: string
}

type IntegerAttribute = BaseAttribute & {
  type: "integer"
  min?: number
  max?: number
  default?: number
}

type FloatAttribute = BaseAttribute & {
  type: "float"
  min?: number
  max?: number
  default?: number
}

type BooleanAttribute = BaseAttribute & {
  type: "boolean"
  default?: boolean
}

type DatetimeAttribute = BaseAttribute & {
  type: "datetime"
  default?: string
}

type EmailAttribute = BaseAttribute & {
  type: "email"
  default?: string
}

type UrlAttribute = BaseAttribute & {
  type: "url"
  default?: string
}

type EnumAttribute = BaseAttribute & {
  type: "enum"
  elements: readonly string[]
  default?: string
}

type RelationshipAttribute = BaseAttribute & {
  type: "relationship"
  relatedCollection: AppwriteCollectionKey
  relationType: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany"
  onDelete?: "restrict" | "cascade" | "setNull"
  twoWay?: boolean
  twoWayKey?: string
}

export type AppwriteAttributeDefinition =
  | StringAttribute
  | IntegerAttribute
  | FloatAttribute
  | BooleanAttribute
  | DatetimeAttribute
  | EmailAttribute
  | UrlAttribute
  | EnumAttribute
  | RelationshipAttribute

export type AppwriteIndexDefinition = {
  key: string
  type: "key" | "unique" | "fulltext"
  attributes: string[]
  orders?: Array<"ASC" | "DESC">
}

export type AppwriteCollectionDefinition = {
  key: AppwriteCollectionKey
  name: string
  documentSecurity?: boolean
  attributes: AppwriteAttributeDefinition[]
  indexes?: AppwriteIndexDefinition[]
}

const roleValues = [
  "super_admin",
  "sales_operator",
  "field_employee",
] as const

const orgMemberStatusValues = ["active", "invited", "disabled"] as const
const departmentStatusValues = ["active", "archived"] as const
const vendorStatusValues = ["normal", "watchlist", "blocked"] as const
const inventoryStatusValues = ["active", "archived"] as const
const saleTypeValues = [
  "inventory_sale",
  "service_sale",
  "manual_sale",
] as const
const saleStatusValues = [
  "pending_payment",
  "paid",
  "mismatch_flagged",
] as const
const posRequestStatusValues = [
  "not_requested",
  "requested",
  "pending",
  "success",
  "failed",
  "expired",
  "simulated_success",
] as const
const paymentSourceValues = [
  "bank_transfer",
  "pos_payment",
  "cash",
  "manual_record",
] as const
const stockMovementTypeValues = ["stock_in", "sale_out", "adjustment"] as const
const saleLineKindValues = [
  "inventory_item",
  "service_item",
  "manual_item",
] as const
const incomingPaymentStatusValues = [
  "recorded",
  "matched",
  "mismatch_flagged",
  "unclassified",
] as const
const reconciliationOutcomeValues = [
  "matched",
  "amount_mismatch",
  "missing_payment",
  "unclassified_payment",
] as const
const paymentRequestTypeValues = [
  "vendor_payment",
  "staff_cash_request",
  "airtime_data_request",
  "utility_payment",
  "manual_business_expense",
] as const
const paymentRequestStatusValues = [
  "submitted",
  "approved",
  "rejected",
] as const
const evidenceStatusValues = ["uploaded", "verified", "flagged"] as const
const evidenceAnalysisStatusValues = [
  "not_required",
  "missing",
  "verified",
  "needs_review",
  "mismatch",
] as const
const approvalDecisionValues = ["approved", "rejected"] as const
const evaluationTargetValues = ["incoming_payment", "payment_request"] as const
const riskBandValues = ["low", "medium", "high", "critical"] as const
const modelScoreTypeValues = ["anomaly_score", "risk_score"] as const
const ruleOutcomeValues = ["pass", "flag", "fail"] as const
const transferStatusValues = [
  "queued",
  "processing",
  "success",
  "failed",
  "unknown",
] as const
const ledgerDirectionValues = ["debit", "credit"] as const
const ledgerSourceTypeValues = [
  "sale",
  "incoming_payment",
  "payment_request",
  "transfer",
  "adjustment",
] as const
const alertSeverityValues = ["info", "warning", "critical"] as const
const alertStatusValues = ["open", "acknowledged", "resolved"] as const
const trainingStatusValues = ["planned", "generated", "trained", "failed"] as const

export const financeOsCollections: AppwriteCollectionDefinition[] = [
  {
    key: "organizations",
    name: "Organizations",
    attributes: [
      { key: "name", type: "string", size: 160, required: true },
      { key: "businessType", type: "string", size: 120, required: true },
      { key: "currency", type: "enum", elements: ["NGN"], required: true },
      {
        key: "walletMode",
        type: "enum",
        elements: ["sandbox", "live"],
        required: true,
      },
      { key: "createdBy", type: "string", size: 64, required: true },
    ],
    indexes: [
      { key: "organizations_name", type: "key", attributes: ["name"] },
      { key: "organizations_createdBy", type: "key", attributes: ["createdBy"] },
    ],
  },
  {
    key: "userProfiles",
    name: "User Profiles",
    attributes: [
      { key: "appwriteUserId", type: "string", size: 64, required: true },
      { key: "name", type: "string", size: 160, required: true },
      { key: "email", type: "email", required: true },
      { key: "phone", type: "string", size: 32 },
    ],
    indexes: [
      { key: "userProfiles_appwriteUserId", type: "unique", attributes: ["appwriteUserId"] },
      { key: "userProfiles_email", type: "unique", attributes: ["email"] },
    ],
  },
  {
    key: "orgMembers",
    name: "Organization Members",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "userProfileId",
        type: "relationship",
        relatedCollection: "userProfiles",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "departmentId",
        type: "relationship",
        relatedCollection: "departments",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      { key: "role", type: "enum", elements: roleValues, required: true },
      {
        key: "status",
        type: "enum",
        elements: orgMemberStatusValues,
        required: true,
      },
    ],
    indexes: [
      { key: "orgMembers_role", type: "key", attributes: ["role"] },
      { key: "orgMembers_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "departments",
    name: "Departments",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "name", type: "string", size: 120, required: true },
      { key: "description", type: "string", size: 400 },
      {
        key: "status",
        type: "enum",
        elements: departmentStatusValues,
        required: true,
      },
    ],
    indexes: [
      { key: "departments_name", type: "key", attributes: ["name"] },
      { key: "departments_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "vendors",
    name: "Vendors",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "displayName", type: "string", size: 160, required: true },
      { key: "bankCode", type: "string", size: 12, required: true },
      { key: "bankName", type: "string", size: 120, required: true },
      { key: "accountNumber", type: "string", size: 16, required: true },
      { key: "resolvedAccountName", type: "string", size: 160 },
      { key: "status", type: "enum", elements: vendorStatusValues, required: true },
      { key: "firstSeenAt", type: "datetime" },
      { key: "lastPaidAt", type: "datetime" },
      { key: "totalPaidKobo", type: "integer", min: 0, default: 0 },
      { key: "notes", type: "string", size: 800 },
    ],
    indexes: [
      { key: "vendors_displayName", type: "key", attributes: ["displayName"] },
      { key: "vendors_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "inventoryItems",
    name: "Inventory Items",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "sku", type: "string", size: 80, required: true },
      { key: "name", type: "string", size: 160, required: true },
      { key: "description", type: "string", size: 500 },
      { key: "unitPriceKobo", type: "integer", min: 0, required: true },
      { key: "quantityOnHand", type: "integer", required: true, default: 0 },
      { key: "lowStockThreshold", type: "integer", min: 0, default: 0 },
      {
        key: "status",
        type: "enum",
        elements: inventoryStatusValues,
        required: true,
      },
    ],
    indexes: [
      { key: "inventoryItems_sku", type: "unique", attributes: ["sku"] },
      { key: "inventoryItems_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "stockMovements",
    name: "Stock Movements",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "inventoryItemId",
        type: "string",
        size: 64,
        required: true,
      },
      {
        key: "saleId",
        type: "relationship",
        relatedCollection: "sales",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      {
        key: "type",
        type: "enum",
        elements: stockMovementTypeValues,
        required: true,
      },
      { key: "quantityDelta", type: "integer", required: true },
      { key: "unitPriceKobo", type: "integer", min: 0 },
      { key: "reason", type: "string", size: 400 },
      { key: "createdBy", type: "string", size: 64, required: true },
      { key: "createdAtIso", type: "datetime", required: true },
    ],
    indexes: [
      { key: "stockMovements_type", type: "key", attributes: ["type"] },
      { key: "stockMovements_createdAtIso", type: "key", attributes: ["createdAtIso"] },
    ],
  },
  {
    key: "sales",
    name: "Sales",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "createdByMemberId", type: "string", size: 64, required: true },
      { key: "saleType", type: "enum", elements: saleTypeValues, required: true },
      { key: "title", type: "string", size: 180, required: true },
      { key: "customerLabel", type: "string", size: 160 },
      { key: "expectedAmountKobo", type: "integer", min: 0, required: true },
      { key: "status", type: "enum", elements: saleStatusValues, required: true },
      {
        key: "paymentSourceExpected",
        type: "enum",
        elements: paymentSourceValues,
        required: true,
      },
      { key: "posRequestReference", type: "string", size: 160 },
      { key: "posTerminalId", type: "string", size: 80 },
      {
        key: "posRequestStatus",
        type: "enum",
        elements: posRequestStatusValues,
        default: "not_requested",
      },
      { key: "posRequestedAt", type: "datetime" },
      { key: "posConfirmedAt", type: "datetime" },
      { key: "bankTransferReference", type: "string", size: 160 },
      { key: "bankTransferAccountName", type: "string", size: 180 },
      { key: "bankTransferAccountNumber", type: "string", size: 16 },
      { key: "bankTransferBankName", type: "string", size: 120 },
      { key: "bankTransferExpiresAt", type: "datetime" },
      { key: "bankTransferProviderPayload", type: "string", size: 4000 },
      { key: "notes", type: "string", size: 1000 },
    ],
    indexes: [
      { key: "sales_saleType", type: "key", attributes: ["saleType"] },
      { key: "sales_status", type: "key", attributes: ["status"] },
      { key: "sales_createdByMemberId", type: "key", attributes: ["createdByMemberId"] },
      { key: "sales_posRequestReference", type: "key", attributes: ["posRequestReference"] },
      { key: "sales_bankTransferReference", type: "key", attributes: ["bankTransferReference"] },
    ],
  },
  {
    key: "saleLines",
    name: "Sale Lines",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "saleId",
        type: "relationship",
        relatedCollection: "sales",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      {
        key: "inventoryItemId",
        type: "relationship",
        relatedCollection: "inventoryItems",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      { key: "kind", type: "enum", elements: saleLineKindValues, required: true },
      { key: "label", type: "string", size: 180, required: true },
      { key: "quantity", type: "integer", min: 1, required: true },
      { key: "unitPriceKobo", type: "integer", min: 0, required: true },
      { key: "lineTotalKobo", type: "integer", min: 0, required: true },
    ],
    indexes: [
      { key: "saleLines_saleId", type: "key", attributes: ["saleId"] },
      { key: "saleLines_kind", type: "key", attributes: ["kind"] },
    ],
  },
  {
    key: "incomingPayments",
    name: "Incoming Payments",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "saleId",
        type: "relationship",
        relatedCollection: "sales",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      { key: "sourceType", type: "enum", elements: paymentSourceValues, required: true },
      { key: "amountKobo", type: "integer", min: 0, required: true },
      {
        key: "status",
        type: "enum",
        elements: incomingPaymentStatusValues,
        required: true,
      },
      { key: "provider", type: "enum", elements: ["squad", "manual"], required: true },
      { key: "providerReference", type: "string", size: 160 },
      { key: "recordedByMemberId", type: "string", size: 64 },
      { key: "recordedAt", type: "datetime" },
    ],
    indexes: [
      { key: "incomingPayments_status", type: "key", attributes: ["status"] },
      { key: "incomingPayments_providerReference", type: "key", attributes: ["providerReference"] },
    ],
  },
  {
    key: "reconciliationEvents",
    name: "Reconciliation Events",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "saleId",
        type: "relationship",
        relatedCollection: "sales",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      {
        key: "incomingPaymentId",
        type: "relationship",
        relatedCollection: "incomingPayments",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      {
        key: "outcome",
        type: "enum",
        elements: reconciliationOutcomeValues,
        required: true,
      },
      { key: "expectedAmountKobo", type: "integer", min: 0, required: true },
      { key: "actualAmountKobo", type: "integer", min: 0 },
      { key: "explanationInput", type: "string", size: 2000 },
    ],
    indexes: [
      { key: "reconciliationEvents_outcome", type: "key", attributes: ["outcome"] },
    ],
  },
  {
    key: "paymentRequests",
    name: "Payment Requests",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "departmentId",
        type: "relationship",
        relatedCollection: "departments",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      {
        key: "vendorId",
        type: "relationship",
        relatedCollection: "vendors",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      {
        key: "beneficiaryUserProfileId",
        type: "relationship",
        relatedCollection: "userProfiles",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      { key: "submittedByMemberId", type: "string", size: 64, required: true },
      {
        key: "requestType",
        type: "enum",
        elements: paymentRequestTypeValues,
        required: true,
      },
      { key: "title", type: "string", size: 180, required: true },
      { key: "description", type: "string", size: 1000 },
      { key: "amountKobo", type: "integer", min: 0, required: true },
      {
        key: "status",
        type: "enum",
        elements: paymentRequestStatusValues,
        required: true,
      },
      { key: "proofRequired", type: "boolean", default: false },
      { key: "submittedAt", type: "datetime" },
    ],
    indexes: [
      { key: "paymentRequests_requestType", type: "key", attributes: ["requestType"] },
      { key: "paymentRequests_status", type: "key", attributes: ["status"] },
      { key: "paymentRequests_submittedByMemberId", type: "key", attributes: ["submittedByMemberId"] },
    ],
  },
  {
    key: "requestEvidence",
    name: "Request Evidence",
    attributes: [
      {
        key: "paymentRequestId",
        type: "relationship",
        relatedCollection: "paymentRequests",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      { key: "bucketFileId", type: "string", size: 64, required: true },
      { key: "fileName", type: "string", size: 200, required: true },
      { key: "mimeType", type: "string", size: 120, required: true },
      { key: "sizeBytes", type: "integer", min: 0, required: true },
      { key: "sha256Hash", type: "string", size: 128 },
      {
        key: "analysisStatus",
        type: "enum",
        elements: evidenceAnalysisStatusValues,
      },
      { key: "analysisSummary", type: "string", size: 1200 },
      { key: "analysisConfidence", type: "float", min: 0, max: 1 },
      { key: "extractionPayload", type: "string", size: 4000 },
      { key: "squadLookupPayload", type: "string", size: 2000 },
      { key: "extractedAccountNumber", type: "string", size: 20 },
      { key: "extractedAccountName", type: "string", size: 180 },
      { key: "extractedBankName", type: "string", size: 140 },
      { key: "extractedAmountKobo", type: "integer", min: 0 },
      { key: "accountMatchStatus", type: "string", size: 40 },
      { key: "amountMatchStatus", type: "string", size: 40 },
      { key: "uploadedByMemberId", type: "string", size: 64, required: true },
      { key: "uploadedAt", type: "datetime", required: true },
      { key: "status", type: "enum", elements: evidenceStatusValues, required: true },
    ],
    indexes: [
      { key: "requestEvidence_paymentRequestId", type: "key", attributes: ["paymentRequestId"] },
      { key: "requestEvidence_sha256Hash", type: "key", attributes: ["sha256Hash"] },
    ],
  },
  {
    key: "approvalDecisions",
    name: "Approval Decisions",
    attributes: [
      {
        key: "paymentRequestId",
        type: "relationship",
        relatedCollection: "paymentRequests",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      {
        key: "decidedByUserProfileId",
        type: "relationship",
        relatedCollection: "userProfiles",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      {
        key: "decision",
        type: "enum",
        elements: approvalDecisionValues,
        required: true,
      },
      { key: "comment", type: "string", size: 1000 },
      { key: "decidedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "approvalDecisions_paymentRequestId", type: "key", attributes: ["paymentRequestId"] },
    ],
  },
  {
    key: "riskEvaluations",
    name: "Risk Evaluations",
    attributes: [
      { key: "targetId", type: "string", size: 64, required: true },
      {
        key: "targetType",
        type: "enum",
        elements: evaluationTargetValues,
        required: true,
      },
      { key: "riskScore", type: "float", min: 0, max: 1 },
      { key: "anomalyScore", type: "float", min: 0, max: 1 },
      { key: "riskBand", type: "enum", elements: riskBandValues },
      { key: "summary", type: "string", size: 1200 },
      { key: "computedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "riskEvaluations_targetId", type: "key", attributes: ["targetId"] },
      { key: "riskEvaluations_targetType", type: "key", attributes: ["targetType"] },
    ],
  },
  {
    key: "modelScores",
    name: "Model Scores",
    attributes: [
      {
        key: "riskEvaluationId",
        type: "relationship",
        relatedCollection: "riskEvaluations",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      { key: "modelName", type: "string", size: 120, required: true },
      { key: "modelVersion", type: "string", size: 80, required: true },
      { key: "scoreType", type: "enum", elements: modelScoreTypeValues, required: true },
      { key: "scoreValue", type: "float", min: 0, max: 1, required: true },
      { key: "rawPayload", type: "string", size: 4000 },
    ],
    indexes: [
      { key: "modelScores_riskEvaluationId", type: "key", attributes: ["riskEvaluationId"] },
    ],
  },
  {
    key: "ruleResults",
    name: "Rule Results",
    attributes: [
      {
        key: "riskEvaluationId",
        type: "relationship",
        relatedCollection: "riskEvaluations",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      { key: "ruleCode", type: "string", size: 120, required: true },
      { key: "label", type: "string", size: 200, required: true },
      { key: "outcome", type: "enum", elements: ruleOutcomeValues, required: true },
      { key: "details", type: "string", size: 1600 },
    ],
    indexes: [
      { key: "ruleResults_riskEvaluationId", type: "key", attributes: ["riskEvaluationId"] },
      { key: "ruleResults_ruleCode", type: "key", attributes: ["ruleCode"] },
    ],
  },
  {
    key: "transfers",
    name: "Transfers",
    attributes: [
      {
        key: "paymentRequestId",
        type: "relationship",
        relatedCollection: "paymentRequests",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "provider", type: "enum", elements: ["squad"], required: true },
      { key: "providerReference", type: "string", size: 160, required: true },
      { key: "amountKobo", type: "integer", min: 0, required: true },
      { key: "status", type: "enum", elements: transferStatusValues, required: true },
      { key: "submittedAt", type: "datetime" },
      { key: "resolvedAt", type: "datetime" },
      { key: "rawProviderPayload", type: "string", size: 4000 },
    ],
    indexes: [
      { key: "transfers_providerReference", type: "unique", attributes: ["providerReference"] },
      { key: "transfers_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "ledgerEntries",
    name: "Ledger Entries",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "entryReference", type: "string", size: 160, required: true },
      { key: "sourceId", type: "string", size: 64, required: true },
      { key: "sourceType", type: "enum", elements: ledgerSourceTypeValues, required: true },
      { key: "direction", type: "enum", elements: ledgerDirectionValues, required: true },
      { key: "amountKobo", type: "integer", min: 0, required: true },
      { key: "narration", type: "string", size: 400, required: true },
      { key: "recordedAt", type: "datetime", required: true },
    ],
    indexes: [
      { key: "ledgerEntries_entryReference", type: "unique", attributes: ["entryReference"] },
      { key: "ledgerEntries_sourceId", type: "key", attributes: ["sourceId"] },
      { key: "ledgerEntries_sourceType", type: "key", attributes: ["sourceType"] },
    ],
  },
  {
    key: "webhookEvents",
    name: "Webhook Events",
    attributes: [
      { key: "provider", type: "enum", elements: ["squad"], required: true },
      { key: "eventType", type: "string", size: 120, required: true },
      { key: "providerEventId", type: "string", size: 160 },
      { key: "idempotencyKey", type: "string", size: 160, required: true },
      { key: "status", type: "enum", elements: ["received", "processed", "failed"], required: true },
      { key: "receivedAt", type: "datetime", required: true },
      { key: "rawPayload", type: "string", size: 8000, required: true },
    ],
    indexes: [
      { key: "webhookEvents_idempotencyKey", type: "unique", attributes: ["idempotencyKey"] },
      { key: "webhookEvents_providerEventId", type: "key", attributes: ["providerEventId"] },
    ],
  },
  {
    key: "auditEvents",
    name: "Audit Events",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "actorUserProfileId", type: "string", size: 64 },
      { key: "entityType", type: "string", size: 80, required: true },
      { key: "entityId", type: "string", size: 64, required: true },
      { key: "action", type: "string", size: 120, required: true },
      { key: "summary", type: "string", size: 1000, required: true },
      { key: "occurredAt", type: "datetime", required: true },
      { key: "payload", type: "string", size: 4000 },
    ],
    indexes: [
      { key: "auditEvents_entityType", type: "key", attributes: ["entityType"] },
      { key: "auditEvents_entityId", type: "key", attributes: ["entityId"] },
      { key: "auditEvents_occurredAt", type: "key", attributes: ["occurredAt"] },
    ],
  },
  {
    key: "alerts",
    name: "Alerts",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "title", type: "string", size: 180, required: true },
      { key: "message", type: "string", size: 1200, required: true },
      { key: "severity", type: "enum", elements: alertSeverityValues, required: true },
      { key: "status", type: "enum", elements: alertStatusValues, required: true },
      { key: "saleId", type: "string", size: 64 },
      { key: "paymentRequestId", type: "string", size: 64 },
      { key: "incomingPaymentId", type: "string", size: 64 },
      { key: "createdAtIso", type: "datetime", required: true },
    ],
    indexes: [
      { key: "alerts_severity", type: "key", attributes: ["severity"] },
      { key: "alerts_status", type: "key", attributes: ["status"] },
    ],
  },
  {
    key: "frankThreads",
    name: "Frank Threads",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "restrict",
      },
      { key: "startedByUserProfileId", type: "string", size: 64, required: true },
      { key: "topic", type: "string", size: 180 },
      { key: "status", type: "enum", elements: ["open", "closed"], required: true },
    ],
    indexes: [
      { key: "frankThreads_startedByUserProfileId", type: "key", attributes: ["startedByUserProfileId"] },
    ],
  },
  {
    key: "frankMessages",
    name: "Frank Messages",
    attributes: [
      {
        key: "threadId",
        type: "relationship",
        relatedCollection: "frankThreads",
        relationType: "manyToOne",
        onDelete: "cascade",
      },
      { key: "role", type: "enum", elements: ["user", "assistant", "system"], required: true },
      { key: "message", type: "string", size: 4000, required: true },
      { key: "createdAtIso", type: "datetime", required: true },
      { key: "metadataJson", type: "string", size: 2000 },
    ],
    indexes: [
      { key: "frankMessages_threadId", type: "key", attributes: ["threadId"] },
      { key: "frankMessages_createdAtIso", type: "key", attributes: ["createdAtIso"] },
    ],
  },
  {
    key: "trainingDatasetRuns",
    name: "Training Dataset Runs",
    attributes: [
      {
        key: "organizationId",
        type: "relationship",
        relatedCollection: "organizations",
        relationType: "manyToOne",
        onDelete: "setNull",
      },
      { key: "name", type: "string", size: 180, required: true },
      { key: "status", type: "enum", elements: trainingStatusValues, required: true },
      { key: "datasetVersion", type: "string", size: 80, required: true },
      { key: "artifactPath", type: "string", size: 240 },
      { key: "notes", type: "string", size: 1200 },
      { key: "createdAtIso", type: "datetime", required: true },
    ],
    indexes: [
      { key: "trainingDatasetRuns_status", type: "key", attributes: ["status"] },
      { key: "trainingDatasetRuns_datasetVersion", type: "key", attributes: ["datasetVersion"] },
    ],
  },
]
