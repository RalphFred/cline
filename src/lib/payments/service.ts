import "server-only"

import { ID, Query, type Models } from "appwrite"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import type {
  CreatePaymentRequestInput,
} from "@/lib/payments/schemas"
import type {
  PaymentRequestSummary,
  PaymentRequestTimelineItem,
  PaymentRequestType,
  RiskBand,
} from "@/lib/payments/types"
import {
  executeSquadTransfer,
  requerySquadTransfer,
} from "@/lib/squad/transfers"

type AppwriteDataDocument = Models.Document & Record<string, unknown>

type WorkspaceContext = {
  organizationId: string
  memberId: string
  userProfileId: string
}

const requestTypeLabels: Record<PaymentRequestType, string> = {
  vendor_payment: "Vendor payment",
  staff_cash_request: "Field cash",
  airtime_data_request: "Airtime/data",
  utility_payment: "Utility bill",
  manual_business_expense: "Reimbursement",
}

function getDocumentId(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "$id" in value &&
    typeof value.$id === "string"
  ) {
    return value.$id
  }

  return ""
}

function getDocumentString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function getPaymentRequestType(value: unknown): PaymentRequestType {
  if (
    value === "vendor_payment" ||
    value === "airtime_data_request" ||
    value === "utility_payment" ||
    value === "manual_business_expense"
  ) {
    return value
  }

  return "staff_cash_request"
}

function formatShortDate(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return "Recently"
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function parseDescription(description: unknown) {
  const raw = getDocumentString(description)
  const fallback = {
    purpose: raw,
    location: "Field route",
    urgency: "Today",
    neededBy: "Today",
    invoiceReference: "",
    vendorName: "",
    bankName: "",
    accountNumber: "",
  }

  if (!raw.trim().startsWith("{")) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as Partial<typeof fallback>

    return {
      purpose: getDocumentString(parsed.purpose, fallback.purpose),
      location: getDocumentString(parsed.location, fallback.location),
      urgency: getDocumentString(parsed.urgency, fallback.urgency),
      neededBy: getDocumentString(parsed.neededBy, fallback.neededBy),
      invoiceReference: getDocumentString(parsed.invoiceReference),
      vendorName: getDocumentString(parsed.vendorName),
      bankName: getDocumentString(parsed.bankName),
      accountNumber: getDocumentString(parsed.accountNumber),
    }
  } catch {
    return fallback
  }
}

function calculateRequestRisk(input: {
  requestType: PaymentRequestType
  amountKobo: number
  urgency: string
  hasEvidence: boolean
}) {
  const rules: Array<{
    code: string
    label: string
    outcome: "pass" | "flag" | "fail"
    details: string
  }> = []
  let score = 0.18

  if (input.amountKobo >= 2_000_000_00) {
    score += 0.34
    rules.push({
      code: "large_outgoing_amount",
      label: "Large outgoing amount",
      outcome: "flag",
      details: "Amount is above the normal fast-field approval band.",
    })
  } else {
    rules.push({
      code: "amount_in_normal_band",
      label: "Amount in normal band",
      outcome: "pass",
      details: "Amount is inside the common operating range for this workflow.",
    })
  }

  if (
    (input.requestType === "vendor_payment" ||
      input.requestType === "utility_payment" ||
      input.requestType === "manual_business_expense") &&
    !input.hasEvidence
  ) {
    score += 0.24
    rules.push({
      code: "supporting_file_missing",
      label: "Supporting file missing",
      outcome: "flag",
      details: "Invoice, receipt, bill, or proof of address was not attached.",
    })
  } else {
    rules.push({
      code: "supporting_file_present",
      label: "Supporting file present",
      outcome: "pass",
      details: "Evidence is attached for Super Admin review.",
    })
  }

  if (input.urgency === "Immediate") {
    score += 0.16
    rules.push({
      code: "urgent_request",
      label: "Urgent request",
      outcome: "flag",
      details: "Immediate money movement deserves a closer human check.",
    })
  }

  const riskScore = Math.min(0.92, Number(score.toFixed(2)))
  const riskBand: RiskBand =
    riskScore >= 0.68 ? "high" : riskScore >= 0.38 ? "medium" : "low"
  const topFlag =
    rules.find((rule) => rule.outcome === "flag")?.label ?? "Low concern"

  return {
    riskScore,
    anomalyScore: Number(Math.min(0.96, riskScore * 0.82 + 0.08).toFixed(2)),
    riskBand,
    topFlag,
    rules,
    summary:
      riskBand === "high"
        ? "Frank flags this for close review because the amount or evidence profile is unusual."
        : riskBand === "medium"
          ? "Frank sees review signals, but the request can proceed after Super Admin approval."
          : "Frank sees a normal operating pattern. Human approval is still required.",
  }
}

async function createOrFindVendor(params: {
  organizationId: string
  vendorName?: string
  bankName?: string
  accountNumber?: string
}) {
  if (!params.vendorName || !params.bankName || !params.accountNumber) {
    return undefined
  }

  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const existing = await databases.listDocuments(
    ids.databaseId,
    ids.collections.vendors,
    [
      Query.equal("organizationId", [params.organizationId]),
      Query.equal("accountNumber", [params.accountNumber]),
      Query.limit(1),
    ],
  )

  if (existing.documents[0]) {
    return existing.documents[0].$id
  }

  const now = new Date().toISOString()
  const vendor = await databases.createDocument(
    ids.databaseId,
    ids.collections.vendors,
    ID.unique(),
    {
      organizationId: params.organizationId,
      displayName: params.vendorName,
      bankCode: "manual",
      bankName: params.bankName,
      accountNumber: params.accountNumber,
      resolvedAccountName: params.vendorName,
      status: "normal",
      firstSeenAt: now,
      totalPaidKobo: 0,
    },
  )

  return vendor.$id
}

async function createRequestEvidence(params: {
  requestId: string
  memberId: string
  file?: File | null
  fallbackFileName?: string
}) {
  const fileName =
    params.file && params.file.size > 0
      ? params.file.name
      : params.fallbackFileName

  if (!fileName) {
    return undefined
  }

  const ids = getAppwriteIds()
  const { databases, storage } = createAppwriteAdminClient()
  const uploadedAt = new Date().toISOString()
  let bucketFileId = `metadata-${ID.unique()}`
  let mimeType = "text/plain"
  let sizeBytes = 0

  if (params.file && params.file.size > 0) {
    mimeType = params.file.type || "application/octet-stream"
    sizeBytes = params.file.size

    try {
      const uploadedFile = await storage.createFile({
        bucketId: ids.buckets.requestEvidence,
        fileId: ID.unique(),
        file: params.file,
      })

      bucketFileId = uploadedFile.$id
    } catch {
      bucketFileId = `pending-storage-${ID.unique()}`
    }
  }

  return await databases.createDocument(
    ids.databaseId,
    ids.collections.requestEvidence,
    ID.unique(),
    {
      paymentRequestId: params.requestId,
      bucketFileId,
      fileName,
      mimeType,
      sizeBytes,
      uploadedByMemberId: params.memberId,
      uploadedAt,
      status: "uploaded",
    },
  )
}

export async function createPaymentRequest(params: {
  context: WorkspaceContext
  input: CreatePaymentRequestInput
  evidenceFile?: File | null
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const requestId = ID.unique()
  const submittedAt = new Date().toISOString()
  const amountKobo = Math.round(params.input.amountNaira * 100)
  const hasEvidence =
    Boolean(params.evidenceFile && params.evidenceFile.size > 0) ||
    Boolean(params.input.invoiceReference)
  const risk = calculateRequestRisk({
    requestType: params.input.requestType,
    amountKobo,
    urgency: params.input.urgency,
    hasEvidence,
  })
  const vendorId =
    params.input.requestType === "vendor_payment"
      ? await createOrFindVendor({
          organizationId: params.context.organizationId,
          vendorName: params.input.vendorName,
          bankName: params.input.bankName,
          accountNumber: params.input.accountNumber,
        })
      : undefined
  const description = JSON.stringify({
    purpose: params.input.purpose,
    location: params.input.recipientOrLocation,
    urgency: params.input.urgency,
    neededBy: params.input.neededBy || params.input.urgency,
    invoiceReference: params.input.invoiceReference,
    vendorName: params.input.vendorName,
    bankName: params.input.bankName,
    accountNumber: params.input.accountNumber,
  })

  await databases.createDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    requestId,
    {
      organizationId: params.context.organizationId,
      vendorId,
      beneficiaryUserProfileId:
        params.input.requestType === "vendor_payment"
          ? undefined
          : params.context.userProfileId,
      submittedByMemberId: params.context.memberId,
      requestType: params.input.requestType,
      title: params.input.title,
      description,
      amountKobo,
      status: "submitted",
      proofRequired:
        params.input.requestType === "staff_cash_request" ||
        params.input.requestType === "utility_payment" ||
        params.input.requestType === "manual_business_expense",
      submittedAt,
    },
  )

  await createRequestEvidence({
    requestId,
    memberId: params.context.memberId,
    file: params.evidenceFile,
    fallbackFileName: params.input.invoiceReference,
  })

  const riskEvaluation = await databases.createDocument(
    ids.databaseId,
    ids.collections.riskEvaluations,
    ID.unique(),
    {
      targetId: requestId,
      targetType: "payment_request",
      riskScore: risk.riskScore,
      anomalyScore: risk.anomalyScore,
      riskBand: risk.riskBand,
      summary: risk.summary,
      computedAt: submittedAt,
    },
  )

  await Promise.all([
    databases.createDocument(ids.databaseId, ids.collections.modelScores, ID.unique(), {
      riskEvaluationId: riskEvaluation.$id,
      modelName: "demo-xgboost-risk",
      modelVersion: "2026.05",
      scoreType: "risk_score",
      scoreValue: risk.riskScore,
      rawPayload: JSON.stringify({ topFlag: risk.topFlag }),
    }),
    ...risk.rules.map((rule) =>
      databases.createDocument(ids.databaseId, ids.collections.ruleResults, ID.unique(), {
        riskEvaluationId: riskEvaluation.$id,
        ruleCode: rule.code,
        label: rule.label,
        outcome: rule.outcome,
        details: rule.details,
      }),
    ),
    databases.createDocument<AppwriteDataDocument>(ids.databaseId, ids.collections.auditEvents, ID.unique(), {
      organizationId: params.context.organizationId,
      actorUserProfileId: params.context.memberId,
      entityType: "payment_request",
      entityId: requestId,
      action: "payment_request_submitted",
      summary: `${requestTypeLabels[params.input.requestType]} request "${params.input.title}" was submitted for Super Admin approval.`,
      occurredAt: submittedAt,
      payload: JSON.stringify({ riskScore: risk.riskScore, topFlag: risk.topFlag }),
    }),
    databases.createDocument(ids.databaseId, ids.collections.alerts, ID.unique(), {
      organizationId: params.context.organizationId,
      title: "Outgoing request awaiting decision",
      message: `${params.input.title} needs Super Admin approval before payout.`,
      severity: risk.riskBand === "high" ? "critical" : "warning",
      status: "open",
      paymentRequestId: requestId,
      createdAtIso: submittedAt,
    }),
  ])

  return await getPaymentRequestSummary(requestId)
}

export async function attachPaymentRequestProof(params: {
  organizationId: string
  memberId: string
  requestId: string
  proofFile?: File | null
  note?: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const request = await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    params.requestId,
  )

  if (getDocumentId((request as AppwriteDataDocument).organizationId) !== params.organizationId) {
    throw new Error("This request belongs to another workspace.")
  }

  await createRequestEvidence({
    requestId: params.requestId,
    memberId: params.memberId,
    file: params.proofFile,
    fallbackFileName: params.note,
  })

  const now = new Date().toISOString()

  await databases.createDocument(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: params.organizationId,
      actorUserProfileId: params.memberId,
      entityType: "payment_request",
      entityId: params.requestId,
      action: "payment_request_proof_uploaded",
      summary: `Proof was uploaded for ${String((request as AppwriteDataDocument).title)}.`,
      occurredAt: now,
      payload: params.note,
    },
  )

  return await getPaymentRequestSummary(params.requestId)
}

export async function decidePaymentRequest(params: {
  organizationId: string
  decidedByUserProfileId: string
  requestId: string
  decision: "approved" | "rejected"
  comment?: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const request = (await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    params.requestId,
  )) as AppwriteDataDocument

  if (getDocumentId(request.organizationId) !== params.organizationId) {
    throw new Error("This request belongs to another workspace.")
  }

  if (request.status !== "submitted") {
    return await getPaymentRequestSummary(params.requestId)
  }

  const now = new Date().toISOString()

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    params.requestId,
    { status: params.decision },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.approvalDecisions,
    ID.unique(),
    {
      paymentRequestId: params.requestId,
      decidedByUserProfileId: params.decidedByUserProfileId,
      decision: params.decision,
      comment: params.comment,
      decidedAt: now,
    },
  )

  const relatedAlerts = await databases.listDocuments(
    ids.databaseId,
    ids.collections.alerts,
    [
      Query.equal("paymentRequestId", [params.requestId]),
      Query.equal("status", ["open"]),
      Query.limit(20),
    ],
  )

  const writes: Array<Promise<unknown>> = [
    databases.createDocument<AppwriteDataDocument>(ids.databaseId, ids.collections.auditEvents, ID.unique(), {
      organizationId: params.organizationId,
      actorUserProfileId: params.decidedByUserProfileId,
      entityType: "payment_request",
      entityId: params.requestId,
      action: `payment_request_${params.decision}`,
      summary: `${String(request.title)} was ${params.decision} by Super Admin.`,
      occurredAt: now,
      payload: params.comment,
    }),
    ...relatedAlerts.documents.map((alert) =>
      databases.updateDocument(
        ids.databaseId,
        ids.collections.alerts,
        alert.$id,
        { status: "resolved" },
      ),
    ),
  ]

  if (params.decision === "approved") {
    const details = parseDescription(request.description)
    const transfer = await executeSquadTransfer({
      requestId: params.requestId,
      amountKobo: Number(request.amountKobo ?? 0),
      bankCode: getDocumentString(
        (request.vendorId as AppwriteDataDocument | undefined)?.bankCode,
        "manual",
      ),
      bankName:
        getDocumentString(
          (request.vendorId as AppwriteDataDocument | undefined)?.bankName,
        ) || details.bankName,
      accountNumber:
        getDocumentString(
          (request.vendorId as AppwriteDataDocument | undefined)?.accountNumber,
        ) || details.accountNumber,
      accountName:
        getDocumentString(
          (request.vendorId as AppwriteDataDocument | undefined)
            ?.resolvedAccountName,
        ) || details.vendorName,
      recipientLabel: details.vendorName || details.location,
      remark: `Cline payout for ${String(request.title).slice(0, 80)}`,
    })
    const transferStatus =
      transfer.status === "success"
        ? "success"
        : transfer.status === "failed"
          ? "failed"
          : transfer.status === "unknown"
            ? "unknown"
            : "processing"

    writes.push(
      databases.createDocument<AppwriteDataDocument>(ids.databaseId, ids.collections.transfers, ID.unique(), {
        paymentRequestId: params.requestId,
        provider: "squad",
        providerReference: transfer.reference,
        amountKobo: Number(request.amountKobo ?? 0),
        status: transferStatus,
        submittedAt: now,
        resolvedAt: transferStatus === "success" || transferStatus === "failed" ? now : undefined,
        rawProviderPayload: JSON.stringify({
          mode: transfer.mode,
          providerMessage: transfer.providerMessage,
          rawPayload: transfer.rawPayload,
        }),
      }),
      databases.createDocument<AppwriteDataDocument>(
        ids.databaseId,
        ids.collections.auditEvents,
        ID.unique(),
        {
          organizationId: params.organizationId,
          actorUserProfileId: params.decidedByUserProfileId,
          entityType: "transfer",
          entityId: params.requestId,
          action: `squad_transfer_${transferStatus}`,
          summary:
            transferStatus === "success"
              ? `${String(request.title)} was sent through ${transfer.mode === "live" ? "Squad" : "the simulated Squad payout path"}.`
              : `Squad payout for ${String(request.title)} is ${transferStatus}.`,
          occurredAt: now,
          payload: transfer.rawPayload,
        },
      ),
    )

    if (transferStatus === "success") {
      writes.push(
        databases.createDocument<AppwriteDataDocument>(ids.databaseId, ids.collections.ledgerEntries, ID.unique(), {
          organizationId: params.organizationId,
          entryReference: transfer.reference,
          sourceId: params.requestId,
          sourceType: "payment_request",
          direction: "debit",
          amountKobo: Number(request.amountKobo ?? 0),
          narration: `Approved outgoing payment: ${String(request.title)}`,
          recordedAt: now,
        }),
      )
    }
  }

  await Promise.all(writes)
  return await getPaymentRequestSummary(params.requestId)
}

export async function requeryPaymentRequestTransfer(params: {
  organizationId: string
  actorUserProfileId: string
  requestId: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const request = (await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    params.requestId,
  )) as AppwriteDataDocument

  if (getDocumentId(request.organizationId) !== params.organizationId) {
    throw new Error("This request belongs to another workspace.")
  }

  const transfers = await databases.listDocuments(
    ids.databaseId,
    ids.collections.transfers,
    [
      Query.equal("paymentRequestId", [params.requestId]),
      Query.orderDesc("submittedAt"),
      Query.limit(1),
    ],
  )
  const transfer = transfers.documents[0] as AppwriteDataDocument | undefined
  const reference = getDocumentString(transfer?.providerReference)

  if (!transfer || !reference) {
    throw new Error("No Squad payout exists for this request yet.")
  }

  const result = await requerySquadTransfer({ reference })
  const now = new Date().toISOString()
  const nextStatus =
    result.status === "success"
      ? "success"
      : result.status === "failed"
        ? "failed"
        : result.status === "unknown"
          ? "unknown"
          : "processing"

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.transfers,
    transfer.$id,
    {
      status: nextStatus,
      resolvedAt: nextStatus === "success" || nextStatus === "failed" ? now : undefined,
      rawProviderPayload: JSON.stringify({
        mode: result.mode,
        providerMessage: result.providerMessage,
        rawPayload: result.rawPayload,
      }),
    },
  )

  if (nextStatus === "success") {
    const existingLedger = await databases.listDocuments(
      ids.databaseId,
      ids.collections.ledgerEntries,
      [Query.equal("entryReference", [reference]), Query.limit(1)],
    )

    if (!existingLedger.documents[0]) {
      await databases.createDocument<AppwriteDataDocument>(
        ids.databaseId,
        ids.collections.ledgerEntries,
        ID.unique(),
        {
          organizationId: params.organizationId,
          entryReference: reference,
          sourceId: params.requestId,
          sourceType: "payment_request",
          direction: "debit",
          amountKobo: Number(transfer.amountKobo ?? request.amountKobo ?? 0),
          narration: `Approved outgoing payment: ${String(request.title)}`,
          recordedAt: now,
        },
      )
    }
  }

  await databases.createDocument<AppwriteDataDocument>(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: params.organizationId,
      actorUserProfileId: params.actorUserProfileId,
      entityType: "payment_request",
      entityId: params.requestId,
      action: `squad_transfer_requery_${nextStatus}`,
      summary: `Squad payout ${reference} was requeried and is ${nextStatus}.`,
      occurredAt: now,
      payload: result.rawPayload,
    },
  )

  return await getPaymentRequestSummary(params.requestId)
}

export async function markPaymentRequestProofStatus(params: {
  organizationId: string
  actorUserProfileId: string
  requestId: string
  status: "verified" | "flagged"
  comment: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const request = (await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    params.requestId,
  )) as AppwriteDataDocument

  if (getDocumentId(request.organizationId) !== params.organizationId) {
    throw new Error("This request belongs to another workspace.")
  }

  const evidence = await databases.listDocuments(
    ids.databaseId,
    ids.collections.requestEvidence,
    [
      Query.equal("paymentRequestId", [params.requestId]),
      Query.orderDesc("uploadedAt"),
      Query.limit(1),
    ],
  )
  const latestEvidence = evidence.documents[0]

  if (!latestEvidence) {
    throw new Error("No proof has been uploaded for this request yet.")
  }

  const now = new Date().toISOString()

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.requestEvidence,
    latestEvidence.$id,
    { status: params.status },
  )

  await databases.createDocument<AppwriteDataDocument>(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: params.organizationId,
      actorUserProfileId: params.actorUserProfileId,
      entityType: "payment_request",
      entityId: params.requestId,
      action:
        params.status === "verified"
          ? "payment_request_proof_verified"
          : "payment_request_proof_flagged",
      summary:
        params.status === "verified"
          ? `Proof for ${String(request.title)} was accepted by Super Admin.`
          : `Proof for ${String(request.title)} still needs correction.`,
      occurredAt: now,
      payload: params.comment,
    },
  )

  return await getPaymentRequestSummary(params.requestId)
}

export async function listPaymentRequestSummaries(params: {
  organizationId: string
  submittedByMemberId?: string
  limit?: number
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const queries = [
    Query.equal("organizationId", [params.organizationId]),
    Query.orderDesc("submittedAt"),
    Query.limit(params.limit ?? 20),
  ]

  if (params.submittedByMemberId) {
    queries.push(Query.equal("submittedByMemberId", [params.submittedByMemberId]))
  }

  const response = await databases.listDocuments(
    ids.databaseId,
    ids.collections.paymentRequests,
    queries,
  )

  return await hydratePaymentRequestSummaries(response.documents)
}

export async function getPaymentRequestSummary(requestId: string) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const request = await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    requestId,
  )

  return (await hydratePaymentRequestSummaries([request]))[0]
}

async function hydratePaymentRequestSummaries(documents: Models.Document[]) {
  if (documents.length === 0) {
    return []
  }

  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const requestIds = documents.map((document) => document.$id)
  const [evidence, risks, decisions, transfers] = await Promise.all([
    databases.listDocuments(ids.databaseId, ids.collections.requestEvidence, [
      Query.equal("paymentRequestId", requestIds),
      Query.orderDesc("uploadedAt"),
      Query.limit(100),
    ]),
    databases.listDocuments(ids.databaseId, ids.collections.riskEvaluations, [
      Query.equal("targetId", requestIds),
      Query.equal("targetType", ["payment_request"]),
      Query.orderDesc("computedAt"),
      Query.limit(100),
    ]),
    databases.listDocuments(ids.databaseId, ids.collections.approvalDecisions, [
      Query.equal("paymentRequestId", requestIds),
      Query.orderDesc("decidedAt"),
      Query.limit(100),
    ]),
    databases.listDocuments(ids.databaseId, ids.collections.transfers, [
      Query.equal("paymentRequestId", requestIds),
      Query.orderDesc("submittedAt"),
      Query.limit(100),
    ]),
  ])
  const riskIds = risks.documents.map((document) => document.$id)
  const [modelScores, ruleResults, auditEvents] =
    riskIds.length > 0
      ? await Promise.all([
          databases.listDocuments(ids.databaseId, ids.collections.modelScores, [
            Query.equal("riskEvaluationId", riskIds),
            Query.limit(100),
          ]),
          databases.listDocuments(ids.databaseId, ids.collections.ruleResults, [
            Query.equal("riskEvaluationId", riskIds),
            Query.limit(100),
          ]),
          databases.listDocuments(ids.databaseId, ids.collections.auditEvents, [
            Query.equal("entityType", ["payment_request"]),
            Query.equal("entityId", requestIds),
            Query.orderDesc("occurredAt"),
            Query.limit(100),
          ]),
        ])
      : await Promise.all([
          Promise.resolve({ documents: [] as Models.Document[] }),
          Promise.resolve({ documents: [] as Models.Document[] }),
          databases.listDocuments(ids.databaseId, ids.collections.auditEvents, [
            Query.equal("entityType", ["payment_request"]),
            Query.equal("entityId", requestIds),
            Query.orderDesc("occurredAt"),
            Query.limit(100),
          ]),
        ])
  const evidenceByRequest = new Map<string, AppwriteDataDocument[]>()
  const riskByRequest = new Map<string, AppwriteDataDocument>()
  const decisionByRequest = new Map<string, AppwriteDataDocument>()
  const transferByRequest = new Map<string, AppwriteDataDocument>()
  const modelScoresByRisk = new Map<string, AppwriteDataDocument[]>()
  const ruleResultsByRisk = new Map<string, AppwriteDataDocument[]>()
  const auditByRequest = new Map<string, AppwriteDataDocument[]>()

  for (const document of evidence.documents) {
    const data = document as AppwriteDataDocument
    const requestId = getDocumentId(data.paymentRequestId)

    if (requestId) {
      evidenceByRequest.set(requestId, [
        ...(evidenceByRequest.get(requestId) ?? []),
        data,
      ])
    }
  }

  for (const document of risks.documents) {
    const data = document as AppwriteDataDocument
    const requestId = getDocumentString(data.targetId)

    if (requestId && !riskByRequest.has(requestId)) {
      riskByRequest.set(requestId, data)
    }
  }

  for (const document of decisions.documents) {
    const data = document as AppwriteDataDocument
    const requestId = getDocumentId(data.paymentRequestId)

    if (requestId && !decisionByRequest.has(requestId)) {
      decisionByRequest.set(requestId, data)
    }
  }

  for (const document of transfers.documents) {
    const data = document as AppwriteDataDocument
    const requestId = getDocumentId(data.paymentRequestId)

    if (requestId && !transferByRequest.has(requestId)) {
      transferByRequest.set(requestId, data)
    }
  }

  for (const document of modelScores.documents) {
    const data = document as AppwriteDataDocument
    const riskId = getDocumentId(data.riskEvaluationId)

    if (riskId) {
      modelScoresByRisk.set(riskId, [
        ...(modelScoresByRisk.get(riskId) ?? []),
        data,
      ])
    }
  }

  for (const document of ruleResults.documents) {
    const data = document as AppwriteDataDocument
    const riskId = getDocumentId(data.riskEvaluationId)

    if (riskId) {
      ruleResultsByRisk.set(riskId, [
        ...(ruleResultsByRisk.get(riskId) ?? []),
        data,
      ])
    }
  }

  for (const document of auditEvents.documents) {
    const data = document as AppwriteDataDocument
    const requestId = getDocumentString(data.entityId)

    if (requestId) {
      auditByRequest.set(requestId, [
        ...(auditByRequest.get(requestId) ?? []),
        data,
      ])
    }
  }

  return documents.map((document) => {
    const data = document as AppwriteDataDocument
    const requestType = getPaymentRequestType(data.requestType)
    const status =
      data.status === "approved" || data.status === "rejected"
        ? data.status
        : "submitted"
    const details = parseDescription(data.description)
    const submittedAt = getDocumentString(data.submittedAt, document.$createdAt)
    const risk = riskByRequest.get(document.$id)
    const evidenceItems = evidenceByRequest.get(document.$id) ?? []
    const latestEvidence = evidenceItems[0]
    const decision = decisionByRequest.get(document.$id)
    const transfer = transferByRequest.get(document.$id)
    const transferPayload = getDocumentString(transfer?.rawProviderPayload)
    const transferMeta = parseTransferPayload(transferPayload)
    const riskBand: RiskBand =
      risk?.riskBand === "high" || risk?.riskBand === "medium"
        ? risk.riskBand
        : "low"
    const hasProof = Boolean(latestEvidence?.fileName)
    const proofRequired = Boolean(data.proofRequired)
    const timeline: PaymentRequestTimelineItem[] = [
      { label: "Submitted", state: "done" },
      {
        label: "Risk checked",
        state: risk ? "done" : "current",
      },
      {
        label:
          status === "approved"
            ? "Approved"
            : status === "rejected"
              ? "Rejected"
              : "Super Admin decision",
        state: status === "submitted" ? "current" : "done",
      },
    ]

    if (transfer?.providerReference) {
      timeline.push({
        label:
          transfer.status === "success"
            ? "Squad payout completed"
            : "Squad payout pending",
        state: transfer.status === "success" ? "done" : "current",
      })
    }

    if (proofRequired) {
      timeline.push({
        label: hasProof ? "Proof uploaded" : "Proof due",
        state: hasProof ? "done" : status === "approved" ? "current" : "waiting",
      })
    }

    return {
      id: document.$id,
      title: String(data.title),
      amountKobo: Number(data.amountKobo ?? 0),
      requestType,
      purpose: details.purpose,
      location: details.location,
      urgency: details.urgency,
      submittedAt: formatShortDate(submittedAt),
      neededBy: details.neededBy,
      status,
      riskBand,
      riskScore:
        typeof risk?.riskScore === "number" ? Number(risk.riskScore) : 0.18,
      proofRequired,
      proofFileName: latestEvidence?.fileName
        ? String(latestEvidence.fileName)
        : undefined,
      frankNote:
        typeof risk?.summary === "string"
          ? risk.summary
          : "Frank will score this request after it is submitted.",
      topFlag:
        riskBand === "low"
          ? "Low concern"
          : details.invoiceReference
            ? "Review requested evidence"
            : "Supporting file missing",
      submitterName: getDocumentString(
        (data.submittedByMemberId as AppwriteDataDocument | undefined)?.name,
      ),
      transferReference: getDocumentString(transfer?.providerReference),
      transferStatus:
        transfer?.status === "queued" ||
        transfer?.status === "processing" ||
        transfer?.status === "success" ||
        transfer?.status === "failed" ||
        transfer?.status === "unknown"
          ? transfer.status
          : undefined,
      transfer: transfer?.providerReference
        ? {
            provider: "squad",
            reference: getDocumentString(transfer.providerReference),
            status:
              transfer.status === "queued" ||
              transfer.status === "processing" ||
              transfer.status === "success" ||
              transfer.status === "failed" ||
              transfer.status === "unknown"
                ? transfer.status
                : "unknown",
            amountKobo: Number(transfer.amountKobo ?? 0),
            submittedAt: getDocumentString(transfer.submittedAt),
            resolvedAt: getDocumentString(transfer.resolvedAt),
            mode: transferMeta.mode,
            providerMessage: transferMeta.providerMessage,
          }
        : undefined,
      decisionComment: getDocumentString(decision?.comment),
      decisionAt: getDocumentString(decision?.decidedAt),
      evidence: evidenceItems.map((item) => ({
        id: item.$id,
        fileName: getDocumentString(item.fileName, "Evidence"),
        fileType: getDocumentString(item.mimeType, "file"),
        uploadedAt: formatShortDate(getDocumentString(item.uploadedAt, item.$createdAt)),
        uploadedByMemberId: getDocumentString(item.uploadedByMemberId),
        status: getDocumentString(item.status, "uploaded"),
      })),
      rules: (risk ? ruleResultsByRisk.get(risk.$id) ?? [] : []).map((rule) => ({
        code: getDocumentString(rule.ruleCode),
        label: getDocumentString(rule.label, "Rule check"),
        outcome:
          rule.outcome === "fail" || rule.outcome === "flag"
            ? rule.outcome
            : "pass",
        details: getDocumentString(rule.details),
      })),
      modelScores: (risk ? modelScoresByRisk.get(risk.$id) ?? [] : []).map(
        (score) => ({
          modelName: getDocumentString(score.modelName, "demo-model"),
          modelVersion: getDocumentString(score.modelVersion, "demo"),
          scoreType:
            score.scoreType === "anomaly_score"
              ? "anomaly_score"
              : "risk_score",
          scoreValue: Number(score.scoreValue ?? 0),
        }),
      ),
      auditTrail: (auditByRequest.get(document.$id) ?? []).map((event) => ({
        action: getDocumentString(event.action),
        summary: getDocumentString(event.summary),
        occurredAt: formatShortDate(
          getDocumentString(event.occurredAt, event.$createdAt),
        ),
      })),
      timeline,
    } satisfies PaymentRequestSummary
  })
}

function parseTransferPayload(raw: string) {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as {
      mode?: "live" | "simulated"
      providerMessage?: string
    }

    return {
      mode:
        parsed.mode === "live" || parsed.mode === "simulated"
          ? parsed.mode
          : undefined,
      providerMessage: getDocumentString(parsed.providerMessage),
    }
  } catch {
    return {}
  }
}
