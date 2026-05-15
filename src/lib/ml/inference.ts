import artifactJson from "@/lib/ml/artifacts/demo-risk-models.json"
import { getPaymentRequestFeatureVector, getRiskBand, getTopFeature } from "@/lib/ml/features"
import {
  type DemoRiskModelArtifact,
  type IsolationTreeNode,
  type PaymentRequestFeatureVector,
  type PaymentRequestModelInput,
  type PaymentRequestModelPrediction,
} from "@/lib/ml/types"

const artifact = artifactJson as DemoRiskModelArtifact

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value))
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function pathLength(vector: PaymentRequestFeatureVector, node: IsolationTreeNode): number {
  if (node.type === "leaf") {
    return node.depth + Math.log2(Math.max(node.size, 2))
  }

  return pathLength(
    vector,
    vector[node.feature] <= node.threshold ? node.left : node.right,
  )
}

function predictRiskScore(vector: PaymentRequestFeatureVector) {
  const logit = artifact.riskModel.trees.reduce((sum, tree) => {
    const treeValue =
      vector[tree.feature] <= tree.threshold ? tree.leftValue : tree.rightValue
    return sum + artifact.riskModel.learningRate * treeValue
  }, artifact.riskModel.baseLogit)

  return clamp(sigmoid(logit), 0, 1)
}

function predictAnomalyScore(vector: PaymentRequestFeatureVector) {
  const sampleSize = artifact.anomalyModel.sampleSize
  const averagePathLength = average(
    artifact.anomalyModel.trees.map((tree) => pathLength(vector, tree)),
  )
  const normalization =
    2 * (Math.log(sampleSize - 1) + 0.5772156649) -
    (2 * (sampleSize - 1)) / sampleSize

  return clamp(Math.pow(2, -averagePathLength / normalization), 0, 1)
}

export function scorePaymentRequestRisk(
  input: PaymentRequestModelInput,
): PaymentRequestModelPrediction {
  const vector = getPaymentRequestFeatureVector(input)
  const riskScore = Number(predictRiskScore(vector).toFixed(2))
  const anomalyScore = Number(predictAnomalyScore(vector).toFixed(2))
  const blendedScore = Number(
    clamp(riskScore * 0.72 + anomalyScore * 0.28, 0, 1).toFixed(2),
  )

  return {
    riskScore: blendedScore,
    anomalyScore,
    riskBand: getRiskBand(blendedScore),
    modelVersion: artifact.artifactVersion,
    topModelFeature: getTopFeature(vector),
  }
}

export function getDemoRiskModelArtifactSummary() {
  return {
    artifactVersion: artifact.artifactVersion,
    trainedAtIso: artifact.trainedAtIso,
    datasetVersion: artifact.datasetVersion,
    rowCount: artifact.rowCount,
    riskModel: artifact.riskModel.modelName,
    anomalyModel: artifact.anomalyModel.modelName,
    riskMetrics: artifact.riskModel.metrics,
    anomalyMetrics: artifact.anomalyModel.metrics,
  }
}
