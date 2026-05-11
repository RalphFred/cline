export type LedgerEntryType =
  | "inbound_funding"
  | "sandbox_funding_adjustment"
  | "reservation"
  | "reservation_release"
  | "transfer_debit"
  | "transfer_failure_release"
  | "reversal"
  | "correction"

export type LedgerDirection = "credit" | "debit" | "reservation"

export type LedgerStatus = "pending" | "posted" | "released" | "reversed"
