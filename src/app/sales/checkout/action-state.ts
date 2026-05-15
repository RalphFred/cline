export type CreateSaleActionState = {
  status: "idle" | "error" | "success"
  message?: string
  posRequestStatus?:
    | "not_requested"
    | "requested"
    | "pending"
    | "success"
    | "failed"
    | "expired"
    | "simulated_success"
  transfer?: {
    saleId: string
    title: string
    customerLabel?: string | null
    amountKobo: number
    accountName?: string | null
    accountNumber?: string | null
    bankName?: string | null
    expiresAt?: string | null
    reference?: string | null
  }
}

export type SaleFlowActionState = CreateSaleActionState

export const initialCreateSaleActionState: CreateSaleActionState = {
  status: "idle",
}
