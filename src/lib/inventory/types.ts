export const inventoryStatuses = ["active", "archived"] as const
export type InventoryStatus = (typeof inventoryStatuses)[number]

export const stockMovementTypes = [
  "stock_in",
  "sale_out",
  "adjustment",
] as const
export type StockMovementType = (typeof stockMovementTypes)[number]

export type InventoryItemRecord = {
  id: string
  organizationId: string
  sku: string
  name: string
  description?: string | null
  unitPriceKobo: number
  quantityOnHand: number
  lowStockThreshold: number
  status: InventoryStatus
}

export type InventorySaleLine = {
  inventoryItemId: string
  quantity: number
  unitPriceKobo: number
}

export type StockMovementRecord = {
  organizationId: string
  inventoryItemId: string
  type: StockMovementType
  quantityDelta: number
  unitPriceKobo?: number
  saleId?: string
  reason?: string
  createdBy: string
  createdAtIso: string
}

export type LowStockState = "healthy" | "low" | "out"

export type InventoryAvailabilityIssue = {
  inventoryItemId: string
  sku: string
  requestedQuantity: number
  quantityOnHand: number
  reason: "item_archived" | "insufficient_stock"
}

export type InventorySaleApplicationResult = {
  updatedItems: InventoryItemRecord[]
  stockMovements: StockMovementRecord[]
  totalQuantitySold: number
  totalAmountKobo: number
}
