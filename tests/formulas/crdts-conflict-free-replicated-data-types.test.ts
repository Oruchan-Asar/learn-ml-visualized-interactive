import { describe, it, expect } from "vitest";
import {
  REPLICAS,
  zeroState,
  increment,
  merge,
  mergeAll,
  value,
  statesEqual,
  type GCounterState,
} from "@/lib/math-core/crdts-conflict-free-replicated-data-types";

const P_STATE = increment(increment(increment(zeroState(), "P"), "P"), "P"); // P did 3 own increments
const Q_STATE = increment(increment(zeroState(), "Q"), "Q"); // Q did 2 own increments
const R_STATE = increment(zeroState(), "R"); // R did 1 own increment

describe("zeroState / increment", () => {
  it("starts every replica slot at 0", () => {
    expect(zeroState()).toEqual({ P: 0, Q: 0, R: 0 });
  });

  it("increment only ever bumps the given replica's own slot", () => {
    expect(P_STATE).toEqual({ P: 3, Q: 0, R: 0 });
    expect(Q_STATE).toEqual({ P: 0, Q: 2, R: 0 });
    expect(R_STATE).toEqual({ P: 0, Q: 0, R: 1 });
  });

  it("supports incrementing by more than 1 at once", () => {
    expect(increment(zeroState(), "P", 5)).toEqual({ P: 5, Q: 0, R: 0 });
  });
});

describe("merge — pointwise max per slot", () => {
  it("matches the hand-computed merge of P and Q", () => {
    expect(merge(P_STATE, Q_STATE)).toEqual({ P: 3, Q: 2, R: 0 });
  });

  it("is commutative: merge(P, Q) === merge(Q, P)", () => {
    expect(merge(P_STATE, Q_STATE)).toEqual(merge(Q_STATE, P_STATE));
  });

  it("is idempotent: merging a state with itself changes nothing", () => {
    expect(merge(P_STATE, P_STATE)).toEqual(P_STATE);
  });

  it("is associative: merge(merge(P, Q), R) === merge(P, merge(Q, R))", () => {
    const left = merge(merge(P_STATE, Q_STATE), R_STATE);
    const right = merge(P_STATE, merge(Q_STATE, R_STATE));
    expect(left).toEqual(right);
    expect(left).toEqual({ P: 3, Q: 2, R: 1 });
  });
});

describe("mergeAll — order-independent convergence across all 3 replicas", () => {
  it("every permutation of merge order reaches the identical final state", () => {
    const perms: GCounterState[][] = [
      [P_STATE, Q_STATE, R_STATE],
      [R_STATE, Q_STATE, P_STATE],
      [Q_STATE, R_STATE, P_STATE],
    ];
    const results = perms.map((perm) => mergeAll(perm));
    for (const r of results) {
      expect(r).toEqual({ P: 3, Q: 2, R: 1 });
    }
  });

  it("throws on an empty list", () => {
    expect(() => mergeAll([])).toThrow();
  });
});

describe("value — the counter's logical total", () => {
  it("sums every replica's slot", () => {
    expect(value(mergeAll([P_STATE, Q_STATE, R_STATE]))).toBe(6);
  });

  it("a lone replica's value is just its own count", () => {
    expect(value(P_STATE)).toBe(3);
  });
});

describe("statesEqual", () => {
  it("is true for two states with identical slots, false otherwise", () => {
    expect(statesEqual(P_STATE, { ...P_STATE })).toBe(true);
    expect(statesEqual(P_STATE, Q_STATE)).toBe(false);
  });

  it("treats a missing slot as 0", () => {
    expect(statesEqual({ P: 0 }, {})).toBe(true);
  });

  it("REPLICAS names exactly the 3 fixed replicas used throughout", () => {
    expect(REPLICAS).toEqual(["P", "Q", "R"]);
  });
});
