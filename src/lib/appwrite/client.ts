import { Account, Client, Databases, Storage } from "appwrite"

import { getPublicEnv } from "@/lib/env"

export function createAppwriteBrowserClient() {
  const env = getPublicEnv()

  return new Client()
    .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
}

export function createAppwriteBrowserServices() {
  const client = createAppwriteBrowserClient()

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  }
}
