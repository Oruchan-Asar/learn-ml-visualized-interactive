import { positionAt, velocity, type Pair, PAIRS } from "./flow-matching";

export type { Pair };
export { PAIRS };

/**
 * Last chapter's straight-line path needed only one Euler step to reach its endpoint, because its
 * velocity is constant. A consistency model generalizes that shortcut into a trained property: a single
 * function f(x_t, t) that maps ANY point on a trajectory directly to that trajectory's endpoint, so two
 * different points on the *same* trajectory must agree — that agreement is exactly what "self-consistency"
 * means, and what a real consistency-distillation loss enforces even on genuinely curved trajectories.
 */
export function consistencyFunction(t: number, pair: Pair): number {
  const xt = positionAt(t, pair);
  return xt + (1 - t) * velocity(pair);
}

export interface Candidate {
  t: number;
  pairIndex: number;
}

export const CANDIDATES: Candidate[] = [
  { t: 0.2, pairIndex: 0 },
  { t: 0.6, pairIndex: 1 },
  { t: 0.9, pairIndex: 2 },
];
