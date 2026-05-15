export const paymentRequestTypes = [
  "vendor_payment",
  "staff_cash_request",
  "airtime_data_request",
  "utility_payment",
  "manual_business_expense",
] as const
export type PaymentRequestType = (typeof paymentRequestTypes)[number]

export const paymentRequestStatuses = [
  "submitted",
  "approved",
  "rejected",
] as const
export type PaymentRequestStatus = (typeof paymentRequestStatuses)[number]

export const riskBands = ["low", "medium", "high"] as const
export type RiskBand = (typeof riskBands)[number]

export type PaymentRequestTimelineItem = {
  label: string
  state: "done" | "current" | "waiting"
}

export type PaymentRequestEvidenceSummary = {
  id: string
  fileName: string
  fileType: string
  fileUrl?: string
  isImage: boolean
  sizeBytes: number
  analysisStatus?: string
  analysisSummary?: string
  analysisConfidence?: number
  extractedAccountNumber?: string
  extractedAccountName?: string
  extractedBankName?: string
  extractedAmountKobo?: number
  accountMatchStatus?: string
  amountMatchStatus?: string
  uploadedAt: string
  uploadedByMemberId: string
  status: string
}

export type PaymentRequestRuleSummary = {
  code: string
  label: string
  outcome: "pass" | "flag" | "fail"
  details: string
}

export type PaymentRequestModelScoreSummary = {
  modelName: string
  modelVersion: string
  scoreType: "anomaly_score" | "risk_score"
  scoreValue: number
}

export type PaymentRequestAuditSummary = {
  action: string
  summary: string
  occurredAt: string
}

export type PaymentRequestTransferSummary = {
  provider: "squad"
  reference: string
  status: "queued" | "processing" | "success" | "failed" | "unknown"
  amountKobo: number
  submittedAt?: string
  resolvedAt?: string
  mode?: "live" | "simulated"
  providerMessage?: string
}

export type PaymentRequestSummary = {
  id: string
  title: string
  amountKobo: number
  requestType: PaymentRequestType
  purpose: string
  location: string
  urgency: string
  submittedAt: string
  neededBy: string
  status: PaymentRequestStatus
  riskBand: RiskBand
  riskScore: number
  proofRequired: boolean
  proofFileName?: string
  frankNote: string
  topFlag: string
  submitterName?: string
  departmentName?: string
  transferReference?: string
  transferStatus?: PaymentRequestTransferSummary["status"]
  transfer?: PaymentRequestTransferSummary
  decisionComment?: string
  decisionAt?: string
  evidence: PaymentRequestEvidenceSummary[]
  rules: PaymentRequestRuleSummary[]
  modelScores: PaymentRequestModelScoreSummary[]
  auditTrail: PaymentRequestAuditSummary[]
  timeline: PaymentRequestTimelineItem[]
}
