"use server"

import { ID } from "appwrite"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import {
  ensureDemoWorkspace,
  getDemoInventoryItem,
} from "@/lib/demo/server"
import { createStockAdjustmentMovement, createStockInMovement } from "@/lib/inventory/service"
import { inventoryItemSchema } from "@/lib/inventory/schemas"
import type { InventoryStatus } from "@/lib/inventory/types"
import type { InventoryActionState } from "@/app/sales/inventory/action-state"

const inventoryFormSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional(),
  unitPriceNaira: z.coerce.number().int().nonnegative(),
  quantityOnHand: z.coerce.number().int().nonnegative(),
  lowStockThreshold: z.coerce.number().int().nonnegative(),
  status: z.enum(["active", "archived"]).default("active"),
})

const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1),
  movementType: z.enum(["stock_in", "adjustment"]),
  quantity: z.coerce.number().int().positive(),
  direction: z.enum(["add", "remove"]).default("add"),
  reason: z.string().trim().min(2).max(400),
})

const itemStatusSchema = z.object({
  itemId: z.string().min(1),
  status: z.enum(["active", "archived"]),
})

export async function createInventoryItemAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const context = await getAuthorizedInventoryContext()
  const parsed = inventoryFormSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the item details.",
    }
  }

  try {
    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const now = new Date().toISOString()
    const unitPriceKobo = parsed.data.unitPriceNaira * 100
    const itemId = ID.unique()
    const item = inventoryItemSchema.parse({
      id: itemId,
      organizationId: context.organizationId,
      sku: createInventoryItemCode(parsed.data.name, itemId),
      name: parsed.data.name,
      description: parsed.data.description,
      unitPriceKobo,
      quantityOnHand: parsed.data.quantityOnHand,
      lowStockThreshold: parsed.data.lowStockThreshold,
      status: "active",
    })

    await databases.createDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      item.id,
      {
        organizationId: item.organizationId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        unitPriceKobo: item.unitPriceKobo,
        quantityOnHand: item.quantityOnHand,
        lowStockThreshold: item.lowStockThreshold,
        status: item.status,
      },
    )

    if (item.quantityOnHand > 0) {
      const movement = createStockInMovement({
        organizationId: context.organizationId,
        inventoryItemId: item.id,
        quantity: item.quantityOnHand,
        unitPriceKobo,
        reason: "Opening stock",
        createdBy: context.memberId,
        createdAtIso: now,
      })

      await databases.createDocument(
        ids.databaseId,
        ids.collections.stockMovements,
        ID.unique(),
        movement,
      )
    }

    await writeInventoryAudit({
      action: "inventory_item_created",
      actorMemberId: context.memberId,
      entityId: item.id,
      organizationId: context.organizationId,
      summary: `${item.name} was added to inventory with ${item.quantityOnHand} units on hand.`,
    })

    revalidateInventoryPaths()

    return {
      status: "success",
      message: `${item.name} is now available for sales.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to create inventory item.",
    }
  }
}

export async function updateInventoryItemAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const context = await getAuthorizedInventoryContext()
  const parsed = inventoryFormSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success || !parsed.data.itemId) {
    return {
      status: "error",
      message: parsed.error?.issues[0]?.message ?? "Choose a valid item to edit.",
    }
  }

  try {
    const item = await getDemoInventoryItem(context.organizationId, parsed.data.itemId)

    if (!item) {
      return { status: "error", message: "That inventory item was not found." }
    }

    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const unitPriceKobo = parsed.data.unitPriceNaira * 100

    await databases.updateDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      item.id,
      {
        name: parsed.data.name,
        description: parsed.data.description,
        unitPriceKobo,
        quantityOnHand: parsed.data.quantityOnHand,
        lowStockThreshold: parsed.data.lowStockThreshold,
        status: parsed.data.status,
      },
    )

    await writeInventoryAudit({
      action: "inventory_item_updated",
      actorMemberId: context.memberId,
      entityId: item.id,
      organizationId: context.organizationId,
      summary: `${parsed.data.name} inventory details were updated.`,
    })

    revalidateInventoryPaths()

    return {
      status: "success",
      message: `${parsed.data.name} was updated.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to update inventory item.",
    }
  }
}

export async function adjustInventoryStockAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const context = await getAuthorizedInventoryContext()
  const parsed = stockAdjustmentSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the stock update.",
    }
  }

  try {
    const item = await getDemoInventoryItem(context.organizationId, parsed.data.itemId)

    if (!item) {
      return { status: "error", message: "That inventory item was not found." }
    }

    const quantityDelta =
      parsed.data.movementType === "stock_in" || parsed.data.direction === "add"
        ? parsed.data.quantity
        : parsed.data.quantity * -1
    const nextQuantity = item.quantityOnHand + quantityDelta

    if (nextQuantity < 0) {
      return {
        status: "error",
        message: "This adjustment would put stock below zero.",
      }
    }

    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const now = new Date().toISOString()
    const movement =
      parsed.data.movementType === "stock_in"
        ? createStockInMovement({
            organizationId: context.organizationId,
            inventoryItemId: item.id,
            quantity: parsed.data.quantity,
            unitPriceKobo: item.unitPriceKobo,
            reason: parsed.data.reason,
            createdBy: context.memberId,
            createdAtIso: now,
          })
        : createStockAdjustmentMovement({
            organizationId: context.organizationId,
            inventoryItemId: item.id,
            quantityDelta,
            reason: parsed.data.reason,
            createdBy: context.memberId,
            createdAtIso: now,
          })

    await databases.updateDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      item.id,
      { quantityOnHand: nextQuantity },
    )

    await databases.createDocument(
      ids.databaseId,
      ids.collections.stockMovements,
      ID.unique(),
      movement,
    )

    await writeInventoryAudit({
      action: "inventory_stock_adjusted",
      actorMemberId: context.memberId,
      entityId: item.id,
      organizationId: context.organizationId,
      summary: `${item.name} stock changed by ${quantityDelta}. New quantity: ${nextQuantity}.`,
    })

    revalidateInventoryPaths()

    return {
      status: "success",
      message: `${item.name} stock is now ${nextQuantity}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to update stock.",
    }
  }
}

export async function setInventoryItemStatusAction(
  _prevState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const context = await getAuthorizedInventoryContext()
  const parsed = itemStatusSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: "error", message: "Choose a valid item status." }
  }

  try {
    const item = await getDemoInventoryItem(context.organizationId, parsed.data.itemId)

    if (!item) {
      return { status: "error", message: "That inventory item was not found." }
    }

    const ids = getAppwriteIds()
    const { databases } = createAppwriteAdminClient()
    const status: InventoryStatus = parsed.data.status

    await databases.updateDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      item.id,
      { status },
    )

    await writeInventoryAudit({
      action: status === "archived" ? "inventory_item_archived" : "inventory_item_restored",
      actorMemberId: context.memberId,
      entityId: item.id,
      organizationId: context.organizationId,
      summary: `${item.name} was ${status === "archived" ? "archived" : "restored"}.`,
    })

    revalidateInventoryPaths()

    return {
      status: "success",
      message: `${item.name} was ${status === "archived" ? "archived" : "restored"}.`,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Unable to update item status.",
    }
  }
}

async function getAuthorizedInventoryContext() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    throw new Error("Sign in again to continue.")
  }

  const workspace = await ensureDemoWorkspace(account)

  if (
    workspace.memberRole !== "sales_operator" &&
    workspace.memberRole !== "super_admin"
  ) {
    throw new Error("Only Sales Operators and Super Admins can manage inventory.")
  }

  return workspace
}

async function writeInventoryAudit(input: {
  organizationId: string
  actorMemberId: string
  entityId: string
  action: string
  summary: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()

  await databases.createDocument(
    ids.databaseId,
    ids.collections.auditEvents,
    ID.unique(),
    {
      organizationId: input.organizationId,
      actorUserProfileId: input.actorMemberId,
      entityType: "inventory_item",
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      occurredAt: new Date().toISOString(),
    },
  )
}

function revalidateInventoryPaths() {
  revalidatePath("/admin")
  revalidatePath("/mobile")
  revalidatePath("/sales")
  revalidatePath("/sales/inventory")
  revalidatePath("/sales/checkout")
}

function createInventoryItemCode(name: string, itemId: string) {
  const prefix = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.slice(0, 3))
    .join("-")

  const suffix =
    itemId
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(-5) || "ITEM"

  return `${prefix || "ITEM"}-${suffix}`
}
