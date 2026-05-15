import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { ID, Query } from "appwrite"

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local")

  if (!existsSync(envPath)) {
    return
  }

  const file = readFileSync(envPath, "utf8")

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue
    }

    const [key, ...valueParts] = trimmed.split("=")
    const value = valueParts.join("=")

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const demoOrganizationDocumentId = "demo-crestview"

const demoInventorySeed = [
  {
    sku: "ENG-OIL-5W30",
    name: "Engine Oil 5W-30 Carton",
    description: "12-bottle carton for wholesale auto-parts buyers.",
    unitPriceKobo: 258000,
    quantityOnHand: 120,
    lowStockThreshold: 24,
    status: "active",
  },
  {
    sku: "BAT-200AH",
    name: "Inverter Battery 200AH",
    description: "Deep-cycle batteries used in larger distributor orders.",
    unitPriceKobo: 1850000,
    quantityOnHand: 18,
    lowStockThreshold: 6,
    status: "active",
  },
  {
    sku: "DSL-FLTR-PK",
    name: "Diesel Filter Pack",
    description: "Multi-unit consumable bundle for generator maintenance work.",
    unitPriceKobo: 92000,
    quantityOnHand: 64,
    lowStockThreshold: 12,
    status: "active",
  },
  {
    sku: "GEN-SVC-KIT",
    name: "Generator Service Kit",
    description: "Quick-turn kit bundled for scheduled facility servicing jobs.",
    unitPriceKobo: 345000,
    quantityOnHand: 22,
    lowStockThreshold: 8,
    status: "active",
  },
] as const

async function main() {
  loadLocalEnv()

  const args = new Set(process.argv.slice(2))
  const reset = args.has("--reset")

  if (!process.env.APPWRITE_API_KEY) {
    throw new Error("APPWRITE_API_KEY is required to seed demo inventory.")
  }

  const [{ getAppwriteIds }, { createAppwriteAdminClient }] = await Promise.all([
    import("@/lib/appwrite/ids"),
    import("@/lib/appwrite/server"),
  ])
  const ids = getAppwriteIds()
  const { databases } = createAppwriteAdminClient()

  try {
    await databases.getDocument(
      ids.databaseId,
      ids.collections.organizations,
      demoOrganizationDocumentId,
    )
  } catch {
    await databases.createDocument(
      ids.databaseId,
      ids.collections.organizations,
      demoOrganizationDocumentId,
      {
        name: "Crestview Distribution",
        businessType: "Retail and distribution SME",
        currency: "NGN",
        walletMode: "sandbox",
        createdBy: "demo-seed",
      },
    )
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const item of demoInventorySeed) {
    const existing = await databases.listDocuments(
      ids.databaseId,
      ids.collections.inventoryItems,
      [
        Query.equal("organizationId", [demoOrganizationDocumentId]),
        Query.equal("sku", [item.sku]),
        Query.limit(1),
      ],
    )

    if (!existing.documents[0]) {
      await databases.createDocument(
        ids.databaseId,
        ids.collections.inventoryItems,
        ID.unique(),
        {
          organizationId: demoOrganizationDocumentId,
          ...item,
        },
      )
      created += 1
      continue
    }

    if (!reset) {
      skipped += 1
      continue
    }

    await databases.updateDocument(
      ids.databaseId,
      ids.collections.inventoryItems,
      existing.documents[0].$id,
      item,
    )
    updated += 1
  }

  console.log(
    `Demo inventory ready. created=${created} updated=${updated} skipped=${skipped}`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
