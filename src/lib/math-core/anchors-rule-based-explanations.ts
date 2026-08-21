/**
 * A genuine AND-interaction: the model fires only when BOTH features clear a threshold. A rule
 * that only checks one condition looks reasonable but is unreliable; the full conjunction is
 * perfectly reliable, at the cost of covering a smaller slice of the input space.
 */
export interface Point {
  x1: number;
  x2: number;
}

export const GRID_VALUES: number[] = [0, 1, 2, 3, 4, 5, 6];
export const INSTANCE: Point = { x1: 5, x2: 5 };

export function model(x1: number, x2: number): 0 | 1 {
  return x1 > 3 && x2 > 3 ? 1 : 0;
}

export function allGridPoints(values: number[] = GRID_VALUES): Point[] {
  const points: Point[] = [];
  for (const x1 of values) {
    for (const x2 of values) {
      points.push({ x1, x2 });
    }
  }
  return points;
}

export interface AnchorRule {
  predicate: (p: Point) => boolean;
  label: string;
}

export const ANCHOR_SINGLE: AnchorRule = { predicate: (p) => p.x1 > 3, label: "x1 > 3" };
export const ANCHOR_CONJUNCTION: AnchorRule = { predicate: (p) => p.x1 > 3 && p.x2 > 3, label: "x1 > 3 AND x2 > 3" };

/**
 * Three more candidates, unused in the Intuition/Play demos above, reserved for the checkpoint so it
 * tests fresh reasoning instead of a number the learner already saw on screen a moment ago.
 */
export const ANCHOR_LOOSE_SINGLE: AnchorRule = { predicate: (p) => p.x2 > 0, label: "x2 > 0" };
export const ANCHOR_LOOSE_CONJUNCTION: AnchorRule = { predicate: (p) => p.x1 > 3 && p.x2 > 2, label: "x1 > 3 AND x2 > 2" };
export const ANCHOR_TIGHT_CONJUNCTION: AnchorRule = { predicate: (p) => p.x1 > 4 && p.x2 > 4, label: "x1 > 4 AND x2 > 4" };

export interface AnchorStats {
  precision: number;
  coverage: number;
  nSatisfying: number;
  nMatching: number;
}

/** Precision: of the points satisfying the rule, how many share the instance's prediction. Coverage: what fraction of all points satisfy the rule at all. */
export function evaluateAnchor(rule: AnchorRule, instance: Point = INSTANCE, points: Point[] = allGridPoints()): AnchorStats {
  const targetLabel = model(instance.x1, instance.x2);
  const satisfying = points.filter((p) => rule.predicate(p));
  const matching = satisfying.filter((p) => model(p.x1, p.x2) === targetLabel);
  return {
    precision: satisfying.length === 0 ? 0 : matching.length / satisfying.length,
    coverage: satisfying.length / points.length,
    nSatisfying: satisfying.length,
    nMatching: matching.length,
  };
}

export const PRECISION_THRESHOLD = 0.95;
