import { describe, it, expect } from "vitest";
import {
  PREF_LIST,
  N,
  incrementClock,
  mergeClocks,
  compareClocks,
  quorumOverlap,
  sufficientQuorum,
  writeTargets,
} from "@/lib/math-core/dynamo-style-storage";

describe("vector clocks — incrementClock / compareClocks", () => {
  it("two replicas writing independently from empty clocks are concurrent", () => {
    const a = incrementClock({}, "A"); // {A:1}
    const b = incrementClock({}, "B"); // {B:1}
    expect(a).toEqual({ A: 1 });
    expect(compareClocks(a, b)).toBe("concurrent");
    expect(compareClocks(b, a)).toBe("concurrent");
  });

  it("a write that descends from a merge of both is 'after' the earlier one", () => {
    const a = incrementClock({}, "A"); // {A:1}
    const b = incrementClock({}, "B"); // {B:1}
    const aAfterSeeingB = incrementClock(mergeClocks(a, b), "A"); // {A:2, B:1}
    expect(aAfterSeeingB).toEqual({ A: 2, B: 1 });
    expect(compareClocks(aAfterSeeingB, b)).toBe("after");
    expect(compareClocks(b, aAfterSeeingB)).toBe("before");
  });

  it("identical clocks compare equal", () => {
    const a = incrementClock({}, "A");
    expect(compareClocks(a, { A: 1 })).toBe("equal");
  });

  it("mergeClocks takes the pointwise max and is commutative", () => {
    const a = { A: 2, B: 1 };
    const b = { A: 1, B: 3, C: 1 };
    expect(mergeClocks(a, b)).toEqual({ A: 2, B: 3, C: 1 });
    expect(mergeClocks(a, b)).toEqual(mergeClocks(b, a));
  });
});

describe("sloppy quorums — quorumOverlap / sufficientQuorum", () => {
  it("R=3, W=3 over N=5 guarantees overlap, matching the hand-picked example", () => {
    const writeSet = PREF_LIST.slice(0, 3); // N1, N2, N3
    const readSet = PREF_LIST.slice(2); // N3, N4, N5
    expect(quorumOverlap(readSet, writeSet)).toEqual(["N3"]);
    expect(sufficientQuorum(3, 3, N)).toBe(true);
  });

  it("R=2, W=2 over N=5 does not guarantee overlap, and this example has none", () => {
    const writeSet = PREF_LIST.slice(0, 2); // N1, N2
    const readSet = PREF_LIST.slice(3); // N4, N5
    expect(quorumOverlap(readSet, writeSet)).toEqual([]);
    expect(sufficientQuorum(2, 2, N)).toBe(false);
  });

  it("the boundary R+W===N is not sufficient (must be strictly greater)", () => {
    expect(sufficientQuorum(2, 3, 5)).toBe(false);
    expect(sufficientQuorum(3, 3, 5)).toBe(true);
  });

  it("increasing R while W stays fixed eventually guarantees overlap for this fixed pair of sets", () => {
    const writeSet = PREF_LIST.slice(0, 3);
    for (let r = 1; r <= 5; r++) {
      const readSet = PREF_LIST.slice(N - r);
      const overlaps = quorumOverlap(readSet, writeSet).length > 0;
      expect(overlaps).toBe(sufficientQuorum(r, 3, N));
    }
  });
});

describe("writeTargets — hinted handoff around a down node", () => {
  it("with no down nodes, targets are simply the first W of the preference list", () => {
    expect(writeTargets(PREF_LIST, new Set(), 3)).toEqual({ targets: ["N1", "N2", "N3"], hintedFor: {} });
  });

  it("skips a down node and assigns its hint to the next healthy stand-in", () => {
    const result = writeTargets(PREF_LIST, new Set(["N2"]), 3);
    expect(result.targets).toEqual(["N1", "N3", "N4"]);
    expect(result.hintedFor).toEqual({ N3: "N2" });
  });

  it("handles two down nodes in a row, queuing both hints in order", () => {
    const result = writeTargets(PREF_LIST, new Set(["N1", "N2"]), 2);
    expect(result.targets).toEqual(["N3", "N4"]);
    expect(result.hintedFor).toEqual({ N3: "N1", N4: "N2" });
  });
});
