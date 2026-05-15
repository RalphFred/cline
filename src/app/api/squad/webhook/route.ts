import { createHmac, timingSafeEqual } from "node:crypto"

import { ID, Query } from "appwrite"
import { NextResponse } from "next/server"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getServerEnv } from "@/lib/env"

export const runtime = "nodejs"

function getString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function extractProviderReference(payload: Record<string, unknown>) {
  const body =
    typeof payload.Body === "object" && payload.Body !== null
      ? (payload.Body as Record<string, unknown>)
      : payload

  return (
    getString(payload.TransactionRef) ||
    getString(payload.transaction_ref) ||
    getString(payload.transaction_reference) ||
    getString(payload.transactionReference) ||
    getString(payload.merchant_reference) ||
    getString(payload.customer_identifier) ||
    getString(body.transaction_ref) ||
    getString(body.transaction_reference) ||
    getString(body.transactionReference) ||
    getString(body.merchant_reference) ||
    getString(body.customer_identifier) ||
    getString(body.virtual_account_number)
  )
}

function extractEventType(payload: Record<string, unknown>) {
  const body =
    typeof payload.Body === "object" && payload.Body !== null
      ? (payload.Body as Record<string, unknown>)
      : payload

  return (
    getString(payload.Event) ||
    getString(payload.event) ||
    getString(payload.transaction_status) ||
    getString(payload.transaction_type) ||
    getString(body.transaction_status) ||
    getString(body.transaction_type) ||
    getString(body.event) ||
    "squad_webhook"
  )
}

function getSquadSignatureSource(payload: Record<string, unknown>, rawBody: string) {
  const body =
    typeof payload.Body === "object" && payload.Body !== null
      ? (payload.Body as Record<string, unknown>)
      : payload
  const transactionReference =
    getString(body.transaction_reference) || getString(body.transaction_ref)
  const virtualAccountNumber = getString(body.virtual_account_number)
  const currency = getString(body.currency)
  const principalAmount = getString(body.principal_amount)
  const settledAmount = getString(body.settled_amount)
  const customerIdentifier = getString(body.customer_identifier)

  if (
    transactionReference &&
    virtualAccountNumber &&
    currency &&
    principalAmount &&
    settledAmount &&
    customerIdentifier
  ) {
    return `${transactionReference}|${virtualAccountNumber}|${currency}|${principalAmount}|${settledAmount}|${customerIdentifier}`
  }

  const event = getString(payload.Event) || getString(body.event)
  const transactionRef =
    getString(payload.TransactionRef) ||
    getString(body.transaction_ref) ||
    getString(body.transaction_reference)
  const amount =
    typeof body.amount === "number" || typeof body.amount === "string"
      ? String(body.amount)
      : ""
  const email = getString(body.email) || getString(body.customer_email)
  const merchantId = getString(body.merchant_id)

  if (event && transactionRef && amount && email && merchantId) {
    return `${event}|${transactionRef}|${amount}|${email}|${merchantId}`
  }

  return rawBody
}

function isValidSquadSignature(input: {
  payload: Record<string, unknown>
  rawBody: string
  signature: string
}) {
  const secret = getServerEnv().SQUAD_WEBHOOK_SECRET ?? getServerEnv().SQUAD_SECRET_KEY

  if (!secret) {
    return true
  }

  if (!input.signature) {
    return false
  }

  const expected = createHmac("sha512", secret)
    .update(getSquadSignatureSource(input.payload, input.rawBody))
    .digest("hex")
    .toUpperCase()
  const received = input.signature.toUpperCase()
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

async function storeWebhookEvent(input: {
  payload: Record<string, unknown>
  rawBody: string
  status: "received" | "processed" | "failed"
  idempotencyKey: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const existing = await databases.listDocuments(
    ids.databaseId,
    ids.collections.webhookEvents,
    [Query.equal("idempotencyKey", [input.idempotencyKey]), Query.limit(1)],
  )

  if (existing.documents[0]) {
    return existing.documents[0]
  }

  return await databases.createDocument(
    ids.databaseId,
    ids.collections.webhookEvents,
    ID.unique(),
    {
      provider: "squad",
      eventType: extractEventType(input.payload),
      providerEventId: extractProviderReference(input.payload),
      idempotencyKey: input.idempotencyKey,
      status: input.status,
      receivedAt: new Date().toISOString(),
      rawPayload: input.rawBody,
    },
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature =
    request.headers.get("x-squad-signature") ??
    request.headers.get("x-squad-encrypted-body") ??
    ""
  let payload: Record<string, unknown>

  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { response_code: 400, response_description: "Invalid JSON" },
      { status: 400 },
    )
  }

  const providerReference = extractProviderReference(payload)
  const idempotencyKey =
    providerReference || `${extractEventType(payload)}:${signature || rawBody.slice(0, 96)}`
  const validSignature = isValidSquadSignature({ payload, rawBody, signature })

  await storeWebhookEvent({
    payload,
    rawBody,
    idempotencyKey,
    status: validSignature ? "processed" : "failed",
  })

  if (!validSignature) {
    return NextResponse.json(
      {
        response_code: 401,
        transaction_reference: providerReference,
        response_description: "Invalid Squad signature",
      },
      { status: 401 },
    )
  }

  return NextResponse.json({
    response_code: 200,
    transaction_reference: providerReference,
    response_description: "Success",
  })
}
