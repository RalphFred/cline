import type { PaymentRequestSummary } from "@/lib/payments/types"

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

export const requestTypeLabels: Record<
  PaymentRequestSummary["requestType"],
  string
> = {
  vendor_payment: "Vendor",
  staff_cash_request: "Staff cash",
  airtime_data_request: "Airtime/data",
  utility_payment: "Utility",
  manual_business_expense: "Reimbursement",
}

export function formatCurrency(amountKobo: number) {
  return currencyFormatter.format(amountKobo / 100)
}

export function riskBadgeClass(riskBand: PaymentRequestSummary["riskBand"]) {
  if (riskBand === "high") {
    return "bg-critical text-white hover:bg-critical"
  }

  if (riskBand === "medium") {
    return "bg-warning text-white hover:bg-warning"
  }

  return "bg-success text-white hover:bg-success"
}

export function statusBadgeClass(status: PaymentRequestSummary["status"]) {
  if (status === "approved") {
    return "bg-success text-white hover:bg-success"
  }

  if (status === "rejected") {
    return "bg-critical text-white hover:bg-critical"
  }

  return "bg-secondary text-secondary-foreground hover:bg-secondary"
}

export function transferBadgeClass(
  status?: PaymentRequestSummary["transferStatus"],
) {
  if (status === "success") {
    return "bg-success text-white hover:bg-success"
  }

  if (status === "failed") {
    return "bg-critical text-white hover:bg-critical"
  }

  if (status === "unknown" || status === "processing" || status === "queued") {
    return "bg-warning text-white hover:bg-warning"
  }

  return "border-border bg-background text-muted-foreground"
}
