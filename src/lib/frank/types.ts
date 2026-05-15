export type FrankToolName =
  | "getRevenueByPeriod"
  | "getFlaggedTransactions"
  | "getPendingPaymentRequests"
  | "getRequestsByType"
  | "getBestSellingProducts"
  | "getRequestRiskExplanation"
  | "getSystemSummary"
  | "unsupportedQuestion"

export type FrankToolResult = {
  toolName: FrankToolName
  summary: string
  facts: Record<string, string | number | boolean | null>
}

export type FrankChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  message: string
  createdAtIso: string
}

export type FrankChatResponse = {
  threadId: string
  answer: string
  messages: FrankChatMessage[]
  toolResults: FrankToolResult[]
  mode: "gemini" | "deterministic" | "gemini_fallback"
}
