import "server-only"

import { z } from "zod"

import { getServerEnv } from "@/lib/env"

const squadVirtualAccountDataSchema = z
  .object({
    bank_code: z.string().optional().nullable(),
    virtual_account_number: z.string().optional().nullable(),
    beneficiary_account: z.string().optional().nullable(),
    customer_identifier: z.string().optional().nullable(),
    business_name: z.string().optional().nullable(),
    first_name: z.string().optional().nullable(),
    last_name: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
  })
  .passthrough()

const squadVirtualAccountResponseSchema = z
  .object({
    status: z.union([z.number(), z.string()]).optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z
      .union([
        squadVirtualAccountDataSchema,
        z.array(squadVirtualAccountDataSchema),
      ])
      .optional(),
  })
  .passthrough()

export type StaticVirtualAccount = {
  mode: "live" | "simulated"
  provider: "squad"
  customerIdentifier: string
  businessName: string
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
  beneficiaryAccount?: string
  providerMessage: string
  rawPayload: string
  createdAt?: string
}

export type PublicStaticVirtualAccount = Omit<
  StaticVirtualAccount,
  "rawPayload"
>

function getSquadAuthHeaders(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "content-type": "application/json",
  }
}

function normalizeIdentifier(input: string) {
  const normalized = input.toUpperCase().replace(/[^A-Z0-9]/g, "")

  return normalized.length > 0 ? normalized.slice(0, 40) : "CLINEDEMO"
}

function getStaticCustomerIdentifier(organizationId: string) {
  const envIdentifier =
    getServerEnv().SQUAD_STATIC_VIRTUAL_ACCOUNT_CUSTOMER_IDENTIFIER

  if (envIdentifier) {
    return normalizeIdentifier(envIdentifier)
  }

  return normalizeIdentifier(`CLINE${organizationId}`)
}

function hashDigits(input: string, length: number) {
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }

  return String(hash).padStart(length, "0").slice(-length)
}

function mapVirtualAccountData(input: {
  businessName: string
  customerIdentifier: string
  data: z.infer<typeof squadVirtualAccountDataSchema>
  message: string
  rawPayload: string
}): StaticVirtualAccount | null {
  const accountNumber = input.data.virtual_account_number

  if (!accountNumber) {
    return null
  }

  const firstName = input.data.first_name ?? ""
  const lastName = input.data.last_name ?? ""
  const accountName =
    input.data.business_name ||
    `${firstName} ${lastName}`.trim() ||
    input.businessName

  return {
    mode: "live",
    provider: "squad",
    customerIdentifier:
      input.data.customer_identifier ?? input.customerIdentifier,
    businessName: input.businessName,
    accountName,
    accountNumber,
    bankCode: input.data.bank_code ?? "058",
    bankName: "GTBank",
    beneficiaryAccount: input.data.beneficiary_account ?? undefined,
    providerMessage: input.message,
    rawPayload: input.rawPayload,
    createdAt: input.data.created_at ?? undefined,
  }
}

function createSimulatedStaticVirtualAccount(input: {
  organizationId: string
  businessName: string
  customerIdentifier: string
  reason: string
}) {
  const accountNumber = `9${hashDigits(input.customerIdentifier, 9)}`

  return {
    mode: "simulated" as const,
    provider: "squad" as const,
    customerIdentifier: input.customerIdentifier,
    businessName: input.businessName,
    accountName: input.businessName,
    accountNumber,
    bankCode: "058",
    bankName: "GTBank",
    providerMessage: input.reason,
    rawPayload: JSON.stringify({
      source: "cline_demo_simulation",
      provider: "squad",
      organization_id: input.organizationId,
      customer_identifier: input.customerIdentifier,
      virtual_account_number: accountNumber,
      bank_code: "058",
      business_name: input.businessName,
      reason: input.reason,
    }),
  } satisfies StaticVirtualAccount
}

async function retrieveSquadVirtualAccount(input: {
  baseUrl: string
  secretKey: string
  businessName: string
  customerIdentifier: string
}) {
  const response = await fetch(
    `${input.baseUrl.replace(/\/$/, "")}/virtual-account/${
      input.customerIdentifier
    }`,
    {
      headers: getSquadAuthHeaders(input.secretKey),
    },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error("Squad could not retrieve the static virtual account.")
  }

  const payload = squadVirtualAccountResponseSchema.parse(await response.json())
  const rawPayload = JSON.stringify(payload)
  const accountData = Array.isArray(payload.data)
    ? payload.data.find(
        (item) =>
          item.customer_identifier === input.customerIdentifier ||
          item.virtual_account_number,
      )
    : payload.data

  return accountData
    ? mapVirtualAccountData({
        businessName: input.businessName,
        customerIdentifier: input.customerIdentifier,
        data: accountData,
        message: payload.message ?? "Static Squad virtual account retrieved.",
        rawPayload,
      })
    : null
}

async function createBusinessSquadVirtualAccount(input: {
  baseUrl: string
  secretKey: string
  businessName: string
  customerIdentifier: string
}) {
  const env = getServerEnv()

  if (!env.SQUAD_VIRTUAL_ACCOUNT_BVN || !env.SQUAD_VIRTUAL_ACCOUNT_MOBILE_NUM) {
    return null
  }

  const response = await fetch(
    `${input.baseUrl.replace(/\/$/, "")}/virtual-account/business`,
    {
      method: "POST",
      headers: getSquadAuthHeaders(input.secretKey),
      body: JSON.stringify({
        customer_identifier: input.customerIdentifier,
        business_name: env.SQUAD_VIRTUAL_ACCOUNT_BUSINESS_NAME ?? input.businessName,
        mobile_num: env.SQUAD_VIRTUAL_ACCOUNT_MOBILE_NUM,
        bvn: env.SQUAD_VIRTUAL_ACCOUNT_BVN,
        beneficiary_account:
          env.SQUAD_VIRTUAL_ACCOUNT_BENEFICIARY_ACCOUNT ?? undefined,
      }),
    },
  )
  const payload = squadVirtualAccountResponseSchema.parse(await response.json())
  const rawPayload = JSON.stringify(payload)

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Squad could not create the static virtual account.")
  }

  return payload.data && !Array.isArray(payload.data)
    ? mapVirtualAccountData({
        businessName: input.businessName,
        customerIdentifier: input.customerIdentifier,
        data: payload.data,
        message: payload.message ?? "Static Squad virtual account created.",
        rawPayload,
      })
    : null
}

export async function getStaticAdminVirtualAccount(input: {
  organizationId: string
  businessName: string
}): Promise<StaticVirtualAccount> {
  const env = getServerEnv()
  const customerIdentifier = getStaticCustomerIdentifier(input.organizationId)

  if (!env.SQUAD_SECRET_KEY) {
    return createSimulatedStaticVirtualAccount({
      organizationId: input.organizationId,
      businessName: input.businessName,
      customerIdentifier,
      reason:
        "Demo static virtual account. Add Squad credentials to create or retrieve a live business virtual account.",
    })
  }

  try {
    const baseUrl = env.SQUAD_BASE_URL
    const existingAccount = await retrieveSquadVirtualAccount({
      baseUrl,
      secretKey: env.SQUAD_SECRET_KEY,
      businessName: input.businessName,
      customerIdentifier,
    })

    if (existingAccount) {
      return existingAccount
    }

    const createdAccount = await createBusinessSquadVirtualAccount({
      baseUrl,
      secretKey: env.SQUAD_SECRET_KEY,
      businessName: input.businessName,
      customerIdentifier,
    })

    if (createdAccount) {
      return createdAccount
    }

    return createSimulatedStaticVirtualAccount({
      organizationId: input.organizationId,
      businessName: input.businessName,
      customerIdentifier,
      reason:
        "Squad credentials are configured, but BVN and mobile number are required before Cline can create a live business virtual account.",
    })
  } catch (error) {
    return createSimulatedStaticVirtualAccount({
      organizationId: input.organizationId,
      businessName: input.businessName,
      customerIdentifier,
      reason:
        error instanceof Error
          ? error.message
          : "Squad virtual account lookup failed.",
    })
  }
}
