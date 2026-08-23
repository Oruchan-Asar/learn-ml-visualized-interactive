import {
  TRAIN_POINTS,
  VALIDATION_POINTS,
  TREE_DOMAIN,
  type TreePoint,
  type TreeRegion,
} from "./overfitting-tree";
import { FOREST_TREES, ensembleAccuracy as forestAccuracy, forestRegions } from "./bagging";
import { newtonLeafValue } from "./modern-boosters-xgboost-and-lightgbm";

export { TRAIN_POINTS, VALIDATION_POINTS, TREE_DOMAIN };

function toSign(label: string): number {
  return label === "B" ? 1 : -1;
}

function toLabel(score: number): string {
  return score >= 0 ? "B" : "A";
}

export interface NewtonStump {
  threshold: number;
  leftValue: number;
  rightValue: number;
}

/**
 * XGBoost-style split search: pick whichever threshold maximizes the Newton-boosting gain
 * G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) — the same objective real gradient boosters optimize,
 * built on the exact leaf-value formula from the "Modern boosters" chapter.
 */
function newtonBestSplit(xs: number[], gradients: number[], lambda: number, hessianPerPoint: number): NewtonStump {
  const sortedX = [...new Set(xs)].sort((a, b) => a - b);
  let best: (NewtonStump & { gain: number }) | null = null;
  for (let i = 0; i < sortedX.length - 1; i++) {
    const threshold = (sortedX[i] + sortedX[i + 1]) / 2;
    let leftSum = 0;
    let rightSum = 0;
    let leftCount = 0;
    let rightCount = 0;
    for (let j = 0; j < xs.length; j++) {
      if (xs[j] < threshold) {
        leftSum += gradients[j];
        leftCount += 1;
      } else {
        rightSum += gradients[j];
        rightCount += 1;
      }
    }
    const leftH = leftCount * hessianPerPoint;
    const rightH = rightCount * hessianPerPoint;
    const gain = (leftSum * leftSum) / (leftH + lambda) + (rightSum * rightSum) / (rightH + lambda);
    if (!best || gain > best.gain) {
      best = {
        threshold,
        leftValue: newtonLeafValue(leftSum, leftH, lambda),
        rightValue: newtonLeafValue(rightSum, rightH, lambda),
        gain,
      };
    }
  }
  if (!best) throw new Error("Need at least two distinct x values to split on.");
  return best;
}

function predictStump(stump: NewtonStump, x: number): number {
  return x < stump.threshold ? stump.leftValue : stump.rightValue;
}

/** Trains a squared-loss Newton-boosted classifier: each round's stump targets the current score's gradient. */
export function trainXgboostClassifier(
  points: TreePoint[],
  numRounds: number,
  lambda: number,
  hessianPerPoint: number,
): NewtonStump[] {
  const xs = points.map((p) => p.x);
  const y = points.map((p) => toSign(p.label));
  let score = points.map(() => 0);
  const rounds: NewtonStump[] = [];
  for (let r = 0; r < numRounds; r++) {
    const gradients = score.map((s, i) => s - y[i]);
    const stump = newtonBestSplit(xs, gradients, lambda, hessianPerPoint);
    score = xs.map((x, i) => score[i] + predictStump(stump, x));
    rounds.push(stump);
  }
  return rounds;
}

export function xgboostClassifierScore(rounds: NewtonStump[], numRounds: number, x: number): number {
  let score = 0;
  for (let i = 0; i < numRounds; i++) score += predictStump(rounds[i], x);
  return score;
}

export function xgboostClassifierPredict(rounds: NewtonStump[], numRounds: number, x: number): string {
  return toLabel(xgboostClassifierScore(rounds, numRounds, x));
}

export function xgboostClassifierAccuracy(rounds: NewtonStump[], numRounds: number, points: TreePoint[]): number {
  return points.filter((p) => xgboostClassifierPredict(rounds, numRounds, p.x) === p.label).length / points.length;
}

function mergeRegions(raw: TreeRegion[]): TreeRegion[] {
  const merged: TreeRegion[] = [];
  for (const region of raw) {
    const last = merged[merged.length - 1];
    if (last && last.prediction === region.prediction) last.end = region.end;
    else merged.push({ ...region });
  }
  return merged;
}

/** Regions of a stump ensemble, computed exactly from its own split thresholds (no sampling needed). */
export function xgboostClassifierRegions(
  rounds: NewtonStump[],
  numRounds: number,
  domainMin: number,
  domainMax: number,
): TreeRegion[] {
  const cuts = new Set<number>();
  for (let i = 0; i < numRounds; i++) cuts.add(rounds[i].threshold);
  const boundaries = [domainMin, ...[...cuts].filter((c) => c > domainMin && c < domainMax).sort((a, b) => a - b), domainMax];
  const raw: TreeRegion[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    raw.push({ start, end, prediction: xgboostClassifierPredict(rounds, numRounds, (start + end) / 2) });
  }
  return mergeRegions(raw);
}

/**
 * A simplified kernel-SVM-style classifier: every training point acts as a pseudo support vector, voting
 * with an RBF-kernel-weighted sign. A real SVM solves a QP for a *sparse* set of support-vector weights;
 * this keeps the essential kernel-trick mechanism — similarity-weighted, non-linear voting — at toy scale.
 */
export function rbfScore(trainPoints: TreePoint[], x: number, gamma: number): number {
  return trainPoints.reduce((sum, p) => sum + toSign(p.label) * Math.exp(-gamma * (x - p.x) ** 2), 0);
}

export function rbfPredict(trainPoints: TreePoint[], x: number, gamma: number): string {
  return toLabel(rbfScore(trainPoints, x, gamma));
}

export function rbfAccuracy(trainPoints: TreePoint[], points: TreePoint[], gamma: number): number {
  return points.filter((p) => rbfPredict(trainPoints, p.x, gamma) === p.label).length / points.length;
}

/** Regions for the (continuous, no finite cut list) kernel classifier — found by fine-grained sampling. */
export function rbfRegions(
  trainPoints: TreePoint[],
  gamma: number,
  domainMin: number,
  domainMax: number,
  resolution = 1000,
): TreeRegion[] {
  const raw: TreeRegion[] = [];
  const step = (domainMax - domainMin) / resolution;
  for (let i = 0; i < resolution; i++) {
    const start = domainMin + i * step;
    const end = domainMin + (i + 1) * step;
    raw.push({ start, end, prediction: rbfPredict(trainPoints, (start + end) / 2, gamma) });
  }
  return mergeRegions(raw);
}

export interface ScoreboardEntry {
  key: string;
  label: string;
  trainAccuracy: number;
  validationAccuracy: number;
  regions: TreeRegion[];
}

const XGB_UNREGULARIZED = trainXgboostClassifier(TRAIN_POINTS, 5, 0, 1);
const XGB_REGULARIZED = trainXgboostClassifier(TRAIN_POINTS, 5, 1, 1);
export const KERNEL_GAMMA_NARROW = 1;
export const KERNEL_GAMMA_TUNED = 0.1;

export const SCOREBOARD: ScoreboardEntry[] = [
  {
    key: "randomForest",
    label: "Random Forest (20 bagged trees)",
    trainAccuracy: forestAccuracy(FOREST_TREES, TRAIN_POINTS),
    validationAccuracy: forestAccuracy(FOREST_TREES, VALIDATION_POINTS),
    regions: forestRegions(FOREST_TREES, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "xgboostPlain",
    label: "XGBoost-style (5 rounds, λ=0)",
    trainAccuracy: xgboostClassifierAccuracy(XGB_UNREGULARIZED, 5, TRAIN_POINTS),
    validationAccuracy: xgboostClassifierAccuracy(XGB_UNREGULARIZED, 5, VALIDATION_POINTS),
    regions: xgboostClassifierRegions(XGB_UNREGULARIZED, 5, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "xgboostRegularized",
    label: "XGBoost-style (5 rounds, λ=1)",
    trainAccuracy: xgboostClassifierAccuracy(XGB_REGULARIZED, 5, TRAIN_POINTS),
    validationAccuracy: xgboostClassifierAccuracy(XGB_REGULARIZED, 5, VALIDATION_POINTS),
    regions: xgboostClassifierRegions(XGB_REGULARIZED, 5, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "kernelNarrow",
    label: "Kernel SVM (γ=1, too narrow)",
    trainAccuracy: rbfAccuracy(TRAIN_POINTS, TRAIN_POINTS, KERNEL_GAMMA_NARROW),
    validationAccuracy: rbfAccuracy(TRAIN_POINTS, VALIDATION_POINTS, KERNEL_GAMMA_NARROW),
    regions: rbfRegions(TRAIN_POINTS, KERNEL_GAMMA_NARROW, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "kernelTuned",
    label: "Kernel SVM (γ=0.1, tuned)",
    trainAccuracy: rbfAccuracy(TRAIN_POINTS, TRAIN_POINTS, KERNEL_GAMMA_TUNED),
    validationAccuracy: rbfAccuracy(TRAIN_POINTS, VALIDATION_POINTS, KERNEL_GAMMA_TUNED),
    regions: rbfRegions(TRAIN_POINTS, KERNEL_GAMMA_TUNED, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
];

export const BEST_VALIDATION_ACCURACY = Math.max(...SCOREBOARD.map((e) => e.validationAccuracy));
