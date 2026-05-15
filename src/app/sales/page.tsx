import { ArrowRight, Boxes, LogOut, ReceiptText } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signOutAction } from "@/app/(auth)/sign-in/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

export default async function SalesOverviewPage() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/sales")
  }

  const workspace = await ensureDemoWorkspace(account)
  const [inventoryItems, recentSales] = await Promise.all([
    listDemoInventoryItems(workspace.organizationId),
    listRecentDemoSales(workspace.organizationId),
  ])
  const lowStockItems = inventoryItems.filter(
    (item) => item.lowStockState !== "healthy",
  )
  const paidSales = recentSales.filter((sale) => sale.status === "paid")
  const pendingSales = recentSales.filter((sale) => sale.status === "pending_payment")
  const visibleRecentSales = recentSales.filter(
    (sale) => sale.status !== "pending_payment",
  )
  const recentRevenueKobo = paidSales.reduce(
    (total, sale) => total + sale.expectedAmountKobo,
    0,
  )

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Sales</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Make sales, manage supermarket inventory, and track today&apos;s
                payment status.
              </p>
            </div>
            <form action={signOutAction}>
              <Button
                className="min-h-10 cursor-pointer rounded-full border border-[color:color-mix(in_srgb,var(--color-destructive)_28%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-destructive)_10%,white)] px-4 text-[color:var(--color-destructive)] shadow-none hover:border-[color:color-mix(in_srgb,var(--color-destructive)_42%,var(--color-border))] hover:bg-[color:color-mix(in_srgb,var(--color-destructive)_16%,white)]"
                type="submit"
                variant="outline"
              >
                <LogOut data-icon="inline-start" />
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-[color:color-mix(in_srgb,var(--color-success)_24%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-success)_10%,white)] shadow-none">
            <CardHeader>
              <CardDescription className="text-[color:var(--color-success)]">
                Paid sales
              </CardDescription>
              <CardTitle className="font-mono text-3xl text-[color:var(--color-success)]">
                {currencyFormatter.format(recentRevenueKobo / 100)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-primary)_9%,white)] shadow-none">
            <CardHeader>
              <CardDescription className="text-primary">
                Pending payments
              </CardDescription>
              <CardTitle className="font-mono text-3xl text-primary">
                {pendingSales.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-[color:color-mix(in_srgb,var(--color-warning)_26%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,white)] shadow-none">
            <CardHeader>
              <CardDescription className="text-[color:var(--color-warning)]">
                Low stock items
              </CardDescription>
              <CardTitle className="font-mono text-3xl text-[color:var(--color-warning)]">
                {lowStockItems.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            className="group cursor-pointer rounded-xl border border-[color:color-mix(in_srgb,var(--color-brand)_22%,var(--color-border))] bg-[color:color-mix(in_srgb,var(--color-brand)_7%,white)] p-5 transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-brand)_11%,white)]"
            href="/sales/checkout"
          >
            <div className="flex min-h-28 items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center bg-white text-[color:var(--color-brand)] shadow-sm">
                  <ReceiptText />
                </div>
                <div>
                  <div className="text-lg font-semibold">Make a sale</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sell inventory, services, or manual items.
                  </div>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            className="group cursor-pointer rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-soft p-5 transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary)_14%,white)]"
            href="/sales/inventory"
          >
            <div className="flex min-h-28 items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center bg-white text-primary shadow-sm">
                  <Boxes />
                </div>
                <div>
                  <div className="text-lg font-semibold">Manage inventory</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    Add items, edit prices, restock shelves.
                  </div>
                </div>
              </div>
              <ArrowRight className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Recent sales</CardTitle>
            <CardDescription>Latest supermarket counter activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {visibleRecentSales.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 border border-dashed border-border bg-[color:color-mix(in_srgb,var(--color-soft)_64%,white)] px-6 py-10 text-center">
                <div className="flex size-12 items-center justify-center bg-white text-primary shadow-sm">
                  <ReceiptText />
                </div>
                <div>
                  <div className="font-semibold">No completed sales yet</div>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    Start with “Make a sale” when a customer checks out. The
                    sale will appear here with its payment status.
                  </p>
                </div>
                <Link className={buttonVariants({ className: "cursor-pointer" })} href="/sales/checkout">
                  Make first sale
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRecentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sale.customerLabel || "Walk-in customer"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {currencyFormatter.format(sale.expectedAmountKobo / 100)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.status === "paid" ? "secondary" : "outline"}
                        >
                          {sale.status === "pending_payment"
                            ? "Pending"
                            : sale.status === "paid"
                              ? "Paid"
                              : "Flagged"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
