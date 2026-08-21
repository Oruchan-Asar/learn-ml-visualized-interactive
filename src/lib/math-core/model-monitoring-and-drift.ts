import { klDivergence } from "./kl-divergence-and-mutual-information";

/** Three input bins a classifier's confidence naturally falls into. */
export const BIN_LABELS = ["low", "medium", "high"];

/** Per-bin accuracy — a fixed property of the model, unaffected by how often each bin occurs. */
export const BIN_ACCURACIES = [0.95, 0.85, 0.75];

/** The bin proportions the model was trained (and originally validated) on. */
export const TRAIN_DIST = [0.2, 0.5, 0.3];

/** The bin proportions seen in production months later — visibly different from TRAIN_DIST. */
export const LIVE_DIST = [0.3, 0.3, 0.4];

/** Overall accuracy is the bin proportions weighted by each bin's fixed accuracy. */
export function weightedAccuracy(dist: number[]): number {
  return dist.reduce((sum, w, i) => sum + w * BIN_ACCURACIES[i], 0);
}

/** Drift score: KL divergence, in bits, from a reference distribution to a candidate one. */
export function driftScore(reference: number[], candidate: number[]): number {
  return klDivergence(reference, candidate);
}

/** Above this many bits of divergence, the input distribution has drifted enough to alert on. */
export const DRIFT_ALERT_THRESHOLD = 0.05;

export function isDrifting(reference: number[], candidate: number[]): boolean {
  return driftScore(reference, candidate) > DRIFT_ALERT_THRESHOLD;
}

export interface Candidate {
  label: string;
  dist: number[];
}

/** Three unseen distributions for the checkpoint: one drifts silently behind matching accuracy, one drifts loudly (accuracy moves too), one barely drifts at all. */
export const CANDIDATES: Candidate[] = [
  { label: "candidate A", dist: [0.4, 0.1, 0.5] },
  { label: "candidate B", dist: [0.5, 0.2, 0.3] },
  { label: "candidate C", dist: [0.22, 0.48, 0.3] },
];
