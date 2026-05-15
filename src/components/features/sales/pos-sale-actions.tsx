"use client"

import {
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Landmark,
  RadioTower,
  RotateCw,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import {
  confirmPosPaymentAction,
  flagMissingPaymentAction,
  requestPosPaymentAction,
} from "@/app/sales/checkout/actions"
import {
  initialCreateSaleActionState,
  type SaleFlowActionState,
} from "@/app/sales/checkout/action-state"
import { Button } from "@/components/ui/button"
import { PendingTransferDialog } from "@/components/features/sales/pending-transfer-dialog"
import type { RecentSaleSummary } from "@/lib/sales/types"
import type { PublicStaticVirtualAccount } from "@/lib/squad/virtual-accounts"

type PosSaleActionsProps = {
  sale: RecentSaleSummary
  virtualAccount: PublicStaticVirtualAccount
}

function SubmitButton({
  disabled,
  icon,
  label,
  pendingLabel,
  tone,
}: {
  disabled?: boolean
  icon?: ReactNode
  label: string
  pendingLabel: string
  tone?: "default" | "outline" | "destructive"
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      className="h-8 flex-1 rounded-xl"
      disabled={pending || disabled}
      type="submit"
      variant={tone ?? "default"}
    >
      {icon}
      {pending ? pendingLabel : label}
    </Button>
  )
}

function useToastForActionState(
  state: SaleFlowActionState,
  options?: { quietPending?: boolean },
) {
  useEffect(() => {
    if (options?.quietPending && state.posRequestStatus === "pending") {
      return
    }

    if (state.status === "success" && state.message) {
      toast.success(state.message)
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message)
    }
  }, [options?.quietPending, state])
}

export function PosSaleActions({ sale, virtualAccount }: PosSaleActionsProps) {
  const router = useRouter()
  const [pollState, setPollState] =
    useState<SaleFlowActionState>(initialCreateSaleActionState)
  const [isAutoChecking, setIsAutoChecking] = useState(false)
  const [requestState, requestAction] = useActionState(
    requestPosPaymentAction,
    initialCreateSaleActionState,
  )
  const [confirmState, confirmAction] = useActionState(
    confirmPosPaymentAction,
    initialCreateSaleActionState,
  )
  const [flagState, flagAction] = useActionState(
    flagMissingPaymentAction,
    initialCreateSaleActionState,
  )

  useToastForActionState(requestState)
  useToastForActionState(confirmState)
  useToastForActionState(flagState)
  useToastForActionState(pollState, { quietPending: true })

  const currentPosStatus =
    pollState.posRequestStatus ??
    confirmState.posRequestStatus ??
    sale.posRequestStatus
  const hasFinalPosStatus =
    currentPosStatus === "success" ||
    currentPosStatus === "simulated_success" ||
    currentPosStatus === "failed" ||
    currentPosStatus === "expired"
  const shouldAutoRequery =
    sale.paymentSourceExpected === "pos_payment" &&
    sale.status === "pending_payment" &&
    Boolean(sale.posRequestReference) &&
    !hasFinalPosStatus

  useEffect(() => {
    if (!shouldAutoRequery || isAutoChecking) {
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsAutoChecking(true)

        try {
          const formData = new FormData()

          formData.set("saleId", sale.id)
          const result = await confirmPosPaymentAction(
            initialCreateSaleActionState,
            formData,
          )

          setPollState(result)

          if (result.posRequestStatus !== "pending") {
            router.refresh()
          }
        } finally {
          setIsAutoChecking(false)
        }
      })()
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [isAutoChecking, router, sale.id, shouldAutoRequery])

  if (sale.paymentSourceExpected === "bank_transfer") {
    if (sale.status === "paid") {
      return (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeCheck className="size-3.5" />
          Matched automatically
        </div>
      )
    }

    return (
      <PendingTransferDialog
        sale={sale}
        virtualAccount={virtualAccount}
        trigger={
          <Button className="cursor-pointer rounded-xl" size="sm" variant="outline">
            <Landmark data-icon="inline-start" />
            View transfer
          </Button>
        }
      />
    )
  }

  if (sale.paymentSourceExpected !== "pos_payment") {
    return null
  }

  if (sale.status === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-[color:color-mix(in_srgb,var(--color-success)_10%,white)] px-3 py-2 text-xs font-medium text-[color:var(--color-success)]">
        <BadgeCheck className="size-3.5" />
        POS payment matched and ledgered.
      </div>
    )
  }

  if (sale.status === "mismatch_flagged") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-[color:color-mix(in_srgb,var(--color-warning)_12%,white)] px-3 py-2 text-xs leading-5 text-[color:var(--color-warning)]">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Flagged for reconciliation. Frank can explain this from the stored
          event trail.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-xs text-muted-foreground">
        <RadioTower className="size-3.5 text-primary" />
        <span className="min-w-0 flex-1 truncate">
          {sale.posRequestReference
            ? `POS request ${sale.posRequestReference}`
            : "No POS request attached yet."}
        </span>
        {currentPosStatus === "pending" || isAutoChecking ? (
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            <RotateCw className="size-3 animate-spin" />
            Requerying
          </span>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {!sale.posRequestReference ? (
          <form action={requestAction}>
            <input name="saleId" type="hidden" value={sale.id} />
            <SubmitButton label="Request POS" pendingLabel="Requesting..." />
          </form>
        ) : null}

        <form action={confirmAction}>
          <input name="saleId" type="hidden" value={sale.id} />
          <SubmitButton
            disabled={!sale.posRequestReference}
            icon={<RotateCw data-icon="inline-start" />}
            label="Check now"
            pendingLabel="Checking..."
            tone={sale.posRequestReference ? "default" : "outline"}
          />
        </form>

        <form action={flagAction}>
          <input name="saleId" type="hidden" value={sale.id} />
          <SubmitButton
            label="Flag missing"
            pendingLabel="Flagging..."
            tone="outline"
          />
        </form>
      </div>
    </div>
  )
}
