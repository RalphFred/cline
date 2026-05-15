import { z } from "zod"

import {
  paymentSourceTypes,
  saleTypes,
} from "@/lib/sales/types"

const trimmedOptionalString = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value
    }

    const trimmedValue = value.trim()
    return trimmedValue.length === 0 ? undefined : trimmedValue
  }, z.string().max(max).optional())

export const inventorySaleDraftLineSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceKobo: z.number().int().nonnegative(),
})

export const nonInventorySaleDraftLineSchema = z.object({
  label: z.string().trim().min(1).max(180),
  quantity: z.number().int().positive(),
  unitPriceKobo: z.number().int().nonnegative(),
})

export const createSaleInputSchema = z
  .object({
    saleType: z.enum(saleTypes),
    title: z.string().trim().min(1).max(180),
    customerLabel: trimmedOptionalString(160),
    paymentSourceExpected: z.enum(paymentSourceTypes),
    notes: trimmedOptionalString(1000),
    lines: z.array(z.unknown()).min(1),
  })
  .superRefine((input, ctx) => {
    const schema =
      input.saleType === "inventory_sale"
        ? inventorySaleDraftLineSchema
        : nonInventorySaleDraftLineSchema

    input.lines.forEach((line, index) => {
      const parsedLine = schema.safeParse(line)

      if (!parsedLine.success) {
        for (const issue of parsedLine.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: ["lines", index, ...(issue.path ?? [])],
            message: issue.message,
          })
        }
      }
    })
  })

export type CreateSaleInputSchema = z.infer<typeof createSaleInputSchema>
