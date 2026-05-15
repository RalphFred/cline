import { getPaymentRequestFeatureVector, getRiskBand } from "@/lib/ml/features"
import {
  demoModelVersion,
  paymentRequestFeatureNames,
  type DemoRiskModelArtifact,
  type IsolationTreeNode,
  type PaymentRequestFeatureName,
  type PaymentRequestFeatureVector,
  type PaymentRequestModelInput,
  type RiskModelTree,
} from "@/lib/ml/types"
import type { PaymentRequestType } from "@/lib/payments/types"

type TrainingRow = {
  id: string
  input: PaymentRequestModelInput
  features: PaymentRequestFeatureVector
  label: 0 | 1
  scenario: string
}

type ScoredRow = TrainingRow & {
  riskScore: number
  anomalyScore: number
}

class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0
    return this.state / 4294967296
  }

  integer(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(items: readonly T[]): T {
    return items[this.integer(0, items.length - 1)]
  }

  chance(probability: number) {
    return this.next() < probability
  }
}

const requestTypes: PaymentRequestType[] = [
  "vendor_payment",
  "staff_cash_request",
  "airtime_data_request",
  "utility_payment",
  "manual_business_expense",
]

const amountBandsNaira: Record<PaymentRequestType, [number, number]> = {
  vendor_payment: [120_000, 2_800_000],
  staff_cash_request: [12_000, 350_000],
  airtime_data_request: [2_000, 75_000],
  utility_payment: [18_000, 650_000],
  manual_business_expense: [6_000, 420_000],
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

function roundScore(value: number) {
  return Number(clamp(value, 0, 1).toFixed(4))
}

function scoreSyntheticRisk(input: PaymentRequestModelInput) {
  const features = getPaymentRequestFeatureVector(input)
  let score = features.request_type_prior

  score += Math.min(features.amount_deviation_ratio, 2.4) * 0.14
  score += features.missing_required_evidence * 0.22
  score += features.is_immediate * 0.13
  score += features.request_frequency_7d >= 4 ? 0.16 : 0
  score += features.duplicate_evidence_hint * 0.18
  score += features.after_hours * 0.08
  score += features.vendor_watchlist * 0.24
  score += features.new_beneficiary * 0.08
  score -= features.has_evidence * 0.05
  score -= features.has_bank_details * 0.03

  return roundScore(score)
}

export function generateDemoTrainingRows(rowCount = 1600, seed = 42): TrainingRow[] {
  const random = new SeededRandom(seed)
  const rows: TrainingRow[] = []

  for (let index = 0; index < rowCount; index += 1) {
    const requestType = random.pick(requestTypes)
    const [minAmount, maxAmount] = amountBandsNaira[requestType]
    const highRiskScenario = random.chance(0.18)
    const amountNaira = highRiskScenario
      ? random.integer(Math.floor(maxAmount * 0.7), Math.floor(maxAmount * 2.2))
      : random.integer(minAmount, maxAmount)
    const urgency = random.chance(highRiskScenario ? 0.38 : 0.12)
      ? "Immediate"
      : random.pick(["Today", "This week", "Normal"])
    const hasEvidence =
      requestType === "airtime_data_request" || requestType === "staff_cash_request"
        ? random.chance(0.46)
        : random.chance(highRiskScenario ? 0.48 : 0.86)
    const submittedHour = random.chance(highRiskScenario ? 0.34 : 0.12)
      ? random.pick([3, 5, 21, 23])
      : random.integer(8, 18)
    const submittedAtIso = new Date(
      Date.UTC(2026, 4, random.integer(1, 12), submittedHour, random.integer(0, 59)),
    ).toISOString()
    const duplicateEvidenceHint = random.chance(highRiskScenario ? 0.14 : 0.025)
    const vendorStatus = random.chance(highRiskScenario ? 0.09 : 0.015)
      ? "watchlist"
      : "normal"
    const requestFrequency7d = highRiskScenario
      ? random.integer(1, 9)
      : random.integer(0, 4)
    const isNewBeneficiary =
      requestType === "vendor_payment" && random.chance(highRiskScenario ? 0.5 : 0.18)
    const accountNumber =
      requestType === "vendor_payment" && !isNewBeneficiary
        ? `10${random.integer(10000000, 99999999)}`
        : undefined
    const purpose = random.chance(0.22)
      ? "Operational payout"
      : "Stock, field operations, utility, or reimbursement expense for the demo workspace"

    const input: PaymentRequestModelInput = {
      requestType,
      amountKobo: amountNaira * 100,
      urgency,
      hasEvidence,
      purpose,
      submittedAtIso,
      accountNumber,
      vendorStatus,
      duplicateEvidenceHint,
      requestFrequency7d,
      isNewBeneficiary,
    }
    const riskScore = scoreSyntheticRisk(input)
    const label: 0 | 1 = riskScore >= 0.58 || random.chance(riskScore * 0.08) ? 1 : 0
    const scenario = label
      ? random.pick([
          "large_amount_or_unusual_frequency",
          "missing_evidence",
          "new_or_watchlisted_beneficiary",
          "urgent_after_hours_request",
        ])
      : "normal_operating_request"

    rows.push({
      id: `demo-row-${String(index + 1).padStart(4, "0")}`,
      input,
      features: getPaymentRequestFeatureVector(input),
      label,
      scenario,
    })
  }

  return rows
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function trainRiskBoostingModel(rows: TrainingRow[]) {
  const learningRate = 0.22
  const positiveRate = clamp(
    rows.filter((row) => row.label === 1).length / rows.length,
    0.001,
    0.999,
  )
  const baseLogit = Math.log(positiveRate / (1 - positiveRate))
  const logits = rows.map(() => baseLogit)
  const trees: RiskModelTree[] = []

  for (let round = 0; round < 42; round += 1) {
    const residuals = rows.map((row, index) => row.label - sigmoid(logits[index]))
    let bestTree: RiskModelTree | undefined
    let bestError = Number.POSITIVE_INFINITY

    for (const feature of paymentRequestFeatureNames) {
      const values = rows
        .map((row) => row.features[feature])
        .sort((left, right) => left - right)
      const thresholds = [0.25, 0.5, 0.75].map(
        (quantile) => values[Math.floor((values.length - 1) * quantile)],
      )

      for (const threshold of thresholds) {
        const leftResiduals: number[] = []
        const rightResiduals: number[] = []

        rows.forEach((row, index) => {
          if (row.features[feature] <= threshold) {
            leftResiduals.push(residuals[index])
          } else {
            rightResiduals.push(residuals[index])
          }
        })

        if (leftResiduals.length === 0 || rightResiduals.length === 0) {
          continue
        }

        const leftValue = average(leftResiduals)
        const rightValue = average(rightResiduals)
        const error = rows.reduce((sum, row, index) => {
          const prediction = row.features[feature] <= threshold ? leftValue : rightValue
          return sum + Math.pow(residuals[index] - prediction, 2)
        }, 0)

        if (error < bestError) {
          bestError = error
          bestTree = {
            feature,
            threshold,
            leftValue,
            rightValue,
          }
        }
      }
    }

    if (!bestTree) {
      break
    }

    trees.push(bestTree)
    rows.forEach((row, index) => {
      logits[index] +=
        learningRate *
        (row.features[bestTree.feature] <= bestTree.threshold
          ? bestTree.leftValue
          : bestTree.rightValue)
    })
  }

  return {
    modelName: "demo-gbdt-risk" as const,
    modelVersion: demoModelVersion as typeof demoModelVersion,
    baseLogit,
    learningRate,
    trees,
  }
}

function featureRange(rows: TrainingRow[], feature: PaymentRequestFeatureName) {
  const values = rows.map((row) => row.features[feature])
  return [Math.min(...values), Math.max(...values)] as const
}

function buildIsolationTree(
  rows: TrainingRow[],
  random: SeededRandom,
  depth: number,
  maxDepth: number,
): IsolationTreeNode {
  if (depth >= maxDepth || rows.length <= 2) {
    return { type: "leaf", size: rows.length, depth }
  }

  const shuffledFeatures = [...paymentRequestFeatureNames].sort(() => random.next() - 0.5)

  for (const feature of shuffledFeatures) {
    const [min, max] = featureRange(rows, feature)

    if (min === max) {
      continue
    }

    const threshold = min + random.next() * (max - min)
    const leftRows = rows.filter((row) => row.features[feature] <= threshold)
    const rightRows = rows.filter((row) => row.features[feature] > threshold)

    if (leftRows.length === 0 || rightRows.length === 0) {
      continue
    }

    return {
      type: "split",
      feature,
      threshold,
      left: buildIsolationTree(leftRows, random, depth + 1, maxDepth),
      right: buildIsolationTree(rightRows, random, depth + 1, maxDepth),
    }
  }

  return { type: "leaf", size: rows.length, depth }
}

function trainIsolationForest(rows: TrainingRow[], seed: number) {
  const random = new SeededRandom(seed)
  const sampleSize = Math.min(128, rows.length)
  const maxDepth = Math.ceil(Math.log2(sampleSize))
  const trees: IsolationTreeNode[] = []

  for (let index = 0; index < 48; index += 1) {
    const sample = Array.from({ length: sampleSize }, () => rows[random.integer(0, rows.length - 1)])
    trees.push(buildIsolationTree(sample, random, 0, maxDepth))
  }

  return {
    modelName: "demo-isolation-forest-anomaly" as const,
    modelVersion: demoModelVersion as typeof demoModelVersion,
    sampleSize,
    trees,
  }
}

function isolationPathLength(vector: PaymentRequestFeatureVector, node: IsolationTreeNode): number {
  if (node.type === "leaf") {
    return node.depth + Math.log2(Math.max(node.size, 2))
  }

  return isolationPathLength(
    vector,
    vector[node.feature] <= node.threshold ? node.left : node.right,
  )
}

function anomalyScore(vector: PaymentRequestFeatureVector, trees: IsolationTreeNode[], sampleSize: number) {
  const averagePathLength = average(trees.map((tree) => isolationPathLength(vector, tree)))
  const normalization = 2 * (Math.log(sampleSize - 1) + 0.5772156649) - (2 * (sampleSize - 1)) / sampleSize

  return roundScore(Math.pow(2, -averagePathLength / normalization))
}

function riskScore(row: TrainingRow, baseLogit: number, learningRate: number, trees: RiskModelTree[]) {
  const logit = trees.reduce((sum, tree) => {
    const value =
      row.features[tree.feature] <= tree.threshold ? tree.leftValue : tree.rightValue
    return sum + learningRate * value
  }, baseLogit)

  return roundScore(sigmoid(logit))
}

function getMetrics(rows: ScoredRow[]) {
  let truePositive = 0
  let trueNegative = 0
  let falsePositive = 0
  let falseNegative = 0

  for (const row of rows) {
    const predicted = row.riskScore >= 0.5 ? 1 : 0

    if (predicted === 1 && row.label === 1) truePositive += 1
    if (predicted === 0 && row.label === 0) trueNegative += 1
    if (predicted === 1 && row.label === 0) falsePositive += 1
    if (predicted === 0 && row.label === 1) falseNegative += 1
  }

  return {
    accuracy: roundScore((truePositive + trueNegative) / rows.length),
    precision: roundScore(truePositive / Math.max(truePositive + falsePositive, 1)),
    recall: roundScore(truePositive / Math.max(truePositive + falseNegative, 1)),
  }
}

export function trainDemoRiskModels(params?: {
  rowCount?: number
  seed?: number
  datasetVersion?: string
  trainedAtIso?: string
}) {
  const rows = generateDemoTrainingRows(params?.rowCount, params?.seed)
  const riskModel = trainRiskBoostingModel(rows)
  const anomalyModel = trainIsolationForest(rows, params?.seed ?? 42)
  const scoredRows: ScoredRow[] = rows.map((row) => ({
    ...row,
    riskScore: riskScore(row, riskModel.baseLogit, riskModel.learningRate, riskModel.trees),
    anomalyScore: anomalyScore(row.features, anomalyModel.trees, anomalyModel.sampleSize),
  }))
  const anomalyScores = scoredRows
    .map((row) => row.anomalyScore)
    .sort((left, right) => left - right)

  const artifact: DemoRiskModelArtifact = {
    artifactVersion: demoModelVersion,
    trainedAtIso: params?.trainedAtIso ?? new Date().toISOString(),
    datasetVersion: params?.datasetVersion ?? "demo-synthetic-v1",
    rowCount: rows.length,
    featureNames: [...paymentRequestFeatureNames],
    riskModel: {
      ...riskModel,
      metrics: getMetrics(scoredRows),
    },
    anomalyModel: {
      ...anomalyModel,
      metrics: {
        averageAnomalyScore: roundScore(average(anomalyScores)),
        p95AnomalyScore: roundScore(anomalyScores[Math.floor(anomalyScores.length * 0.95)]),
      },
    },
    notes:
      "Synthetic Nigerian SME payment-request scenarios. The GBDT artifact is codebase-native for demo inference and can be replaced by a Colab-trained XGBoost or LightGBM export with the same feature contract.",
  }

  return {
    artifact,
    rows: scoredRows,
  }
}

export function serializeTrainingRows(rows: ScoredRow[]) {
  const header = [
    "id",
    "scenario",
    "label",
    "risk_score",
    "anomaly_score",
    ...paymentRequestFeatureNames,
  ]

  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.scenario,
        row.label,
        row.riskScore,
        row.anomalyScore,
        ...paymentRequestFeatureNames.map((feature) => row.features[feature]),
      ].join(","),
    ),
  ].join("\n")
}

export function summarizeArtifact(artifact: DemoRiskModelArtifact) {
  const riskBandSamples = {
    low: 0,
    medium: 0,
    high: 0,
  }

  for (const score of [0.2, 0.48, 0.76]) {
    riskBandSamples[getRiskBand(score)] += 1
  }

  return {
    artifactVersion: artifact.artifactVersion,
    datasetVersion: artifact.datasetVersion,
    rowCount: artifact.rowCount,
    riskModel: artifact.riskModel.modelName,
    anomalyModel: artifact.anomalyModel.modelName,
    riskMetrics: artifact.riskModel.metrics,
    anomalyMetrics: artifact.anomalyModel.metrics,
    riskBandSamples,
  }
}
