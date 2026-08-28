import { describe, it, expect } from "vitest";
import { ID_BITS, SELF_ID, NODE_IDS, xorDistance, bucketIndex, kBuckets, closestNodes } from "@/lib/math-core/kademlia-and-structured-p2p";

describe("xorDistance", () => {
  it("is symmetric", () => {
    for (const a of NODE_IDS) {
      for (const b of NODE_IDS) {
        expect(xorDistance(a, b)).toBe(xorDistance(b, a));
      }
    }
  });

  it("is zero exactly when the two ids are equal", () => {
    expect(xorDistance(6, 6)).toBe(0);
    expect(xorDistance(SELF_ID, SELF_ID)).toBe(0);
  });

  it("matches hand-computed distances from SELF_ID (6 = 0110)", () => {
    expect(xorDistance(6, 7)).toBe(1); // 0110 ^ 0111 = 0001
    expect(xorDistance(6, 4)).toBe(2); // 0110 ^ 0100 = 0010
    expect(xorDistance(6, 3)).toBe(5); // 0110 ^ 0011 = 0101
    expect(xorDistance(6, 0)).toBe(6); // 0110 ^ 0000 = 0110
    expect(xorDistance(6, 9)).toBe(15); // 0110 ^ 1001 = 1111
    expect(xorDistance(6, 13)).toBe(11); // 0110 ^ 1101 = 1011
  });
});

describe("bucketIndex", () => {
  it("throws for a non-positive distance", () => {
    expect(() => bucketIndex(0)).toThrow();
    expect(() => bucketIndex(-1)).toThrow();
  });

  it("places each boundary distance in the expected bucket", () => {
    expect(bucketIndex(1)).toBe(0);
    expect(bucketIndex(2)).toBe(1);
    expect(bucketIndex(3)).toBe(1);
    expect(bucketIndex(4)).toBe(2);
    expect(bucketIndex(7)).toBe(2);
    expect(bucketIndex(8)).toBe(3);
    expect(bucketIndex(15)).toBe(3);
  });
});

describe("kBuckets — every fixed node bucketed by distance from SELF_ID", () => {
  it("matches the hand-computed bucket assignment exactly", () => {
    expect(kBuckets(SELF_ID, NODE_IDS)).toEqual([
      [7], // bucket 0: distance 1
      [4], // bucket 1: distance 2
      [3, 0], // bucket 2: distances 5, 6
      [9, 13], // bucket 3: distances 15, 11
    ]);
  });

  it("produces exactly ID_BITS buckets", () => {
    expect(kBuckets(SELF_ID, NODE_IDS)).toHaveLength(ID_BITS);
  });

  it("every node appears in exactly one bucket, and self is excluded", () => {
    const buckets = kBuckets(SELF_ID, [...NODE_IDS, SELF_ID]);
    const flattened = buckets.flat();
    expect(flattened.sort((a, b) => a - b)).toEqual([...NODE_IDS].sort((a, b) => a - b));
    expect(flattened).not.toContain(SELF_ID);
  });
});

describe("closestNodes — Kademlia's lookup contact list", () => {
  it("returns the 3 nearest nodes to target 10, closest first", () => {
    expect(closestNodes(10, NODE_IDS, 3)).toEqual([9, 13, 3]);
  });

  it("returns the 2 nearest nodes to target 1", () => {
    expect(closestNodes(1, NODE_IDS, 2)).toEqual([0, 3]);
  });

  it("a node is its own single closest match", () => {
    expect(closestNodes(9, NODE_IDS, 1)).toEqual([9]);
  });

  it("k equal to the full list length returns every node sorted by distance", () => {
    expect(closestNodes(10, NODE_IDS, NODE_IDS.length)).toHaveLength(NODE_IDS.length);
  });
});
