import { LABELS as INGESTION_LABELS, pointInTimeFeature } from "./data-pipelines-and-feature-stores";
import { driftScore as klDriftScore, DRIFT_ALERT_THRESHOLD } from "./model-monitoring-and-drift";

/** The ingestion side: the exact point-in-time feature values Chapter 1 established as correct. */
export const EXPECTED_INGESTION_VALUES = [30, 45, 100];

export interface StaticTestResult {
  labelTime: number;
  expected: number;
  actual: number;
  passed: boolean;
}

/** A static regression suite for the join logic — it only ever checks that the code still computes the right number for fixed historical labels. It knows nothing about today's live traffic. */
export function runStaticIngestionTests(): StaticTestResult[] {
  return INGESTION_LABELS.map((label, i) => {
    const actual = pointInTimeFeature(label.t);
    const expected = EXPECTED_INGESTION_VALUES[i];
    return { labelTime: label.t, expected, actual, passed: actual === expected };
  });
}

/** The serving side: three input bins, each with its own fixed accuracy. */
export const BIN_LABELS = ["low", "medium", "high"];
export const BIN_ACCURACIES = [0.9, 0.8, 0.7];
export const TRAIN_DIST = [0.3, 0.4, 0.3];

export function weightedAccuracy(dist: number[]): number {
  return dist.reduce((sum, w, i) => sum + w * BIN_ACCURACIES[i], 0);
}

/** The monitoring side: the same KL-divergence drift score from Chapter 3, against this pipeline's own training distribution. */
export function driftScore(candidate: number[]): number {
  return klDriftScore(TRAIN_DIST, candidate);
}

export { DRIFT_ALERT_THRESHOLD };

export function isDrifting(candidate: number[]): boolean {
  return driftScore(candidate) > DRIFT_ALERT_THRESHOLD;
}

export interface DayReport {
  day: number;
  dist: number[];
  accuracy: number;
  drift: number;
  staticTestsPassed: boolean;
  alarm: boolean;
}

/** Three days of live traffic: a stable baseline, a normal wobble, and a silent incident. */
export const DAILY_DISTRIBUTIONS: number[][] = [
  [0.3, 0.4, 0.3],
  [0.35, 0.35, 0.3],
  [0.4, 0.2, 0.4],
];

export function runPipeline(dailyDistributions: number[][] = DAILY_DISTRIBUTIONS): DayReport[] {
  const staticTestsPassed = runStaticIngestionTests().every((t) => t.passed);
  return dailyDistributions.map((dist, i) => ({
    day: i + 1,
    dist,
    accuracy: weightedAccuracy(dist),
    drift: driftScore(dist),
    staticTestsPassed,
    alarm: isDrifting(dist),
  }));
}

export interface Candidate {
  label: string;
  dist: number[];
}

/** Three unseen candidate days for the checkpoint: genuinely fine, loudly drifting (accuracy moves too), and silently drifting (accuracy hides it). */
export const CHECKPOINT_CANDIDATES: Candidate[] = [
  { label: "candidate A", dist: [0.32, 0.38, 0.3] },
  { label: "candidate B", dist: [0.6, 0.1, 0.3] },
  { label: "candidate C", dist: [0.1, 0.8, 0.1] },
];
