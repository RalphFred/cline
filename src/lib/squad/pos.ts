import "server-only"

import { z } from "zod"

import { getServerEnv } from "@/lib/env"

const createPosPaymentRequestResponseSchema = z.object({
  status: z.union([z.number(), z.string()]),
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.object({
    request_ref: z.string().min(1),
  }),
})

const requeryPosPaymentResponseSchema = z.object({
  status: z.union([z.number(), z.string()]),
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      status: z.enum(["pending", "success", "failed"]),
      id: z.union([z.number(), z.string()]).optional(),
      merchant_request_ref: z.string().optional(),
      merchant_id: z.string().optional(),
      terminal_id: z.string().optional(),
      amount: z.number().optional(),
      currency: z.string().optional(),
      payment_method: z.string().optional(),
      transaction_reference: z.string().optional(),
      response_code: z.string().optional(),
      response_message: z.string().optional(),
      created_at: z.string().optional(),
    })
    .passthrough(),
})

export type SquadPosPaymentStatus =
  | {
      mode: "simulated"
      status: "success"
      requestReference: string
      transactionReference: string
      terminalId: string
      amountKobo: number
      rawPayload: string
    }
  | {
      mode: "live"
      status: "pending"
      requestReference: string
      rawPayload: string
    }
  | {
      mode: "live"
      status: "success"
      requestReference: string
      transactionReference?: string
      terminalId?: string
      amountKobo?: number
      rawPayload: string
    }
  | {
      mode: "live"
      status: "failed"
      requestReference: string
      transactionReference?: string
      terminalId?: string
      amountKobo?: number
      rawPayload: string
    }
  | {
      mode: "live"
      status: "expired"
      requestReference: string
      rawPayload: string
    }

function createDemoReference(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function getSquadAuthHeaders(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "content-type": "application/json",
  }
}

export function getConfiguredPosTerminalId() {
  return getServerEnv().SQUAD_POS_TERMINAL_ID ?? "CLINE-DEMO-POS"
}

export function canUseLiveSquadPos() {
  const env = getServerEnv()

  return Boolean(env.SQUAD_SECRET_KEY && env.SQUAD_POS_TERMINAL_ID)
}

export async function createSquadPosPaymentRequest(input: {
  amountKobo: number
  saleId: string
}) {
  const env = getServerEnv()
  const terminalId = getConfiguredPosTerminalId()

  if (!env.SQUAD_SECRET_KEY || !env.SQUAD_POS_TERMINAL_ID) {
    return {
      mode: "simulated" as const,
      requestReference: createDemoReference(`demo_pos_${input.saleId.slice(0, 8)}`),
      terminalId,
      rawPayload: JSON.stringify({
        source: "cline_demo_simulation",
        amount: input.amountKobo,
        terminal_id: terminalId,
      }),
    }
  }

  const response = await fetch(
    `${env.SQUAD_SOFTPOS_BASE_URL.replace(/\/$/, "")}/pos/remote-request`,
    {
      method: "POST",
      headers: getSquadAuthHeaders(env.SQUAD_SECRET_KEY),
      body: JSON.stringify({
        terminal_id: env.SQUAD_POS_TERMINAL_ID,
        amount: input.amountKobo,
        account_type: "default",
      }),
    },
  )

  if (!response.ok) {
    throw new Error("Squad could not create the POS payment request.")
  }

  const parsed = createPosPaymentRequestResponseSchema.parse(await response.json())

  return {
    mode: "live" as const,
    requestReference: parsed.data.request_ref,
    terminalId: env.SQUAD_POS_TERMINAL_ID,
    rawPayload: JSON.stringify(parsed),
  }
}

export async function requerySquadPosPayment(input: {
  requestReference: string
  expectedAmountKobo: number
  terminalId?: string | null
}): Promise<SquadPosPaymentStatus> {
  const env = getServerEnv()

  if (!env.SQUAD_SECRET_KEY || input.requestReference.startsWith("demo_pos_")) {
    const transactionReference = createDemoReference("demo_txn")

    return {
      mode: "simulated",
      status: "success",
      requestReference: input.requestReference,
      transactionReference,
      terminalId: input.terminalId ?? getConfiguredPosTerminalId(),
      amountKobo: input.expectedAmountKobo,
      rawPayload: JSON.stringify({
        source: "cline_demo_simulation",
        status: "success",
        merchant_request_ref: input.requestReference,
        transaction_reference: transactionReference,
        amount: input.expectedAmountKobo,
      }),
    }
  }

  const response = await fetch(
    `${env.SQUAD_SOFTPOS_BASE_URL.replace(/\/$/, "")}/pos/remote-request/${
      input.requestReference
    }`,
    {
      headers: getSquadAuthHeaders(env.SQUAD_SECRET_KEY),
    },
  )

  if (response.status === 404) {
    return {
      mode: "live",
      status: "expired",
      requestReference: input.requestReference,
      rawPayload: JSON.stringify({
        status: 404,
        message: "Request not found or expired",
      }),
    }
  }

  if (!response.ok) {
    throw new Error("Squad could not requery the POS payment request.")
  }

  const parsed = requeryPosPaymentResponseSchema.parse(await response.json())

  if (parsed.data.status === "pending") {
    return {
      mode: "live",
      status: "pending",
      requestReference: input.requestReference,
      rawPayload: JSON.stringify(parsed),
    }
  }

  return {
    mode: "live",
    status: parsed.data.status,
    requestReference:
      parsed.data.merchant_request_ref ?? input.requestReference,
    transactionReference: parsed.data.transaction_reference,
    terminalId: parsed.data.terminal_id,
    amountKobo: parsed.data.amount,
    rawPayload: JSON.stringify(parsed),
  }
}
