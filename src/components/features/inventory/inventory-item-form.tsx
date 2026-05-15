"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Archive, CheckCircle2, PackagePlus, Save } from "lucide-react"
import { toast } from "sonner"

import {
  createInventoryItemAction,
  setInventoryItemStatusAction,
  updateInventoryItemAction,
} from "@/app/sales/inventory/actions"
import {
  initialInventoryActionState,
  type InventoryActionState,
} from "@/app/sales/inventory/action-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DemoInventoryItemSummary } from "@/lib/demo/server"

type InventoryItemFormProps = {
  item?: DemoInventoryItemSummary
  mode: "create" | "edit"
}

function useInventoryToast(state: InventoryActionState) {
  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message)
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message)
    }
  }, [state])
}

function SubmitButton({ mode }: { mode: InventoryItemFormProps["mode"] }) {
  const { pending } = useFormStatus()

  return (
    <Button className="min-h-11 w-full sm:w-auto" disabled={pending} type="submit">
      {mode === "create" ? (
        <PackagePlus data-icon="inline-start" />
      ) : (
        <Save data-icon="inline-start" />
      )}
      {pending
        ? mode === "create"
          ? "Adding item..."
          : "Saving item..."
        : mode === "create"
          ? "Add inventory item"
          : "Save item"}
    </Button>
  )
}

function StatusButton({
  item,
}: {
  item: DemoInventoryItemSummary
}) {
  const { pending } = useFormStatus()
  const nextStatus = item.status === "active" ? "archived" : "active"

  return (
    <Button
      className="min-h-11 w-full sm:w-auto"
      disabled={pending}
      type="submit"
      variant="outline"
    >
      {nextStatus === "archived" ? (
        <Archive data-icon="inline-start" />
      ) : (
        <CheckCircle2 data-icon="inline-start" />
      )}
      {pending
        ? "Updating..."
        : nextStatus === "archived"
          ? "Archive item"
          : "Restore item"}
    </Button>
  )
}

export function InventoryItemForm({ item, mode }: InventoryItemFormProps) {
  const [formState, formAction] = useActionState(
    mode === "create" ? createInventoryItemAction : updateInventoryItemAction,
    initialInventoryActionState,
  )
  const [statusState, statusAction] = useActionState(
    setInventoryItemStatusAction,
    initialInventoryActionState,
  )

  useInventoryToast(formState)
  useInventoryToast(statusState)

  return (
    <Card className="rounded-xl border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Item details" : "Item details"}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Set the product name, price, and starting quantity."
            : "Keep price, stock threshold, and availability aligned with the sales counter."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {item ? <input name="itemId" type="hidden" value={item.id} /> : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="inventory-name">Item name</Label>
            <Input
              className="min-h-12 text-base"
              defaultValue={item?.name}
              id="inventory-name"
              name="name"
              placeholder="Solar Panel"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="inventory-description">Description</Label>
            <Textarea
              className="min-h-24 text-base"
              defaultValue={item?.description ?? ""}
              id="inventory-description"
              name="description"
              placeholder="Short sales-counter description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inventory-price">Unit price (NGN)</Label>
              <Input
                className="min-h-12 text-base"
                defaultValue={item ? item.unitPriceKobo / 100 : undefined}
                id="inventory-price"
                inputMode="numeric"
                name="unitPriceNaira"
                pattern="[0-9]*"
                placeholder="18500"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="inventory-quantity">Quantity on hand</Label>
              <Input
                className="min-h-12 text-base"
                defaultValue={item?.quantityOnHand}
                id="inventory-quantity"
                inputMode="numeric"
                name="quantityOnHand"
                pattern="[0-9]*"
                placeholder="24"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="inventory-threshold">Low-stock threshold</Label>
              <Input
                className="min-h-12 text-base"
                defaultValue={item?.lowStockThreshold}
                id="inventory-threshold"
                inputMode="numeric"
                name="lowStockThreshold"
                pattern="[0-9]*"
                placeholder="6"
                required
              />
            </div>
          </div>

          {mode === "edit" ? (
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select defaultValue={item?.status ?? "active"} name="status">
                <SelectTrigger className="min-h-12 w-full bg-background text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <input name="status" type="hidden" value="active" />
          )}

          {formState.status !== "idle" && formState.message ? (
            <p className="rounded-md border border-border bg-soft px-3 py-2 text-sm text-muted-foreground">
              {formState.message}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 bg-white sm:flex-row sm:justify-between">
          <SubmitButton mode={mode} />
        </CardFooter>
      </form>

      {item ? (
        <form action={statusAction}>
          <input name="itemId" type="hidden" value={item.id} />
          <input
            name="status"
            type="hidden"
            value={item.status === "active" ? "archived" : "active"}
          />
          <CardFooter className="bg-white">
            <StatusButton item={item} />
          </CardFooter>
        </form>
      ) : null}
    </Card>
  )
}
