import "server-only"

import { ID, Query, type Models } from "appwrite"

import { getLowStockState } from "@/lib/inventory/service"
import type { InventoryItemRecord, LowStockState } from "@/lib/inventory/types"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getAppwriteIds } from "@/lib/appwrite/ids"
import { getDemoAccountByUserId } from "@/lib/demo/accounts"
import { roles, type Role } from "@/lib/permissions/roles"
import type { RecentSaleSummary } from "@/lib/sales/types"

const demoOrganizationDocumentId = "demo-crestview"

const demoInventorySeed = [
  {
    sku: "ENG-OIL-5W30",
    name: "Engine Oil 5W-30 Carton",
    description: "12-bottle carton for wholesale auto-parts buyers.",
    unitPriceKobo: 258000,
    quantityOnHand: 120,
    lowStockThreshold: 24,
    status: "active",
  },
  {
    sku: "BAT-200AH",
    name: "Inverter Battery 200AH",
    description: "Deep-cycle batteries used in larger distributor orders.",
    unitPriceKobo: 1850000,
    quantityOnHand: 18,
    lowStockThreshold: 6,
    status: "active",
  },
  {
    sku: "DSL-FLTR-PK",
    name: "Diesel Filter Pack",
    description: "Multi-unit consumable bundle for generator maintenance work.",
    unitPriceKobo: 92000,
    quantityOnHand: 64,
    lowStockThreshold: 12,
    status: "active",
  },
  {
    sku: "GEN-SVC-KIT",
    name: "Generator Service Kit",
    description: "Quick-turn kit bundled for scheduled facility servicing jobs.",
    unitPriceKobo: 345000,
    quantityOnHand: 22,
    lowStockThreshold: 8,
    status: "active",
  },
] as const

export type DemoWorkspaceContext = {
  organizationId: string
  memberId: string
  memberRole: Role
  userProfileId: string
}

export type DemoInventoryItemSummary = InventoryItemRecord & {
  lowStockState: LowStockState
}

export type DemoStockMovementSummary = {
  id: string
  inventoryItemId: string
  inventoryItemName: string
  type: "stock_in" | "sale_out" | "adjustment"
  quantityDelta: number
  unitPriceKobo?: number | null
  reason?: string | null
  createdAtIso: string
}

type AppwriteAccount = Models.User<Models.Preferences>
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

function mapInventoryDocument(document: Models.Document): InventoryItemRecord {
  const data = document as AppwriteDataDocument

  return {
    id: document.$id,
    organizationId:
      typeof data.organizationId === "string"
        ? data.organizationId
        : typeof data.organizationId === "object" &&
            data.organizationId !== null &&
            "$id" in data.organizationId
          ? String(data.organizationId.$id)
          : "",
    sku: String(data.sku),
    name: String(data.name),
    description:
      typeof data.description === "string" ? data.description : null,
    unitPriceKobo: Number(data.unitPriceKobo),
    quantityOnHand: Number(data.quantityOnHand),
    lowStockThreshold: Number(data.lowStockThreshold),
    status: data.status === "archived" ? "archived" : "active",
  }
}

function mapStockMovementDocument(
  document: Models.Document,
): DemoStockMovementSummary {
  const data = document as AppwriteDataDocument
  const inventoryItemId = getDocumentId(data.inventoryItemId)
  const inventoryItem =
    typeof data.inventoryItemId === "object" && data.inventoryItemId !== null
      ? (data.inventoryItemId as AppwriteDataDocument)
      : undefined

  return {
    id: document.$id,
    inventoryItemId,
    inventoryItemName:
      typeof inventoryItem?.name === "string" ? inventoryItem.name : "Inventory item",
    type:
      data.type === "sale_out" || data.type === "adjustment"
        ? data.type
        : "stock_in",
    quantityDelta: Number(data.quantityDelta),
    unitPriceKobo:
      typeof data.unitPriceKobo === "number" ? data.unitPriceKobo : null,
    reason: typeof data.reason === "string" ? data.reason : null,
    createdAtIso:
      typeof data.createdAtIso === "string" ? data.createdAtIso : document.$createdAt,
  }
}

function mapRecentSaleDocument(document: Models.Document): RecentSaleSummary {
  const data = document as AppwriteDataDocument
  const latestPayment = Array.isArray(data.incomingPayments)
    ? (data.incomingPayments[0] as AppwriteDataDocument | undefined)
    : undefined
  const latestReconciliation = Array.isArray(data.reconciliationEvents)
    ? (data.reconciliationEvents[0] as AppwriteDataDocument | undefined)
    : undefined

  return {
    id: document.$id,
    title: String(data.title),
    customerLabel:
      typeof data.customerLabel === "string" ? data.customerLabel : null,
    saleType:
      data.saleType === "service_sale" || data.saleType === "manual_sale"
        ? data.saleType
        : "inventory_sale",
    status:
      data.status === "paid" || data.status === "mismatch_flagged"
        ? data.status
        : "pending_payment",
    expectedAmountKobo: Number(data.expectedAmountKobo),
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
      typeof data.posRequestStatus === "string"
        ? (data.posRequestStatus as RecentSaleSummary["posRequestStatus"])
        : null,
    posRequestedAt:
      typeof data.posRequestedAt === "string" ? data.posRequestedAt : null,
    posConfirmedAt:
      typeof data.posConfirmedAt === "string" ? data.posConfirmedAt : null,
    bankTransferReference:
      typeof data.bankTransferReference === "string"
        ? data.bankTransferReference
        : null,
    bankTransferAccountName:
      typeof data.bankTransferAccountName === "string"
        ? data.bankTransferAccountName
        : null,
    bankTransferAccountNumber:
      typeof data.bankTransferAccountNumber === "string"
        ? data.bankTransferAccountNumber
        : null,
    bankTransferBankName:
      typeof data.bankTransferBankName === "string"
        ? data.bankTransferBankName
        : null,
    bankTransferExpiresAt:
      typeof data.bankTransferExpiresAt === "string"
        ? data.bankTransferExpiresAt
        : null,
    incomingPaymentStatus:
      latestPayment?.status === "recorded" ||
      latestPayment?.status === "matched" ||
      latestPayment?.status === "mismatch_flagged" ||
      latestPayment?.status === "unclassified"
        ? latestPayment.status
        : null,
    actualAmountKobo: latestPayment?.amountKobo
      ? Number(latestPayment.amountKobo)
      : null,
    reconciliationOutcome:
      latestReconciliation?.outcome === "matched" ||
      latestReconciliation?.outcome === "amount_mismatch" ||
      latestReconciliation?.outcome === "missing_payment" ||
      latestReconciliation?.outcome === "unclassified_payment"
        ? latestReconciliation.outcome
        : null,
    reconciliationSummary:
      typeof latestReconciliation?.explanationInput === "string"
        ? latestReconciliation.explanationInput
        : null,
    createdAt: document.$createdAt,
  }
}

export async function ensureDemoWorkspace(account: AppwriteAccount) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const demoAccount = getDemoAccountByUserId(account.$id)
  const accountRole = demoAccount?.role ?? "super_admin"

  try {
    await databases.getDocument(
      ids.databaseId,
      ids.collections.organizations,
      demoOrganizationDocumentId,
    )
  } catch {
    await databases.createDocument(
      ids.databaseId,
      ids.collections.organizations,
      demoOrganizationDocumentId,
      {
        name: "Crestview Distribution",
        businessType: "Retail and distribution SME",
        currency: "NGN",
        walletMode: "sandbox",
        createdBy: account.$id,
      },
    )
  }

  const existingProfiles = await databases.listDocuments(
    ids.databaseId,
    ids.collections.userProfiles,
    [Query.equal("appwriteUserId", [account.$id]), Query.limit(1)],
  )

  const userProfile =
    existingProfiles.documents[0] ??
    (await databases.createDocument(
      ids.databaseId,
      ids.collections.userProfiles,
      ID.unique(),
      {
        appwriteUserId: account.$id,
        name: account.name || account.email,
        email: account.email,
      },
    ))

  const existingMembers = await databases.listDocuments(
    ids.databaseId,
    ids.collections.orgMembers,
    [
      Query.equal("organizationId", [demoOrganizationDocumentId]),
      Query.equal("userProfileId", [userProfile.$id]),
      Query.limit(1),
    ],
  )

  const orgMember =
    existingMembers.documents[0] ??
    (await databases.createDocument(
      ids.databaseId,
      ids.collections.orgMembers,
      ID.unique(),
      {
        organizationId: demoOrganizationDocumentId,
        userProfileId: userProfile.$id,
        role: accountRole,
        status: "active",
      },
    ))

  await ensureDemoInventorySeeded(demoOrganizationDocumentId)
  const memberData = orgMember as AppwriteDataDocument
  const memberRole = roles.includes(memberData.role as Role)
    ? (memberData.role as Role)
    : accountRole

  return {
    organizationId: demoOrganizationDocumentId,
    memberId: orgMember.$id,
    memberRole,
    userProfileId: userProfile.$id,
  }
}

async function ensureDemoInventorySeeded(organizationId: string) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const existingItems = await databases.listDocuments(
    ids.databaseId,
    ids.collections.inventoryItems,
    [Query.equal("organizationId", [organizationId]), Query.limit(1)],
  )

  if (existingItems.total > 0) {
    return
  }

  await Promise.all(
    demoInventorySeed.map((item) =>
      databases.createDocument(
        ids.databaseId,
        ids.collections.inventoryItems,
        ID.unique(),
        {
          organizationId,
          ...item,
        },
      ),
    ),
  )
}

export async function listDemoInventoryItems(
  organizationId: string,
): Promise<DemoInventoryItemSummary[]> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const response = await databases.listDocuments(
    ids.databaseId,
    ids.collections.inventoryItems,
    [Query.equal("organizationId", [organizationId]), Query.orderAsc("name")],
  )

  return response.documents.map((document) => {
    const item = mapInventoryDocument(document)

    return {
      ...item,
      lowStockState: getLowStockState(item),
    }
  })
}

export async function getDemoInventoryItem(
  organizationId: string,
  itemId: string,
): Promise<DemoInventoryItemSummary | null> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()

  try {
    const document = await databases.getDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      itemId,
    )
    const item = mapInventoryDocument(document)

    if (item.organizationId !== organizationId) {
      return null
    }

    return {
      ...item,
      lowStockState: getLowStockState(item),
    }
  } catch {
    return null
  }
}

export async function listRecentDemoStockMovements(
  organizationId: string,
): Promise<DemoStockMovementSummary[]> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const response = await databases.listDocuments(
    ids.databaseId,
    ids.collections.stockMovements,
    [
      Query.equal("organizationId", [organizationId]),
      Query.orderDesc("createdAtIso"),
      Query.limit(8),
    ],
  )

  return response.documents.map(mapStockMovementDocument)
}

export async function listRecentDemoSales(
  organizationId: string,
): Promise<RecentSaleSummary[]> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const response = await databases.listDocuments(
    ids.databaseId,
    ids.collections.sales,
    [
      Query.equal("organizationId", [organizationId]),
      Query.orderDesc("$createdAt"),
      Query.limit(30),
    ],
  )

  return await hydrateSaleSummaries(response.documents.map(mapRecentSaleDocument))
}

async function hydrateSaleSummaries(sales: RecentSaleSummary[]) {
  if (sales.length === 0) {
    return sales
  }

  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const saleIds = sales.map((sale) => sale.id)
  const [payments, reconciliations] = await Promise.all([
    databases.listDocuments(
      ids.databaseId,
      ids.collections.incomingPayments,
      [
        Query.equal("saleId", saleIds),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    ),
    databases.listDocuments(
      ids.databaseId,
      ids.collections.reconciliationEvents,
      [
        Query.equal("saleId", saleIds),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    ),
  ])
  const latestPaymentBySaleId = new Map<string, AppwriteDataDocument>()
  const latestReconciliationBySaleId = new Map<string, AppwriteDataDocument>()

  for (const document of payments.documents) {
    const payment = document as AppwriteDataDocument
    const saleId = getDocumentId(payment.saleId)

    if (saleId && !latestPaymentBySaleId.has(saleId)) {
      latestPaymentBySaleId.set(saleId, payment)
    }
  }

  for (const document of reconciliations.documents) {
    const reconciliation = document as AppwriteDataDocument
    const saleId = getDocumentId(reconciliation.saleId)

    if (saleId && !latestReconciliationBySaleId.has(saleId)) {
      latestReconciliationBySaleId.set(saleId, reconciliation)
    }
  }

  return sales.map((sale) => {
    const payment = latestPaymentBySaleId.get(sale.id)
    const reconciliation = latestReconciliationBySaleId.get(sale.id)

    return {
      ...sale,
      incomingPaymentStatus:
        payment?.status === "recorded" ||
        payment?.status === "matched" ||
        payment?.status === "mismatch_flagged" ||
        payment?.status === "unclassified"
          ? payment.status
          : sale.incomingPaymentStatus,
      actualAmountKobo: payment?.amountKobo
        ? Number(payment.amountKobo)
        : sale.actualAmountKobo,
      reconciliationOutcome:
        reconciliation?.outcome === "matched" ||
        reconciliation?.outcome === "amount_mismatch" ||
        reconciliation?.outcome === "missing_payment" ||
        reconciliation?.outcome === "unclassified_payment"
          ? reconciliation.outcome
          : sale.reconciliationOutcome,
      reconciliationSummary:
        typeof reconciliation?.explanationInput === "string"
          ? reconciliation.explanationInput
          : sale.reconciliationSummary,
    }
  })
}

export async function getLiveAdminMoneyInOverview(organizationId: string) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const [sales, payments, flaggedSalesResponse, auditEvents] = await Promise.all([
    databases.listDocuments(
      ids.databaseId,
      ids.collections.sales,
      [Query.equal("organizationId", [organizationId]), Query.limit(100)],
    ),
    databases.listDocuments(
      ids.databaseId,
      ids.collections.incomingPayments,
      [Query.equal("organizationId", [organizationId]), Query.limit(100)],
    ),
    databases.listDocuments(
      ids.databaseId,
      ids.collections.sales,
      [
        Query.equal("organizationId", [organizationId]),
        Query.equal("status", ["mismatch_flagged"]),
        Query.orderDesc("$updatedAt"),
        Query.limit(5),
      ],
    ),
    databases.listDocuments(
      ids.databaseId,
      ids.collections.auditEvents,
      [
        Query.equal("organizationId", [organizationId]),
        Query.equal("entityType", ["sale"]),
        Query.orderDesc("occurredAt"),
        Query.limit(6),
      ],
    ),
  ])

  const saleDocuments = sales.documents.map(
    (document) => document as AppwriteDataDocument,
  )
  const paymentDocuments = payments.documents.map(
    (document) => document as AppwriteDataDocument,
  )
  const expectedKobo = saleDocuments.reduce(
    (total, sale) => total + Number(sale.expectedAmountKobo ?? 0),
    0,
  )
  const collectedKobo = paymentDocuments
    .filter((payment) => payment.status === "matched")
    .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0)
  const cashPaymentSaleIds = new Set(
    paymentDocuments
      .filter(
        (payment) =>
          payment.status === "matched" && payment.sourceType === "cash",
      )
      .map((payment) => getDocumentId(payment.saleId))
      .filter(Boolean),
  )
  const cashKobo =
    paymentDocuments
      .filter(
        (payment) =>
          payment.status === "matched" && payment.sourceType === "cash",
      )
      .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0) +
    saleDocuments
      .filter(
        (sale) =>
          sale.status === "paid" &&
          sale.paymentSourceExpected === "cash" &&
          !cashPaymentSaleIds.has(String(sale.$id)),
      )
      .reduce((total, sale) => total + Number(sale.expectedAmountKobo ?? 0), 0)
  const transferKobo = paymentDocuments
    .filter(
      (payment) =>
        payment.status === "matched" && payment.sourceType === "bank_transfer",
    )
    .reduce((total, payment) => total + Number(payment.amountKobo ?? 0), 0)

  return {
    expectedKobo,
    collectedKobo,
    cashKobo,
    transferKobo,
    pendingCount: saleDocuments.filter(
      (sale) => sale.status === "pending_payment",
    ).length,
    paidCount: saleDocuments.filter((sale) => sale.status === "paid").length,
    flaggedCount: saleDocuments.filter(
      (sale) => sale.status === "mismatch_flagged",
    ).length,
    posRequestedCount: saleDocuments.filter(
      (sale) =>
        typeof sale.posRequestReference === "string" &&
        sale.posRequestReference.length > 0,
    ).length,
    flaggedSales: await hydrateSaleSummaries(
      flaggedSalesResponse.documents.map(mapRecentSaleDocument),
    ),
    recentActivity: auditEvents.documents.map((document) => {
      const data = document as AppwriteDataDocument
      return String(data.summary)
    }),
  }
}
