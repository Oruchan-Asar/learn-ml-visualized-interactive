/**
 * "Fair" isn't one definition — it's several, each individually reasonable, that can disagree on the
 * exact same classifier and the exact same data. This is the same confusion-matrix machinery from Part
 * IX, computed once per group instead of once overall, then compared across groups.
 */
export interface GroupOutcome {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

export const GROUP_A: GroupOutcome = { tp: 4, fp: 1, fn: 1, tn: 4 };
export const GROUP_B: GroupOutcome = { tp: 2, fp: 2, fn: 0, tn: 6 };

function total(g: GroupOutcome): number {
  return g.tp + g.fp + g.fn + g.tn;
}

/** Demographic parity's quantity: what fraction of this group got a positive prediction, regardless of whether it was correct. */
export function selectionRate(g: GroupOutcome): number {
  return (g.tp + g.fp) / total(g);
}

/** Equal opportunity's quantity: of this group's actual positives, what fraction were caught. */
export function truePositiveRate(g: GroupOutcome): number {
  return g.tp / (g.tp + g.fn);
}

/** Predictive parity's quantity: of this group's positive predictions, what fraction were actually correct. */
export function precision(g: GroupOutcome): number {
  return g.tp / (g.tp + g.fp);
}

/** How common actual positives are in this group — the base rate. Different base rates are exactly what makes the three metrics above pull in different directions. */
export function baseRate(g: GroupOutcome): number {
  return (g.tp + g.fn) / total(g);
}

export interface FairnessMetric {
  key: string;
  label: string;
  compute: (g: GroupOutcome) => number;
}

export const METRICS: FairnessMetric[] = [
  { key: "demographic_parity", label: "Demographic parity (selection rate)", compute: selectionRate },
  { key: "equal_opportunity", label: "Equal opportunity (true positive rate)", compute: truePositiveRate },
  { key: "predictive_parity", label: "Predictive parity (precision)", compute: precision },
];

/** The absolute gap between the two groups on a given metric — zero would mean that metric is satisfied. */
export function gap(metric: FairnessMetric, groupA: GroupOutcome = GROUP_A, groupB: GroupOutcome = GROUP_B): number {
  return Math.abs(metric.compute(groupA) - metric.compute(groupB));
}
