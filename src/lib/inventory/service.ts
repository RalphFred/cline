import {
  inventoryItemSchema,
  inventorySaleLineSchema,
  stockAdjustmentInputSchema,
  stockInInputSchema,
  stockMovementSchema,
} from "@/lib/inventory/schemas"
import type {
  InventoryAvailabilityIssue,
  InventoryItemRecord,
  InventorySaleApplicationResult,
  InventorySaleLine,
  LowStockState,
  StockMovementRecord,
} from "@/lib/inventory/types"

export function getLowStockState(item: InventoryItemRecord): LowStockState {
  const parsedItem = inventoryItemSchema.parse(item)

  if (parsedItem.quantityOnHand === 0) {
    return "out"
  }

  if (parsedItem.quantityOnHand <= parsedItem.lowStockThreshold) {
    return "low"
  }

  return "healthy"
}

export function calculateInventorySaleTotal(lines: InventorySaleLine[]): number {
  return lines.reduce((total, line) => {
    const parsedLine = inventorySaleLineSchema.parse(line)
    return total + parsedLine.quantity * parsedLine.unitPriceKobo
  }, 0)
}

export function findInventoryAvailabilityIssues(
  items: InventoryItemRecord[],
  lines: InventorySaleLine[],
): InventoryAvailabilityIssue[] {
  const itemsById = new Map(items.map((item) => [item.id, inventoryItemSchema.parse(item)]))

  return lines.flatMap<InventoryAvailabilityIssue>((line) => {
    const parsedLine = inventorySaleLineSchema.parse(line)
    const item = itemsById.get(parsedLine.inventoryItemId)

    if (!item) {
      return [
        {
          inventoryItemId: parsedLine.inventoryItemId,
          sku: "unknown",
          requestedQuantity: parsedLine.quantity,
          quantityOnHand: 0,
          reason: "insufficient_stock" as const,
        },
      ]
    }

    if (item.status === "archived") {
      return [
        {
          inventoryItemId: item.id,
          sku: item.sku,
          requestedQuantity: parsedLine.quantity,
          quantityOnHand: item.quantityOnHand,
          reason: "item_archived" as const,
        },
      ]
    }

    if (item.quantityOnHand < parsedLine.quantity) {
      return [
        {
          inventoryItemId: item.id,
          sku: item.sku,
          requestedQuantity: parsedLine.quantity,
          quantityOnHand: item.quantityOnHand,
          reason: "insufficient_stock" as const,
        },
      ]
    }

    return []
  })
}

export function applyInventorySale(params: {
  items: InventoryItemRecord[]
  lines: InventorySaleLine[]
  organizationId: string
  saleId: string
  createdBy: string
  createdAtIso: string
}): InventorySaleApplicationResult {
  const issues = findInventoryAvailabilityIssues(params.items, params.lines)

  if (issues.length > 0) {
    throw new Error(
      `Inventory sale cannot be applied because ${issues.length} line item(s) failed stock validation.`,
    )
  }

  const itemsById = new Map(
    params.items.map((item) => [item.id, inventoryItemSchema.parse(item)]),
  )
  const stockMovements: StockMovementRecord[] = []
  let totalQuantitySold = 0

  for (const line of params.lines) {
    const parsedLine = inventorySaleLineSchema.parse(line)
    const item = itemsById.get(parsedLine.inventoryItemId)

    if (!item) {
      throw new Error(`Inventory item ${parsedLine.inventoryItemId} was not found.`)
    }

    item.quantityOnHand -= parsedLine.quantity
    totalQuantitySold += parsedLine.quantity

    stockMovements.push(
      stockMovementSchema.parse({
        organizationId: params.organizationId,
        inventoryItemId: parsedLine.inventoryItemId,
        type: "sale_out",
        quantityDelta: parsedLine.quantity * -1,
        unitPriceKobo: parsedLine.unitPriceKobo,
        saleId: params.saleId,
        createdBy: params.createdBy,
        createdAtIso: params.createdAtIso,
      }),
    )
  }

  return {
    updatedItems: [...itemsById.values()],
    stockMovements,
    totalQuantitySold,
    totalAmountKobo: calculateInventorySaleTotal(params.lines),
  }
}

export function createStockInMovement(input: {
  organizationId: string
  inventoryItemId: string
  quantity: number
  unitPriceKobo: number
  reason?: string
  createdBy: string
  createdAtIso: string
}): StockMovementRecord {
  const parsedInput = stockInInputSchema.parse(input)

  return stockMovementSchema.parse({
    organizationId: parsedInput.organizationId,
    inventoryItemId: parsedInput.inventoryItemId,
    type: "stock_in",
    quantityDelta: parsedInput.quantity,
    unitPriceKobo: parsedInput.unitPriceKobo,
    reason: parsedInput.reason,
    createdBy: parsedInput.createdBy,
    createdAtIso: parsedInput.createdAtIso,
  })
}

export function createStockAdjustmentMovement(input: {
  organizationId: string
  inventoryItemId: string
  quantityDelta: number
  reason: string
  createdBy: string
  createdAtIso: string
}): StockMovementRecord {
  const parsedInput = stockAdjustmentInputSchema.parse(input)

  return stockMovementSchema.parse({
    organizationId: parsedInput.organizationId,
    inventoryItemId: parsedInput.inventoryItemId,
    type: "adjustment",
    quantityDelta: parsedInput.quantityDelta,
    reason: parsedInput.reason,
    createdBy: parsedInput.createdBy,
    createdAtIso: parsedInput.createdAtIso,
  })
}
