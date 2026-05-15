"use client"

import { Download, ReceiptText } from "lucide-react"

import type { CreateSaleActionState } from "@/app/sales/checkout/action-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type CashReceipt = NonNullable<CreateSaleActionState["receipt"]>

type CashReceiptDialogProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  receipt: CashReceipt
}

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
})

function getReceiptReference(saleId: string) {
  return `RCPT-${saleId.slice(-8).toUpperCase()}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function buildReceiptHtml(receipt: CashReceipt) {
  const receiptReference = getReceiptReference(receipt.saleId)
  const issuedAt = dateTimeFormatter.format(new Date(receipt.issuedAtIso))
  const amount = currencyFormatter.format(receipt.amountKobo / 100)
  const itemRows = receipt.lines
    .map(
      (line) => `<tr>
        <td>
          <strong>${escapeHtml(line.label)}</strong>
          <span>${line.quantity} x ${currencyFormatter.format(line.unitPriceKobo / 100)}</span>
        </td>
        <td>${currencyFormatter.format(line.lineTotalKobo / 100)}</td>
      </tr>`,
    )
    .join("")

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${receiptReference}</title>
  <style>
    body { margin: 0; background: #f4f1ea; color: #171717; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
    .receipt { width: 390px; background: #fffdf7; border: 1px solid #d9d0bf; box-shadow: 0 24px 80px rgba(23,23,23,.18); }
    .header { padding: 28px 28px 18px; border-bottom: 1px dashed #b9ad98; text-align: center; }
    .brand { font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .paid { margin: 16px auto 0; width: max-content; border: 2px solid #166534; color: #166534; padding: 7px 14px; transform: rotate(-4deg); font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .body { padding: 24px 28px; display: grid; gap: 14px; }
    .row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .label { color: #716a5e; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    td { border-top: 1px dashed #d6cbb9; padding: 12px 0; vertical-align: top; font-size: 13px; }
    td:last-child { text-align: right; font-weight: 800; white-space: nowrap; }
    td span { display: block; color: #716a5e; margin-top: 4px; }
    .amount { margin-top: 8px; padding-top: 18px; border-top: 1px dashed #b9ad98; font-size: 24px; font-weight: 900; }
    .footer { padding: 18px 28px 26px; border-top: 1px dashed #b9ad98; text-align: center; color: #716a5e; font-size: 12px; }
  </style>
</head>
<body>
  <main class="page">
    <section class="receipt">
      <div class="header">
        <div class="brand">Crestview Distribution</div>
        <div class="paid">Paid cash</div>
      </div>
      <div class="body">
        <div class="row"><span class="label">Receipt</span><strong>${receiptReference}</strong></div>
        <div class="row"><span class="label">Customer</span><strong>${escapeHtml(receipt.customerLabel || "Walk-in customer")}</strong></div>
        <div class="row"><span class="label">Issued</span><strong>${issuedAt}</strong></div>
        <table>${itemRows}</table>
        <div class="row amount"><span>Total paid</span><span>${amount}</span></div>
      </div>
      <div class="footer">Payment recorded by Cline.</div>
    </section>
  </main>
</body>
</html>`
}

export function CashReceiptDialog({
  onOpenChange,
  open,
  receipt,
}: CashReceiptDialogProps) {
  const receiptReference = getReceiptReference(receipt.saleId)
  const issuedAt = dateTimeFormatter.format(new Date(receipt.issuedAtIso))

  function downloadReceipt() {
    const url = window.URL.createObjectURL(
      new Blob([buildReceiptHtml(receipt)], { type: "text/html;charset=utf-8" }),
    )
    const link = document.createElement("a")

    link.href = url
    link.download = `${receiptReference.toLowerCase()}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cash receipt ready</DialogTitle>
          <DialogDescription>
            The cash payment has been recorded and the customer receipt is ready.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-[color:color-mix(in_srgb,var(--color-soft)_72%,white)] p-3">
          <div className="relative overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <div className="absolute left-0 right-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,var(--color-primary)_0_10px,transparent_10px_18px)]" />
            <div className="flex flex-col items-center gap-2 border-b border-dashed border-border px-5 pb-5 pt-7 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-success)_14%,white)] text-[color:var(--color-success)]">
                <ReceiptText />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Crestview Distribution
                </div>
                <div className="mt-2 inline-flex rotate-[-3deg] rounded-sm border-2 border-[color:var(--color-success)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[color:var(--color-success)]">
                  Paid cash
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-5 py-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Receipt</span>
                <span className="font-mono font-semibold">{receiptReference}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">
                  {receipt.customerLabel || "Walk-in customer"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">Cash</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium">{issuedAt}</span>
              </div>

              <div className="mt-1 flex flex-col gap-3 border-y border-dashed border-border py-4">
                {receipt.lines.map((line, index) => (
                  <div
                    className="flex items-start justify-between gap-3 text-sm"
                    key={`${line.label}-${index}`}
                  >
                    <div>
                      <div className="font-medium">{line.label}</div>
                      <div className="mt-1 text-muted-foreground">
                        {line.quantity} x{" "}
                        {currencyFormatter.format(line.unitPriceKobo / 100)}
                      </div>
                    </div>
                    <div className="font-mono font-semibold">
                      {currencyFormatter.format(line.lineTotalKobo / 100)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-end justify-between gap-3">
                <span className="font-medium">Total paid</span>
                <span className="font-mono text-3xl font-black">
                  {currencyFormatter.format(receipt.amountKobo / 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="h-9 w-full rounded-xl sm:w-auto"
            onClick={downloadReceipt}
            type="button"
          >
            <Download data-icon="inline-start" />
            Download receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
