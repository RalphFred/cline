import { z } from "zod"

import { paymentRequestTypes } from "@/lib/payments/types"

const trimmedOptionalString = (max: number) =>
  z.preprocess((value) => {
    if (value === null) {
      return undefined
    }

    if (typeof value !== "string") {
      return value
    }

    const trimmedValue = value.trim()
    return trimmedValue.length === 0 ? undefined : trimmedValue
  }, z.string().max(max).optional())

export const createPaymentRequestInputSchema = z
  .object({
    requestType: z.enum(paymentRequestTypes),
    title: z.string().trim().min(1).max(180),
    amountNaira: z.coerce.number().positive().max(100_000_000),
    urgency: z.string().trim().min(1).max(40),
    neededBy: trimmedOptionalString(80),
    recipientOrLocation: z.string().trim().min(1).max(180),
    purpose: z.string().trim().min(1).max(700),
    invoiceReference: trimmedOptionalString(120),
    vendorName: trimmedOptionalString(160),
    bankName: trimmedOptionalString(120),
    accountNumber: trimmedOptionalString(16),
  })
  .superRefine((input, ctx) => {
    if (input.requestType !== "vendor_payment") {
      return
    }

    if (!input.vendorName) {
      ctx.addIssue({
        code: "custom",
        path: ["vendorName"],
        message: "Vendor name is required for supplier payments.",
      })
    }
  })

export type CreatePaymentRequestInput = z.infer<
  typeof createPaymentRequestInputSchema
>
