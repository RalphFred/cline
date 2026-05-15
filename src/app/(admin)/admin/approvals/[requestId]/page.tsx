import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Wallet,
} from "lucide-react"

import { AdminShell } from "@/components/features/admin/admin-shell"
import {
  MetricTile,
  PageHeading,
} from "@/components/features/admin/admin-cards"
import { formatCurrency } from "@/components/features/admin/admin-format"
import { RequestReviewCard } from "@/components/features/admin/request-review-card"
import { buttonVariants } from "@/components/ui/button"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { getPaymentRequestSummary } from "@/lib/payments/service"

export default async function AdminApprovalDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const { account, staticVirtualAccount } =
    await getSuperAdminWorkspace("/admin/approvals")

  let request

  try {
    request = await getPaymentRequestSummary(requestId)
  } catch {
    notFound()
  }

  if (!request) {
    notFound()
  }

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="approvals"
      staticVirtualAccount={staticVirtualAccount}
    >
      <PageHeading
        action={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/approvals"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Link>
        }
        description={`${request.location} - ${request.submittedAt}`}
        eyebrow="Approval request"
        title={request.title}
      />

      <section className="mt-5 grid gap-4 lg:grid-cols-4">
        <MetricTile
          icon={ClipboardCheck}
          label="Status"
          value={request.status}
        />
        <MetricTile
          icon={Gauge}
          label="Risk"
          value={request.riskScore.toFixed(2)}
        />
        <MetricTile
          icon={Wallet}
          label="Amount"
          value={formatCurrency(request.amountKobo)}
        />
        <MetricTile
          icon={FileCheck2}
          label="Proof"
          value={request.proofRequired ? "Required" : "No"}
        />
      </section>

      <section className="mt-5">
        <RequestReviewCard request={request} />
      </section>
    </AdminShell>
  )
}
