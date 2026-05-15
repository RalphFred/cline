import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Wallet,
} from "lucide-react"

import { AdminShell } from "@/components/features/admin/admin-shell"
import { ApprovalsTable } from "@/components/features/admin/approvals-table"
import {
  MetricTile,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import { formatCurrency } from "@/components/features/admin/admin-format"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { listPaymentRequestSummaries } from "@/lib/payments/service"

export default async function AdminApprovalsPage() {
  const { account, workspace, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin/approvals")
  const liveOutgoingRequests = await listPaymentRequestSummaries({
    organizationId: workspace.organizationId,
    limit: 50,
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
        description="Filter outgoing money requests, open the full review record, and keep payout decisions moving from one queue."
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

      <section className="mt-5">
        <ApprovalsTable requests={liveOutgoingRequests} />
      </section>
    </AdminShell>
  )
}
