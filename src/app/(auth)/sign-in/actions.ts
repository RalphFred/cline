"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import {
  clearAppwriteSessionCookie,
  getAppwriteSessionSecret,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/session"
import {
  getDemoAccountByRole,
  type DemoAccount,
} from "@/lib/demo/accounts"
import { getServerEnv } from "@/lib/env"
import { roles, type Role } from "@/lib/permissions/roles"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
})

const sessionResponseSchema = z.object({
  secret: z.string().min(1),
  expire: z.string().optional(),
})

const demoRoleSchema = z.enum(roles)

function getSafeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/admin"
  }

  return nextPath
}

function getAppwriteEndpointPath(path: string) {
  const env = getServerEnv()

  return `${env.NEXT_PUBLIC_APPWRITE_ENDPOINT.replace(/\/$/, "")}${path}`
}

function getAppwriteProjectHeaders() {
  const env = getServerEnv()

  return {
    "X-Appwrite-Project": env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  }
}

async function createEmailPasswordSession(input: {
  email: string
  password: string
}) {
  const response = await fetch(getAppwriteEndpointPath("/account/sessions/email"), {
    method: "POST",
    headers: {
      ...getAppwriteProjectHeaders(),
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error("Appwrite rejected the email/password session.")
  }

  return sessionResponseSchema.parse(await response.json())
}

async function ensureDemoUser(account: DemoAccount) {
  const env = getServerEnv()

  if (!env.APPWRITE_API_KEY) {
    throw new Error("Appwrite API key is required for demo sign-in.")
  }

  const headers = {
    ...getAppwriteProjectHeaders(),
    "X-Appwrite-Key": env.APPWRITE_API_KEY,
    "content-type": "application/json",
  }

  const existingUserResponse = await fetch(
    getAppwriteEndpointPath(`/users/${account.userId}`),
    { headers },
  )

  if (existingUserResponse.ok) {
    return
  }

  if (existingUserResponse.status !== 404) {
    throw new Error("Unable to inspect the demo Super Admin user.")
  }

  const createUserResponse = await fetch(getAppwriteEndpointPath("/users"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      userId: account.userId,
      email: account.email,
      name: account.name,
    }),
  })

  if (!createUserResponse.ok) {
    throw new Error("Unable to create the demo Super Admin user.")
  }
}

async function createDemoUserSession(account: DemoAccount) {
  const env = getServerEnv()

  if (!env.APPWRITE_API_KEY) {
    throw new Error("Appwrite API key is required for demo sign-in.")
  }

  await ensureDemoUser(account)

  const response = await fetch(
    getAppwriteEndpointPath(`/users/${account.userId}/sessions`),
    {
      method: "POST",
      headers: {
        ...getAppwriteProjectHeaders(),
        "X-Appwrite-Key": env.APPWRITE_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    },
  )

  if (!response.ok) {
    throw new Error("Unable to create the demo user session.")
  }

  return sessionResponseSchema.parse(await response.json())
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

  let session: z.infer<typeof sessionResponseSchema>

  try {
    session = await createEmailPasswordSession({
      email: parsed.data.email,
      password: parsed.data.password,
    })
    await setAppwriteSessionCookie(session.secret, session.expire)
  } catch {
    redirect("/sign-in?error=invalid_credentials")
  }

  redirect(getSafeNextPath(parsed.data.next))
}

export async function demoRoleSignInAction(formData: FormData) {
  const parsedRole = demoRoleSchema.safeParse(formData.get("role"))

  if (!parsedRole.success) {
    redirect("/sign-in?error=demo_sign_in_failed")
  }

  const account = getDemoAccountByRole(parsedRole.data as Role)

  if (!account) {
    redirect("/sign-in?error=demo_sign_in_failed")
  }

  try {
    const session = await createDemoUserSession(account)
    await setAppwriteSessionCookie(session.secret, session.expire)
  } catch {
    redirect("/sign-in?error=demo_sign_in_failed")
  }

  redirect(getSafeNextPath(account.destination))
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
    const sessionSecret = await getAppwriteSessionSecret()

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
