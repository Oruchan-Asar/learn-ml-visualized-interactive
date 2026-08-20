import { FEATURE_KEYS, FEATURE_NAMES, WEIGHTS, BASELINE_FEATURES, INSTANCE, predict, shapValue, type FeatureKey } from "./shap-linear";

export { FEATURE_KEYS, FEATURE_NAMES, WEIGHTS, BASELINE_FEATURES, INSTANCE, predict, shapValue };
export type { FeatureKey };

/** Reframes the same linear price model as a binary approval classifier at this cutoff. */
export const THRESHOLD = 500;

export function decisionValue(features: Record<FeatureKey, number> = INSTANCE): number {
  return predict(features) - THRESHOLD;
}

export function isApproved(features: Record<FeatureKey, number> = INSTANCE): boolean {
  return decisionValue(features) >= 0;
}

/**
 * "Saliency" for a linear model is just the raw gradient magnitude — the weight itself, exactly the
 * same everywhere, for every instance. It never looks at this instance's actual feature values at all.
 */
export function saliency(key: FeatureKey): number {
  return Math.abs(WEIGHTS[key]);
}

export const NORM_SQUARED = FEATURE_KEYS.reduce((s, k) => s + WEIGHTS[k] ** 2, 0);
export const NORM = Math.sqrt(NORM_SQUARED);

/** The nearest point (in feature space) that flips the approval decision — same closed form as Chapter 7, in 4D. */
export function nearestCounterfactual(features: Record<FeatureKey, number> = INSTANCE): Record<FeatureKey, number> {
  const f = decisionValue(features);
  const scale = f / NORM_SQUARED;
  return Object.fromEntries(FEATURE_KEYS.map((k) => [k, features[k] - scale * WEIGHTS[k]])) as Record<FeatureKey, number>;
}

/** How much each feature would need to change to reach that nearest counterfactual point. */
export function counterfactualDelta(features: Record<FeatureKey, number> = INSTANCE): Record<FeatureKey, number> {
  const cf = nearestCounterfactual(features);
  return Object.fromEntries(FEATURE_KEYS.map((k) => [k, cf[k] - features[k]])) as Record<FeatureKey, number>;
}
