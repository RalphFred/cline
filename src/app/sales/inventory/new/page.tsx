import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { InventoryItemForm } from "@/components/features/inventory/inventory-item-form"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import { cn } from "@/lib/utils"

export default async function NewInventoryItemPage() {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    redirect("/sign-in?next=/sales/inventory/new")
  }

  await ensureDemoWorkspace(account)

  return (
    <main className="min-h-screen bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Add inventory item</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a new product for the sales counter.
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

        <InventoryItemForm mode="create" />
      </div>
    </main>
  )
}
