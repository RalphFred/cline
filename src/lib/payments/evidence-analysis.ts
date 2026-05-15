import "server-only"

import { Buffer } from "node:buffer"

import {
  extractInvoiceEvidence,
  type InvoiceExtractionResult,
} from "@/lib/gemini/evidence-extraction"
import {
  lookupSquadAccount,
  resolveSquadBank,
  type SquadAccountLookupResult,
} from "@/lib/squad/accounts"

export type EvidenceAnalysisStatus =
  | "not_required"
  | "missing"
  | "verified"
  | "needs_review"
  | "mismatch"

export type PaymentEvidenceAnalysis = {
  status: EvidenceAnalysisStatus
  extraction: InvoiceExtractionResult
  squadLookup?: SquadAccountLookupResult
  extractedAccountNumber?: string
  extractedAccountName?: string
  extractedBankName?: string
  extractedBankCode?: string
  extractedAmountKobo?: number
  extractedVendorName?: string
  invoiceNumber?: string
  confidence: number
  accountMatchStatus: "match" | "mismatch" | "missing" | "unverified"
  amountMatchStatus: "match" | "mismatch" | "missing"
  vendorNameMatchStatus: "match" | "mismatch" | "missing"
  duplicateEvidenceHint: boolean
  summary: string
  extractionPayload: string
  squadLookupPayload?: string
}

const businessStopWords = new Set([
  "and",
  "company",
  "enterprise",
  "enterprises",
  "limited",
  "ltd",
  "nig",
  "nigeria",
  "plc",
  "services",
  "the",
])

function normalizeAccountNumber(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? ""

  return digits.length >= 10 ? digits.slice(-10) : undefined
}

function normalizeText(value?: string) {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  )
}

function meaningfulTokens(value?: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !businessStopWords.has(token))
}

function namesLikelyMatch(left?: string, right?: string) {
  const leftTokens = meaningfulTokens(left)
  const rightTokens = meaningfulTokens(right)

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false
  }

  const leftJoined = leftTokens.join("")
  const rightJoined = rightTokens.join("")

  if (leftJoined.includes(rightJoined) || rightJoined.includes(leftJoined)) {
    return true
  }

  const rightSet = new Set(rightTokens)
  const shared = leftTokens.filter((token) => rightSet.has(token)).length

  return shared / Math.min(leftTokens.length, rightTokens.length) >= 0.5
}

function getAmountMatchStatus(input: {
  requestAmountKobo: number
  extractedAmountKobo?: number
}) {
  if (!input.extractedAmountKobo) {
    return "missing" as const
  }

  const difference = Math.abs(input.requestAmountKobo - input.extractedAmountKobo)
  const tolerance = Math.max(1_000, Math.round(input.requestAmountKobo * 0.02))

  return difference <= tolerance ? "match" : "mismatch"
}

function buildSummary(input: {
  accountMatchStatus: PaymentEvidenceAnalysis["accountMatchStatus"]
  amountMatchStatus: PaymentEvidenceAnalysis["amountMatchStatus"]
  vendorNameMatchStatus: PaymentEvidenceAnalysis["vendorNameMatchStatus"]
  squadLookup?: SquadAccountLookupResult
  extraction: InvoiceExtractionResult
}) {
  if (input.accountMatchStatus === "mismatch") {
    return "Invoice bank details do not match the vendor or Squad lookup result."
  }

  if (input.amountMatchStatus === "mismatch") {
    return "Invoice amount differs from the requested payout amount."
  }

  if (input.squadLookup?.status === "verified") {
    return "Invoice evidence was extracted and the bank account was verified through Squad."
  }

  if (input.extraction.status === "extracted") {
    return "Invoice evidence was extracted, but account verification still needs review."
  }

  return input.extraction.summary
}

export async function analyzePaymentEvidence(input: {
  fileBytes?: Buffer
  fileName?: string
  mimeType?: string
  requestTitle: string
  requestAmountKobo: number
  vendorName?: string
  knownVendorAccountNumber?: string
  duplicateEvidenceHint: boolean
}): Promise<PaymentEvidenceAnalysis | undefined> {
  if (!input.fileBytes || !input.fileName || !input.mimeType) {
    return undefined
  }

  const extraction = await extractInvoiceEvidence({
    fileBytes: input.fileBytes,
    mimeType: input.mimeType,
    fileName: input.fileName,
    requestTitle: input.requestTitle,
    requestAmountKobo: input.requestAmountKobo,
    vendorName: input.vendorName,
  })
  const extracted = extraction.extraction
  const bank = resolveSquadBank({
    bankCode: extracted?.bankCode,
    bankName: extracted?.bankName,
  })
  const extractedAccountNumber = normalizeAccountNumber(extracted?.accountNumber)
  const knownVendorAccountNumber = normalizeAccountNumber(input.knownVendorAccountNumber)
  const extractedAmountKobo =
    typeof extracted?.totalAmountNaira === "number"
      ? Math.round(extracted.totalAmountNaira * 100)
      : undefined
  const squadLookup =
    extractedAccountNumber || bank.bankCode
      ? await lookupSquadAccount({
          bankCode: bank.bankCode,
          bankName: bank.bankName ?? extracted?.bankName,
          accountNumber: extractedAccountNumber,
          fallbackAccountName: extracted?.accountName ?? extracted?.vendorName,
        })
      : undefined
  const squadNameMatchesVendor = namesLikelyMatch(
    squadLookup?.accountName,
    input.vendorName || extracted?.vendorName,
  )
  const invoiceNameMatchesVendor = namesLikelyMatch(
    extracted?.accountName || extracted?.vendorName,
    input.vendorName,
  )
  const accountMatchStatus: PaymentEvidenceAnalysis["accountMatchStatus"] =
    knownVendorAccountNumber && extractedAccountNumber
      ? knownVendorAccountNumber === extractedAccountNumber
        ? "match"
        : "mismatch"
      : squadLookup?.status === "verified"
        ? squadNameMatchesVendor || namesLikelyMatch(squadLookup.accountName, extracted?.accountName)
          ? "match"
          : "mismatch"
        : extractedAccountNumber
          ? "unverified"
          : "missing"
  const amountMatchStatus = getAmountMatchStatus({
    requestAmountKobo: input.requestAmountKobo,
    extractedAmountKobo,
  })
  const vendorNameMatchStatus: PaymentEvidenceAnalysis["vendorNameMatchStatus"] =
    !input.vendorName || (!extracted?.vendorName && !extracted?.accountName)
      ? "missing"
      : invoiceNameMatchesVendor
        ? "match"
        : "mismatch"
  const summary = buildSummary({
    accountMatchStatus,
    amountMatchStatus,
    vendorNameMatchStatus,
    squadLookup,
    extraction,
  })
  const status: EvidenceAnalysisStatus =
    accountMatchStatus === "mismatch" ||
    amountMatchStatus === "mismatch" ||
    vendorNameMatchStatus === "mismatch"
      ? "mismatch"
      : accountMatchStatus === "match"
        ? "verified"
        : "needs_review"

  return {
    status,
    extraction,
    squadLookup,
    extractedAccountNumber,
    extractedAccountName: extracted?.accountName,
    extractedBankName: bank.bankName ?? extracted?.bankName,
    extractedBankCode: bank.bankCode ?? extracted?.bankCode,
    extractedAmountKobo,
    extractedVendorName: extracted?.vendorName,
    invoiceNumber: extracted?.invoiceNumber,
    confidence: extraction.confidence,
    accountMatchStatus,
    amountMatchStatus,
    vendorNameMatchStatus,
    duplicateEvidenceHint: input.duplicateEvidenceHint,
    summary,
    extractionPayload: JSON.stringify({
      status: extraction.status,
      extraction: extracted,
      rawText: extraction.rawText,
    }).slice(0, 4000),
    squadLookupPayload: squadLookup?.rawPayload.slice(0, 2000),
  }
}
