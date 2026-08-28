/**
 * Sagas: a long transaction broken into local steps, each with its own explicit compensating
 * (undo) action, instead of holding distributed locks across services for the whole thing. If step
 * k fails, every step that already completed is undone, strictly in reverse order (LIFO) — a "stack
 * of undos" you unwind one at a time.
 */

export interface SagaStep {
  name: string;
  compensation: string;
}

/** A fixed 4-step trip-booking saga, small enough to trace every compensation by hand. */
export const STEPS: SagaStep[] = [
  { name: "Reserve funds", compensation: "Release funds" },
  { name: "Book flight", compensation: "Cancel flight" },
  { name: "Book hotel", compensation: "Cancel hotel" },
  { name: "Charge card", compensation: "Refund card" },
];

export type TraceEntry =
  | { index: number; kind: "forward"; action: string }
  | { index: number; kind: "failed"; action: string }
  | { index: number; kind: "compensation"; action: string };

/**
 * Runs the saga forward. `failAt`, if given, is the index of the step that fails (never completes);
 * every step before it already completed and gets compensated, in reverse order. `failAt === null`
 * means every step succeeds and no compensation ever runs.
 */
export function runSaga(failAt: number | null): TraceEntry[] {
  const trace: TraceEntry[] = [];
  const completed: number[] = [];

  for (let i = 0; i < STEPS.length; i++) {
    if (i === failAt) {
      trace.push({ index: i, kind: "failed", action: STEPS[i].name });
      break;
    }
    trace.push({ index: i, kind: "forward", action: STEPS[i].name });
    completed.push(i);
  }

  if (failAt !== null) {
    for (let i = completed.length - 1; i >= 0; i--) {
      const idx = completed[i];
      trace.push({ index: idx, kind: "compensation", action: STEPS[idx].compensation });
    }
  }

  return trace;
}

/** How many steps get compensated for a given failure point — exactly the number that had already completed. */
export function compensationCount(failAt: number | null): number {
  if (failAt === null) return 0;
  return failAt;
}

/** The compensation order is always the exact reverse of completion order — a LIFO stack of undos. */
export function compensationOrder(failAt: number | null): number[] {
  if (failAt === null || failAt === 0) return [];
  const completed = Array.from({ length: failAt }, (_, i) => i);
  return [...completed].reverse();
}
