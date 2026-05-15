import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { InventoryItemForm } from "@/components/features/inventory/inventory-item-form"
import { StockAdjustmentForm } from "@/components/features/inventory/stock-adjustment-form"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import {
  ensureDemoWorkspace,
  getDemoInventoryItem,
  listDemoInventoryItems,
} from "@/lib/demo/server"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

type EditInventoryItemPageProps = {
  params: Promise<{
    itemId: string
  }>
}

export default async function EditInventoryItemPage({
  params,
}: EditInventoryItemPageProps) {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/sales/inventory")
  }

  const [{ itemId }, workspace] = await Promise.all([
    params,
    ensureDemoWorkspace(account),
  ])
  const [item, inventoryItems] = await Promise.all([
    getDemoInventoryItem(workspace.organizationId, itemId),
    listDemoInventoryItems(workspace.organizationId),
  ])

  if (!item) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Edit inventory item</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.name} · {item.sku} ·{" "}
                {currencyFormatter.format(item.unitPriceKobo / 100)} · {item.quantityOnHand} on hand
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
              href="/sales/inventory"
            >
              <ArrowLeft data-icon="inline-start" />
              Inventory
            </Link>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <InventoryItemForm item={item} mode="edit" />

          <div className="flex flex-col gap-4">
            <Card className="rounded-xl border-border bg-card shadow-none">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Sale-facing inventory state.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={item.status === "active" ? "secondary" : "outline"}>
                    {item.status === "active" ? "Active" : "Archived"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Stock state</span>
                  <span className="font-medium">
                    {item.lowStockState === "healthy"
                      ? "Healthy"
                      : item.lowStockState === "low"
                        ? "Low"
                        : "Out"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-2">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-mono font-medium">
                    {item.lowStockThreshold}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Inventory value</span>
                  <span className="font-mono font-medium">
                    {currencyFormatter.format(
                      (item.unitPriceKobo * item.quantityOnHand) / 100,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <StockAdjustmentForm items={inventoryItems} selectedItemId={item.id} />
          </div>
        </div>
      </div>
    </main>
  )
}
