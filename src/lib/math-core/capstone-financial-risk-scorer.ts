import { softmax, argmax } from "./multinomial-logistic-regression-and-softmax";

export const RISK_LABELS = ["low", "medium", "high"];

export interface Applicant {
  name: string;
  debtRatio: number;
  latePayments: number;
  trueRisk: number;
}

/** Four toy loan applicants, each with two features: a debt ratio (0-10 scale) and a count of late payments. */
export const APPLICANTS: Applicant[] = [
  { name: "Alex", debtRatio: 2, latePayments: 0, trueRisk: 0 },
  { name: "Bao", debtRatio: 5, latePayments: 0, trueRisk: 1 },
  { name: "Cora", debtRatio: 8, latePayments: 3, trueRisk: 2 },
  { name: "Deja", debtRatio: 3, latePayments: 2, trueRisk: 1 },
];

export interface ClassWeights {
  bias: number;
  debtWeight: number;
  lateWeight: number;
}

/** Raw (unregularized) per-class weights — deliberately large-magnitude, exactly the kind of weight
 *  vector a linear classifier can land on when nothing constrains its size. Index matches RISK_LABELS. */
export const RAW_WEIGHTS: ClassWeights[] = [
  { bias: 6, debtWeight: -1, lateWeight: -1 },
  { bias: 2, debtWeight: 0, lateWeight: 0 },
  { bias: -4, debtWeight: 1, lateWeight: 1 },
];

export const LAMBDA_MAX = 2;

/** L2-style weight decay: shrinks every non-bias weight by the same 1/(1+λ) factor, leaving the bias
 *  (the per-class baseline) untouched — this is exactly ridge regression's closed-form shrinkage of
 *  ordinary least squares coefficients in the special case of standardized, uncorrelated features. */
export function shrinkWeights(weights: ClassWeights[], lambda: number): ClassWeights[] {
  const factor = 1 / (1 + lambda);
  return weights.map((w) => ({ bias: w.bias, debtWeight: w.debtWeight * factor, lateWeight: w.lateWeight * factor }));
}

export function logits(weights: ClassWeights[], applicant: Applicant): number[] {
  return weights.map((w) => w.bias + w.debtWeight * applicant.debtRatio + w.lateWeight * applicant.latePayments);
}

export function classify(weights: ClassWeights[], applicant: Applicant): { probabilities: number[]; predicted: number } {
  const z = logits(weights, applicant);
  const probabilities = softmax(z);
  return { probabilities, predicted: argmax(z) };
}

/** How many of the 4 applicants get their true risk class as the argmax prediction, at a given λ. */
export function accuracyAt(lambda: number): number {
  const weights = shrinkWeights(RAW_WEIGHTS, lambda);
  return APPLICANTS.reduce((count, a) => count + (classify(weights, a).predicted === a.trueRisk ? 1 : 0), 0);
}
