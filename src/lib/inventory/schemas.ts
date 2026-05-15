import { z } from "zod"

import { inventoryStatuses, stockMovementTypes } from "@/lib/inventory/types"

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  description: z.string().max(500).nullish(),
  unitPriceKobo: z.number().int().nonnegative(),
  quantityOnHand: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  status: z.enum(inventoryStatuses),
})

export const inventorySaleLineSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceKobo: z.number().int().nonnegative(),
})

export const stockMovementSchema = z.object({
  organizationId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  type: z.enum(stockMovementTypes),
  quantityDelta: z.number().int(),
  unitPriceKobo: z.number().int().nonnegative().optional(),
  saleId: z.string().min(1).optional(),
  reason: z.string().max(400).optional(),
  createdBy: z.string().min(1),
  createdAtIso: z.string().datetime(),
})

export const stockInInputSchema = z.object({
  organizationId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceKobo: z.number().int().nonnegative(),
  reason: z.string().max(400).optional(),
  createdBy: z.string().min(1),
  createdAtIso: z.string().datetime(),
})

export const stockAdjustmentInputSchema = z.object({
  organizationId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  quantityDelta: z.number().int().refine((value) => value !== 0, {
    message: "quantityDelta cannot be zero",
  }),
  reason: z.string().min(1).max(400),
  createdBy: z.string().min(1),
  createdAtIso: z.string().datetime(),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type InventorySaleLineInput = z.infer<typeof inventorySaleLineSchema>
export type StockMovementInput = z.infer<typeof stockMovementSchema>
export type StockInInput = z.infer<typeof stockInInputSchema>
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentInputSchema>
