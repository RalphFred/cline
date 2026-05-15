import { NextResponse } from "next/server"

import { getAppwriteIds } from "@/lib/appwrite/ids"
import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import { getServerEnv } from "@/lib/env"

export const runtime = "nodejs"

type AppwriteDataDocument = {
  $id: string
} & Record<string, unknown>

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

function getInlineFileName(fileName: string) {
  return fileName.replace(/["\r\n]/g, "")
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ evidenceId: string }> },
) {
  const account = await getCurrentAppwriteAccount()

  if (!account) {
    return NextResponse.json({ message: "Sign in to view evidence." }, { status: 401 })
  }

  const { evidenceId } = await context.params
  const ids = getAppwriteIds()
  const env = getServerEnv()
  const { databases, storage } = createAppwriteAdminClient()
  const workspace = await ensureDemoWorkspace(account)
  const evidence = (await databases.getDocument(
    ids.databaseId,
    ids.collections.requestEvidence,
    evidenceId,
  )) as AppwriteDataDocument
  const requestId = getDocumentId(evidence.paymentRequestId)
  const paymentRequest = (await databases.getDocument(
    ids.databaseId,
    ids.collections.paymentRequests,
    requestId,
  )) as AppwriteDataDocument
  const organizationId = getDocumentId(paymentRequest.organizationId)
  const submittedByMemberId = getDocumentId(paymentRequest.submittedByMemberId)

  if (
    organizationId !== workspace.organizationId ||
    (workspace.memberRole !== "super_admin" &&
      submittedByMemberId !== workspace.memberId)
  ) {
    return NextResponse.json({ message: "Evidence not found." }, { status: 404 })
  }

  const bucketFileId = getDocumentString(evidence.bucketFileId)

  if (
    !bucketFileId ||
    bucketFileId.startsWith("metadata-") ||
    bucketFileId.startsWith("pending-storage-")
  ) {
    return NextResponse.json(
      { message: "This evidence does not have a stored file." },
      { status: 404 },
    )
  }

  const fileUrl = storage.getFileView({
    bucketId: ids.buckets.requestEvidence,
    fileId: bucketFileId,
  })
  const fileResponse = await fetch(fileUrl, {
    headers: {
      "x-appwrite-key": env.APPWRITE_API_KEY ?? "",
      "x-appwrite-project": env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    },
  })

  if (!fileResponse.ok) {
    return NextResponse.json({ message: "Unable to load evidence." }, { status: 502 })
  }

  const contentType =
    getDocumentString(evidence.mimeType) ||
    fileResponse.headers.get("content-type") ||
    "application/octet-stream"
  const fileName = getInlineFileName(getDocumentString(evidence.fileName, "evidence"))

  return new NextResponse(fileResponse.body, {
    headers: {
      "cache-control": "private, max-age=60",
      "content-disposition": `inline; filename="${fileName}"`,
      "content-type": contentType,
    },
  })
}
