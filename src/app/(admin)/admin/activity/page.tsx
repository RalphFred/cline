import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  EmptyPanel,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import {
  formatCurrency,
  riskBadgeClass,
} from "@/components/features/admin/admin-format"
import { FrankChatPanel } from "@/components/features/frank/frank-chat-panel"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { getLiveAdminMoneyInOverview } from "@/lib/demo/server"
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
  const requestAudit = liveOutgoingRequests.map((request) => {
    const latestEvent = request.auditTrail[0]

    return {
      id: `${request.id}-${latestEvent?.occurredAt ?? request.submittedAt}`,
      area: "Requests" as const,
      title: request.title,
      summary:
        latestEvent?.summary ??
        `${request.title} is awaiting Super Admin review.`,
      occurredAt: latestEvent?.occurredAt ?? request.submittedAt,
      riskBand: request.riskBand,
      amountKobo: request.amountKobo,
      status:
        request.status === "approved"
          ? "Approved"
          : request.status === "rejected"
            ? "Rejected"
            : "Review",
    }
  })
  const moneyInAudit = liveMoneyIn.recentActivity.map((summary, index) => ({
    id: `money-in-${index}`,
    area: "Money in" as const,
    title: "Payment activity",
    summary,
    occurredAt: "Recent",
    riskBand: "low" as const,
    amountKobo: null,
    status: "Recorded",
  }))
  const activityRows = [...requestAudit, ...moneyInAudit]

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="activity"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        description="Sales, payments, requests, and decisions in one operating timeline."
        eyebrow="Activity"
        title="Activity"
      />

      <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Operating timeline</CardTitle>
              <CardDescription>
                Recent movement across money in and outgoing requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityRows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead className="w-[120px]">Area</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-[130px] text-right">Amount</TableHead>
                      <TableHead className="w-[110px] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityRows.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-muted-foreground">
                          {event.occurredAt}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              event.area === "Money in"
                                ? "bg-secondary text-primary hover:bg-secondary"
                                : "bg-background text-foreground hover:bg-background"
                            }
                            variant="secondary"
                          >
                            {event.area}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[360px] whitespace-normal py-3">
                          <div className="font-medium">{event.title}</div>
                          <div className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                            {event.summary}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {event.amountKobo === null
                            ? "—"
                            : formatCurrency(event.amountKobo)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              event.status === "Review"
                                ? riskBadgeClass(event.riskBand)
                                : event.status === "Approved"
                                  ? "bg-success text-white hover:bg-success"
                                  : event.status === "Rejected"
                                    ? "bg-destructive text-white hover:bg-destructive"
                                    : "bg-secondary text-primary hover:bg-secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyPanel>
                  Activity will appear here after sales, payments, or requests move.
                </EmptyPanel>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="grid content-start gap-5">
          <FrankChatPanel />
        </aside>
      </section>
    </AdminShell>
  )
}
