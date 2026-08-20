export const FEATURE_KEYS = ["size", "age", "distance", "renovated"] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_NAMES: Record<FeatureKey, string> = {
  size: "Size (100 sqft)",
  age: "Age (years)",
  distance: "Distance to center (km)",
  renovated: "Renovated",
};

/** A simple linear price model: predict = intercept + sum(weight_i * feature_i). */
export const WEIGHTS: Record<FeatureKey, number> = {
  size: 15,
  age: -2,
  distance: -5,
  renovated: 20,
};

export const INTERCEPT = 100;

/** The "typical house" — every SHAP value here is measured relative to this baseline. */
export const BASELINE_FEATURES: Record<FeatureKey, number> = {
  size: 20,
  age: 15,
  distance: 10,
  renovated: 0,
};

/** The specific house this chapter explains. */
export const INSTANCE: Record<FeatureKey, number> = {
  size: 25,
  age: 5,
  distance: 8,
  renovated: 1,
};

export function predict(features: Record<FeatureKey, number>): number {
  return INTERCEPT + FEATURE_KEYS.reduce((sum, k) => sum + WEIGHTS[k] * features[k], 0);
}

export const BASELINE_PREDICTION = predict(BASELINE_FEATURES);

/**
 * For a linear model, the exact Shapley value has a closed form — no permutations needed: a feature's
 * contribution is just its weight times how far this instance's value sits from the baseline.
 */
export function shapValue(key: FeatureKey, features: Record<FeatureKey, number> = INSTANCE): number {
  return WEIGHTS[key] * (features[key] - BASELINE_FEATURES[key]);
}

export function allShapValues(features: Record<FeatureKey, number> = INSTANCE): Record<FeatureKey, number> {
  return Object.fromEntries(FEATURE_KEYS.map((k) => [k, shapValue(k, features)])) as Record<FeatureKey, number>;
}
