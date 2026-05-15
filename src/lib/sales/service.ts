import {
  applyInventorySale,
  calculateInventorySaleTotal,
} from "@/lib/inventory/service"
import type { InventoryItemRecord } from "@/lib/inventory/types"
import {
  createSaleInputSchema,
  inventorySaleDraftLineSchema,
  nonInventorySaleDraftLineSchema,
} from "@/lib/sales/schemas"
import type { SaleDraft, SaleLineKind } from "@/lib/sales/types"

function getSaleLineKind(saleType: "inventory_sale" | "service_sale" | "manual_sale"): SaleLineKind {
  if (saleType === "inventory_sale") {
    return "inventory_item"
  }

  if (saleType === "service_sale") {
    return "service_item"
  }

  return "manual_item"
}

function calculateNonInventorySaleTotal(
  lines: Array<{ quantity: number; unitPriceKobo: number }>,
) {
  return lines.reduce(
    (total, line) => total + line.quantity * line.unitPriceKobo,
    0,
  )
}

export function buildSaleDraft(params: {
  organizationId: string
  createdByMemberId: string
  saleId: string
  createdAtIso: string
  inventoryItems: InventoryItemRecord[]
  input: unknown
}): SaleDraft {
  const parsedInput = createSaleInputSchema.parse(params.input)
  const lineKind = getSaleLineKind(parsedInput.saleType)

  if (parsedInput.saleType === "inventory_sale") {
    const inventoryLines = parsedInput.lines.map((line) =>
      inventorySaleDraftLineSchema.parse(line),
    )
    const inventoryItemsById = new Map(
      params.inventoryItems.map((item) => [item.id, item]),
    )
    const inventoryApplication = applyInventorySale({
      items: params.inventoryItems,
      lines: inventoryLines,
      organizationId: params.organizationId,
      saleId: params.saleId,
      createdBy: params.createdByMemberId,
      createdAtIso: params.createdAtIso,
    })

    return {
      sale: {
        id: params.saleId,
        organizationId: params.organizationId,
        createdByMemberId: params.createdByMemberId,
        saleType: parsedInput.saleType,
        title: parsedInput.title,
        customerLabel: parsedInput.customerLabel,
        expectedAmountKobo: calculateInventorySaleTotal(inventoryLines),
        status: "pending_payment",
        paymentSourceExpected: parsedInput.paymentSourceExpected,
        notes: parsedInput.notes,
      },
      saleLines: inventoryLines.map((line) => {
        const item = inventoryItemsById.get(line.inventoryItemId)

        if (!item) {
          throw new Error(`Inventory item ${line.inventoryItemId} was not found.`)
        }

        return {
          organizationId: params.organizationId,
          saleId: params.saleId,
          kind: lineKind,
          inventoryItemId: line.inventoryItemId,
          label: item.name,
          quantity: line.quantity,
          unitPriceKobo: line.unitPriceKobo,
          lineTotalKobo: line.quantity * line.unitPriceKobo,
        }
      }),
      updatedInventoryItems: inventoryApplication.updatedItems,
      stockMovements: inventoryApplication.stockMovements,
    }
  }

  const nonInventoryLines = parsedInput.lines.map((line) =>
    nonInventorySaleDraftLineSchema.parse(line),
  )

  return {
    sale: {
      id: params.saleId,
      organizationId: params.organizationId,
      createdByMemberId: params.createdByMemberId,
      saleType: parsedInput.saleType,
      title: parsedInput.title,
      customerLabel: parsedInput.customerLabel,
      expectedAmountKobo: calculateNonInventorySaleTotal(nonInventoryLines),
      status: "pending_payment",
      paymentSourceExpected: parsedInput.paymentSourceExpected,
      notes: parsedInput.notes,
    },
    saleLines: nonInventoryLines.map((line) => ({
      organizationId: params.organizationId,
      saleId: params.saleId,
      kind: lineKind,
      label: line.label,
      quantity: line.quantity,
      unitPriceKobo: line.unitPriceKobo,
      lineTotalKobo: line.quantity * line.unitPriceKobo,
    })),
    updatedInventoryItems: [],
    stockMovements: [],
  }
}
