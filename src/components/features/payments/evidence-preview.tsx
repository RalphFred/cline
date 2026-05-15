"use client"

import { ExternalLink, FileText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import type { PaymentRequestEvidenceSummary } from "@/lib/payments/types"
import { cn } from "@/lib/utils"

type EvidencePreviewProps = {
  compact?: boolean
  evidence: PaymentRequestEvidenceSummary
}

const fileSizeFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

function formatFileSize(sizeBytes: number) {
  if (!sizeBytes) {
    return "Stored evidence"
  }

  if (sizeBytes < 1024 * 1024) {
    return `${fileSizeFormatter.format(sizeBytes / 1024)} KB`
  }

  return `${fileSizeFormatter.format(sizeBytes / (1024 * 1024))} MB`
}

function formatNaira(kobo?: number) {
  if (!kobo) {
    return undefined
  }

  return new Intl.NumberFormat("en-NG", {
    currency: "NGN",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(kobo / 100)
}

export function EvidencePreview({
  compact = false,
  evidence,
}: EvidencePreviewProps) {
  const meta = `${evidence.fileType} - ${evidence.uploadedAt} - ${evidence.status}`

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-secondary/55">
      {evidence.fileUrl && evidence.isImage ? (
        <a
          className="block bg-background"
          href={evidence.fileUrl}
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt={`Uploaded evidence: ${evidence.fileName}`}
            className={compact ? "h-28 w-full object-cover" : "h-52 w-full object-cover"}
            src={evidence.fileUrl}
          />
        </a>
      ) : (
        <div
          className={
            compact
              ? "flex h-24 items-center justify-center bg-background"
              : "flex h-36 items-center justify-center bg-background"
          }
        >
          <FileText className="size-8 text-muted-foreground" />
        </div>
      )}

      <div className="px-3 py-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{evidence.fileName}</div>
            <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatFileSize(evidence.sizeBytes)}
            </div>
            {evidence.analysisSummary ? (
              <div className="mt-2 rounded-md bg-background px-2 py-2 text-xs leading-5 text-muted-foreground">
                <div className="font-medium text-foreground">
                  {evidence.analysisStatus === "verified"
                    ? "OCR verified"
                    : evidence.analysisStatus === "mismatch"
                      ? "OCR mismatch"
                      : "OCR review"}
                </div>
                <div>{evidence.analysisSummary}</div>
                {evidence.extractedAccountNumber ? (
                  <div className="mt-1 font-mono">
                    {evidence.extractedBankName || "Bank"} ·{" "}
                    {evidence.extractedAccountNumber}
                  </div>
                ) : null}
                {formatNaira(evidence.extractedAmountKobo) ? (
                  <div className="mt-1 font-mono">
                    {formatNaira(evidence.extractedAmountKobo)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {evidence.fileUrl ? (
            <a
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "shrink-0",
              )}
              href={evidence.fileUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink data-icon="inline-start" />
              Open
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
