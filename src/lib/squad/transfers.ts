import "server-only"

import { z } from "zod"

import { getServerEnv } from "@/lib/env"

const squadTransferResponseSchema = z
  .object({
    status: z.union([z.number(), z.string()]).optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z
      .object({
        transaction_reference: z.string().optional(),
        response_description: z.string().optional(),
        amount: z.union([z.string(), z.number()]).optional(),
        nip_transaction_reference: z.string().optional(),
        account_number: z.string().optional(),
        account_name: z.string().optional(),
        destination_institution_name: z.string().optional(),
        transaction_status: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const squadTransferRequeryResponseSchema = z
  .object({
    status: z.union([z.number(), z.string()]).optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z
      .object({
        transaction_reference: z.string().optional(),
        transaction_status: z.string().optional(),
        response_description: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type SquadTransferStatus =
  | "success"
  | "processing"
  | "failed"
  | "unknown"

export type SquadTransferResult = {
  mode: "live" | "simulated"
  reference: string
  status: SquadTransferStatus
  rawPayload: string
  providerMessage: string
}

function getSquadAuthHeaders(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "content-type": "application/json",
  }
}

function createTransferReference(requestId: string) {
  const merchantId = getServerEnv().SQUAD_MERCHANT_ID ?? "CLINEDEMO"
  const suffix = `${requestId}_${Date.now().toString(36)}`
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(-48)

  return `${merchantId}_${suffix}`
}

function mapTransferStatus(input: {
  httpStatus?: number
  success?: boolean
  providerStatus?: string
}) {
  const normalized = input.providerStatus?.toLowerCase()

  if (
    input.success ||
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "completed"
  ) {
    return "success" as const
  }

  if (
    input.httpStatus === 424 ||
    normalized === "pending" ||
    normalized === "processing"
  ) {
    return "unknown" as const
  }

  if (
    normalized === "failed" ||
    normalized === "reversed" ||
    normalized === "declined"
  ) {
    return "failed" as const
  }

  return "processing" as const
}

export function canUseLiveSquadTransfer(input: {
  bankCode?: string
  accountNumber?: string
  accountName?: string
}) {
  const env = getServerEnv()

  return Boolean(
    env.SQUAD_SECRET_KEY &&
      env.SQUAD_MERCHANT_ID &&
      input.bankCode &&
      input.bankCode !== "manual" &&
      input.accountNumber &&
      input.accountName,
  )
}

export async function executeSquadTransfer(input: {
  requestId: string
  amountKobo: number
  bankCode?: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  recipientLabel?: string
  remark: string
}): Promise<SquadTransferResult> {
  const reference = createTransferReference(input.requestId)
  const env = getServerEnv()

  if (
    !canUseLiveSquadTransfer({
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
    })
  ) {
    return {
      mode: "simulated",
      reference,
      status: "success",
      providerMessage:
        "Simulated Squad payout because live credentials or beneficiary details are not configured.",
      rawPayload: JSON.stringify({
        source: "cline_demo_simulation",
        transaction_reference: reference,
        amount: input.amountKobo,
        bank_code: input.bankCode,
        bank_name: input.bankName,
        account_number: input.accountNumber,
        account_name: input.accountName ?? input.recipientLabel,
      }),
    }
  }

  const response = await fetch(
    `${env.SQUAD_BASE_URL.replace(/\/$/, "")}/payout/transfer`,
    {
      method: "POST",
      headers: getSquadAuthHeaders(env.SQUAD_SECRET_KEY!),
      body: JSON.stringify({
        transaction_reference: reference,
        amount: String(input.amountKobo),
        bank_code: input.bankCode,
        account_number: input.accountNumber,
        account_name: input.accountName,
        currency_id: "NGN",
        remark: input.remark,
      }),
    },
  )
  const payload = squadTransferResponseSchema.parse(await response.json())

  if (!response.ok && response.status !== 424) {
    return {
      mode: "live",
      reference,
      status: "failed",
      providerMessage: payload.message ?? "Squad rejected the payout request.",
      rawPayload: JSON.stringify(payload),
    }
  }

  return {
    mode: "live",
    reference: payload.data?.transaction_reference ?? reference,
    status: mapTransferStatus({
      httpStatus: response.status,
      success: payload.success,
      providerStatus: payload.data?.transaction_status,
    }),
    providerMessage:
      payload.data?.response_description ?? payload.message ?? "Squad transfer submitted.",
    rawPayload: JSON.stringify(payload),
  }
}

export async function requerySquadTransfer(input: {
  reference: string
}): Promise<SquadTransferResult> {
  const env = getServerEnv()

  if (!env.SQUAD_SECRET_KEY || input.reference.includes("CLINEDEMO_")) {
    return {
      mode: "simulated",
      reference: input.reference,
      status: "success",
      providerMessage: "Simulated payout remains successful.",
      rawPayload: JSON.stringify({
        source: "cline_demo_simulation",
        transaction_reference: input.reference,
        transaction_status: "success",
      }),
    }
  }

  const response = await fetch(
    `${env.SQUAD_BASE_URL.replace(/\/$/, "")}/payout/requery`,
    {
      method: "POST",
      headers: getSquadAuthHeaders(env.SQUAD_SECRET_KEY),
      body: JSON.stringify({
        transaction_reference: input.reference,
      }),
    },
  )
  const payload = squadTransferRequeryResponseSchema.parse(await response.json())

  return {
    mode: "live",
    reference: payload.data?.transaction_reference ?? input.reference,
    status: mapTransferStatus({
      httpStatus: response.status,
      success: payload.success,
      providerStatus: payload.data?.transaction_status,
    }),
    providerMessage:
      payload.data?.response_description ?? payload.message ?? "Squad transfer requeried.",
    rawPayload: JSON.stringify(payload),
  }
}
