export const FEATURE_KEYS = ["A", "B", "C"] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_NAMES: Record<FeatureKey, string> = {
  A: "Fresh dough",
  B: "Extra cheese",
  C: "Toppings",
};

/** Canonical key for a subset: its feature letters, sorted, joined ("" for empty, "ABC" for all three). */
function subsetKey(subset: FeatureKey[]): string {
  return [...subset].sort().join("");
}

/**
 * The "game": a pizza's quality score given which of the three upgrades are present. Deliberately not
 * additive — cheese and toppings together (BC) are worth far more than their solo effects summed, a real
 * synergy that a naive "credit each feature its solo contribution" scheme would completely miss.
 */
const VALUE_TABLE: Record<string, number> = {
  "": 50,
  A: 55,
  B: 52,
  C: 53,
  AB: 62,
  AC: 61,
  BC: 65,
  ABC: 80,
};

export function valueOf(subset: FeatureKey[]): number {
  const key = subsetKey(subset);
  const v = VALUE_TABLE[key];
  if (v === undefined) throw new Error(`No value defined for subset "${key}"`);
  return v;
}

export const BASELINE = valueOf([]);
export const FULL_VALUE = valueOf([...FEATURE_KEYS]);

function permutationsOf<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const result: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const perm of permutationsOf(rest)) result.push([item, ...perm]);
  });
  return result;
}

export const ALL_ORDERINGS: FeatureKey[][] = permutationsOf([...FEATURE_KEYS]);

/** How much `feature` adds when it joins, given the features already present ahead of it in this ordering. */
export function marginalContribution(ordering: FeatureKey[], feature: FeatureKey): number {
  const position = ordering.indexOf(feature);
  const before = ordering.slice(0, position);
  return valueOf([...before, feature]) - valueOf(before);
}

/** The Shapley value: a feature's marginal contribution, averaged over every possible arrival order. */
export function shapleyValue(feature: FeatureKey): number {
  const contributions = ALL_ORDERINGS.map((ordering) => marginalContribution(ordering, feature));
  return contributions.reduce((s, v) => s + v, 0) / contributions.length;
}

export function allShapleyValues(): Record<FeatureKey, number> {
  return Object.fromEntries(FEATURE_KEYS.map((f) => [f, shapleyValue(f)])) as Record<FeatureKey, number>;
}
