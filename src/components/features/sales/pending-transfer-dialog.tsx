"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import type { ReactElement, ReactNode } from "react"
import { useFormStatus } from "react-dom"
import { BadgeCheck, Ban, Download, Landmark, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import {
  cancelPendingTransferAction,
  simulateIncomingBankTransferAction,
} from "@/app/sales/checkout/actions"
import {
  initialCreateSaleActionState,
} from "@/app/sales/checkout/action-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { PublicStaticVirtualAccount } from "@/lib/squad/virtual-accounts"

export type PendingTransferDialogSale = {
  id: string
  title: string
  customerLabel?: string | null
  expectedAmountKobo: number
  bankTransferAccountName?: string | null
  bankTransferAccountNumber?: string | null
  bankTransferBankName?: string | null
  bankTransferExpiresAt?: string | null
  bankTransferReference?: string | null
}

type PendingTransferDialogProps = {
  onOpenChange?: (open: boolean) => void
  onResolved?: () => void
  open?: boolean
  sale: PendingTransferDialogSale
  trigger?: ReactElement
  virtualAccount: PublicStaticVirtualAccount
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

function TransferSubmitButton({
  children,
  pendingLabel,
  variant,
}: {
  children: ReactNode
  pendingLabel: string
  variant?: "default" | "outline" | "destructive"
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      className="h-9 w-full rounded-xl sm:w-auto"
      disabled={pending}
      type="submit"
      variant={variant}
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function PendingTransferDialog({
  onOpenChange,
  onResolved,
  open,
  sale,
  trigger,
  virtualAccount,
}: PendingTransferDialogProps) {
  const [transferState, transferAction] = useActionState(
    simulateIncomingBankTransferAction,
    initialCreateSaleActionState,
  )
  const [cancelState, cancelAction] = useActionState(
    cancelPendingTransferAction,
    initialCreateSaleActionState,
  )
  const [isReceiptReady, setIsReceiptReady] = useState(false)
  const receiptReference = useMemo(
    () => `RCPT-${sale.id.slice(-8).toUpperCase()}`,
    [sale.id],
  )
  const receiptIssuedAt = useMemo(() => new Date(), [])
  const formattedIssuedAt = dateTimeFormatter.format(receiptIssuedAt)
  const transferAccount = {
    accountName: sale.bankTransferAccountName ?? virtualAccount.accountName,
    accountNumber:
      sale.bankTransferAccountNumber ?? virtualAccount.accountNumber,
    bankName: sale.bankTransferBankName ?? virtualAccount.bankName,
    expiresAt: sale.bankTransferExpiresAt,
    reference:
      sale.bankTransferReference ?? virtualAccount.customerIdentifier,
  }
  const formattedExpiresAt = transferAccount.expiresAt
    ? dateTimeFormatter.format(new Date(transferAccount.expiresAt))
    : null
  const isSaleAccount = Boolean(sale.bankTransferAccountNumber)

  useEffect(() => {
    if (transferState.status === "success" && transferState.message) {
      toast.success(transferState.message)
      const receiptTimer = window.setTimeout(() => {
        setIsReceiptReady(true)
      }, 0)

      return () => window.clearTimeout(receiptTimer)
    }

    if (transferState.status === "error" && transferState.message) {
      toast.error(transferState.message)
    }
  }, [transferState])

  useEffect(() => {
    if (cancelState.status === "success" && cancelState.message) {
      toast.success(cancelState.message)
      onResolved?.()
    }

    if (cancelState.status === "error" && cancelState.message) {
      toast.error(cancelState.message)
    }
  }, [cancelState, onResolved])

  function downloadReceipt() {
    const amount = currencyFormatter.format(sale.expectedAmountKobo / 100)
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${receiptReference}</title>
  <style>
    body { margin: 0; background: #f4f1ea; color: #171717; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }
    .receipt { width: 360px; background: #fffdf7; border: 1px solid #d9d0bf; box-shadow: 0 24px 80px rgba(23,23,23,.18); }
    .header { padding: 28px 28px 18px; border-bottom: 1px dashed #b9ad98; text-align: center; }
    .brand { font: 700 18px ui-sans-serif, system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
    .paid { margin: 16px auto 0; width: max-content; border: 2px solid #166534; color: #166534; padding: 7px 14px; transform: rotate(-4deg); font-weight: 800; letter-spacing: .12em; }
    .body { padding: 24px 28px; display: grid; gap: 14px; }
    .row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .label { color: #716a5e; }
    .amount { margin-top: 8px; padding-top: 18px; border-top: 1px dashed #b9ad98; font-size: 26px; font-weight: 900; }
    .footer { padding: 18px 28px 26px; border-top: 1px dashed #b9ad98; text-align: center; color: #716a5e; font-size: 12px; }
  </style>
</head>
<body>
  <main class="page">
    <section class="receipt">
      <div class="header">
        <div class="brand">Crestview Distribution</div>
        <div class="paid">Paid</div>
      </div>
      <div class="body">
        <div class="row"><span class="label">Receipt</span><strong>${receiptReference}</strong></div>
        <div class="row"><span class="label">Sale</span><strong>${sale.title}</strong></div>
        <div class="row"><span class="label">Customer</span><strong>${sale.customerLabel || "Walk-in customer"}</strong></div>
        <div class="row"><span class="label">Method</span><strong>Bank transfer</strong></div>
        <div class="row"><span class="label">Issued</span><strong>${formattedIssuedAt}</strong></div>
        <div class="row amount"><span>Total paid</span><span>${amount}</span></div>
      </div>
      <div class="footer">Payment matched and recorded by Cline.</div>
    </section>
  </main>
</body>
</html>`
    const url = window.URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
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
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent className="overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isReceiptReady ? "Payment received" : "Pending transfer"}
          </DialogTitle>
          <DialogDescription>
            {isReceiptReady
              ? "The bank transfer has been matched and the customer receipt is ready."
              : isSaleAccount
                ? "Share this Cline Squad account with the customer. The sale is only completed when the exact amount is received."
                : "Share the static Cline Squad account with the customer. The sale is only completed when the exact amount is received."}
          </DialogDescription>
        </DialogHeader>

        {isReceiptReady ? (
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
                    Paid
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 px-5 py-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Receipt</span>
                  <span className="font-mono font-semibold">{receiptReference}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Sale</span>
                  <span className="max-w-56 text-right font-medium">{sale.title}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">
                    {sale.customerLabel || "Walk-in customer"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">Bank transfer</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">{formattedIssuedAt}</span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3 border-t border-dashed border-border pt-4">
                  <span className="font-medium">Total paid</span>
                  <span className="font-mono text-3xl font-black">
                    {currencyFormatter.format(sale.expectedAmountKobo / 100)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <dl className="grid gap-3 rounded-xl border border-border bg-soft/60 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Amount</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold">
                  {currencyFormatter.format(sale.expectedAmountKobo / 100)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Bank</dt>
                <dd className="mt-1 font-medium">{transferAccount.bankName}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Account number</dt>
                <dd className="mt-1 font-mono text-lg font-semibold">
                  {transferAccount.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Account name</dt>
                <dd className="mt-1 font-medium">{transferAccount.accountName}</dd>
              </div>
              {formattedExpiresAt ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Expires</dt>
                  <dd className="mt-1 font-medium">{formattedExpiresAt}</dd>
                </div>
              ) : null}
              {transferAccount.reference ? (
                <div>
                  <dt className="text-sm text-muted-foreground">Reference</dt>
                  <dd className="mt-1 break-all font-mono text-xs font-semibold">
                    {transferAccount.reference}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Landmark data-icon="inline-start" />
                {sale.title}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {sale.customerLabel || "Walk-in customer"} - pending bank transfer
              </p>
            </div>
          </>
        )}

        <DialogFooter>
          {isReceiptReady ? (
            <Button
              className="h-9 w-full rounded-xl sm:w-auto"
              onClick={downloadReceipt}
              type="button"
            >
              <Download data-icon="inline-start" />
              Download receipt
            </Button>
          ) : (
            <>
              <form action={cancelAction} className="w-full sm:w-auto">
                <input name="saleId" type="hidden" value={sale.id} />
                <TransferSubmitButton pendingLabel="Cancelling..." variant="outline">
                  <Ban data-icon="inline-start" />
                  Cancel payment
                </TransferSubmitButton>
              </form>
              <form action={transferAction} className="w-full sm:w-auto">
                <input name="saleId" type="hidden" value={sale.id} />
                <TransferSubmitButton pendingLabel="Receiving...">
                  <BadgeCheck data-icon="inline-start" />
                  Mark received
                </TransferSubmitButton>
              </form>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
