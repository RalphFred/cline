"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { ClipboardPlus } from "lucide-react"
import { toast } from "sonner"

import {
  adjustInventoryStockAction,
} from "@/app/sales/inventory/actions"
import { initialInventoryActionState } from "@/app/sales/inventory/action-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { DemoInventoryItemSummary } from "@/lib/demo/server"

type StockAdjustmentFormProps = {
  items: DemoInventoryItemSummary[]
  selectedItemId?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="min-h-11 w-full" disabled={pending} type="submit">
      <ClipboardPlus data-icon="inline-start" />
      {pending ? "Updating..." : "Update stock"}
    </Button>
  )
}

export function StockAdjustmentForm({
  items,
  selectedItemId,
}: StockAdjustmentFormProps) {
  const [state, action] = useActionState(
    adjustInventoryStockAction,
    initialInventoryActionState,
  )
  const selectedItem = items.find((item) => item.id === selectedItemId)

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message)
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <Card className="rounded-xl border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Restock item</CardTitle>
        <CardDescription>
          Add new stock or correct the quantity on the shelf.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          {selectedItemId ? (
            <div className="flex flex-col gap-2">
              <Label>Inventory item</Label>
              <input name="itemId" type="hidden" value={selectedItemId} />
              <div className="flex min-h-12 items-center rounded-lg border border-border bg-soft px-3 text-base">
                {selectedItem?.name ?? "Selected item"}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Inventory item</Label>
              <Select defaultValue={items[0]?.id} name="itemId">
                <SelectTrigger className="min-h-12 w-full bg-background text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {item.quantityOnHand} on hand
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Update type</Label>
              <Select defaultValue="stock_in" name="movementType">
                <SelectTrigger className="min-h-12 w-full bg-background text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="stock_in">Stock received</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Quantity change</Label>
              <Select defaultValue="add" name="direction">
                <SelectTrigger className="min-h-12 w-full bg-background text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="add">Add stock</SelectItem>
                    <SelectItem value="remove">Remove stock</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-quantity">Quantity</Label>
              <Input
                className="min-h-12 text-base"
                id="stock-quantity"
                inputMode="numeric"
                name="quantity"
                pattern="[0-9]*"
                placeholder="12"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="stock-reason">Reason</Label>
              <Input
                className="min-h-12 text-base"
                id="stock-reason"
                name="reason"
                placeholder="New delivery, count correction, damaged item"
                required
              />
            </div>
          </div>

          {state.status !== "idle" && state.message ? (
            <p className="rounded-md border border-border bg-soft px-3 py-2 text-sm text-muted-foreground">
              {state.message}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
