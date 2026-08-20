import { rankByDistance, predict as knnPredict, type LabeledPoint2D } from "./k-nearest-neighbors";
import { runDBSCAN, type Point2D, NOISE, type ClusterLabel } from "./alternative-clustering-dbscan";

export { NOISE };
export type { ClusterLabel };

/**
 * One shared, messy dataset: two clean clusters (A bottom-left, B top-right) plus one deliberately
 * noisy A point planted right inside B's spatial territory — the same "one stray point" trick from
 * the kNN and Naive Bayes chapters, now run through three different tools at once.
 */
export const POINTS: LabeledPoint2D[] = [
  { x: 1, y: 1, label: "A" },
  { x: 1, y: 2, label: "A" },
  { x: 2, y: 1, label: "A" },
  { x: 2, y: 2, label: "A" },
  { x: 5.2, y: 5.3, label: "A" }, // the noisy point
  { x: 5, y: 5, label: "B" },
  { x: 5, y: 6, label: "B" },
  { x: 6, y: 5, label: "B" },
  { x: 6, y: 6, label: "B" },
];

export const QUERY = { x: 5, y: 5.5 };
export const DOMAIN: [number, number] = [0, 7];

// ---- Lens 1: kNN — reuses Chapter 1's exact ranking + voting logic on this shared dataset. ----
export function knnRank() {
  return rankByDistance(QUERY, POINTS);
}
export function knnPrediction(k: number): string {
  return knnPredict(QUERY, k, POINTS);
}

// ---- Lens 2: Naive Bayes — binarizes (x, y) into "high_x"/"high_y" features, then classifies. ----
const THRESHOLD = 3.5;
type NbLabel = "A" | "B";

function binarize(p: { x: number; y: number }): { highX: boolean; highY: boolean } {
  return { highX: p.x > THRESHOLD, highY: p.y > THRESHOLD };
}

function nbClassCount(label: NbLabel): number {
  return POINTS.filter((p) => p.label === label).length;
}

function nbFeatureLikelihood(feature: "highX" | "highY", label: NbLabel): number {
  const classPoints = POINTS.filter((p) => p.label === label);
  const trueCount = classPoints.filter((p) => binarize(p)[feature]).length;
  return (trueCount + 1) / (classPoints.length + 2); // Laplace smoothed
}

export interface NbResult {
  posteriors: Record<NbLabel, number>;
  prediction: NbLabel;
}

export function naiveBayesClassify(query: { x: number; y: number } = QUERY): NbResult {
  const q = binarize(query);
  const labels: NbLabel[] = ["A", "B"];
  const unnormalized = Object.fromEntries(
    labels.map((label) => {
      const prior = nbClassCount(label) / POINTS.length;
      const pX = nbFeatureLikelihood("highX", label);
      const pY = nbFeatureLikelihood("highY", label);
      const likelihood = (q.highX ? pX : 1 - pX) * (q.highY ? pY : 1 - pY);
      return [label, prior * likelihood];
    }),
  ) as Record<NbLabel, number>;
  const total = labels.reduce((s, l) => s + unnormalized[l], 0);
  const posteriors = Object.fromEntries(labels.map((l) => [l, unnormalized[l] / total])) as Record<NbLabel, number>;
  const prediction = labels.reduce((best, l) => (posteriors[l] > posteriors[best] ? l : best));
  return { posteriors, prediction };
}

// ---- Lens 3: DBSCAN — ignores every label, clusters purely by spatial density. ----
export const DBSCAN_EPS = 1.5;
export const DBSCAN_MIN_NEIGHBORS = 1;

export function dbscanLabels(): ClusterLabel[] {
  const asPoints: Point2D[] = POINTS.map((p) => ({ x: p.x, y: p.y }));
  return runDBSCAN(asPoints, DBSCAN_EPS, DBSCAN_MIN_NEIGHBORS);
}
