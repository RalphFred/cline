import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  ClipboardCheck,
  Wallet,
} from "lucide-react"
import Link from "next/link"

import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  EmptyPanel,
  MetricTile,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import {
  formatCurrency,
  requestTypeLabels,
  riskBadgeClass,
} from "@/components/features/admin/admin-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { getLiveAdminMoneyInOverview } from "@/lib/demo/server"
import { listPaymentRequestSummaries } from "@/lib/payments/service"

export default async function AdminPage() {
  const { account, workspace, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin")

  const [liveMoneyIn, liveOutgoingRequests] = await Promise.all([
    getLiveAdminMoneyInOverview(workspace.organizationId),
    listPaymentRequestSummaries({
      organizationId: workspace.organizationId,
      limit: 8,
    }),
  ])

  const submittedRequests = liveOutgoingRequests.filter(
    (request) => request.status === "submitted",
  )
  const highRiskRequests = liveOutgoingRequests.filter(
    (request) => request.riskBand === "high",
  )
  const statTiles = [
    {
      label: "Expected revenue",
      value: formatCurrency(liveMoneyIn.expectedKobo),
      icon: Wallet,
    },
    {
      label: "Matched collections",
      value: formatCurrency(liveMoneyIn.collectedKobo),
      icon: BadgeCheck,
    },
    {
      label: "Pending reconciliation",
      value: String(liveMoneyIn.pendingCount),
      icon: Clock3,
    },
    {
      label: "Awaiting decision",
      value: String(submittedRequests.length),
      icon: AlertTriangle,
    },
  ]

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="overview"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        description="A desktop control room for the finance work that needs attention: money coming in, outgoing approvals, and the audit trail behind each decision."
        eyebrow="Super Admin"
        title="Finance overview"
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <MetricTile
            icon={tile.icon}
            key={tile.label}
            label={tile.label}
            value={tile.value}
          />
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div>
                <CardTitle>Money-in health</CardTitle>
                <CardDescription>
                  Revenue, POS matching, and reconciliation exceptions.
                </CardDescription>
              </div>
              <CardAction>
                <Link
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  href="/admin/money-in"
                >
                  Open money in
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  {
                    label: "POS collections matched",
                    value: formatCurrency(liveMoneyIn.collectedKobo),
                    note: `${liveMoneyIn.paidCount} sale${
                      liveMoneyIn.paidCount === 1 ? "" : "s"
                    } reconciled through the POS flow.`,
                  },
                  {
                    label: "Sales waiting for payment",
                    value: String(liveMoneyIn.pendingCount),
                    note: "Expected revenue with no matched incoming payment.",
                  },
                  {
                    label: "Inventory-backed sales under watch",
                    value: String(liveMoneyIn.flaggedCount),
                    note: "Flagged sales preserve reconciliation events and Frank inputs.",
                  },
                ].map((item) => (
                  <div
                    className="grid grid-cols-[1fr_150px] items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
                    key={item.label}
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.note}
                      </p>
                    </div>
                    <div className="text-right font-mono text-lg font-semibold text-primary">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div>
                <CardTitle>Approval queue</CardTitle>
                <CardDescription>
                  Submitted requests that need a finance decision.
                </CardDescription>
              </div>
              <CardAction>
                <Link
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                  href="/admin/approvals"
                >
                  Review approvals
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3">
              {submittedRequests.length > 0 ? (
                submittedRequests.slice(0, 4).map((request) => (
                  <Link
                    className="grid grid-cols-[1fr_130px_82px] items-center gap-4 rounded-lg border border-border bg-background px-4 py-3 transition hover:bg-secondary/55"
                    href="/admin/approvals"
                    key={request.id}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{request.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {requestTypeLabels[request.requestType]} -{" "}
                        {request.location}
                      </div>
                    </div>
                    <div className="text-right font-mono font-semibold">
                      {formatCurrency(request.amountKobo)}
                    </div>
                    <Badge className={riskBadgeClass(request.riskBand)}>
                      {request.riskScore.toFixed(2)}
                    </Badge>
                  </Link>
                ))
              ) : (
                <EmptyPanel>No submitted requests are waiting for review.</EmptyPanel>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Today's focus</CardTitle>
              <CardDescription>Start with the highest-impact work.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Submitted approvals</div>
                  <Badge variant="secondary">{submittedRequests.length}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Decide what should be paid, rejected, or sent back for proof.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">Flagged money-in</div>
                  <Badge variant="secondary">{liveMoneyIn.flaggedCount}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Inspect stock-to-payment mismatches before closing the day.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">High-risk requests</div>
                  <Badge variant="secondary">{highRiskRequests.length}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Keep larger or weaker-documentation requests visible.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(liveMoneyIn.recentActivity.length > 0
                ? liveMoneyIn.recentActivity.slice(0, 5)
                : [
                    "Create and confirm a POS sale to populate the live audit trail.",
                  ]
              ).map((item, index) => (
                <div
                  className="flex items-start gap-3 rounded-lg bg-background px-3 py-3 text-sm"
                  key={`${item}-${index}`}
                >
                  <ClipboardCheck className="mt-0.5 size-4 text-primary" />
                  <span className="leading-5 text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </AdminShell>
  )
}
