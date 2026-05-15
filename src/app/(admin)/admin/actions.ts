"use server"

import { revalidatePath } from "next/cache"

import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { getDemoAccountByRole } from "@/lib/demo/accounts"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import {
  decidePaymentRequest,
  markPaymentRequestProofStatus,
  requeryPaymentRequestTransfer,
} from "@/lib/payments/service"

export async function approvePaymentRequestAction(formData: FormData) {
  await decideFromAdmin(formData, "approved")
}

export async function rejectPaymentRequestAction(formData: FormData) {
  await decideFromAdmin(formData, "rejected")
}

export async function requeryPaymentRequestTransferAction(formData: FormData) {
  const { workspace, requestId } = await getAdminActionContext(formData)

  await requeryPaymentRequestTransfer({
    organizationId: workspace.organizationId,
    actorUserProfileId: workspace.userProfileId,
    requestId,
  })

  revalidateAdminPaths()
}

export async function acceptPaymentRequestProofAction(formData: FormData) {
  await decideProofFromAdmin(formData, "verified")
}

export async function flagPaymentRequestProofAction(formData: FormData) {
  await decideProofFromAdmin(formData, "flagged")
}

async function decideFromAdmin(
  formData: FormData,
  decision: "approved" | "rejected",
) {
  const { workspace, requestId } = await getAdminActionContext(formData)
  const comment = String(formData.get("comment") ?? "").trim()

  await decidePaymentRequest({
    organizationId: workspace.organizationId,
    decidedByUserProfileId: workspace.userProfileId,
    requestId,
    decision,
    comment:
      comment ||
      (decision === "approved"
        ? "Approved for Squad payout."
        : "Rejected by Super Admin."),
  })

  revalidateAdminPaths()
  revalidatePath("/mobile")
}

async function decideProofFromAdmin(
  formData: FormData,
  status: "verified" | "flagged",
) {
  const { workspace, requestId } = await getAdminActionContext(formData)
  const comment = String(formData.get("comment") ?? "").trim()

  await markPaymentRequestProofStatus({
    organizationId: workspace.organizationId,
    actorUserProfileId: workspace.userProfileId,
    requestId,
    status,
    comment:
      comment ||
      (status === "verified"
        ? "Proof accepted by Super Admin."
        : "Proof needs correction."),
  })

  revalidateAdminPaths()
  revalidatePath("/mobile")
}

function revalidateAdminPaths() {
  revalidatePath("/admin")
  revalidatePath("/admin/approvals")
  revalidatePath("/admin/activity")
}

async function getAdminActionContext(formData: FormData) {
  const account = await getAdminActionAccount()

  if (!account) {
    throw new Error("Sign in again to review this request.")
  }

  const workspace = await ensureDemoWorkspace(account)

  if (workspace.memberRole !== "super_admin") {
    throw new Error("Only Super Admin can approve outgoing requests.")
  }

  const requestId = String(formData.get("requestId") ?? "")

  if (!requestId) {
    throw new Error("Choose a valid request first.")
  }

  return {
    workspace,
    requestId,
  }
}

async function getAdminActionAccount() {
  const account = await getCurrentAppwriteAccount()

  if (account || process.env.NODE_ENV === "production") {
    return account
  }

  const demoAccount = getDemoAccountByRole("super_admin")

  if (!demoAccount) {
    return null
  }

  return {
    $id: demoAccount.userId,
    name: demoAccount.name,
    email: demoAccount.email,
  } as NonNullable<Awaited<ReturnType<typeof getCurrentAppwriteAccount>>>
}
