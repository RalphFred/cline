import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Clock3,
  ClipboardCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react"
import Link from "next/link"

import { AdminShell } from "@/components/features/admin/admin-shell"
import { formatCurrency } from "@/components/features/admin/admin-format"
import { getSuperAdminWorkspace } from "@/lib/admin/server"
import { getLiveAdminMoneyInOverview } from "@/lib/demo/server"
import { listPaymentRequestSummaries } from "@/lib/payments/service"
import { cn } from "@/lib/utils"

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
  const approvedRequests = liveOutgoingRequests.filter(
    (request) => request.status === "approved",
  )
  const moneyOutKobo = approvedRequests.reduce(
    (total, request) => total + request.amountKobo,
    0,
  )
  const awaitingReviewKobo = submittedRequests.reduce(
    (total, request) => total + request.amountKobo,
    0,
  )
  const accountBalanceKobo = Math.max(liveMoneyIn.collectedKobo - moneyOutKobo, 0)
  const statTiles = [
    {
      label: "Balance",
      value: formatCurrency(accountBalanceKobo),
      note: "Money available after approved payouts",
      icon: Wallet,
      className:
        "border-primary bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(15,107,143,0.14)]",
      iconClassName:
        "bg-primary-foreground/15 text-primary-foreground ring-1 ring-primary-foreground/20",
      valueClassName: "text-primary-foreground",
      noteClassName: "text-primary-foreground/78",
    },
    {
      label: "Revenue",
      value: formatCurrency(liveMoneyIn.expectedKobo),
      note: `${liveMoneyIn.pendingCount} sale${
        liveMoneyIn.pendingCount === 1 ? "" : "s"
      } still awaiting payment`,
      icon: BadgeCheck,
      className:
        "border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-card text-foreground",
      iconClassName: "bg-primary text-primary-foreground",
      valueClassName: "text-primary",
      noteClassName: "text-muted-foreground",
    },
    {
      label: "Money in",
      value: formatCurrency(liveMoneyIn.collectedKobo),
      note: `${liveMoneyIn.paidCount} matched collection${
        liveMoneyIn.paidCount === 1 ? "" : "s"
      }`,
      icon: BanknoteArrowDown,
      className:
        "border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-card text-foreground",
      iconClassName: "bg-primary text-primary-foreground",
      valueClassName: "text-primary",
      noteClassName: "text-muted-foreground",
    },
    {
      label: "Money out",
      value: formatCurrency(moneyOutKobo),
      note: `${approvedRequests.length} approved payout${
        approvedRequests.length === 1 ? "" : "s"
      }`,
      icon: BanknoteArrowUp,
      className:
        "border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-card text-foreground",
      iconClassName: "bg-primary text-primary-foreground",
      valueClassName: "text-primary",
      noteClassName: "text-muted-foreground",
    },
    {
      label: "Awaiting review",
      value: String(submittedRequests.length),
      note: formatCurrency(awaitingReviewKobo),
      icon: Clock3,
      className:
        "border-[color:color-mix(in_srgb,var(--color-brand)_24%,var(--color-border))] bg-card text-foreground",
      iconClassName: "bg-brand text-white",
      valueClassName: "text-brand",
      noteClassName: "text-muted-foreground",
    },
  ]
  const actions = [
    {
      label: "Review money in",
      href: "/admin/money-in",
      icon: BanknoteArrowDown,
    },
    {
      label: "Open approvals",
      href: "/admin/approvals",
      icon: ClipboardCheck,
    },
    {
      label: "View activity",
      href: "/admin/activity",
      icon: Activity,
    },
    {
      label: "Sales workspace",
      href: "/sales",
      icon: ShoppingCart,
    },
  ]

  return (
    <AdminShell
      accountLabel={account.name || account.email}
      active="overview"
      staticVirtualAccount={staticVirtualAccount}
    >
      <section className="grid gap-4 xl:grid-cols-5">
        {statTiles.map((tile) => (
          <div
            className={cn(
              "rounded-lg border px-4 py-4 transition duration-200 hover:-translate-y-0.5",
              tile.className,
            )}
            key={tile.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">{tile.label}</div>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  tile.iconClassName,
                )}
              >
                <tile.icon className="size-4" />
              </div>
            </div>
            <div className="mt-4 font-mono text-3xl font-semibold leading-none tracking-normal">
              <span className={tile.valueClassName}>{tile.value}</span>
            </div>
            <div className={cn("mt-3 text-xs leading-5", tile.noteClassName)}>
              {tile.note}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Finance actions
            </h1>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                className="group flex min-h-24 items-center justify-between gap-4 rounded-lg border border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-card px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/70 hover:shadow-[0_14px_30px_rgba(15,107,143,0.10)]"
                href={action.href}
                key={action.href}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="truncate font-semibold">{action.label}</div>
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight className="size-4" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </AdminShell>
  )
}
