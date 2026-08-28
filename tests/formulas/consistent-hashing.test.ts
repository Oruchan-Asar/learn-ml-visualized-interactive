import { describe, it, expect } from "vitest";
import { RING_SIZE, NODES, KEYS, assignKey, assignAll, reassignedKeys, type RingItem } from "@/lib/math-core/consistent-hashing";

describe("assignKey — clockwise successor on the ring", () => {
  it("matches the hand-computed assignment for every key against the base 4-node ring", () => {
    expect(assignAll(NODES, KEYS)).toEqual({
      k1: "A", // pos 0 -> first node >= 0 -> A@2
      k2: "B", // pos 4 -> first node >= 4 -> B@6
      k3: "C", // pos 7 -> first node >= 7 -> C@9
      k4: "D", // pos 10 -> first node >= 10 -> D@13
      k5: "D", // pos 12 -> first node >= 12 -> D@13
      k6: "A", // pos 15 -> wraps around -> A@2
    });
  });

  it("a key exactly at a node's position is owned by that node", () => {
    expect(assignKey(9, NODES)).toBe("C");
  });

  it("wraps around when no node position is >= the key's position", () => {
    expect(assignKey(15, NODES)).toBe("A");
    expect(assignKey(RING_SIZE - 1, NODES)).toBe("A");
  });

  it("throws with no nodes on the ring", () => {
    expect(() => assignKey(5, [])).toThrow();
  });
});

describe("adding a node only reshuffles the keys in its new arc", () => {
  it("adding E@11 (between C@9 and D@13) only moves k4, which was previously owned by D", () => {
    const before = assignAll(NODES, KEYS);
    const withE: RingItem[] = [...NODES, { id: "E", pos: 11 }];
    const after = assignAll(withE, KEYS);
    expect(after.k4).toBe("E");
    expect(reassignedKeys(before, after)).toEqual(["k4"]);
  });
});

describe("removing a node only reshuffles the keys it used to own", () => {
  it("removing C only moves k3, which now falls to D", () => {
    const before = assignAll(NODES, KEYS);
    const withoutC = NODES.filter((n) => n.id !== "C");
    const after = assignAll(withoutC, KEYS);
    expect(after.k3).toBe("D");
    expect(reassignedKeys(before, after)).toEqual(["k3"]);
  });
});

describe("reassignedKeys", () => {
  it("is empty when the assignment doesn't change", () => {
    const a = assignAll(NODES, KEYS);
    const b = assignAll(NODES, KEYS);
    expect(reassignedKeys(a, b)).toEqual([]);
  });
});
