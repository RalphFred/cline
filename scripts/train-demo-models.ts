import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import {
  serializeTrainingRows,
  summarizeArtifact,
  trainDemoRiskModels,
} from "@/lib/ml/training"

async function main() {
  const args = new Map(
    process.argv
      .slice(2)
      .map((arg) => {
        const [key, value = ""] = arg.split("=")
        return [key, value] as const
      }),
  )
  const rowCount = Number(args.get("--rows") ?? 1600)
  const seed = Number(args.get("--seed") ?? 42)
  const datasetVersion = args.get("--dataset-version") || "demo-synthetic-v1"
  const trainedAtIso = new Date().toISOString()

  const { artifact, rows } = trainDemoRiskModels({
    rowCount,
    seed,
    datasetVersion,
    trainedAtIso,
  })
  const artifactDirectory = resolve(process.cwd(), "src/lib/ml/artifacts")
  const datasetDirectory = resolve(process.cwd(), "src/lib/ml/datasets")

  await Promise.all([mkdir(artifactDirectory, { recursive: true }), mkdir(datasetDirectory, { recursive: true })])

  const artifactPath = resolve(artifactDirectory, "demo-risk-models.json")
  const datasetPath = resolve(datasetDirectory, `${datasetVersion}.csv`)

  await Promise.all([
    writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`),
    writeFile(datasetPath, `${serializeTrainingRows(rows)}\n`),
  ])

  console.log(JSON.stringify(summarizeArtifact(artifact), null, 2))
  console.log(`Wrote ${artifactPath}`)
  console.log(`Wrote ${datasetPath}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
