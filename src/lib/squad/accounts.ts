import "server-only"

import { z } from "zod"

import { getServerEnv } from "@/lib/env"

const squadAccountLookupResponseSchema = z
  .object({
    status: z.union([z.number(), z.string()]).optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z
      .object({
        account_name: z.string().optional(),
        account_number: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

const bankAliases: Array<{ code: string; name: string; aliases: string[] }> = [
  { code: "000001", name: "Sterling Bank", aliases: ["sterling"] },
  { code: "000002", name: "Keystone Bank", aliases: ["keystone"] },
  { code: "000003", name: "FCMB", aliases: ["fcmb", "first city monument"] },
  { code: "000004", name: "United Bank for Africa", aliases: ["uba", "united bank for africa"] },
  { code: "000007", name: "Fidelity Bank", aliases: ["fidelity"] },
  { code: "000008", name: "Polaris Bank", aliases: ["polaris", "skye"] },
  { code: "000010", name: "Ecobank Bank", aliases: ["ecobank"] },
  { code: "000011", name: "Unity Bank", aliases: ["unity"] },
  { code: "000012", name: "Stanbic IBTC Bank", aliases: ["stanbic", "ibtc"] },
  { code: "000013", name: "GTBank Plc", aliases: ["gtbank", "gt bank", "guaranty trust"] },
  { code: "000014", name: "Access Bank", aliases: ["access", "diamond"] },
  { code: "000015", name: "Zenith Bank Plc", aliases: ["zenith"] },
  { code: "000016", name: "First Bank of Nigeria", aliases: ["first bank", "fbn"] },
  { code: "000017", name: "Wema Bank", aliases: ["wema", "alat"] },
  { code: "000018", name: "Union Bank", aliases: ["union"] },
  { code: "000020", name: "Heritage Bank", aliases: ["heritage"] },
  { code: "000021", name: "Standard Chartered", aliases: ["standard chartered"] },
  { code: "000023", name: "Providus Bank", aliases: ["providus"] },
  { code: "000025", name: "Titan Trust Bank", aliases: ["titan"] },
  { code: "000026", name: "Taj Bank", aliases: ["taj"] },
  { code: "000027", name: "Globus Bank", aliases: ["globus"] },
  { code: "000029", name: "Lotus Bank", aliases: ["lotus"] },
  { code: "000031", name: "Premium Trust Bank", aliases: ["premium trust"] },
  { code: "090267", name: "Kuda Microfinance Bank", aliases: ["kuda"] },
]

export type SquadAccountLookupResult = {
  mode: "live" | "simulated" | "skipped"
  status: "verified" | "failed" | "unavailable"
  accountName?: string
  accountNumber?: string
  bankCode?: string
  bankName?: string
  providerMessage: string
  rawPayload: string
}

function getSquadAuthHeaders(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "content-type": "application/json",
  }
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function resolveSquadBank(input: {
  bankCode?: string
  bankName?: string
}) {
  const explicitCode = input.bankCode?.replace(/\D/g, "")

  if (explicitCode && explicitCode.length >= 6) {
    const known = bankAliases.find((bank) => bank.code === explicitCode)

    return {
      bankCode: explicitCode,
      bankName: known?.name ?? input.bankName,
    }
  }

  const normalizedBankName = normalizeName(input.bankName ?? "")

  if (!normalizedBankName) {
    return {}
  }

  const known = bankAliases.find((bank) =>
    bank.aliases.some((alias) => normalizedBankName.includes(normalizeName(alias))),
  )

  return {
    bankCode: known?.code,
    bankName: known?.name ?? input.bankName,
  }
}

export async function lookupSquadAccount(input: {
  bankCode?: string
  bankName?: string
  accountNumber?: string
  fallbackAccountName?: string
}): Promise<SquadAccountLookupResult> {
  const accountNumber = input.accountNumber?.replace(/\D/g, "").slice(-10)
  const bank = resolveSquadBank({
    bankCode: input.bankCode,
    bankName: input.bankName,
  })

  if (!accountNumber || !bank.bankCode || bank.bankCode === "manual") {
    return {
      mode: "skipped",
      status: "unavailable",
      accountNumber,
      bankName: bank.bankName ?? input.bankName,
      providerMessage: "Squad account lookup needs a recognized bank code and account number.",
      rawPayload: JSON.stringify({ reason: "missing_bank_code_or_account_number" }),
    }
  }

  const env = getServerEnv()

  if (!env.SQUAD_SECRET_KEY) {
    return {
      mode: "simulated",
      status: input.fallbackAccountName ? "verified" : "unavailable",
      accountName: input.fallbackAccountName,
      accountNumber,
      bankCode: bank.bankCode,
      bankName: bank.bankName ?? input.bankName,
      providerMessage:
        "Simulated Squad account lookup because live Squad credentials are not configured.",
      rawPayload: JSON.stringify({
        source: "cline_demo_simulation",
        account_name: input.fallbackAccountName,
        account_number: accountNumber,
        bank_code: bank.bankCode,
      }),
    }
  }

  let response: Response
  let payload: z.infer<typeof squadAccountLookupResponseSchema>

  try {
    response = await fetch(
      `${env.SQUAD_BASE_URL.replace(/\/$/, "")}/payout/account/lookup`,
      {
        method: "POST",
        headers: getSquadAuthHeaders(env.SQUAD_SECRET_KEY),
        body: JSON.stringify({
          bank_code: bank.bankCode,
          account_number: accountNumber,
        }),
      },
    )
    payload = squadAccountLookupResponseSchema.parse(await response.json())
  } catch {
    return {
      mode: "live",
      status: "unavailable",
      accountNumber,
      bankCode: bank.bankCode,
      bankName: bank.bankName ?? input.bankName,
      providerMessage: "Squad account lookup could not be completed.",
      rawPayload: JSON.stringify({ reason: "squad_lookup_unavailable" }),
    }
  }

  if (!response.ok || payload.success === false) {
    return {
      mode: "live",
      status: "failed",
      accountNumber,
      bankCode: bank.bankCode,
      bankName: bank.bankName ?? input.bankName,
      providerMessage: payload.message ?? "Squad could not verify this account.",
      rawPayload: JSON.stringify(payload),
    }
  }

  return {
    mode: "live",
    status: "verified",
    accountName: payload.data?.account_name,
    accountNumber: payload.data?.account_number ?? accountNumber,
    bankCode: bank.bankCode,
    bankName: bank.bankName ?? input.bankName,
    providerMessage: payload.message ?? "Squad account lookup verified the recipient.",
    rawPayload: JSON.stringify(payload),
  }
}
