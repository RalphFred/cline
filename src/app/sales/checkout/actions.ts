"use server"

import { ID, Query, type Models } from "appwrite"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { getDemoAccountByRole } from "@/lib/demo/accounts"
import { ensureDemoWorkspace, listDemoInventoryItems } from "@/lib/demo/server"
import { demoWorkspace } from "@/lib/demo/workspace"
import {
  getSaleForPaymentFlow,
  markSalePaymentMissing,
  recordBankTransferPaymentResult,
  recordPosPaymentResult,
} from "@/lib/sales/reconciliation"
import { buildSaleDraft } from "@/lib/sales/service"
import {
  createSquadPosPaymentRequest,
  requerySquadPosPayment,
} from "@/lib/squad/pos"
import { getStaticAdminVirtualAccount } from "@/lib/squad/virtual-accounts"
import type {
  CreateSaleActionState,
  SaleFlowActionState,
} from "@/app/sales/checkout/action-state"

const createSalePayloadSchema = z.object({
  payload: z.string().min(1),
})

const saleIdPayloadSchema = z.object({
  saleId: z.string().min(1),
})

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

export async function createSaleAction(
  _prevState: CreateSaleActionState,
  formData: FormData,
): Promise<CreateSaleActionState> {
  const account = await getSalesActionAccount()

  if (!account) {
    return {
      status: "error",
      message: "Your session expired. Sign in again to create a sale.",
    }
  }

  const payloadResult = createSalePayloadSchema.safeParse({
    payload: formData.get("payload"),
  })

  if (!payloadResult.success) {
    return {
      status: "error",
      message: "The sale payload was incomplete. Refresh the form and try again.",
    }
  }

  let parsedPayload: unknown

  try {
    parsedPayload = JSON.parse(payloadResult.data.payload)
  } catch {
    return {
      status: "error",
      message: "The sale payload could not be parsed.",
    }
  }

  try {
    const workspace = await ensureDemoWorkspace(account)

    const inventoryItems = await listDemoInventoryItems(workspace.organizationId)
    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const saleId = ID.unique()
    const createdAtIso = new Date().toISOString()
    const draft = buildSaleDraft({
      organizationId: workspace.organizationId,
      createdByMemberId: workspace.memberId,
      saleId,
      createdAtIso,
      inventoryItems,
      input: parsedPayload,
    })
    const posRequest =
      draft.sale.paymentSourceExpected === "pos_payment"
        ? await createSquadPosPaymentRequest({
            amountKobo: draft.sale.expectedAmountKobo,
            saleId,
          })
        : null
    const bankTransferAccount =
      draft.sale.paymentSourceExpected === "bank_transfer"
        ? await getStaticAdminVirtualAccount({
            organizationId: workspace.organizationId,
            businessName: demoWorkspace.organizationName,
          })
        : null

    await databases.createDocument(ids.databaseId, ids.collections.sales, saleId, {
      organizationId: draft.sale.organizationId,
      createdByMemberId: draft.sale.createdByMemberId,
      saleType: draft.sale.saleType,
      title: draft.sale.title,
      customerLabel: draft.sale.customerLabel,
      expectedAmountKobo: draft.sale.expectedAmountKobo,
      status:
        draft.sale.paymentSourceExpected === "cash" ? "paid" : draft.sale.status,
      paymentSourceExpected: draft.sale.paymentSourceExpected,
      posRequestReference: posRequest?.requestReference,
      posTerminalId: posRequest?.terminalId,
      posRequestStatus: posRequest ? "requested" : "not_requested",
      posRequestedAt: posRequest ? createdAtIso : undefined,
      bankTransferReference: bankTransferAccount?.customerIdentifier,
      bankTransferAccountName: bankTransferAccount?.accountName,
      bankTransferAccountNumber: bankTransferAccount?.accountNumber,
      bankTransferBankName: bankTransferAccount?.bankName,
      bankTransferProviderPayload: bankTransferAccount?.rawPayload,
      notes: draft.sale.notes,
    })

    await Promise.all(
      draft.saleLines.map((line) =>
        databases.createDocument(
          ids.databaseId,
          ids.collections.saleLines,
          ID.unique(),
          {
            organizationId: line.organizationId,
            saleId: line.saleId,
            inventoryItemId: line.inventoryItemId,
            kind: line.kind,
            label: line.label,
            quantity: line.quantity,
            unitPriceKobo: line.unitPriceKobo,
            lineTotalKobo: line.lineTotalKobo,
          },
        ),
      ),
    )

    await Promise.all(
      draft.updatedInventoryItems.map((item) =>
        databases.updateDocument(
          ids.databaseId,
          ids.collections.inventoryItems,
          item.id,
          {
            quantityOnHand: item.quantityOnHand,
          },
        ),
      ),
    )

    await Promise.all(
      draft.stockMovements.map((movement) =>
        databases.createDocument(
          ids.databaseId,
          ids.collections.stockMovements,
          ID.unique(),
          {
            organizationId: movement.organizationId,
            inventoryItemId: movement.inventoryItemId,
            saleId: movement.saleId,
            type: movement.type,
            quantityDelta: movement.quantityDelta,
            unitPriceKobo: movement.unitPriceKobo,
            reason: movement.reason,
            createdBy: movement.createdBy,
            createdAtIso: movement.createdAtIso,
          },
        ),
      ),
    )

    await databases.createDocument(
      ids.databaseId,
      ids.collections.auditEvents,
      ID.unique(),
      {
        organizationId: draft.sale.organizationId,
        actorUserProfileId: workspace.memberId,
        entityType: "sale",
        entityId: saleId,
        action: posRequest ? "sale_created_pos_requested" : "sale_created",
        summary: posRequest
          ? `${draft.sale.title} was created and Squad POS request ${posRequest.requestReference} was generated.`
          : bankTransferAccount
            ? `${draft.sale.title} was created for the static Squad account ${bankTransferAccount.accountNumber}.`
          : `${draft.sale.title} was created and is waiting for payment reconciliation.`,
        occurredAt: createdAtIso,
        payload: posRequest?.rawPayload ?? bankTransferAccount?.rawPayload,
      },
    )

    revalidatePath("/admin")
    revalidatePath("/mobile")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message:
        draft.sale.paymentSourceExpected === "cash"
          ? `${draft.sale.title} was paid in cash and the receipt is ready.`
          : posRequest
            ? `${draft.sale.title} was created and POS request ${posRequest.requestReference} is ready to confirm.`
            : bankTransferAccount
              ? `${draft.sale.title} was created with Cline account ${bankTransferAccount.accountNumber}.`
            : `${draft.sale.title} was created as pending. It will complete when the exact transfer is received.`,
      transfer:
        draft.sale.paymentSourceExpected === "bank_transfer"
          ? {
              saleId,
              title: draft.sale.title,
              customerLabel: draft.sale.customerLabel,
              amountKobo: draft.sale.expectedAmountKobo,
              accountName: bankTransferAccount?.accountName,
              accountNumber: bankTransferAccount?.accountNumber,
              bankName: bankTransferAccount?.bankName,
              reference: bankTransferAccount?.customerIdentifier,
            }
          : undefined,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create this sale right now."

    return {
      status: "error",
      message,
    }
  }
}

export async function cancelPendingTransferAction(
  _prevState: SaleFlowActionState,
  formData: FormData,
): Promise<SaleFlowActionState> {
  const context = await getAuthorizedSalesContext()
  const parsed = saleIdPayloadSchema.safeParse({
    saleId: formData.get("saleId"),
  })

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid transfer to cancel." }
  }

  try {
    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const sale = await getSaleForPaymentFlow(parsed.data.saleId)

    if (sale.organizationId !== context.organizationId) {
      return { status: "error", message: "This sale belongs to another workspace." }
    }

    if (sale.paymentSourceExpected !== "bank_transfer") {
      return {
        status: "error",
        message: "Only pending transfer sales can be cancelled here.",
      }
    }

    if (sale.status === "paid") {
      return {
        status: "error",
        message: "This transfer has already been received and cannot be cancelled.",
      }
    }

    if (sale.status !== "pending_payment") {
      return {
        status: "error",
        message: "This transfer is no longer pending.",
      }
    }

    const saleLines = await databases.listDocuments(
      ids.databaseId,
      ids.collections.saleLines,
      [Query.equal("saleId", [sale.id]), Query.limit(100)],
    )
    const now = new Date().toISOString()

    await Promise.all(
      saleLines.documents.map(async (document) => {
        const line = document as AppwriteDataDocument
        const inventoryItemId = getDocumentId(line.inventoryItemId)
        const quantity = Number(line.quantity ?? 0)

        if (!inventoryItemId || quantity <= 0) {
          return
        }

        const item = (await databases.getDocument(
          ids.databaseId,
          ids.collections.inventoryItems,
          inventoryItemId,
        )) as AppwriteDataDocument

        await databases.updateDocument(
          ids.databaseId,
          ids.collections.inventoryItems,
          inventoryItemId,
          {
            quantityOnHand: Number(item.quantityOnHand ?? 0) + quantity,
          },
        )

        await databases.createDocument(
          ids.databaseId,
          ids.collections.stockMovements,
          ID.unique(),
          {
            organizationId: context.organizationId,
            inventoryItemId,
            saleId: sale.id,
            type: "adjustment",
            quantityDelta: quantity,
            unitPriceKobo: Number(line.unitPriceKobo ?? 0),
            reason: `Cancelled pending transfer for ${sale.title}.`,
            createdBy: context.memberId,
            createdAtIso: now,
          },
        )
      }),
    )

    await databases.createDocument(
      ids.databaseId,
      ids.collections.auditEvents,
      ID.unique(),
      {
        organizationId: sale.organizationId,
        actorUserProfileId: context.memberId,
        entityType: "sale",
        entityId: sale.id,
        action: "bank_transfer_payment_cancelled",
        summary: `Pending transfer for ${sale.title} was cancelled before payment was received.`,
        occurredAt: now,
      },
    )

    await databases.deleteDocument(ids.databaseId, ids.collections.sales, sale.id)

    revalidatePath("/admin")
    revalidatePath("/mobile")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message: `Pending transfer for ${sale.title} was cancelled.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to cancel this pending transfer right now.",
    }
  }
}

export async function requestPosPaymentAction(
  _prevState: SaleFlowActionState,
  formData: FormData,
): Promise<SaleFlowActionState> {
  const context = await getAuthorizedSalesContext()
  const parsed = saleIdPayloadSchema.safeParse({
    saleId: formData.get("saleId"),
  })

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid sale first." }
  }

  try {
    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const sale = await getSaleForPaymentFlow(parsed.data.saleId)

    if (sale.organizationId !== context.organizationId) {
      return { status: "error", message: "This sale belongs to another workspace." }
    }

    if (sale.paymentSourceExpected !== "pos_payment") {
      return { status: "error", message: "This sale is not expecting POS payment." }
    }

    if (sale.posRequestReference) {
      return {
        status: "success",
        message: `POS request ${sale.posRequestReference} is already attached.`,
        posRequestStatus: sale.posRequestStatus === "pending" ? "pending" : "requested",
      }
    }

    const posRequest = await createSquadPosPaymentRequest({
      amountKobo: sale.expectedAmountKobo,
      saleId: sale.id,
    })
    const now = new Date().toISOString()

    await databases.updateDocument(
      ids.databaseId,
      ids.collections.sales,
      sale.id,
      {
        posRequestReference: posRequest.requestReference,
        posTerminalId: posRequest.terminalId,
        posRequestStatus: "requested",
        posRequestedAt: now,
      },
    )

    await databases.createDocument(
      ids.databaseId,
      ids.collections.auditEvents,
      ID.unique(),
      {
        organizationId: sale.organizationId,
        actorUserProfileId: context.memberId,
        entityType: "sale",
        entityId: sale.id,
        action: "pos_request_created",
        summary: `Squad POS request ${posRequest.requestReference} was created for ${sale.title}.`,
        occurredAt: now,
        payload: posRequest.rawPayload,
      },
    )

    revalidatePath("/admin")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message: `POS request ${posRequest.requestReference} is ready on ${posRequest.terminalId}.`,
      posRequestStatus: "requested",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to request POS payment right now.",
    }
  }
}

export async function confirmPosPaymentAction(
  _prevState: SaleFlowActionState,
  formData: FormData,
): Promise<SaleFlowActionState> {
  const context = await getAuthorizedSalesContext()
  const parsed = saleIdPayloadSchema.safeParse({
    saleId: formData.get("saleId"),
  })

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid sale first." }
  }

  try {
    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const sale = await getSaleForPaymentFlow(parsed.data.saleId)

    if (sale.organizationId !== context.organizationId) {
      return { status: "error", message: "This sale belongs to another workspace." }
    }

    if (!sale.posRequestReference) {
      return { status: "error", message: "Create a POS request before confirming." }
    }

    const status = await requerySquadPosPayment({
      requestReference: sale.posRequestReference,
      expectedAmountKobo: sale.expectedAmountKobo,
      terminalId: sale.posTerminalId,
    })

    if (status.status === "pending") {
      await databases.updateDocument(
        ids.databaseId,
        ids.collections.sales,
        sale.id,
        { posRequestStatus: "pending" },
      )

      revalidatePath("/sales")
      revalidatePath("/sales/checkout")

      return {
        status: "success",
        message: "Squad says this POS request is still pending. Try again shortly.",
        posRequestStatus: "pending",
      }
    }

    if (status.status === "failed" || status.status === "expired") {
      await databases.updateDocument(
        ids.databaseId,
        ids.collections.sales,
        sale.id,
        { posRequestStatus: status.status },
      )

      await markSalePaymentMissing({
        sale,
        actorMemberId: context.memberId,
        reason:
          status.status === "failed"
            ? `Squad returned a failed POS result for ${sale.title}.`
            : `Squad POS request ${sale.posRequestReference} expired before payment confirmation.`,
      })

      revalidatePath("/admin")
      revalidatePath("/sales")
      revalidatePath("/sales/checkout")

      return {
        status: "error",
        message:
          status.status === "failed"
            ? "Squad returned a failed POS payment; the sale has been flagged."
            : "The Squad POS request expired; the sale has been flagged.",
        posRequestStatus: status.status,
      }
    }

    const result = await recordPosPaymentResult({
      sale,
      payment: status,
      recordedByMemberId: context.memberId,
    })

    revalidatePath("/admin")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message:
        result.saleStatus === "paid"
          ? `${sale.title} is paid. Incoming payment, ledger, reconciliation, and audit records were created.`
          : `${sale.title} was flagged because Squad confirmed a different POS amount.`,
      posRequestStatus:
        status.mode === "simulated" ? "simulated_success" : "success",
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to confirm this POS payment right now.",
    }
  }
}

export async function simulateIncomingBankTransferAction(
  _prevState: SaleFlowActionState,
  formData: FormData,
): Promise<SaleFlowActionState> {
  const context = await getAuthorizedSalesContext()
  const parsed = saleIdPayloadSchema.safeParse({
    saleId: formData.get("saleId"),
  })

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid sale to confirm." }
  }

  try {
    const sale = await getSaleForPaymentFlow(parsed.data.saleId)

    if (sale.organizationId !== context.organizationId) {
      return { status: "error", message: "This sale belongs to another workspace." }
    }

    if (sale.paymentSourceExpected !== "bank_transfer") {
      return {
        status: "error",
        message: "This sale is not waiting for a bank transfer.",
      }
    }

    if (sale.status === "paid") {
      return {
        status: "success",
        message: `${sale.title} is already marked as paid.`,
      }
    }

    await recordBankTransferPaymentResult({
      sale,
      recordedByMemberId: context.memberId,
    })

    revalidatePath("/admin")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message: `Exact transfer received for ${sale.title}. The sale is now paid.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to confirm this transfer right now.",
    }
  }
}

export async function flagMissingPaymentAction(
  _prevState: SaleFlowActionState,
  formData: FormData,
): Promise<SaleFlowActionState> {
  const context = await getAuthorizedSalesContext()
  const parsed = saleIdPayloadSchema.safeParse({
    saleId: formData.get("saleId"),
  })

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid sale first." }
  }

  try {
    const sale = await getSaleForPaymentFlow(parsed.data.saleId)

    if (sale.organizationId !== context.organizationId) {
      return { status: "error", message: "This sale belongs to another workspace." }
    }

    await markSalePaymentMissing({
      sale,
      actorMemberId: context.memberId,
    })

    revalidatePath("/admin")
    revalidatePath("/sales")
    revalidatePath("/sales/checkout")

    return {
      status: "success",
      message: `${sale.title} is now flagged for missing POS payment.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to flag this sale right now.",
    }
  }
}

async function getAuthorizedSalesContext() {
  const account = await getSalesActionAccount()

  if (!account) {
    throw new Error("Sign in again to continue.")
  }

  const workspace = await ensureDemoWorkspace(account)

  return workspace
}

async function getSalesActionAccount() {
  const account = await getCurrentAppwriteAccount()

  if (account || process.env.NODE_ENV === "production") {
    return account
  }

  const demoAccount = getDemoAccountByRole("sales_operator")

  if (!demoAccount) {
    return null
  }

  return {
    $id: demoAccount.userId,
    name: demoAccount.name,
    email: demoAccount.email,
  } as NonNullable<Awaited<ReturnType<typeof getCurrentAppwriteAccount>>>
}
