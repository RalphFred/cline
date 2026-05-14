"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { createAppwriteAdminClient } from "@/lib/appwrite/server"
import {
  clearAppwriteSessionCookie,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/session"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
})

function getSafeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/admin"
  }

  return nextPath
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  })

  if (!parsed.success) {
    redirect("/sign-in?error=invalid_form")
  }

  try {
    const { client } = createAppwriteAdminClient()
    const response = await client.call(
      "post",
      new URL("/account/sessions/email", client.config.endpoint),
      {
        "content-type": "application/json",
      },
      {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    )

    const session = response as { secret?: string; expire?: string }

    if (!session.secret) {
      redirect("/sign-in?error=session_secret_missing")
    }

    await setAppwriteSessionCookie(session.secret, session.expire)
  } catch {
    redirect("/sign-in?error=invalid_credentials")
  }

  redirect(getSafeNextPath(parsed.data.next))
}

export async function signOutAction() {
  const sessionSecret = await clearSessionInAppwrite()
  await clearAppwriteSessionCookie()

  if (sessionSecret) {
    redirect("/sign-in?signed_out=1")
  }

  redirect("/sign-in")
}

async function clearSessionInAppwrite() {
  try {
    const sessionSecret = await (
      await import("@/lib/appwrite/session")
    ).getAppwriteSessionSecret()

    if (!sessionSecret) {
      return null
    }

    const { account } = await import("@/lib/appwrite/server").then((module) =>
      module.createAppwriteSessionClient(sessionSecret),
    )

    await account.deleteSession("current")
    return sessionSecret
  } catch {
    return null
  }
}
