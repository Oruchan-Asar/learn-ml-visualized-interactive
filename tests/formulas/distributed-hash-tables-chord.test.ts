import { describe, it, expect } from "vitest";
import {
  RING_SIZE,
  M_BITS,
  NODE_POSITIONS,
  successor,
  fingerTable,
  closestPrecedingFinger,
  chordLookup,
} from "@/lib/math-core/distributed-hash-tables-chord";

describe("successor — the ring's clockwise successor rule", () => {
  it("matches consistent hashing's clockwise-successor convention for the same 4-node ring", () => {
    expect(successor(0, NODE_POSITIONS)).toBe(2);
    expect(successor(9, NODE_POSITIONS)).toBe(9); // a query exactly at a node's own position
    expect(successor(14, NODE_POSITIONS)).toBe(2); // wraps around past 13
  });

  it("throws with no nodes on the ring", () => {
    expect(() => successor(5, [])).toThrow();
  });
});

describe("fingerTable — finger[i] = successor(nodePos + 2^i)", () => {
  it("matches the hand-computed finger table for every one of the 4 fixed nodes", () => {
    expect(fingerTable(2, NODE_POSITIONS)).toEqual([6, 6, 6, 13]);
    expect(fingerTable(6, NODE_POSITIONS)).toEqual([9, 9, 13, 2]);
    expect(fingerTable(9, NODE_POSITIONS)).toEqual([13, 13, 13, 2]);
    expect(fingerTable(13, NODE_POSITIONS)).toEqual([2, 2, 2, 6]);
  });

  it("finger[0] is always exactly the node's immediate successor", () => {
    for (const n of NODE_POSITIONS) {
      expect(fingerTable(n, NODE_POSITIONS)[0]).toBe(successor(n + 1, NODE_POSITIONS));
    }
  });

  it("produces exactly M_BITS entries, one per bit of the ring's address space", () => {
    expect(M_BITS).toBe(Math.log2(RING_SIZE));
    expect(fingerTable(2, NODE_POSITIONS)).toHaveLength(M_BITS);
  });
});

describe("closestPrecedingFinger — jump as far as possible without overshooting", () => {
  it("picks node 6 as the furthest finger of node 2 that doesn't pass target 12", () => {
    const fingers = fingerTable(2, NODE_POSITIONS); // [6, 6, 6, 13]
    expect(closestPrecedingFinger(2, 12, fingers)).toBe(6);
  });

  it("returns null when no finger qualifies (the successor itself is the answer)", () => {
    const fingers = fingerTable(2, NODE_POSITIONS); // [6, 6, 6, 13]
    expect(closestPrecedingFinger(2, 5, fingers)).toBeNull();
  });
});

describe("chordLookup — hand-traced routing paths on the fixed 4-node ring", () => {
  it("resolves in 0 hops when the target falls in the querying node's own successor arc", () => {
    const result = chordLookup(2, 5);
    expect(result).toEqual({ path: [2], owner: 6, hops: 0 });
  });

  it("takes exactly 2 hops (2 -> 6 -> 9) to resolve target 12, owned by node 13", () => {
    const result = chordLookup(2, 12);
    expect(result).toEqual({ path: [2, 6, 9], owner: 13, hops: 2 });
  });

  it("wraps around the ring correctly: target 14 from node 2 resolves to node 2 itself", () => {
    const result = chordLookup(2, 14);
    expect(result).toEqual({ path: [2, 13], owner: 2, hops: 1 });
  });

  it("every returned path starts at the querying node and ends one hop before the owner", () => {
    for (const start of NODE_POSITIONS) {
      for (let target = 0; target < RING_SIZE; target++) {
        const result = chordLookup(start, target);
        expect(result.path[0]).toBe(start);
        expect(result.hops).toBe(result.path.length - 1);
        expect(result.owner).toBe(successor(target, NODE_POSITIONS));
      }
    }
  });

  it("never takes more than M_BITS hops on this ring", () => {
    for (const start of NODE_POSITIONS) {
      for (let target = 0; target < RING_SIZE; target++) {
        expect(chordLookup(start, target).hops).toBeLessThanOrEqual(M_BITS);
      }
    }
  });
});
