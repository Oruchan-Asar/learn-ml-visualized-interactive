/**
 * A grow-only counter (G-Counter) CRDT with 3 fixed replicas — the simplest possible CRDT that
 * still demonstrates the whole point: every replica can only bump its own slot, so increments
 * from different replicas never conflict, and merging (pointwise max per slot) always produces
 * the same result no matter what order replicas sync in.
 */
export const REPLICAS: string[] = ["P", "Q", "R"];

export type GCounterState = Record<string, number>;

/** A fresh counter with every replica's slot at 0. */
export function zeroState(replicas: string[] = REPLICAS): GCounterState {
  return Object.fromEntries(replicas.map((r) => [r, 0]));
}

/** A replica may only ever bump its own slot — never another replica's. */
export function increment(state: GCounterState, replicaId: string, by: number = 1): GCounterState {
  return { ...state, [replicaId]: (state[replicaId] ?? 0) + by };
}

/** Merging two replicas' views: take the pointwise max of every slot across both — commutative, associative, idempotent. */
export function merge(a: GCounterState, b: GCounterState): GCounterState {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const result: GCounterState = {};
  for (const k of keys) {
    result[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  }
  return result;
}

/** Folds merge over any number of states — the result is the same regardless of the order given. */
export function mergeAll(states: GCounterState[]): GCounterState {
  if (states.length === 0) throw new Error("mergeAll requires at least one state");
  return states.reduce((acc, s) => merge(acc, s));
}

/** The counter's logical value: the sum of every replica's slot. */
export function value(state: GCounterState): number {
  return Object.values(state).reduce((sum, v) => sum + v, 0);
}

/** Whether two states agree on every slot (missing slots count as 0) — "have these replicas fully converged?" */
export function statesEqual(a: GCounterState, b: GCounterState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? 0) !== (b[k] ?? 0)) return false;
  }
  return true;
}
