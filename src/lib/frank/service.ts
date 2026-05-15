import "server-only"

import { GoogleGenAI } from "@google/genai"
import { ID, Query, type Models } from "appwrite"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getServerEnv } from "@/lib/env"
import {
  runFrankToolsForQuestion,
} from "@/lib/frank/tools"
import type {
  FrankChatMessage,
  FrankChatResponse,
  FrankToolResult,
} from "@/lib/frank/types"

type AppwriteDataDocument = Models.Document & Record<string, unknown>

function getDocumentId(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "$id" in value &&
    typeof value.$id === "string"
  ) {
    return value.$id
  }

  return ""
}

function getDocumentString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(kobo / 100)
}

function mapFrankMessage(document: Models.Document): FrankChatMessage {
  const data = document as AppwriteDataDocument

  return {
    id: document.$id,
    role:
      data.role === "user" || data.role === "system"
        ? data.role
        : "assistant",
    message: getDocumentString(data.message),
    createdAtIso: getDocumentString(data.createdAtIso, document.$createdAt),
  }
}

async function ensureFrankThread(params: {
  organizationId: string
  userProfileId: string
  threadId?: string
  topic: string
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()

  if (params.threadId) {
    const thread = await databases.getDocument(
      ids.databaseId,
      ids.collections.frankThreads,
      params.threadId,
    )
    const threadOrganizationId = getDocumentId(
      (thread as AppwriteDataDocument).organizationId,
    )

    if (threadOrganizationId !== params.organizationId) {
      throw new Error("Frank thread does not belong to this organization.")
    }

    return thread.$id
  }

  const thread = await databases.createDocument(
    ids.databaseId,
    ids.collections.frankThreads,
    ID.unique(),
    {
      organizationId: params.organizationId,
      startedByUserProfileId: params.userProfileId,
      topic: params.topic.slice(0, 180),
      status: "open",
    },
  )

  return thread.$id
}

async function createFrankMessage(params: {
  threadId: string
  role: FrankChatMessage["role"]
  message: string
  metadata?: Record<string, unknown>
}) {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()

  return await databases.createDocument(
    ids.databaseId,
    ids.collections.frankMessages,
    ID.unique(),
    {
      threadId: params.threadId,
      role: params.role,
      message: params.message,
      createdAtIso: new Date().toISOString(),
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  )
}

async function listFrankMessages(threadId: string): Promise<FrankChatMessage[]> {
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()
  const response = await databases.listDocuments(
    ids.databaseId,
    ids.collections.frankMessages,
    [
      Query.equal("threadId", [threadId]),
      Query.orderAsc("createdAtIso"),
      Query.limit(40),
    ],
  )

  return response.documents.map(mapFrankMessage)
}

function buildDeterministicAnswer(toolResults: FrankToolResult[]) {
  const revenue = toolResults.find((tool) => tool.toolName === "getRevenueByPeriod")
  const flagged = toolResults.find((tool) => tool.toolName === "getFlaggedTransactions")
  const pending = toolResults.find((tool) => tool.toolName === "getPendingPaymentRequests")
  const requestsByType = toolResults.find((tool) => tool.toolName === "getRequestsByType")
  const bestSellingProducts = toolResults.find(
    (tool) => tool.toolName === "getBestSellingProducts",
  )
  const risk = toolResults.find((tool) => tool.toolName === "getRequestRiskExplanation")
  const system = toolResults.find((tool) => tool.toolName === "getSystemSummary")
  const unsupported = toolResults.find((tool) => tool.toolName === "unsupportedQuestion")

  if (unsupported) {
    return unsupported.summary
  }

  if (revenue) {
    return [
      revenue.summary,
      `Breakdown: POS ${formatNaira(Number(revenue.facts.posKobo ?? 0))}, transfers ${formatNaira(Number(revenue.facts.transferKobo ?? 0))}, cash ${formatNaira(Number(revenue.facts.cashKobo ?? 0))}.`,
    ].join(" ")
  }

  if (flagged) {
    const summary = getDocumentString(flagged.facts.topReconciliationSummary)
    return summary
      ? `${flagged.summary} The main explanation input says: ${summary}`
      : flagged.summary
  }

  if (requestsByType) {
    const count = Number(requestsByType.facts.requestCount ?? 0)

    if (count === 0) {
      return requestsByType.summary
    }

    return [
      requestsByType.summary,
      `${requestsByType.facts.submittedCount} awaiting review, ${requestsByType.facts.approvedCount} approved, ${requestsByType.facts.rejectedCount} rejected.`,
      requestsByType.facts.latestRequestTitle
        ? `Latest: ${requestsByType.facts.latestRequestTitle} for ${formatNaira(Number(requestsByType.facts.latestRequestAmountKobo ?? 0))}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ")
  }

  if (bestSellingProducts) {
    return bestSellingProducts.summary
  }

  if (risk) {
    return `${risk.summary} The score is assistive only: payout still requires Super Admin approval, and the stored rule/model outputs should be reviewed before a decision.`
  }

  if (pending) {
    return pending.summary
  }

  return system?.summary ?? "I do not have enough structured finance data to answer that yet."
}

async function generateGeminiAnswer(params: {
  question: string
  toolResults: FrankToolResult[]
}) {
  const apiKey = getServerEnv().GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "You are Frank, Cline's finance intelligence layer for a Nigerian SME.",
              "Answer only from the structured tool results below.",
              "Do not approve, reject, move money, invent figures, or claim live model training.",
              "Keep the answer concise, operational, and explicit about what needs human review.",
              `Question: ${params.question}`,
              `Tool results: ${JSON.stringify(params.toolResults)}`,
            ].join("\n"),
          },
        ],
      },
    ],
  })

  return response.text?.trim() || null
}

export async function answerFrankQuestion(params: {
  organizationId: string
  userProfileId: string
  question: string
  threadId?: string
}): Promise<FrankChatResponse> {
  const normalizedQuestion = params.question.trim()

  if (!normalizedQuestion) {
    throw new Error("Question is required.")
  }

  const threadId = await ensureFrankThread({
    organizationId: params.organizationId,
    userProfileId: params.userProfileId,
    threadId: params.threadId,
    topic: normalizedQuestion,
  })
  const toolResults = await runFrankToolsForQuestion({
    organizationId: params.organizationId,
    question: normalizedQuestion,
  })

  await createFrankMessage({
    threadId,
    role: "user",
    message: normalizedQuestion,
  })

  let mode: FrankChatResponse["mode"] = "deterministic"
  let answer = buildDeterministicAnswer(toolResults)

  try {
    const geminiAnswer = await generateGeminiAnswer({
      question: normalizedQuestion,
      toolResults,
    })

    if (geminiAnswer) {
      answer = geminiAnswer
      mode = "gemini"
    }
  } catch {
    mode = "gemini_fallback"
  }

  await createFrankMessage({
    threadId,
    role: "assistant",
    message: answer,
    metadata: {
      mode,
      toolNames: toolResults.map((toolResult) => toolResult.toolName),
    },
  })

  return {
    threadId,
    answer,
    messages: await listFrankMessages(threadId),
    toolResults,
    mode,
  }
}
