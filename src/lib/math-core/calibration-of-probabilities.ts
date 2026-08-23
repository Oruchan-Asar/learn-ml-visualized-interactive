/**
 * Eight examples with a "true," honestly-calibrated probability (imagine it as the actual base
 * rate you'd measure for examples exactly like this one) and one binary outcome apiece. The
 * outcomes were chosen so the true probabilities are already perfectly calibrated: the low group
 * (predicted probability < 0.5) sees a positive rate of exactly 0.25, and its average predicted
 * probability is also exactly 0.25. Same story for the high group at 0.75.
 */
export const TRUE_PROBS: number[] = [0.2, 0.3, 0.4, 0.1, 0.6, 0.7, 0.8, 0.9];
export const OUTCOMES: (0 | 1)[] = [0, 1, 0, 0, 1, 0, 1, 1];

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * A model that exaggerates confidence by a factor `k`: it pushes every true probability away
 * from 0.5 by that factor before reporting it. k=1 reproduces the true probability exactly
 * (perfectly calibrated); k>1 overstates confidence in whichever direction it already leaned.
 * 0.5 is a fixed point of this transform for every k, so which side of 0.5 an example falls on
 * never changes — only how far from it.
 */
export function rawPrediction(trueProb: number, k: number): number {
  return clamp01(0.5 + k * (trueProb - 0.5));
}

/** Undoes the exaggeration exactly, given the same k — this is what Platt scaling learns from data. */
export function calibrate(rawProb: number, k: number): number {
  return clamp01(0.5 + (rawProb - 0.5) / k);
}

export type Bucket = "low" | "high";

function bucketOf(trueProb: number): Bucket {
  return trueProb >= 0.5 ? "high" : "low";
}

export interface BucketStats {
  predictedAvg: number;
  actualFreq: number;
  n: number;
}

/**
 * The reliability-diagram data: split into "predicted < 0.5" and "predicted >= 0.5" buckets,
 * and compare each bucket's average predicted probability (under exaggeration factor k) against
 * the actual fraction of positives it contains.
 */
export function reliabilityBuckets(
  k: number,
  trueProbs: number[] = TRUE_PROBS,
  outcomes: (0 | 1)[] = OUTCOMES,
): Record<Bucket, BucketStats> {
  const sums: Record<Bucket, { pred: number; outcome: number; n: number }> = {
    low: { pred: 0, outcome: 0, n: 0 },
    high: { pred: 0, outcome: 0, n: 0 },
  };
  trueProbs.forEach((tp, i) => {
    const bucket = bucketOf(tp);
    sums[bucket].pred += rawPrediction(tp, k);
    sums[bucket].outcome += outcomes[i];
    sums[bucket].n += 1;
  });
  return {
    low: { predictedAvg: sums.low.pred / sums.low.n, actualFreq: sums.low.outcome / sums.low.n, n: sums.low.n },
    high: { predictedAvg: sums.high.pred / sums.high.n, actualFreq: sums.high.outcome / sums.high.n, n: sums.high.n },
  };
}

/** Expected Calibration Error: the size-weighted average gap between predicted confidence and actual frequency. */
export function expectedCalibrationError(k: number, trueProbs: number[] = TRUE_PROBS, outcomes: (0 | 1)[] = OUTCOMES): number {
  const buckets = reliabilityBuckets(k, trueProbs, outcomes);
  const total = trueProbs.length;
  return Object.values(buckets).reduce((sum, b) => sum + Math.abs(b.predictedAvg - b.actualFreq) * (b.n / total), 0);
}
