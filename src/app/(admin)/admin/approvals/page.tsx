import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  Wallet,
} from "lucide-react"

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
  transferBadgeClass,
} from "@/components/features/admin/admin-format"
import { RequestReviewCard } from "@/components/features/admin/request-review-card"
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
import { listPaymentRequestSummaries } from "@/lib/payments/service"

export default async function AdminApprovalsPage() {
  const { account, workspace, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin/approvals")
  const liveOutgoingRequests = await listPaymentRequestSummaries({
    organizationId: workspace.organizationId,
    limit: 12,
  })
  const submittedRequests = liveOutgoingRequests.filter(
    (request) => request.status === "submitted",
  )
  const approvedRequests = liveOutgoingRequests.filter(
    (request) => request.status === "approved",
  )
  const highRiskRequests = liveOutgoingRequests.filter(
    (request) => request.riskBand === "high",
  )
  const closedRequests = liveOutgoingRequests.filter(
    (request) => request.status !== "submitted",
  )
  const totalAmountKobo = liveOutgoingRequests.reduce(
    (total, request) => total + request.amountKobo,
    0,
  )

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="approvals"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        description="Review outgoing money requests with evidence, risk context, Squad payout state, proof requirements, and the decision history in one place."
        eyebrow="Controls"
        title="Approvals"
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        <MetricTile
          icon={ClipboardCheck}
          label="Submitted"
          value={String(submittedRequests.length)}
        />
        <MetricTile
          icon={BadgeCheck}
          label="Approved"
          value={String(approvedRequests.length)}
        />
        <MetricTile
          icon={AlertTriangle}
          label="High risk"
          value={String(highRiskRequests.length)}
        />
        <MetricTile
          icon={Wallet}
          label="Total requested"
          value={formatCurrency(totalAmountKobo)}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Decision queue</CardTitle>
              <CardDescription>
                Submitted requests appear first so finance can act quickly.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {submittedRequests.length > 0 ? (
                submittedRequests.map((request) => (
                  <RequestReviewCard key={request.id} request={request} />
                ))
              ) : (
                <EmptyPanel>No submitted requests are waiting for review.</EmptyPanel>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>All outgoing requests</CardTitle>
              <CardDescription>
                Approved, rejected, and submitted records stay visible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveOutgoingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{request.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {request.submittedAt} - {request.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          {requestTypeLabels[request.requestType]}
                        </TableCell>
                        <TableCell>
                          <Badge className={riskBadgeClass(request.riskBand)}>
                            {request.riskScore.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.status}</TableCell>
                        <TableCell>
                          {request.transferStatus ? (
                            <Badge
                              className={transferBadgeClass(
                                request.transferStatus,
                              )}
                            >
                              {request.transferStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Not sent</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(request.amountKobo)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {closedRequests.length > 0 ? (
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle>Completed decisions</CardTitle>
                <CardDescription>
                  Kept here for payout and proof follow-up.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {closedRequests.map((request) => (
                  <RequestReviewCard
                    compact
                    key={request.id}
                    request={request}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="grid content-start gap-5">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Review guide</CardTitle>
              <CardDescription>
                The decision surface is ordered for finance work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="font-medium">Evidence first</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Match amount, vendor, purpose, and uploaded files before payout.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="font-medium">Risk next</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Frank rules show the reason a request deserves review.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="font-medium">Proof follows</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Approved staff cash requests can still require upload follow-up.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Proof workload</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <FileCheck2 className="size-4 text-primary" />
                  Proof required
                </div>
                <Badge variant="secondary">
                  {
                    liveOutgoingRequests.filter(
                      (request) => request.proofRequired,
                    ).length
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </AdminShell>
  )
}
