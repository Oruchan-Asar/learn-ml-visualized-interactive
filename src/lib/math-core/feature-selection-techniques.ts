export interface FeatureSet {
  name: string;
  label: string;
  values: number[];
}

/**
 * A toy "predict the test score" target — small and exact enough to check every correlation by
 * hand: sum the products of deviations, sum the squared deviations, divide.
 */
export const TARGET: number[] = [2, 4, 6, 8, 10, 12];

/**
 * Five candidate features for the same six students. `hoursStudied` is a perfect predictor,
 * `classroomNumber` never varies at all (every student sits in the same room), and the rest sit
 * somewhere in between — exactly the mix a real feature-selection pass has to sort through.
 */
export const FEATURES: FeatureSet[] = [
  { name: "hoursStudied", label: "Hours studied", values: [1, 2, 3, 4, 5, 6] },
  { name: "classroomNumber", label: "Classroom number", values: [7, 7, 7, 7, 7, 7] },
  { name: "shoeSize", label: "Shoe size", values: [4, 1, 5, 2, 6, 3] },
  { name: "sleepHours", label: "Sleep hours", values: [5, 1, 3, 11, 9, 7] },
  { name: "luckyNumber", label: "Lucky number", values: [8, 6, 7, 5, 9, 4] },
];

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population variance — the basis of the "variance threshold" filter: zero variance, zero information. */
export function variance(xs: number[]): number {
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
}

/** Pearson correlation coefficient. A zero-variance feature has no linear relationship to anything — defined as 0, not NaN. */
export function correlation(xs: number[], ys: number[]): number {
  const mx = mean(xs);
  const my = mean(ys);
  const dx = xs.map((x) => x - mx);
  const dy = ys.map((y) => y - my);
  const cov = dx.reduce((sum, d, i) => sum + d * dy[i], 0);
  const varX = dx.reduce((sum, d) => sum + d * d, 0);
  const varY = dy.reduce((sum, d) => sum + d * d, 0);
  if (varX === 0 || varY === 0) return 0;
  return cov / Math.sqrt(varX * varY);
}

/** R^2 of predicting the target from this one feature alone — a simple filter-method relevance score. */
export function relevanceScore(feature: FeatureSet, target: number[] = TARGET): number {
  return correlation(feature.values, target) ** 2;
}

/**
 * Sum of individual relevance scores across the selected features — a simplified additive stand-in for
 * "how much predictive signal have I kept." Real embedded methods also account for redundancy between
 * features (two features that duplicate each other's signal shouldn't both count fully); this toy score
 * doesn't model that, which is itself worth noticing when comparing subsets.
 */
export function selectionScore(selectedNames: string[], features: FeatureSet[] = FEATURES, target: number[] = TARGET): number {
  return features.filter((f) => selectedNames.includes(f.name)).reduce((sum, f) => sum + relevanceScore(f, target), 0);
}

/** The best achievable score: every feature with nonzero variance, since R^2 is never negative. */
export const MAX_SCORE = selectionScore(
  FEATURES.filter((f) => variance(f.values) > 0).map((f) => f.name),
);
