import { entropy } from "./entropy";

export interface SplitDataPoint {
  x: number;
  label: string;
}

/** One noisy point (x=7 is "A" among a "B" neighborhood) so the best split isn't perfectly pure. */
export const SPLIT_DATA_POINTS: SplitDataPoint[] = [
  { x: 1, label: "A" },
  { x: 2, label: "A" },
  { x: 3, label: "A" },
  { x: 4, label: "A" },
  { x: 5, label: "A" },
  { x: 6, label: "B" },
  { x: 7, label: "A" },
  { x: 8, label: "B" },
  { x: 9, label: "B" },
  { x: 10, label: "B" },
];

export interface SplitResult {
  parentEntropy: number;
  leftEntropy: number;
  rightEntropy: number;
  leftCount: number;
  rightCount: number;
  weightedEntropy: number;
  informationGain: number;
}

function entropyOf(points: SplitDataPoint[]): number {
  if (points.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const p of points) counts.set(p.label, (counts.get(p.label) ?? 0) + 1);
  const probabilities = [...counts.values()].map((c) => c / points.length);
  return entropy(probabilities);
}

/** Points with x below the threshold go left, everything else goes right. */
export function evaluateSplit(points: SplitDataPoint[], threshold: number): SplitResult {
  const left = points.filter((p) => p.x < threshold);
  const right = points.filter((p) => p.x >= threshold);
  const parentEntropy = entropyOf(points);
  const leftEntropy = entropyOf(left);
  const rightEntropy = entropyOf(right);
  const weightedEntropy =
    (left.length / points.length) * leftEntropy + (right.length / points.length) * rightEntropy;
  return {
    parentEntropy,
    leftEntropy,
    rightEntropy,
    leftCount: left.length,
    rightCount: right.length,
    weightedEntropy,
    informationGain: parentEntropy - weightedEntropy,
  };
}

/** Tries every midpoint between consecutive distinct x values — exactly what a real tree tries at each node. */
export function bestSplit(points: SplitDataPoint[]): { threshold: number; result: SplitResult } {
  const xs = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b);
  let best: { threshold: number; result: SplitResult } | null = null;
  for (let i = 0; i < xs.length - 1; i++) {
    const threshold = (xs[i] + xs[i + 1]) / 2;
    const result = evaluateSplit(points, threshold);
    if (!best || result.informationGain > best.result.informationGain) {
      best = { threshold, result };
    }
  }
  if (!best) throw new Error("Need at least two distinct x values to split on.");
  return best;
}
