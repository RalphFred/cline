"use client"

import { useEffect } from "react"
import { toast } from "sonner"

type SignInFeedbackToastProps = {
  errorMessage?: string
  signedOut?: boolean
}

export function SignInFeedbackToast({
  errorMessage,
  signedOut,
}: SignInFeedbackToastProps) {
  useEffect(() => {
    if (signedOut) {
      toast.success("Signed out successfully.")
    }
  }, [signedOut])

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
    }
  }, [errorMessage])

  return null
}
