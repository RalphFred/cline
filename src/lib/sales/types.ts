export const saleTypes = [
  "inventory_sale",
  "service_sale",
  "manual_sale",
] as const
export type SaleType = (typeof saleTypes)[number]

export const saleStatuses = [
  "pending_payment",
  "paid",
  "mismatch_flagged",
] as const
export type SaleStatus = (typeof saleStatuses)[number]

export const paymentSourceTypes = [
  "bank_transfer",
  "pos_payment",
  "cash",
  "manual_record",
] as const
export type PaymentSourceType = (typeof paymentSourceTypes)[number]

export const saleLineKinds = [
  "inventory_item",
  "service_item",
  "manual_item",
] as const
export type SaleLineKind = (typeof saleLineKinds)[number]

export type SaleRecord = {
  id: string
  organizationId: string
  createdByMemberId: string
  saleType: SaleType
  title: string
  customerLabel?: string | null
  expectedAmountKobo: number
  status: SaleStatus
  paymentSourceExpected: PaymentSourceType
  posRequestReference?: string | null
  posTerminalId?: string | null
  posRequestStatus?:
    | "not_requested"
    | "requested"
    | "pending"
    | "success"
    | "failed"
    | "expired"
    | "simulated_success"
    | null
  posRequestedAt?: string | null
  posConfirmedAt?: string | null
  bankTransferReference?: string | null
  bankTransferAccountName?: string | null
  bankTransferAccountNumber?: string | null
  bankTransferBankName?: string | null
  bankTransferExpiresAt?: string | null
  notes?: string | null
}

export type SaleLineRecord = {
  organizationId: string
  saleId: string
  kind: SaleLineKind
  inventoryItemId?: string
  label: string
  quantity: number
  unitPriceKobo: number
  lineTotalKobo: number
}

export type InventorySaleDraftLineInput = {
  inventoryItemId: string
  quantity: number
  unitPriceKobo: number
}

export type NonInventorySaleDraftLineInput = {
  label: string
  quantity: number
  unitPriceKobo: number
}

export type SaleDraftLineInput =
  | InventorySaleDraftLineInput
  | NonInventorySaleDraftLineInput

export type CreateSaleInput = {
  saleType: SaleType
  title: string
  customerLabel?: string
  paymentSourceExpected: PaymentSourceType
  notes?: string
  lines: SaleDraftLineInput[]
}

export type SaleDraft = {
  sale: SaleRecord
  saleLines: SaleLineRecord[]
  updatedInventoryItems: import("@/lib/inventory/types").InventoryItemRecord[]
  stockMovements: import("@/lib/inventory/types").StockMovementRecord[]
}

export type RecentSaleSummary = {
  id: string
  title: string
  customerLabel?: string | null
  saleType: SaleType
  status: SaleStatus
  expectedAmountKobo: number
  paymentSourceExpected: PaymentSourceType
  posRequestReference?: string | null
  posTerminalId?: string | null
  posRequestStatus?: SaleRecord["posRequestStatus"]
  posRequestedAt?: string | null
  posConfirmedAt?: string | null
  bankTransferReference?: string | null
  bankTransferAccountName?: string | null
  bankTransferAccountNumber?: string | null
  bankTransferBankName?: string | null
  bankTransferExpiresAt?: string | null
  incomingPaymentStatus?: "recorded" | "matched" | "mismatch_flagged" | "unclassified" | null
  actualAmountKobo?: number | null
  reconciliationOutcome?:
    | "matched"
    | "amount_mismatch"
    | "missing_payment"
    | "unclassified_payment"
    | null
  reconciliationSummary?: string | null
  createdAt: string
}
