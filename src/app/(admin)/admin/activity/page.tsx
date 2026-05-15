import {
  Activity,
  BadgeCheck,
  Brain,
  CircleDot,
  ClipboardCheck,
  ReceiptText,
  ShieldAlert,
} from "lucide-react"

import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  EmptyPanel,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import {
  formatCurrency,
  riskBadgeClass,
} from "@/components/features/admin/admin-format"
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
import { frankHighlights } from "@/lib/demo/workspace"
import { listPaymentRequestSummaries } from "@/lib/payments/service"

export default async function AdminActivityPage() {
  const { account, workspace, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin/activity")
  const [liveMoneyIn, liveOutgoingRequests] = await Promise.all([
    getLiveAdminMoneyInOverview(workspace.organizationId),
    listPaymentRequestSummaries({
      organizationId: workspace.organizationId,
      limit: 10,
    }),
  ])
  const requestAudit = liveOutgoingRequests.flatMap((request) =>
    request.auditTrail.slice(0, 2).map((event) => ({
      id: `${request.id}-${event.occurredAt}-${event.action}`,
      title: request.title,
      summary: event.summary,
      occurredAt: event.occurredAt,
      riskBand: request.riskBand,
      amountKobo: request.amountKobo,
    })),
  )

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="activity"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        description="A readable audit view for what happened across sales, reconciliation, outgoing requests, Frank signals, and payout follow-up."
        eyebrow="Audit"
        title="Activity"
      />

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Money-in activity</CardTitle>
              <CardDescription>
                Live reconciliation events from the sales and payment flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {liveMoneyIn.recentActivity.length > 0 ? (
                liveMoneyIn.recentActivity.map((item, index) => (
                  <div
                    className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm"
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
                  Create and confirm a POS sale to populate the live audit trail.
                </EmptyPanel>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Outgoing request audit</CardTitle>
              <CardDescription>
                Submission, decision, payout, and proof events.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {requestAudit.length > 0 ? (
                requestAudit.map((event) => (
                  <div
                    className="rounded-lg border border-border bg-background px-4 py-3"
                    key={event.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{event.title}</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {event.summary}
                        </p>
                      </div>
                      <Badge className={riskBadgeClass(event.riskBand)}>
                        {formatCurrency(event.amountKobo)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {event.occurredAt}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyPanel>
                  Field Employee requests will appear here once submitted.
                </EmptyPanel>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Frank signals</CardTitle>
              <CardDescription>
                Finance explanations surfaced for the admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {frankHighlights.map((item) => (
                <div
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm"
                  key={item}
                >
                  <Brain className="mt-0.5 size-4 text-primary" />
                  <span className="leading-6 text-muted-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>System checks</CardTitle>
              <CardDescription>
                The surfaces that keep the demo coherent.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                {
                  label: "Appwrite data",
                  note: "Role, sale, request, proof, and audit records are read live.",
                  icon: BadgeCheck,
                },
                {
                  label: "Squad boundary",
                  note: "Transfers and webhook capture are available through the service layer.",
                  icon: ShieldAlert,
                },
                {
                  label: "Admin routes",
                  note: "Overview, money-in, approvals, and activity now have separate workspaces.",
                  icon: Activity,
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div
                    className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3"
                    key={item.label}
                  >
                    <Icon className="mt-0.5 size-4 text-primary" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.note}
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Queue summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <ClipboardCheck className="size-4 text-primary" />
                  Outgoing requests
                </div>
                <Badge variant="secondary">{liveOutgoingRequests.length}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <CircleDot className="size-4 text-primary" />
                  Money-in events
                </div>
                <Badge variant="secondary">
                  {liveMoneyIn.recentActivity.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </AdminShell>
  )
}
