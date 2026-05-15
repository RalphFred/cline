import "server-only"

import { cookies } from "next/headers"

import { createAppwriteSessionClient } from "@/lib/appwrite/server"

const APPWRITE_SESSION_COOKIE = "cline-session"

export async function setAppwriteSessionCookie(
  secret: string,
  expireAt?: string,
) {
  const cookieStore = await cookies()

  cookieStore.set(APPWRITE_SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expireAt ? new Date(expireAt) : undefined,
  })
}

export async function clearAppwriteSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(APPWRITE_SESSION_COOKIE)
}

export async function getAppwriteSessionSecret() {
  const cookieStore = await cookies()
  return cookieStore.get(APPWRITE_SESSION_COOKIE)?.value ?? null
}

export async function getCurrentAppwriteAccount() {
  const sessionSecret = await getAppwriteSessionSecret()

  if (!sessionSecret) {
    return null
  }

  try {
    const { account } = createAppwriteSessionClient(sessionSecret)
    return await account.get()
  } catch {
    return null
  }
}
