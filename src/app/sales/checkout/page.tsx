import {
  ArrowLeft,
  BanknoteArrowUp,
  Boxes,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PendingTransferDialog } from "@/components/features/sales/pending-transfer-dialog"
import { PosSaleActions } from "@/components/features/sales/pos-sale-actions"
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

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

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
  const visibleRecentSales = recentSales.filter(
    (sale) =>
      !(
        sale.paymentSourceExpected === "bank_transfer" &&
        sale.status === "pending_payment"
      ),
  )
  const lowStockCount = inventoryItems.filter(
    (item) => item.lowStockState !== "healthy",
  ).length

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Make a sale</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeInventoryItems.length} active items · {lowStockCount} low stock ·{" "}
                {visibleRecentSales.length} recent sales
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
                  Transfer payments waiting for bank confirmation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {pendingTransferSales.map((sale) => (
                    <div
                      className="flex flex-col gap-3 rounded-xl border border-border bg-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={sale.id}
                    >
                      <div>
                        <div className="font-medium">{sale.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {sale.customerLabel || "Walk-in customer"}
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
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BanknoteArrowUp data-icon="inline-start" />
                Recent sales
              </CardTitle>
              <CardDescription>Payments to confirm or review.</CardDescription>
            </CardHeader>
            <CardContent>
              {visibleRecentSales.length === 0 ? (
                <div className="border border-dashed border-border bg-soft/50 px-4 py-5 text-sm text-muted-foreground">
                  No POS or completed sales yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sale</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment state</TableHead>
                        <TableHead className="min-w-[320px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleRecentSales.map((sale) => {
                        const paymentState = sale.posRequestStatus
                          ? `POS: ${sale.posRequestStatus.replaceAll("_", " ")}`
                          : sale.paymentSourceExpected === "bank_transfer" &&
                              sale.status === "pending_payment"
                            ? "Waiting for exact transfer"
                            : sale.status === "paid"
                              ? "Completed"
                              : "Pending"

                        return (
                          <TableRow key={sale.id}>
                            <TableCell>
                              <div className="font-medium">{sale.title}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {saleTypeLabels[sale.saleType]}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {sale.customerLabel || "Walk-in customer"}
                            </TableCell>
                            <TableCell className="font-mono font-semibold">
                              {currencyFormatter.format(
                                sale.expectedAmountKobo / 100,
                              )}
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {sale.paymentSourceExpected.replaceAll("_", " ")}
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
                            <TableCell className="text-sm text-muted-foreground">
                              <div>{paymentState}</div>
                              {sale.actualAmountKobo ? (
                                <div className="mt-1 font-mono text-xs">
                                  Actual:{" "}
                                  {currencyFormatter.format(
                                    sale.actualAmountKobo / 100,
                                  )}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                                <PosSaleActions
                                  sale={sale}
                                  virtualAccount={staticVirtualAccount}
                                />
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
