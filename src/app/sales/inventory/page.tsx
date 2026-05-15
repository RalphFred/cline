import { ArrowLeft, ArrowRight, PackagePlus, Pencil } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
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
} from "@/lib/demo/server"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

export default async function InventoryPage() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/sales/inventory")
  }

  const workspace = await ensureDemoWorkspace(account)
  const inventoryItems = await listDemoInventoryItems(workspace.organizationId)
  const activeItems = inventoryItems.filter((item) => item.status === "active")
  const lowStockItems = inventoryItems.filter(
    (item) => item.lowStockState !== "healthy",
  )
  const inventoryValueKobo = activeItems.reduce(
    (total, item) => total + item.quantityOnHand * item.unitPriceKobo,
    0,
  )

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Inventory</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeItems.length} active items · {lowStockItems.length} need attention ·{" "}
                {currencyFormatter.format(inventoryValueKobo / 100)} sellable value
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
                className={cn(buttonVariants(), "min-h-11")}
                href="/sales/checkout"
              >
                Sales
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                className={cn(buttonVariants(), "min-h-11")}
                href="/sales/inventory/new"
              >
                <PackagePlus data-icon="inline-start" />
                Add item
              </Link>
            </div>
          </div>
        </header>

        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Add an item once, then edit or restock it from the table.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Item code</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      {item.description ? (
                        <div className="max-w-[28rem] truncate text-xs font-normal text-muted-foreground">
                          {item.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {currencyFormatter.format(item.unitPriceKobo / 100)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantityOnHand}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            item.lowStockState === "healthy"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {item.lowStockState === "healthy"
                            ? "Healthy"
                            : item.lowStockState === "low"
                              ? "Low"
                              : "Out"}
                        </Badge>
                        {item.status === "archived" ? (
                          <Badge variant="outline">Archived</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        aria-label={`Edit ${item.name}`}
                        className={buttonVariants({
                          size: "icon",
                          variant: "ghost",
                        })}
                        href={`/sales/inventory/${item.id}/edit`}
                      >
                        <Pencil />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
