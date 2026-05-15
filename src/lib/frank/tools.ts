import "server-only"

import { Query, type Models } from "appwrite"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import type { FrankToolResult } from "@/lib/frank/types"
import type { PaymentRequestType } from "@/lib/payments/types"
import { listPaymentRequestSummaries } from "@/lib/payments/service"

type AppwriteDataDocument = Models.Document & Record<string, unknown>

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

function formatCurrency(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(kobo / 100)
}

function getDateWindow(period: "this_month" | "last_30_days") {
  const now = new Date()

  if (period === "this_month") {
    return {
      label: "this month",
      start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      end: now,
    }
  }

  return {
    label: "the last 30 days",
    start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    end: now,
  }
}

function getSalesDateWindow(period: "today" | "this_month") {
  const now = new Date()

  if (period === "today") {
    return {
      label: "today",
      start: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      ),
      end: now,
    }
  }

  return {
    label: "this month",
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: now,
  }
}

export async function getRevenueByPeriod(params: {
  organizationId: string
  period?: "this_month" | "last_30_days"
}): Promise<FrankToolResult> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const window = getDateWindow(params.period ?? "this_month")
  const payments = await databases.listDocuments(
    ids.databaseId,
    ids.collections.incomingPayments,
    [
      Query.equal("organizationId", [params.organizationId]),
      Query.equal("status", ["matched"]),
      Query.greaterThanEqual("recordedAt", window.start.toISOString()),
      Query.lessThanEqual("recordedAt", window.end.toISOString()),
      Query.limit(100),
    ],
  )
  const paymentDocuments = payments.documents.map(
    (document) => document as AppwriteDataDocument,
  )
  const revenueKobo = paymentDocuments.reduce(
    (total, payment) => total + Number(payment.amountKobo ?? 0),
    0,
  )
  const transferKobo = paymentDocuments
    .filter((payment) => payment.sourceType === "bank_transfer")
    .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0)
  const cashKobo = paymentDocuments
    .filter((payment) => payment.sourceType === "cash")
    .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0)
  const posKobo = paymentDocuments
    .filter((payment) => payment.sourceType === "pos_payment")
    .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0)

  return {
    toolName: "getRevenueByPeriod",
    summary: `Matched revenue for ${window.label} is ${formatCurrency(revenueKobo)} from ${paymentDocuments.length} payment record${paymentDocuments.length === 1 ? "" : "s"}.`,
    facts: {
      period: window.label,
      revenueKobo,
      paymentCount: paymentDocuments.length,
      transferKobo,
      cashKobo,
      posKobo,
    },
  }
}

export async function getFlaggedTransactions(params: {
  organizationId: string
}): Promise<FrankToolResult> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const flaggedSales = await databases.listDocuments(
    ids.databaseId,
    ids.collections.sales,
    [
      Query.equal("organizationId", [params.organizationId]),
      Query.equal("status", ["mismatch_flagged"]),
      Query.orderDesc("$updatedAt"),
      Query.limit(10),
    ],
  )
  const saleDocuments = flaggedSales.documents.map(
    (document) => document as AppwriteDataDocument,
  )
  const saleIds = saleDocuments.map((sale) => sale.$id)
  const reconciliations =
    saleIds.length > 0
      ? await databases.listDocuments(
          ids.databaseId,
          ids.collections.reconciliationEvents,
          [
            Query.equal("saleId", saleIds),
            Query.orderDesc("$createdAt"),
            Query.limit(50),
          ],
        )
      : { documents: [] }
  const latestReconciliationBySaleId = new Map<string, AppwriteDataDocument>()

  for (const document of reconciliations.documents) {
    const reconciliation = document as AppwriteDataDocument
    const saleId = getDocumentId(reconciliation.saleId)

    if (saleId && !latestReconciliationBySaleId.has(saleId)) {
      latestReconciliationBySaleId.set(saleId, reconciliation)
    }
  }

  const topSale = saleDocuments[0]
  const topReconciliation = topSale
    ? latestReconciliationBySaleId.get(topSale.$id)
    : undefined
  const totalExpectedKobo = saleDocuments.reduce(
    (total, sale) => total + Number(sale.expectedAmountKobo ?? 0),
    0,
  )

  return {
    toolName: "getFlaggedTransactions",
    summary:
      saleDocuments.length > 0
        ? `${saleDocuments.length} flagged sale${saleDocuments.length === 1 ? "" : "s"} need review. The newest is ${getDocumentString(topSale?.title, "a sale")} for ${formatCurrency(Number(topSale?.expectedAmountKobo ?? 0))}.`
        : "There are no flagged money-in transactions right now.",
    facts: {
      flaggedCount: saleDocuments.length,
      totalExpectedKobo,
      topSaleId: topSale?.$id ?? null,
      topSaleTitle: getDocumentString(topSale?.title, ""),
      topSaleExpectedKobo: Number(topSale?.expectedAmountKobo ?? 0),
      topSaleCustomer: getDocumentString(topSale?.customerLabel, "Walk-in customer"),
      topReconciliationOutcome: getDocumentString(topReconciliation?.outcome, ""),
      topReconciliationSummary:
        getDocumentString(topReconciliation?.explanationInput) ||
        getDocumentString(topReconciliation?.summary),
    },
  }
}

export async function getPendingPaymentRequests(params: {
  organizationId: string
}): Promise<FrankToolResult> {
  const requests = await listPaymentRequestSummaries({
    organizationId: params.organizationId,
    limit: 50,
  })
  const submittedRequests = requests.filter((request) => request.status === "submitted")
  const highRiskRequests = submittedRequests.filter(
    (request) => request.riskBand === "high",
  )
  const totalSubmittedKobo = submittedRequests.reduce(
    (total, request) => total + request.amountKobo,
    0,
  )
  const nextRequest = submittedRequests[0]

  return {
    toolName: "getPendingPaymentRequests",
    summary:
      submittedRequests.length > 0
        ? `${submittedRequests.length} outgoing request${submittedRequests.length === 1 ? "" : "s"} are awaiting Super Admin decision, worth ${formatCurrency(totalSubmittedKobo)}.`
        : "There are no outgoing requests awaiting decision.",
    facts: {
      submittedCount: submittedRequests.length,
      highRiskCount: highRiskRequests.length,
      totalSubmittedKobo,
      nextRequestId: nextRequest?.id ?? null,
      nextRequestTitle: nextRequest?.title ?? "",
      nextRequestRiskBand: nextRequest?.riskBand ?? "",
      nextRequestRiskScore: nextRequest?.riskScore ?? 0,
      nextRequestTopFlag: nextRequest?.topFlag ?? "",
    },
  }
}

const requestTypeLabels: Record<PaymentRequestType, string> = {
  vendor_payment: "vendor payment",
  staff_cash_request: "staff cash",
  airtime_data_request: "airtime/data",
  utility_payment: "utility",
  manual_business_expense: "reimbursement",
}

export async function getRequestsByType(params: {
  organizationId: string
  requestType: PaymentRequestType
}): Promise<FrankToolResult> {
  const requests = await listPaymentRequestSummaries({
    organizationId: params.organizationId,
    limit: 50,
  })
  const matchingRequests = requests.filter(
    (request) => request.requestType === params.requestType,
  )
  const submittedRequests = matchingRequests.filter(
    (request) => request.status === "submitted",
  )
  const approvedRequests = matchingRequests.filter(
    (request) => request.status === "approved",
  )
  const rejectedRequests = matchingRequests.filter(
    (request) => request.status === "rejected",
  )
  const totalRequestedKobo = matchingRequests.reduce(
    (total, request) => total + request.amountKobo,
    0,
  )
  const latestRequest = matchingRequests[0]
  const requestLabel = requestTypeLabels[params.requestType]

  return {
    toolName: "getRequestsByType",
    summary:
      matchingRequests.length > 0
        ? `${matchingRequests.length} ${requestLabel} request${matchingRequests.length === 1 ? "" : "s"} are in the current records, worth ${formatCurrency(totalRequestedKobo)}.`
        : `There are no ${requestLabel} requests in the current records.`,
    facts: {
      requestType: params.requestType,
      requestLabel,
      requestCount: matchingRequests.length,
      submittedCount: submittedRequests.length,
      approvedCount: approvedRequests.length,
      rejectedCount: rejectedRequests.length,
      totalRequestedKobo,
      latestRequestTitle: latestRequest?.title ?? "",
      latestRequestStatus: latestRequest?.status ?? "",
      latestRequestAmountKobo: latestRequest?.amountKobo ?? 0,
      latestRequestSubmittedAt: latestRequest?.submittedAt ?? "",
    },
  }
}

export async function getBestSellingProducts(params: {
  organizationId: string
  period?: "today" | "this_month"
}): Promise<FrankToolResult> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const window = getSalesDateWindow(params.period ?? "today")
  const sales = await databases.listDocuments(
    ids.databaseId,
    ids.collections.sales,
    [
      Query.equal("organizationId", [params.organizationId]),
      Query.limit(100),
    ],
  )
  const saleDocuments = sales.documents
    .map((document) => document as AppwriteDataDocument)
    .filter((sale) => {
      const createdAt = new Date(getDocumentString(sale.$createdAt))

      return (
        createdAt >= window.start &&
        createdAt <= window.end &&
        sale.status !== "mismatch_flagged"
      )
    })
  const saleIds = saleDocuments.map((sale) => sale.$id)

  if (saleIds.length === 0) {
    return {
      toolName: "getBestSellingProducts",
      summary: `No sales were recorded ${window.label}, so there is no best-selling product for that period yet.`,
      facts: {
        period: window.label,
        saleCount: 0,
        productCount: 0,
        topProductName: "",
        topProductQuantity: 0,
        topProductRevenueKobo: 0,
      },
    }
  }

  const saleLines = await databases.listDocuments(
    ids.databaseId,
    ids.collections.saleLines,
    [
      Query.equal("saleId", saleIds),
      Query.equal("kind", ["inventory_item"]),
      Query.limit(100),
    ],
  )
  const productTotals = new Map<
    string,
    {
      label: string
      quantity: number
      revenueKobo: number
    }
  >()

  for (const document of saleLines.documents) {
    const line = document as AppwriteDataDocument
    const inventoryItemId = getDocumentId(line.inventoryItemId)
    const key = inventoryItemId || getDocumentString(line.label, document.$id)
    const previous = productTotals.get(key)

    productTotals.set(key, {
      label: getDocumentString(line.label, previous?.label ?? "Inventory item"),
      quantity: (previous?.quantity ?? 0) + Number(line.quantity ?? 0),
      revenueKobo: (previous?.revenueKobo ?? 0) + Number(line.lineTotalKobo ?? 0),
    })
  }

  const products = [...productTotals.values()].sort((left, right) => {
    if (right.quantity !== left.quantity) {
      return right.quantity - left.quantity
    }

    return right.revenueKobo - left.revenueKobo
  })
  const topProduct = products[0]

  return {
    toolName: "getBestSellingProducts",
    summary: topProduct
      ? `${topProduct.label} is the best-selling product ${window.label}, with ${topProduct.quantity} unit${topProduct.quantity === 1 ? "" : "s"} sold and ${formatCurrency(topProduct.revenueKobo)} in sales.`
      : `No inventory-backed product sales were recorded ${window.label}.`,
    facts: {
      period: window.label,
      saleCount: saleDocuments.length,
      productCount: products.length,
      topProductName: topProduct?.label ?? "",
      topProductQuantity: topProduct?.quantity ?? 0,
      topProductRevenueKobo: topProduct?.revenueKobo ?? 0,
      secondProductName: products[1]?.label ?? "",
      secondProductQuantity: products[1]?.quantity ?? 0,
    },
  }
}

export async function getRequestRiskExplanation(params: {
  organizationId: string
  requestId?: string
}): Promise<FrankToolResult> {
  const requests = await listPaymentRequestSummaries({
    organizationId: params.organizationId,
    limit: 50,
  })
  const request =
    requests.find((item) => item.id === params.requestId) ??
    requests.find((item) => item.status === "submitted") ??
    requests[0]

  if (!request) {
    return {
      toolName: "getRequestRiskExplanation",
      summary: "There is no payment request available for risk explanation yet.",
      facts: {
        requestFound: false,
      },
    }
  }

  return {
    toolName: "getRequestRiskExplanation",
    summary: `${request.title} is ${request.riskBand} risk with score ${request.riskScore.toFixed(2)}. Top signal: ${request.topFlag}.`,
    facts: {
      requestFound: true,
      requestId: request.id,
      title: request.title,
      amountKobo: request.amountKobo,
      status: request.status,
      riskBand: request.riskBand,
      riskScore: request.riskScore,
      topFlag: request.topFlag,
      modelScoreCount: request.modelScores.length,
      ruleCount: request.rules.length,
      frankNote: request.frankNote,
    },
  }
}

export async function getSystemSummary(params: {
  organizationId: string
}): Promise<FrankToolResult> {
  const [revenue, flagged, pending] = await Promise.all([
    getRevenueByPeriod({ organizationId: params.organizationId }),
    getFlaggedTransactions({ organizationId: params.organizationId }),
    getPendingPaymentRequests({ organizationId: params.organizationId }),
  ])

  return {
    toolName: "getSystemSummary",
    summary: `${revenue.summary} ${flagged.summary} ${pending.summary}`,
    facts: {
      revenueKobo: Number(revenue.facts.revenueKobo ?? 0),
      matchedPaymentCount: Number(revenue.facts.paymentCount ?? 0),
      flaggedCount: Number(flagged.facts.flaggedCount ?? 0),
      pendingRequestCount: Number(pending.facts.submittedCount ?? 0),
      highRiskRequestCount: Number(pending.facts.highRiskCount ?? 0),
    },
  }
}

export async function runFrankToolsForQuestion(params: {
  organizationId: string
  question: string
}): Promise<FrankToolResult[]> {
  const normalizedQuestion = params.question.toLowerCase()

  if (
    normalizedQuestion.includes("product") ||
    normalizedQuestion.includes("sold") ||
    normalizedQuestion.includes("best selling") ||
    normalizedQuestion.includes("top item") ||
    normalizedQuestion.includes("inventory performance")
  ) {
    return [
      await getBestSellingProducts({
        organizationId: params.organizationId,
        period:
          normalizedQuestion.includes("month") ||
          normalizedQuestion.includes("monthly")
            ? "this_month"
            : "today",
      }),
    ]
  }

  if (
    normalizedQuestion.includes("airtime") ||
    normalizedQuestion.includes("data bundle") ||
    normalizedQuestion.includes("recharge")
  ) {
    return [
      await getRequestsByType({
        organizationId: params.organizationId,
        requestType: "airtime_data_request",
      }),
    ]
  }

  if (normalizedQuestion.includes("utility") || normalizedQuestion.includes("meter")) {
    return [
      await getRequestsByType({
        organizationId: params.organizationId,
        requestType: "utility_payment",
      }),
    ]
  }

  if (normalizedQuestion.includes("vendor") || normalizedQuestion.includes("supplier")) {
    return [
      await getRequestsByType({
        organizationId: params.organizationId,
        requestType: "vendor_payment",
      }),
    ]
  }

  if (normalizedQuestion.includes("cash")) {
    return [
      await getRequestsByType({
        organizationId: params.organizationId,
        requestType: "staff_cash_request",
      }),
    ]
  }

  if (normalizedQuestion === "why" || normalizedQuestion === "why?") {
    return [
      {
        toolName: "unsupportedQuestion",
        summary:
          "Ask me which flagged transaction or payment request you want explained, or use the suggested question for the newest flagged transaction.",
        facts: {
          requestedCapability: "missing_record_context",
        },
      },
    ]
  }

  if (
    normalizedQuestion.includes("revenue") ||
    normalizedQuestion.includes("month")
  ) {
    return [
      await getRevenueByPeriod({
        organizationId: params.organizationId,
        period: normalizedQuestion.includes("30") ? "last_30_days" : "this_month",
      }),
    ]
  }

  if (
    normalizedQuestion.includes("flagged") ||
    normalizedQuestion.includes("mismatch") ||
    normalizedQuestion.includes("transaction")
  ) {
    return [await getFlaggedTransactions({ organizationId: params.organizationId })]
  }

  if (
    normalizedQuestion.includes("why") ||
    normalizedQuestion.includes("risk") ||
    normalizedQuestion.includes("request")
  ) {
    return [
      await getPendingPaymentRequests({ organizationId: params.organizationId }),
      await getRequestRiskExplanation({ organizationId: params.organizationId }),
    ]
  }

  return [await getSystemSummary({ organizationId: params.organizationId })]
}
