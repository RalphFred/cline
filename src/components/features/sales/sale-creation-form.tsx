"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  Banknote,
  ChevronsUpDown,
  Landmark,
  Plus,
  ReceiptText,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { createSaleAction } from "@/app/sales/checkout/actions"
import { initialCreateSaleActionState } from "@/app/sales/checkout/action-state"
import {
  CashReceiptDialog,
  type CashReceipt,
} from "@/components/features/sales/cash-receipt-dialog"
import {
  PendingTransferDialog,
  type PendingTransferDialogSale,
} from "@/components/features/sales/pending-transfer-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DemoInventoryItemSummary } from "@/lib/demo/server"
import type { PaymentSourceType } from "@/lib/sales/types"
import type { PublicStaticVirtualAccount } from "@/lib/squad/virtual-accounts"
import { cn } from "@/lib/utils"

type SaleCreationFormProps = {
  inventoryItems: DemoInventoryItemSummary[]
  virtualAccount: PublicStaticVirtualAccount
}

type InventoryLineState = {
  inventoryItemId: string
  quantity: number
  unitPriceKobo: number
}

type PaymentOption = {
  value: Extract<PaymentSourceType, "cash" | "bank_transfer" | "pos_payment">
  label: string
  description: string
  icon: typeof Banknote
}

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
})

const paymentOptions: PaymentOption[] = [
  {
    value: "bank_transfer",
    label: "Pay with transfer",
    description: "Wait for bank confirmation.",
    icon: Landmark,
  },
  {
    value: "pos_payment",
    label: "Squad POS",
    description: "Send remote terminal request.",
    icon: Smartphone,
  },
  {
    value: "cash",
    label: "Cash",
    description: "Collected at the counter.",
    icon: Banknote,
  },
]

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function createEmptyInventoryLine(): InventoryLineState {
  return {
    inventoryItemId: "",
    quantity: 1,
    unitPriceKobo: 0,
  }
}

function SubmitButton({
  disabled,
  paymentSource,
}: {
  disabled: boolean
  paymentSource: PaymentOption["value"] | ""
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      className="min-h-12 w-full cursor-pointer rounded-xl text-base"
      disabled={pending || disabled}
      type="submit"
    >
      <ReceiptText data-icon="inline-start" />
      {pending
        ? "Completing sale..."
        : paymentSource === "pos_payment"
          ? "Create sale & request POS"
          : paymentSource === "bank_transfer"
            ? "Create pending transfer sale"
            : paymentSource === "cash"
              ? "Create sale & receipt"
              : "Choose payment method"}
    </Button>
  )
}

function InventoryItemCombobox({
  inventoryItems,
  onSelect,
  selectedItem,
}: {
  inventoryItems: DemoInventoryItemSummary[]
  onSelect: (item: DemoInventoryItemSummary) => void
  selectedItem?: DemoInventoryItemSummary
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filteredItems = inventoryItems.filter((item) => {
    const searchValue = `${item.name} ${item.sku}`.toLowerCase()

    return searchValue.includes(query.toLowerCase())
  })

  return (
    <div className="relative">
      <button
        className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-base transition hover:bg-soft focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className={cn("truncate", !selectedItem && "text-muted-foreground")}>
          {selectedItem
            ? `${selectedItem.name} · ${selectedItem.sku}`
            : "Search inventory"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 rounded-xl border border-border bg-popover p-2 shadow-lg">
          <div className="flex min-h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search item or code"
              value={query}
            />
          </div>

          <div className="mt-2 max-h-64 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-5 text-sm text-muted-foreground">
                No matching inventory item.
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-soft"
                  key={item.id}
                  onClick={() => {
                    onSelect(item)
                    setQuery("")
                    setIsOpen(false)
                  }}
                  type="button"
                >
                  <span>
                    <span className="block font-medium">{item.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.sku} · {item.quantityOnHand} in stock
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {currencyFormatter.format(item.unitPriceKobo / 100)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SaleCreationForm({
  inventoryItems,
  virtualAccount,
}: SaleCreationFormProps) {
  const [state, formAction] = useActionState(
    createSaleAction,
    initialCreateSaleActionState,
  )
  const [paymentSourceExpected, setPaymentSourceExpected] =
    useState<PaymentOption["value"] | "">("")
  const [pendingTransferSale, setPendingTransferSale] =
    useState<PendingTransferDialogSale | null>(null)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [cashReceipt, setCashReceipt] = useState<CashReceipt | null>(null)
  const [isCashReceiptOpen, setIsCashReceiptOpen] = useState(false)
  const [inventoryLines, setInventoryLines] = useState<InventoryLineState[]>([])

  const inventoryItemsById = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  )

  const receiptLines = inventoryLines.map((line) => {
    const item = inventoryItemsById.get(line.inventoryItemId)

    return {
      ...line,
      label: item?.name ?? "Select item",
      isOverStock: item ? line.quantity > item.quantityOnHand : false,
    }
  })
  const totalKobo = receiptLines.reduce(
    (total, line) => total + line.quantity * line.unitPriceKobo,
    0,
  )
  const hasInvalidLine =
    inventoryItems.length === 0 ||
    inventoryLines.length === 0 ||
    receiptLines.some(
      (line) => !line.inventoryItemId || line.quantity < 1 || line.isOverStock,
    )
  const saleTitle =
    receiptLines.length === 1
      ? receiptLines[0]?.label ?? "Inventory sale"
      : `${receiptLines.length} item checkout`

  const payload = JSON.stringify({
    saleType: "inventory_sale",
    title: saleTitle,
    customerLabel: "",
    paymentSourceExpected,
    notes: "",
    lines: inventoryLines,
  })

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Sale created.")
      const resetTimer = window.setTimeout(() => {
        if (state.transfer) {
          setPendingTransferSale({
            id: state.transfer.saleId,
            title: state.transfer.title,
            customerLabel: state.transfer.customerLabel,
            expectedAmountKobo: state.transfer.amountKobo,
            bankTransferAccountName: state.transfer.accountName,
            bankTransferAccountNumber: state.transfer.accountNumber,
            bankTransferBankName: state.transfer.bankName,
            bankTransferExpiresAt: state.transfer.expiresAt,
            bankTransferReference: state.transfer.reference,
          })
          setIsTransferDialogOpen(true)
        }

        if (state.receipt) {
          setCashReceipt(state.receipt)
          setIsCashReceiptOpen(true)
        }

        setPaymentSourceExpected("")
        setInventoryLines([])
      }, 0)

      return () => window.clearTimeout(resetTimer)
    }

    if (state.status === "error" && state.message) {
      toast.error(state.message)
    }
  }, [inventoryItems, state])

  return (
    <>
      <form
        action={formAction}
        className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]"
      >
        <input name="payload" type="hidden" value={payload} />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-white px-4 py-4">
          <div>
            <div className="font-medium">Items sold</div>
            <p className="text-sm text-muted-foreground">
              Add inventory items for this checkout.
            </p>
          </div>

          {inventoryItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-soft px-4 py-6 text-sm text-muted-foreground">
              Add inventory before creating a sale.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {inventoryLines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                  Select an item to start this checkout.
                </div>
              ) : null}

              {inventoryLines.map((line, index) => {
                const selectedItem = inventoryItemsById.get(line.inventoryItemId)
                const lineTotalKobo = line.quantity * line.unitPriceKobo

                return (
                  <div
                    className="rounded-xl border border-border bg-soft/50 px-3 py-3"
                    key={`${line.inventoryItemId}-${index}`}
                  >
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.55fr)_120px_150px_44px] sm:items-end">
                      <div className="flex flex-col gap-2">
                        <Label>Inventory item</Label>
                        <InventoryItemCombobox
                          inventoryItems={inventoryItems}
                          onSelect={(matchedItem) => {
                            setInventoryLines((currentLines) =>
                              currentLines.map((currentLine, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      inventoryItemId: matchedItem.id,
                                      quantity: currentLine.quantity,
                                      unitPriceKobo: matchedItem.unitPriceKobo,
                                    }
                                  : currentLine,
                              ),
                            )
                          }}
                          selectedItem={selectedItem}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Qty</Label>
                        <Input
                          className="min-h-12 text-base"
                          inputMode="numeric"
                          onChange={(event) => {
                            const quantity =
                              Number(onlyDigits(event.target.value)) || 0
                            setInventoryLines((currentLines) =>
                              currentLines.map((currentLine, currentIndex) =>
                                currentIndex === index
                                  ? { ...currentLine, quantity }
                                  : currentLine,
                              ),
                            )
                          }}
                          pattern="[0-9]*"
                          value={String(line.quantity)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Price (NGN)</Label>
                        <Input
                          className="min-h-12 text-base"
                          inputMode="numeric"
                          onChange={(event) => {
                            const unitPriceKobo =
                              (Number(onlyDigits(event.target.value)) || 0) * 100
                            setInventoryLines((currentLines) =>
                              currentLines.map((currentLine, currentIndex) =>
                                currentIndex === index
                                  ? { ...currentLine, unitPriceKobo }
                                  : currentLine,
                              ),
                            )
                          }}
                          pattern="[0-9]*"
                          value={String(line.unitPriceKobo / 100)}
                        />
                      </div>

                      <Button
                        className="min-h-12 cursor-pointer rounded-xl"
                        disabled={inventoryLines.length === 1}
                        onClick={() =>
                          setInventoryLines((currentLines) =>
                            currentLines.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          )
                        }
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
                          In stock: {selectedItem?.quantityOnHand ?? 0}
                        </span>
                        {selectedItem && line.quantity > selectedItem.quantityOnHand ? (
                          <span className="rounded-full bg-[color:color-mix(in_srgb,var(--color-critical)_10%,white)] px-3 py-1 text-[color:var(--color-critical)]">
                            Not enough stock
                          </span>
                        ) : null}
                      </div>
                      <span className="font-mono font-semibold">
                        {currencyFormatter.format(lineTotalKobo / 100)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-start">
            <Button
              className="cursor-pointer rounded-xl"
              disabled={inventoryItems.length === 0}
              onClick={() =>
                setInventoryLines((currentLines) => [
                  ...currentLines,
                  createEmptyInventoryLine(),
                ])
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus data-icon="inline-start" />
              Add item
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 font-medium">Payment method</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon
                const isActive = paymentSourceExpected === option.value

                return (
                  <button
                    className={cn(
                      "flex min-h-20 cursor-pointer flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition",
                      isActive
                        ? "border-primary bg-[color:color-mix(in_srgb,var(--color-primary)_10%,white)] text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-soft",
                    )}
                    key={option.value}
                    onClick={() => setPaymentSourceExpected(option.value)}
                    type="button"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="size-4" />
                      {option.label}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:sticky lg:top-4 lg:self-start">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ReceiptText className="size-5 text-primary" />
            Receipt preview
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {paymentSourceExpected === "cash"
              ? "Cash sale will be marked paid."
              : paymentSourceExpected === "bank_transfer"
                ? "Transfer sale stays pending until the exact incoming transfer is matched."
                : paymentSourceExpected === "pos_payment"
                  ? "Squad POS request is created with the sale."
                  : "Choose items and a payment method to prepare this sale."}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-y border-border py-4">
          {receiptLines.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No items selected.
            </div>
          ) : null}

          {receiptLines.map((line, index) => (
            <div className="flex items-start justify-between gap-3 text-sm" key={index}>
              <div>
                <div className="font-medium">{line.label}</div>
                <div className="mt-1 text-muted-foreground">
                  {line.quantity} x {currencyFormatter.format(line.unitPriceKobo / 100)}
                </div>
              </div>
              <div className="font-mono font-semibold">
                {currencyFormatter.format((line.quantity * line.unitPriceKobo) / 100)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-mono text-3xl font-semibold">
              {currencyFormatter.format(totalKobo / 100)}
            </div>
          </div>
          <div className="rounded-full bg-soft px-3 py-1 text-xs font-medium text-muted-foreground">
            {receiptLines.length} item{receiptLines.length === 1 ? "" : "s"}
          </div>
        </div>

        {state.status !== "idle" && state.message ? (
          <div
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              state.status === "success"
                ? "bg-[color:color-mix(in_srgb,var(--color-success)_12%,white)] text-[color:var(--color-success)]"
                : "bg-[color:color-mix(in_srgb,var(--color-critical)_10%,white)] text-[color:var(--color-critical)]",
            )}
          >
            {state.message}
          </div>
        ) : null}

        <SubmitButton
          disabled={hasInvalidLine || totalKobo <= 0 || !paymentSourceExpected}
          paymentSource={paymentSourceExpected}
        />
      </aside>
      </form>

      {pendingTransferSale ? (
        <PendingTransferDialog
          onOpenChange={setIsTransferDialogOpen}
          onResolved={() => setIsTransferDialogOpen(false)}
          open={isTransferDialogOpen}
          sale={pendingTransferSale}
          virtualAccount={virtualAccount}
        />
      ) : null}

      {cashReceipt ? (
        <CashReceiptDialog
          onOpenChange={setIsCashReceiptOpen}
          open={isCashReceiptOpen}
          receipt={cashReceipt}
        />
      ) : null}
    </>
  )
}
