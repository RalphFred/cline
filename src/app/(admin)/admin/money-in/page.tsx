import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Clock3,
  ReceiptText,
  Wallet,
} from "lucide-react"

import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  EmptyPanel,
} from "@/components/features/admin/admin-cards"
import { formatCurrency } from "@/components/features/admin/admin-format"
import { Badge } from "@/components/ui/badge"
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
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-normal">Money in</h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          {
            label: "Cash on hand",
            value: formatCurrency(liveMoneyIn.cashKobo),
            icon: Wallet,
          },
          {
            label: "Transfer received",
            value: formatCurrency(liveMoneyIn.transferKobo),
            icon: Banknote,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div
              className="rounded-lg border border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-card px-5 py-4 shadow-sm"
              key={item.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-muted-foreground">
                  {item.label}
                </div>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </div>
              </div>
              <div className="mt-4 font-mono text-3xl font-semibold leading-none text-primary">
                {item.value}
              </div>
            </div>
          )
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Card className="self-start shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Collection activity</CardTitle>
              <CardDescription>
                Latest payment and reconciliation events from the live queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Paid",
                    value: String(liveMoneyIn.paidCount),
                    icon: BadgeCheck,
                  },
                  {
                    label: "Pending",
                    value: String(liveMoneyIn.pendingCount),
                    icon: Clock3,
                  },
                  {
                    label: "Flagged",
                    value: String(liveMoneyIn.flaggedCount),
                    icon: AlertTriangle,
                  },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      className="rounded-lg border border-border bg-background px-3 py-3"
                      key={item.label}
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="size-4 text-primary" />
                        {item.label}
                      </div>
                      <div className="mt-2 font-mono text-2xl font-semibold">
                        {item.value}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-2">
                {liveMoneyIn.recentActivity.length > 0 ? (
                  liveMoneyIn.recentActivity.slice(0, 4).map((item, index) => (
                    <div
                      className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm"
                      key={`${item}-${index}`}
                    >
                      <ReceiptText className="mt-0.5 size-4 text-primary" />
                      <span className="leading-6 text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyPanel>
                    No collection activity has been recorded yet.
                  </EmptyPanel>
                )}
              </div>
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
              <CardTitle>Cash and transfer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="text-sm text-muted-foreground">Cash on hand</div>
                <div className="mt-2 font-mono text-2xl font-semibold">
                  {formatCurrency(liveMoneyIn.cashKobo)}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Transfer received
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold">
                  {formatCurrency(liveMoneyIn.transferKobo)}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </AdminShell>
  )
}
