import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { syncAppwriteSchema } from "@/lib/appwrite/sync"

for (const envFile of [".env", ".env.local"]) {
  loadEnvFile(envFile)
}

function loadEnvFile(fileName: string) {
  const envPath = resolve(process.cwd(), fileName)

  if (!existsSync(envPath)) {
    return
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf("=")

    if (separatorIndex < 1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    process.env[key] ??= value.replace(/^["']|["']$/g, "")
  }
}

async function main() {
  const args = new Set(process.argv.slice(2))

  if (!process.env.APPWRITE_API_KEY) {
    throw new Error(
      "APPWRITE_API_KEY is required before running the Appwrite schema sync.",
    )
  }

  await syncAppwriteSchema({
    includeIndexes: !args.has("--skip-indexes"),
    includeRelationships: !args.has("--skip-relationships"),
  })

  console.log("Appwrite schema sync completed.")
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
