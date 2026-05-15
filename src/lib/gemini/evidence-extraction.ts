import "server-only"

import { Buffer } from "node:buffer"

import { GoogleGenAI } from "@google/genai"
import { z } from "zod"

import { getServerEnv } from "@/lib/env"

const supportedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const maxEvidenceBytes = 8 * 1024 * 1024

const invoiceExtractionSchema = z.object({
  documentType: z
    .enum(["invoice", "receipt", "bill", "unknown"])
    .default("unknown"),
  vendorName: z.string().trim().max(180).optional(),
  invoiceNumber: z.string().trim().max(120).optional(),
  accountName: z.string().trim().max(180).optional(),
  accountNumber: z.string().trim().max(20).optional(),
  bankName: z.string().trim().max(140).optional(),
  bankCode: z.string().trim().max(16).optional(),
  totalAmountNaira: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().max(12).optional(),
  confidence: z.coerce.number().min(0).max(1).default(0),
  summary: z.string().trim().max(700).optional(),
})

export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>

export type InvoiceExtractionResult = {
  status: "extracted" | "unavailable" | "unsupported" | "failed"
  extraction?: InvoiceExtraction
  confidence: number
  summary: string
  rawText?: string
}

function normalizeAccountNumber(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? ""

  return digits.length >= 10 ? digits.slice(-10) : undefined
}

function parseJsonObject(text: string) {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return a JSON object.")
  }

  return JSON.parse(trimmed.slice(start, end + 1)) as unknown
}

export async function extractInvoiceEvidence(input: {
  fileBytes: Buffer
  mimeType: string
  fileName: string
  requestTitle: string
  requestAmountKobo: number
  vendorName?: string
}): Promise<InvoiceExtractionResult> {
  if (!supportedMimeTypes.has(input.mimeType)) {
    return {
      status: "unsupported",
      confidence: 0,
      summary: "Evidence was stored, but this file type is not supported for OCR.",
    }
  }

  if (input.fileBytes.byteLength > maxEvidenceBytes) {
    return {
      status: "unsupported",
      confidence: 0,
      summary: "Evidence was stored, but the file is too large for OCR.",
    }
  }

  const apiKey = getServerEnv().GEMINI_API_KEY

  if (!apiKey) {
    return {
      status: "unavailable",
      confidence: 0,
      summary: "Evidence was stored, but OCR is unavailable because Gemini is not configured.",
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Extract structured payment evidence from this Nigerian SME invoice, receipt, or utility bill.",
                "Return only one JSON object with these keys: documentType, vendorName, invoiceNumber, accountName, accountNumber, bankName, bankCode, totalAmountNaira, currency, confidence, summary.",
                "Use null or omit fields that are not visible. Do not invent bank details.",
                "Prefer the payable bank account details printed on the document, not buyer details.",
                `Request title: ${input.requestTitle}`,
                `Expected amount in naira: ${(input.requestAmountKobo / 100).toFixed(2)}`,
                input.vendorName ? `Entered vendor name: ${input.vendorName}` : "",
              ]
                .filter(Boolean)
                .join("\n"),
            },
            {
              inlineData: {
                data: input.fileBytes.toString("base64"),
                mimeType: input.mimeType,
              },
            },
          ],
        },
      ],
    })
    const rawText = response.text?.trim() ?? ""
    const parsed = invoiceExtractionSchema.parse(parseJsonObject(rawText))
    const accountNumber = normalizeAccountNumber(parsed.accountNumber)
    const summary =
      parsed.summary ||
      "Invoice evidence was extracted for account and amount comparison."
    const extraction: InvoiceExtraction = {
      ...parsed,
      accountNumber,
      summary,
    }

    return {
      status: "extracted",
      extraction,
      confidence: extraction.confidence,
      summary,
      rawText,
    }
  } catch {
    return {
      status: "failed",
      confidence: 0,
      summary: "Evidence was stored, but OCR extraction failed and needs human review.",
    }
  }
}
