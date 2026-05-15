import { syncAppwriteSchema } from "@/lib/appwrite/sync"

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
