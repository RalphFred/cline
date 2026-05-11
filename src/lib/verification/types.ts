export type ConcernLevel =
  | "low_concern"
  | "needs_review"
  | "high_concern"
  | "critical_concern"

export type ScoreBreakdown = {
  label: string
  maxPoints: number
  awardedPoints: number
  flags: string[]
}

export type VerificationSummary = {
  score: number
  concernLevel: ConcernLevel
  breakdown: ScoreBreakdown[]
  recommendation: string
}

export function getConcernLevel(score: number): ConcernLevel {
  if (score >= 80) return "low_concern"
  if (score >= 60) return "needs_review"
  if (score >= 40) return "high_concern"
  return "critical_concern"
}
