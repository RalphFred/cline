import type { PaymentRequestType, RiskBand } from "@/lib/payments/types"

export const demoModelVersion = "2026.05-demo.1"

export const paymentRequestFeatureNames = [
  "amount_log_naira",
  "amount_deviation_ratio",
  "request_type_prior",
  "has_evidence",
  "missing_required_evidence",
  "is_immediate",
  "request_frequency_7d",
  "duplicate_evidence_hint",
  "after_hours",
  "vendor_watchlist",
  "new_beneficiary",
  "purpose_length_bucket",
  "has_bank_details",
] as const

export type PaymentRequestFeatureName = (typeof paymentRequestFeatureNames)[number]

export type PaymentRequestModelInput = {
  requestType: PaymentRequestType
  amountKobo: number
  urgency: string
  hasEvidence: boolean
  purpose?: string
  submittedAtIso?: string
  accountNumber?: string
  vendorStatus?: "normal" | "watchlist" | "blocked"
  duplicateEvidenceHint?: boolean
  requestFrequency7d?: number
  isNewBeneficiary?: boolean
}

export type PaymentRequestFeatureVector = Record<PaymentRequestFeatureName, number>

export type RiskModelTree = {
  feature: PaymentRequestFeatureName
  threshold: number
  leftValue: number
  rightValue: number
}

export type IsolationTreeNode =
  | {
      type: "leaf"
      size: number
      depth: number
    }
  | {
      type: "split"
      feature: PaymentRequestFeatureName
      threshold: number
      left: IsolationTreeNode
      right: IsolationTreeNode
    }

export type DemoRiskModelArtifact = {
  artifactVersion: typeof demoModelVersion
  trainedAtIso: string
  datasetVersion: string
  rowCount: number
  featureNames: PaymentRequestFeatureName[]
  riskModel: {
    modelName: "demo-gbdt-risk"
    modelVersion: typeof demoModelVersion
    baseLogit: number
    learningRate: number
    trees: RiskModelTree[]
    metrics: {
      accuracy: number
      precision: number
      recall: number
    }
  }
  anomalyModel: {
    modelName: "demo-isolation-forest-anomaly"
    modelVersion: typeof demoModelVersion
    sampleSize: number
    trees: IsolationTreeNode[]
    metrics: {
      averageAnomalyScore: number
      p95AnomalyScore: number
    }
  }
  notes: string
}

export type PaymentRequestModelPrediction = {
  riskScore: number
  anomalyScore: number
  riskBand: RiskBand
  modelVersion: typeof demoModelVersion
  topModelFeature: PaymentRequestFeatureName
}
