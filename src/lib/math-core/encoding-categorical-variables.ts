export interface CategoricalRow {
  city: string;
  y: 0 | 1;
}

/**
 * Six customers, one categorical feature (`city`), one binary label. NYC appears 3 times, LA
 * appears twice, and SF appears exactly once — that lone SF row is what makes target-encoding
 * leakage visible without needing hundreds of rows.
 */
export const ROWS: CategoricalRow[] = [
  { city: "NYC", y: 1 },
  { city: "LA", y: 0 },
  { city: "NYC", y: 1 },
  { city: "SF", y: 1 },
  { city: "LA", y: 0 },
  { city: "NYC", y: 0 },
];

/** Alphabetical order — arbitrary, which is exactly the point of the "false ordering" lesson. */
export const CATEGORIES: string[] = ["LA", "NYC", "SF"];

/** Ordinal encoding: each category becomes its index in an arbitrary fixed ordering. */
export function ordinalEncode(rows: CategoricalRow[] = ROWS, categories: string[] = CATEGORIES): number[] {
  return rows.map((r) => categories.indexOf(r.city));
}

/** One-hot encoding: one binary column per category, aligned to `categories`. */
export function oneHotEncode(rows: CategoricalRow[] = ROWS, categories: string[] = CATEGORIES): number[][] {
  return rows.map((r) => categories.map((c) => (r.city === c ? 1 : 0)));
}

export function globalMean(rows: CategoricalRow[] = ROWS): number {
  return rows.reduce((sum, r) => sum + r.y, 0) / rows.length;
}

/**
 * Naive target encoding: replace each category with the mean label *including the row's own
 * label*. For a category that appears only once (SF here), this collapses to exactly that row's
 * own label — the model would be handed the answer as a "feature."
 */
export function naiveTargetEncode(rows: CategoricalRow[] = ROWS): number[] {
  return rows.map((row) => {
    const sameCategory = rows.filter((r) => r.city === row.city);
    return sameCategory.reduce((sum, r) => sum + r.y, 0) / sameCategory.length;
  });
}

/**
 * Leave-one-out target encoding: the mean label of every *other* row sharing this category,
 * falling back to the global mean when there are no other rows to average (the honest thing to
 * do for a singleton category, instead of leaking).
 */
export function leaveOneOutTargetEncode(rows: CategoricalRow[] = ROWS): number[] {
  const fallback = globalMean(rows);
  return rows.map((row, i) => {
    const others = rows.filter((r, j) => r.city === row.city && j !== i);
    if (others.length === 0) return fallback;
    return others.reduce((sum, r) => sum + r.y, 0) / others.length;
  });
}

export type EncodingScheme = "ordinal" | "oneHot" | "naiveTarget" | "leaveOneOutTarget";

export const SF_ROW_INDEX = ROWS.findIndex((r) => r.city === "SF");
