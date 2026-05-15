import type { PaymentRequestType, RiskBand } from "@/lib/payments/types"
import {
  paymentRequestFeatureNames,
  type PaymentRequestFeatureName,
  type PaymentRequestFeatureVector,
  type PaymentRequestModelInput,
} from "@/lib/ml/types"

const typicalAmountKoboByType: Record<PaymentRequestType, number> = {
  vendor_payment: 850_000_00,
  staff_cash_request: 95_000_00,
  airtime_data_request: 18_000_00,
  utility_payment: 140_000_00,
  manual_business_expense: 65_000_00,
}

const requestTypePrior: Record<PaymentRequestType, number> = {
  vendor_payment: 0.36,
  staff_cash_request: 0.25,
  airtime_data_request: 0.16,
  utility_payment: 0.22,
  manual_business_expense: 0.32,
}

const evidenceSensitiveTypes = new Set<PaymentRequestType>([
  "vendor_payment",
  "utility_payment",
  "manual_business_expense",
])

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isImmediate(value: string) {
  return value.trim().toLowerCase() === "immediate"
}

function isAfterHours(date: Date) {
  const hour = date.getHours()
  return hour < 7 || hour > 19
}

export function getPaymentRequestFeatureVector(
  input: PaymentRequestModelInput,
): PaymentRequestFeatureVector {
  const typicalAmountKobo = typicalAmountKoboByType[input.requestType]
  const amountDeviationRatio = clamp(
    Math.abs(input.amountKobo - typicalAmountKobo) / typicalAmountKobo,
    0,
    8,
  )
  const submittedAt = input.submittedAtIso
    ? new Date(input.submittedAtIso)
    : new Date()
  const purposeLength = input.purpose?.trim().length ?? 0
  const hasBankDetails =
    typeof input.accountNumber === "string" &&
    input.accountNumber.trim().length >= 10

  return {
    amount_log_naira: Math.log10(input.amountKobo / 100 + 1),
    amount_deviation_ratio: amountDeviationRatio,
    request_type_prior: requestTypePrior[input.requestType],
    has_evidence: input.hasEvidence ? 1 : 0,
    missing_required_evidence:
      evidenceSensitiveTypes.has(input.requestType) && !input.hasEvidence ? 1 : 0,
    is_immediate: isImmediate(input.urgency) ? 1 : 0,
    request_frequency_7d: clamp(input.requestFrequency7d ?? 1, 0, 12),
    duplicate_evidence_hint: input.duplicateEvidenceHint ? 1 : 0,
    after_hours: isAfterHours(submittedAt) ? 1 : 0,
    vendor_watchlist:
      input.vendorStatus === "watchlist" || input.vendorStatus === "blocked" ? 1 : 0,
    new_beneficiary:
      input.isNewBeneficiary ?? (input.requestType === "vendor_payment" && !hasBankDetails)
        ? 1
        : 0,
    purpose_length_bucket: clamp(Math.ceil(purposeLength / 120), 0, 6),
    has_bank_details: hasBankDetails ? 1 : 0,
  }
}

export function featureVectorToArray(vector: PaymentRequestFeatureVector): number[] {
  return paymentRequestFeatureNames.map((feature) => vector[feature])
}

export function getRiskBand(score: number): RiskBand {
  if (score >= 0.68) return "high"
  if (score >= 0.38) return "medium"
  return "low"
}

export function getTopFeature(
  vector: PaymentRequestFeatureVector,
): PaymentRequestFeatureName {
  let strongestFeature: PaymentRequestFeatureName = "request_type_prior"
  let strongestValue = Number.NEGATIVE_INFINITY

  for (const feature of paymentRequestFeatureNames) {
    const value = Math.abs(vector[feature])

    if (value > strongestValue) {
      strongestFeature = feature
      strongestValue = value
    }
  }

  return strongestFeature
}
