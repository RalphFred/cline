import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  CreditCard,
  ReceiptText,
  Wallet,
} from "lucide-react"
import Link from "next/link"

import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  EmptyPanel,
  MetricTile,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import { formatCurrency } from "@/components/features/admin/admin-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { getLiveAdminMoneyInOverview } from "@/lib/demo/server"

export default async function AdminMoneyInPage() {
  const { account, workspace, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin/money-in")
  const liveMoneyIn = await getLiveAdminMoneyInOverview(workspace.organizationId)

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="money-in"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        action={
          <Link className={buttonVariants({ variant: "outline" })} href="/sales">
            Open sales workspace
          </Link>
        }
        description="Track expected revenue against matched incoming payments, then resolve the sales that reduced stock without clean payment confirmation."
        eyebrow="Finance operations"
        title="Money in"
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        <MetricTile
          icon={Wallet}
          label="Expected revenue"
          value={formatCurrency(liveMoneyIn.expectedKobo)}
        />
        <MetricTile
          icon={BadgeCheck}
          label="Matched collections"
          value={formatCurrency(liveMoneyIn.collectedKobo)}
        />
        <MetricTile
          icon={Clock3}
          label="Pending sales"
          value={String(liveMoneyIn.pendingCount)}
        />
        <MetricTile
          icon={AlertTriangle}
          label="Flagged records"
          value={String(liveMoneyIn.flaggedCount)}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Reconciliation health</CardTitle>
              <CardDescription>
                A quick read of the revenue pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                {
                  label: "POS requests created",
                  value: String(liveMoneyIn.posRequestedCount),
                  icon: CreditCard,
                  note: "Sales with a Squad POS request reference.",
                },
                {
                  label: "Paid and matched",
                  value: String(liveMoneyIn.paidCount),
                  icon: BadgeCheck,
                  note: "Sales with matched incoming payment records.",
                },
                {
                  label: "Still pending",
                  value: String(liveMoneyIn.pendingCount),
                  icon: Clock3,
                  note: "Expected money that has not landed cleanly yet.",
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div
                    className="grid grid-cols-[1fr_120px] items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
                    key={item.label}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 text-primary" />
                        {item.label}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.note}
                      </p>
                    </div>
                    <div className="text-right font-mono text-xl font-semibold">
                      {item.value}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Flagged transactions</CardTitle>
              <CardDescription>
                Inventory-backed sales that need a human explanation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {liveMoneyIn.flaggedSales.length > 0 ? (
                liveMoneyIn.flaggedSales.map((item) => (
                  <div
                    className="rounded-lg border border-border bg-background px-4 py-4"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {item.customerLabel || "Walk-in customer"} -{" "}
                          {formatCurrency(item.expectedAmountKobo)}
                        </div>
                      </div>
                      <Badge className="bg-warning text-white hover:bg-warning">
                        Review
                      </Badge>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {item.reconciliationSummary ||
                        "Expected inventory-backed revenue has not matched a POS payment."}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyPanel>No live mismatches right now.</EmptyPanel>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Cline collection account</CardTitle>
              <CardDescription>
                Static Squad virtual account for organization-level transfers.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">Provider</div>
                  <Badge
                    className={
                      staticVirtualAccount.mode === "live"
                        ? "bg-success text-white hover:bg-success"
                        : "bg-warning text-white hover:bg-warning"
                    }
                  >
                    {staticVirtualAccount.mode === "live"
                      ? "Live Squad"
                      : "Demo Squad"}
                  </Badge>
                </div>
                <div className="mt-3 text-sm font-medium">
                  {staticVirtualAccount.bankName}
                </div>
                <div className="mt-1 font-mono text-3xl font-semibold">
                  {staticVirtualAccount.accountNumber}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {staticVirtualAccount.accountName}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                <div className="text-muted-foreground">Customer identifier</div>
                <div className="mt-1 break-all font-mono font-semibold">
                  {staticVirtualAccount.customerIdentifier}
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {staticVirtualAccount.providerMessage}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Collection status</CardTitle>
              <CardDescription>Money expected versus matched.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="text-sm text-muted-foreground">Matched amount</div>
                <div className="mt-2 font-mono text-2xl font-semibold">
                  {formatCurrency(liveMoneyIn.collectedKobo)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="text-sm text-muted-foreground">Unmatched amount</div>
                <div className="mt-2 font-mono text-2xl font-semibold">
                  {formatCurrency(
                    Math.max(
                      liveMoneyIn.expectedKobo - liveMoneyIn.collectedKobo,
                      0,
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Recent money-in activity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {(liveMoneyIn.recentActivity.length > 0
                ? liveMoneyIn.recentActivity.slice(0, 8)
                : [
                    "Create and confirm a POS sale to populate the live audit trail.",
                  ]
              ).map((item, index) => (
                <div
                  className="flex items-start gap-3 rounded-lg bg-background px-3 py-3 text-sm"
                  key={`${item}-${index}`}
                >
                  <ReceiptText className="mt-0.5 size-4 text-primary" />
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
