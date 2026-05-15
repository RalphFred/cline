import "server-only"

import { ID, Query, type Models } from "appwrite"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import type { SquadPosPaymentStatus } from "@/lib/squad/pos"

type AppwriteDataDocument = Models.Document & Record<string, unknown>

type SalePaymentData = {
  id: string
  organizationId: string
  createdByMemberId: string
  title: string
  expectedAmountKobo: number
  status: "pending_payment" | "paid" | "mismatch_flagged"
  paymentSourceExpected: "bank_transfer" | "pos_payment" | "cash" | "manual_record"
  posRequestReference?: string | null
  posTerminalId?: string | null
  posRequestStatus?: string | null
  bankTransferReference?: string | null
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

export function mapSalePaymentDocument(document: Models.Document): SalePaymentData {
  const data = document as AppwriteDataDocument

  return {
    id: document.$id,
    organizationId: getDocumentId(data.organizationId),
    createdByMemberId: String(data.createdByMemberId),
    title: String(data.title),
    expectedAmountKobo: Number(data.expectedAmountKobo),
    status:
      data.status === "paid" || data.status === "mismatch_flagged"
        ? data.status
        : "pending_payment",
    paymentSourceExpected:
      data.paymentSourceExpected === "bank_transfer" ||
      data.paymentSourceExpected === "cash" ||
      data.paymentSourceExpected === "manual_record"
        ? data.paymentSourceExpected
        : "pos_payment",
    posRequestReference:
      typeof data.posRequestReference === "string"
        ? data.posRequestReference
        : null,
    posTerminalId:
      typeof data.posTerminalId === "string" ? data.posTerminalId : null,
    posRequestStatus:
      typeof data.posRequestStatus === "string" ? data.posRequestStatus : null,
    bankTransferReference:
      typeof data.bankTransferReference === "string"
        ? data.bankTransferReference
        : null,
  }
}

export async function getSaleForPaymentFlow(saleId: string) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const document = await databases.getDocument(
    ids.databaseId,
    ids.collections.sales,
    saleId,
  )

  return mapSalePaymentDocument(document)
}

export async function recordPosPaymentResult(input: {
  sale: SalePaymentData
  payment: Extract<SquadPosPaymentStatus, { status: "success" }>
  recordedByMemberId: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const now = new Date().toISOString()
  const providerReference =
    input.payment.transactionReference || input.payment.requestReference

  const existingPayment = await databases.listDocuments(
    ids.databaseId,
    ids.collections.incomingPayments,
    [Query.equal("providerReference", [providerReference]), Query.limit(1)],
  )

  const actualAmountKobo = input.payment.amountKobo ?? input.sale.expectedAmountKobo
  const isMatched = actualAmountKobo === input.sale.expectedAmountKobo
  const incomingStatus = isMatched ? "matched" : "mismatch_flagged"
  const saleStatus = isMatched ? "paid" : "mismatch_flagged"
  const reconciliationOutcome = isMatched ? "matched" : "amount_mismatch"
  const summary = isMatched
    ? `Squad POS payment matched ${input.sale.title}. Expected and received amounts were both ${input.sale.expectedAmountKobo} kobo.`
    : `Squad POS payment did not match ${input.sale.title}. Expected ${input.sale.expectedAmountKobo} kobo but received ${actualAmountKobo} kobo.`

  const incomingPayment =
    existingPayment.documents[0] ??
    (await databases.createDocument(
      ids.databaseId,
      ids.collections.incomingPayments,
      ID.unique(),
      {
        organizationId: input.sale.organizationId,
        saleId: input.sale.id,
        sourceType: "pos_payment",
        amountKobo: actualAmountKobo,
        status: incomingStatus,
        provider: "squad",
        providerReference,
        recordedByMemberId: input.recordedByMemberId,
        recordedAt: now,
      },
    ))

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.sales,
    input.sale.id,
    {
      status: saleStatus,
      posRequestStatus:
        input.payment.mode === "simulated" ? "simulated_success" : "success",
      posConfirmedAt: now,
    },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.reconciliationEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      saleId: input.sale.id,
      incomingPaymentId: incomingPayment.$id,
      outcome: reconciliationOutcome,
      expectedAmountKobo: input.sale.expectedAmountKobo,
      actualAmountKobo,
      explanationInput: summary,
    },
  )

  if (isMatched) {
    await createLedgerEntryOnce({
      organizationId: input.sale.organizationId,
      entryReference: `sale-pos-${input.sale.id}-${providerReference}`,
      sourceId: incomingPayment.$id,
      sourceType: "incoming_payment",
      direction: "credit",
      amountKobo: actualAmountKobo,
      narration: `POS collection matched for ${input.sale.title}`,
      recordedAt: now,
    })
  }

  await databases.createDocument(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      actorUserProfileId: input.recordedByMemberId,
      entityType: "sale",
      entityId: input.sale.id,
      action: isMatched ? "pos_payment_matched" : "pos_payment_mismatch",
      summary,
      occurredAt: now,
      payload: input.payment.rawPayload,
    },
  )

  if (!isMatched) {
    await databases.createDocument(
      ids.databaseId,
      ids.collections.alerts,
      ID.unique(),
      {
        organizationId: input.sale.organizationId,
        title: "POS amount mismatch",
        message: summary,
        severity: "warning",
        status: "open",
        saleId: input.sale.id,
        incomingPaymentId: incomingPayment.$id,
        createdAtIso: now,
      },
    )
  }

  return {
    saleStatus,
    incomingPaymentId: incomingPayment.$id,
    reconciliationOutcome,
  }
}

export async function recordBankTransferPaymentResult(input: {
  sale: SalePaymentData
  recordedByMemberId: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const now = new Date().toISOString()
  const providerReference =
    input.sale.bankTransferReference ?? `manual-transfer-${input.sale.id}`
  const provider = input.sale.bankTransferReference ? "squad" : "manual"

  const existingPayment = await databases.listDocuments(
    ids.databaseId,
    ids.collections.incomingPayments,
    [Query.equal("providerReference", [providerReference]), Query.limit(1)],
  )

  const incomingPayment =
    existingPayment.documents[0] ??
    (await databases.createDocument(
      ids.databaseId,
      ids.collections.incomingPayments,
      ID.unique(),
      {
        organizationId: input.sale.organizationId,
        saleId: input.sale.id,
        sourceType: "bank_transfer",
        amountKobo: input.sale.expectedAmountKobo,
        status: "matched",
        provider,
        providerReference,
        recordedByMemberId: input.recordedByMemberId,
        recordedAt: now,
      },
    ))

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.sales,
    input.sale.id,
    { status: "paid" },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.reconciliationEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      saleId: input.sale.id,
      incomingPaymentId: incomingPayment.$id,
      outcome: "matched",
      expectedAmountKobo: input.sale.expectedAmountKobo,
      actualAmountKobo: input.sale.expectedAmountKobo,
      explanationInput: `Bank transfer manually confirmed for ${input.sale.title}.`,
    },
  )

  await createLedgerEntryOnce({
    organizationId: input.sale.organizationId,
    entryReference: `sale-transfer-${input.sale.id}`,
    sourceId: incomingPayment.$id,
    sourceType: "incoming_payment",
    direction: "credit",
    amountKobo: input.sale.expectedAmountKobo,
    narration: `Bank transfer collection matched for ${input.sale.title}`,
    recordedAt: now,
  })

  await databases.createDocument(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      actorUserProfileId: input.recordedByMemberId,
      entityType: "sale",
      entityId: input.sale.id,
      action: "bank_transfer_payment_matched",
      summary: input.sale.bankTransferReference
        ? `Squad virtual account transfer confirmed for ${input.sale.title}.`
        : `Bank transfer manually confirmed for ${input.sale.title}.`,
      occurredAt: now,
    },
  )

  return {
    saleStatus: "paid" as const,
    incomingPaymentId: incomingPayment.$id,
    reconciliationOutcome: "matched" as const,
  }
}

export async function markSalePaymentMissing(input: {
  sale: SalePaymentData
  actorMemberId: string
  reason?: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const now = new Date().toISOString()
  const summary =
    input.reason ||
    `No matching POS payment has been recorded for ${input.sale.title}; expected ${input.sale.expectedAmountKobo} kobo.`

  await databases.updateDocument(
    ids.databaseId,
    ids.collections.sales,
    input.sale.id,
    {
      status: "mismatch_flagged",
      posRequestStatus:
        input.sale.posRequestStatus === "failed" ? "failed" : "expired",
    },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.reconciliationEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      saleId: input.sale.id,
      outcome: "missing_payment",
      expectedAmountKobo: input.sale.expectedAmountKobo,
      explanationInput: summary,
    },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.alerts,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      title: "Inventory sale missing POS payment",
      message: summary,
      severity: "warning",
      status: "open",
      saleId: input.sale.id,
      createdAtIso: now,
    },
  )

  await databases.createDocument(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: input.sale.organizationId,
      actorUserProfileId: input.actorMemberId,
      entityType: "sale",
      entityId: input.sale.id,
      action: "payment_missing_flagged",
      summary,
      occurredAt: now,
    },
  )
}

async function createLedgerEntryOnce(input: {
  organizationId: string
  entryReference: string
  sourceId: string
  sourceType: "incoming_payment"
  direction: "credit"
  amountKobo: number
  narration: string
  recordedAt: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const existingEntry = await databases.listDocuments(
    ids.databaseId,
    ids.collections.ledgerEntries,
    [Query.equal("entryReference", [input.entryReference]), Query.limit(1)],
  )

  if (existingEntry.total > 0) {
    return
  }

  await databases.createDocument(
    ids.databaseId,
    ids.collections.ledgerEntries,
    ID.unique(),
    input,
  )
}
