"use server"

import { revalidatePath } from "next/cache"

import { getCurrentAppwriteAccount } from "@/lib/appwrite/session"
import { getDemoAccountByRole } from "@/lib/demo/accounts"
import { ensureDemoWorkspace } from "@/lib/demo/server"
import {
  createPaymentRequestInputSchema,
} from "@/lib/payments/schemas"
import {
  attachPaymentRequestProof,
  createPaymentRequest,
} from "@/lib/payments/service"
import type { PaymentRequestSummary } from "@/lib/payments/types"

export type PaymentRequestActionState = {
  status: "idle" | "success" | "error"
  message: string
  request?: PaymentRequestSummary
}

const initialPaymentRequestActionState: PaymentRequestActionState = {
  status: "idle",
  message: "",
}

const maxUploadSizeBytes = 8 * 1024 * 1024

function getFile(formData: FormData, name: string) {
  const file = formData.get(name)

  if (!(file instanceof File) || file.size === 0) {
    return undefined
  }

  return file
}

function getUploadSizeError(file: File | undefined, label: string) {
  if (file && file.size > maxUploadSizeBytes) {
    return `${label} must be 8 MB or smaller. Compress it or choose a smaller file.`
  }

  return undefined
}

export async function createFieldPaymentRequestAction(
  _prevState: PaymentRequestActionState = initialPaymentRequestActionState,
  formData: FormData,
): Promise<PaymentRequestActionState> {
  void _prevState

  const account = await getFieldActionAccount()

  if (!account) {
    return {
      status: "error",
      message: "Your session expired. Sign in again to submit this request.",
    }
  }

  const parsed = createPaymentRequestInputSchema.safeParse({
    requestType: formData.get("requestType"),
    title: formData.get("title"),
    amountNaira: formData.get("amountNaira"),
    urgency: formData.get("urgency"),
    neededBy: formData.get("neededBy"),
    recipientOrLocation: formData.get("recipientOrLocation"),
    purpose: formData.get("purpose"),
    invoiceReference: formData.get("invoiceReference"),
    vendorName: formData.get("vendorName"),
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the request details.",
    }
  }

  const evidenceFile = getFile(formData, "evidenceFile")
  const uploadSizeError = getUploadSizeError(evidenceFile, "Evidence file")

  if (uploadSizeError) {
    return {
      status: "error",
      message: uploadSizeError,
    }
  }

  if (
    (parsed.data.requestType === "vendor_payment" ||
      parsed.data.requestType === "manual_business_expense") &&
    !evidenceFile
  ) {
    return {
      status: "error",
      message: "Attach the invoice or receipt before submitting this request.",
    }
  }

  try {
    const workspace = await ensureDemoWorkspace(account)
    const request = await createPaymentRequest({
      context: workspace,
      input: parsed.data,
      evidenceFile,
    })

    revalidatePath("/admin")
    revalidatePath("/mobile")

    return {
      status: "success",
      message: `${request.title} was submitted for Super Admin approval.`,
      request,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to submit this request right now.",
    }
  }
}

export async function uploadFieldPaymentProofAction(
  _prevState: PaymentRequestActionState = initialPaymentRequestActionState,
  formData: FormData,
): Promise<PaymentRequestActionState> {
  void _prevState

  const account = await getFieldActionAccount()

  if (!account) {
    return {
      status: "error",
      message: "Your session expired. Sign in again to upload proof.",
    }
  }

  const requestId = String(formData.get("requestId") ?? "")
  const proofFile = getFile(formData, "proofFile")
  const note = String(formData.get("proofNote") ?? "").trim()
  const uploadSizeError = getUploadSizeError(proofFile, "Proof file")

  if (!requestId) {
    return { status: "error", message: "Choose the approved request first." }
  }

  if (uploadSizeError) {
    return {
      status: "error",
      message: uploadSizeError,
    }
  }

  if (!proofFile && !note) {
    return {
      status: "error",
      message: "Attach a proof file or add a proof note.",
    }
  }

  try {
    const workspace = await ensureDemoWorkspace(account)
    const request = await attachPaymentRequestProof({
      organizationId: workspace.organizationId,
      memberId: workspace.memberId,
      requestId,
      proofFile,
      note,
    })

    revalidatePath("/admin")
    revalidatePath("/mobile")

    return {
      status: "success",
      message: `Proof was attached to ${request.title}.`,
      request,
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to upload proof right now.",
    }
  }
}

async function getFieldActionAccount() {
  const account = await getCurrentAppwriteAccount()

  if (account || process.env.NODE_ENV === "production") {
    return account
  }

  const demoAccount = getDemoAccountByRole("field_employee")

  if (!demoAccount) {
    return null
  }

  return {
    $id: demoAccount.userId,
    name: demoAccount.name,
    email: demoAccount.email,
  } as NonNullable<Awaited<ReturnType<typeof getCurrentAppwriteAccount>>>
}
