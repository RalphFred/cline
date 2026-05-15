import {
  ArrowLeft,
  BanknoteArrowUp,
  Boxes,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PendingTransferDialog } from "@/components/features/sales/pending-transfer-dialog"
import { SaleCreationForm } from "@/components/features/sales/sale-creation-form"
import { buttonVariants } from "@/components/ui/button"
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
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import {
  ensureDemoWorkspace,
  listDemoInventoryItems,
  listRecentDemoSales,
} from "@/lib/demo/server"
import { demoWorkspace } from "@/lib/demo/workspace"
import { getStaticAdminVirtualAccount } from "@/lib/squad/virtual-accounts"
import { cn } from "@/lib/utils"

const saleTypeLabels = {
  inventory_sale: "Inventory",
  service_sale: "Service",
  manual_sale: "Manual",
} as const

const saleStatusTone = {
  pending_payment: "bg-[color:color-mix(in_srgb,var(--color-warning)_14%,white)] text-[color:var(--color-warning)]",
  paid: "bg-[color:color-mix(in_srgb,var(--color-success)_12%,white)] text-[color:var(--color-success)]",
  mismatch_flagged:
    "bg-[color:color-mix(in_srgb,var(--color-critical)_12%,white)] text-[color:var(--color-critical)]",
} as const

const paymentMethodLabels = {
  bank_transfer: "Transfer",
  pos_payment: "POS",
  cash: "Cash",
  manual_record: "Manual",
} as const

const paymentMethodTone = {
  bank_transfer:
    "bg-[color:color-mix(in_srgb,var(--color-primary)_10%,white)] text-primary",
  pos_payment:
    "bg-[color:color-mix(in_srgb,var(--color-warning)_12%,white)] text-[color:var(--color-warning)]",
  cash: "bg-[color:color-mix(in_srgb,var(--color-success)_12%,white)] text-[color:var(--color-success)]",
  manual_record: "bg-soft text-muted-foreground",
} as const

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

const saleDateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
})

const saleTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
})

const saleDateKeyFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Africa/Lagos",
})

function getSaleDateKey(date: Date) {
  const parts = saleDateKeyFormatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? ""
  const month = parts.find((part) => part.type === "month")?.value ?? ""
  const day = parts.find((part) => part.type === "day")?.value ?? ""

  return `${year}-${month}-${day}`
}

function formatRecentSaleTime(createdAt: Date, now: Date) {
  const isSameDay = getSaleDateKey(createdAt) === getSaleDateKey(now)
  const ageMs = now.getTime() - createdAt.getTime()
  const isWithin24Hours = ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000

  if (isSameDay && isWithin24Hours) {
    return saleTimeFormatter.format(createdAt)
  }

  return saleDateFormatter.format(createdAt)
}

export default async function SalesPage() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/sales/checkout")
  }

  const workspace = await ensureDemoWorkspace(account)
  const [inventoryItems, recentSales, staticVirtualAccount] = await Promise.all([
    listDemoInventoryItems(workspace.organizationId),
    listRecentDemoSales(workspace.organizationId),
    getStaticAdminVirtualAccount({
      organizationId: workspace.organizationId,
      businessName: demoWorkspace.organizationName,
    }),
  ])
  const activeInventoryItems = inventoryItems.filter(
    (item) => item.status === "active",
  )
  const pendingTransferSales = recentSales.filter(
    (sale) =>
      sale.paymentSourceExpected === "bank_transfer" &&
      sale.status === "pending_payment",
  )
  const pendingTransferTotalKobo = pendingTransferSales.reduce(
    (total, sale) => total + sale.expectedAmountKobo,
    0,
  )
  const displayedPendingTransferSales = pendingTransferSales.slice(0, 6)
  const visibleRecentSales = recentSales.filter(
    (sale) =>
      !(
        sale.paymentSourceExpected === "bank_transfer" &&
        sale.status === "pending_payment"
      ),
  )
  const displayedRecentSales = visibleRecentSales.slice(0, 6)
  const lowStockCount = inventoryItems.filter(
    (item) => item.lowStockState !== "healthy",
  ).length
  const now = new Date()

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Make a sale</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeInventoryItems.length} active items · {lowStockCount} low stock ·{" "}
                {recentSales.length} recent sale{recentSales.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
                href="/sales"
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Link>
              <Link
                className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
                href="/sales/inventory"
              >
                <Boxes data-icon="inline-start" />
                Inventory
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-3">
              <CardTitle>Create sale</CardTitle>
              <CardDescription>
                Sell inventory items, choose payment method, and prepare a receipt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SaleCreationForm
                inventoryItems={activeInventoryItems}
                virtualAccount={staticVirtualAccount}
              />
            </CardContent>
          </Card>

          {pendingTransferSales.length > 0 ? (
            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BanknoteArrowUp data-icon="inline-start" />
                  Pending transfers
                </CardTitle>
                <CardDescription>
                  {pendingTransferSales.length} sale{pendingTransferSales.length === 1 ? "" : "s"} waiting for bank confirmation ·{" "}
                  {currencyFormatter.format(pendingTransferTotalKobo / 100)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {displayedPendingTransferSales.map((sale) => (
                    <div
                      className="flex flex-col gap-3 rounded-xl border border-border bg-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={sale.id}
                    >
                      <div>
                        <div className="font-medium">{sale.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {sale.customerLabel || "Walk-in customer"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Created {formatRecentSaleTime(new Date(sale.createdAt), now)}
                        </div>
                        <div className="mt-2 font-mono text-lg font-semibold">
                          {currencyFormatter.format(
                            sale.expectedAmountKobo / 100,
                          )}
                        </div>
                      </div>
                      <PendingTransferDialog
                        sale={sale}
                        virtualAccount={staticVirtualAccount}
                        trigger={
                          <button
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "min-h-10 cursor-pointer rounded-xl",
                            )}
                            type="button"
                          >
                            View account
                          </button>
                        }
                      />
                    </div>
                  ))}
                </div>
                {pendingTransferSales.length > displayedPendingTransferSales.length ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing latest {displayedPendingTransferSales.length}. Cancel or mark received to clear this queue.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BanknoteArrowUp data-icon="inline-start" />
                Completed and POS sales
              </CardTitle>
              <CardDescription>
                Sales that have moved past pending transfer collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayedRecentSales.length === 0 ? (
                <div className="border border-dashed border-border bg-soft/50 px-4 py-5 text-sm text-muted-foreground">
                  {pendingTransferSales.length > 0
                    ? "No completed sale yet. The current sales are still pending transfer confirmation above."
                    : "No sales have been created yet."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRecentSales.map((sale) => {
                        const createdAt = new Date(sale.createdAt)
                        const timeDisplay = formatRecentSaleTime(createdAt, now)

                        return (
                          <TableRow key={sale.id}>
                            <TableCell className="min-w-[220px]">
                              <div className="font-medium">{sale.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {saleTypeLabels[sale.saleType]}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[130px] font-medium">
                              {timeDisplay}
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              {currencyFormatter.format(
                                sale.expectedAmountKobo / 100,
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                  paymentMethodTone[sale.paymentSourceExpected],
                                )}
                              >
                                {paymentMethodLabels[sale.paymentSourceExpected]}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                                  saleStatusTone[sale.status],
                                )}
                              >
                                {sale.status === "pending_payment"
                                  ? "Pending"
                                  : sale.status === "paid"
                                    ? "Paid"
                                    : "Flagged"}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  )
}
