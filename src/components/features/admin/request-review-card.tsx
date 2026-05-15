import {
  BanknoteArrowDown,
  FileCheck2,
  FileText,
  Gauge,
  RefreshCw,
} from "lucide-react"

import {
  acceptPaymentRequestProofAction,
  flagPaymentRequestProofAction,
  requeryPaymentRequestTransferAction,
} from "@/app/(admin)/admin/actions"
import {
  formatCurrency,
  requestTypeLabels,
  riskBadgeClass,
  statusBadgeClass,
  transferBadgeClass,
} from "@/components/features/admin/admin-format"
import { PaymentRequestDecisionForm } from "@/components/features/admin/payment-request-decision-form"
import { EvidencePreview } from "@/components/features/payments/evidence-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PaymentRequestSummary } from "@/lib/payments/types"
import { cn } from "@/lib/utils"

function PayoutPanel({ request }: { request: PaymentRequestSummary }) {
  if (request.status !== "approved") {
    return null
  }

  return (
    <section className="rounded-lg border border-border bg-secondary/45 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BanknoteArrowDown className="size-4" />
            Squad payout
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {request.transfer?.providerMessage ||
              "Payout visibility appears once approval creates a transfer."}
          </p>
        </div>
        {request.transferStatus ? (
          <Badge className={transferBadgeClass(request.transferStatus)}>
            {request.transferStatus}
          </Badge>
        ) : null}
      </div>

      {request.transfer ? (
        <dl className="mt-4 grid gap-3 text-sm lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="mt-1 break-all font-mono">
              {request.transfer.reference}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mode</dt>
            <dd className="mt-1 font-medium">
              {request.transfer.mode === "live" ? "Live Squad" : "Demo simulation"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="mt-1 font-mono font-semibold">
              {formatCurrency(request.transfer.amountKobo)}
            </dd>
          </div>
        </dl>
      ) : null}

      {request.transferStatus && request.transferStatus !== "success" ? (
        <form action={requeryPaymentRequestTransferAction} className="mt-4">
          <input name="requestId" type="hidden" value={request.id} />
          <Button size="sm" type="submit" variant="outline">
            <RefreshCw data-icon="inline-start" />
            Requery Squad
          </Button>
        </form>
      ) : null}
    </section>
  )
}

function ProofPanel({ request }: { request: PaymentRequestSummary }) {
  if (!request.proofRequired || request.status !== "approved") {
    return null
  }

  const latestProof = request.evidence[0]

  return (
    <section className="rounded-lg border border-border bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileCheck2 className="size-4" />
            Post-payout proof
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {latestProof
              ? `${latestProof.fileName} - ${latestProof.status}`
              : "Waiting for Field Employee proof upload."}
          </p>
        </div>
      </div>
      {latestProof ? (
        <div className="mt-4">
          <EvidencePreview evidence={latestProof} />
        </div>
      ) : null}
      {latestProof ? (
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          <form action={acceptPaymentRequestProofAction}>
            <input name="requestId" type="hidden" value={request.id} />
            <input name="comment" type="hidden" value="Proof accepted." />
            <Button className="w-full" size="sm" type="submit">
              Accept proof
            </Button>
          </form>
          <form action={flagPaymentRequestProofAction}>
            <input name="requestId" type="hidden" value={request.id} />
            <input name="comment" type="hidden" value="Proof needs correction." />
            <Button className="w-full" size="sm" type="submit" variant="outline">
              Needs correction
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export function RequestReviewCard({
  request,
  compact = false,
}: {
  request: PaymentRequestSummary
  compact?: boolean
}) {
  const flaggedRules = request.rules.filter((rule) => rule.outcome !== "pass")

  return (
    <article className="rounded-lg border border-border bg-card">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{requestTypeLabels[request.requestType]}</Badge>
            <Badge className={riskBadgeClass(request.riskBand)}>
              {request.riskBand === "medium"
                ? "Needs review"
                : `${request.riskBand} risk`}
            </Badge>
            <Badge className={statusBadgeClass(request.status)}>
              {request.status}
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_190px]">
            <div>
              <h3 className="text-xl font-semibold leading-tight">
                {request.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {request.purpose}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/55 px-4 py-3 xl:text-right">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {formatCurrency(request.amountKobo)}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mt-5 grid gap-4",
              compact ? "lg:grid-cols-1" : "lg:grid-cols-2",
            )}
          >
            <section className="rounded-lg border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="size-4" />
                Risk and Frank
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {request.frankNote}
              </p>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Risk score</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold">
                    {request.riskScore.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Top flag</dt>
                  <dd className="mt-1 font-medium">{request.topFlag}</dd>
                </div>
              </dl>
              {flaggedRules.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {flaggedRules.map((rule) => (
                    <div
                      className="rounded-lg bg-secondary/55 px-3 py-3 text-sm"
                      key={rule.code}
                    >
                      <div className="font-medium">{rule.label}</div>
                      <div className="mt-1 leading-5 text-muted-foreground">
                        {rule.details}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4" />
                Evidence
              </div>
              {request.evidence.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {request.evidence.map((item) => (
                    <EvidencePreview compact={compact} evidence={item} key={item.id} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No evidence has been attached yet.
                </p>
              )}
            </section>
          </div>

          <div className="mt-4 grid gap-4">
            <PayoutPanel request={request} />
            <ProofPanel request={request} />
          </div>
        </div>

        <aside className="border-t border-border bg-secondary/35 px-5 py-5 xl:border-l xl:border-t-0">
          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <div className="text-sm font-semibold">Decision</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Record the final Super Admin decision for this request.
            </p>

            {request.status === "submitted" ? (
              <PaymentRequestDecisionForm requestId={request.id} />
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {request.decisionComment || "Decision has been recorded."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  )
}
