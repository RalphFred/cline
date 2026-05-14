import "server-only"

import { Account, Client, Databases, Storage } from "appwrite"

import { getServerEnv } from "@/lib/env"

function createBaseServerClient() {
  const env = getServerEnv()

  return new Client()
    .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
}

export function createAppwriteAdminClient() {
  const env = getServerEnv()
  const client = createBaseServerClient()

  if (env.APPWRITE_API_KEY) {
    client.setDevKey(env.APPWRITE_API_KEY)
  }

  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
  }
}

export function createAppwriteSessionClient(session: string) {
  const client = createBaseServerClient().setSession(session)

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  }
}
