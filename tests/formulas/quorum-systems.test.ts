import { describe, it, expect } from "vitest";
import {
  CLUSTER_SIZE,
  overlapMargin,
  quorumsOverlap,
  minWriteQuorumFor,
  isValidQuorumSize,
} from "@/lib/math-core/quorum-systems";

describe("overlapMargin / quorumsOverlap on the worked example (N=5, R=3, W=3)", () => {
  it("computes a margin of exactly 1", () => {
    expect(overlapMargin(CLUSTER_SIZE, 3, 3)).toBe(1);
  });

  it("guarantees overlap when R+W > N", () => {
    expect(quorumsOverlap(CLUSTER_SIZE, 3, 3)).toBe(true);
  });

  it("does not guarantee overlap when R+W <= N", () => {
    expect(overlapMargin(CLUSTER_SIZE, 2, 2)).toBe(-1);
    expect(quorumsOverlap(CLUSTER_SIZE, 2, 2)).toBe(false);
  });

  it("is a boundary case (margin 0) precisely when R+W == N — not guaranteed", () => {
    expect(overlapMargin(5, 2, 3)).toBe(0);
    expect(quorumsOverlap(5, 2, 3)).toBe(false);
  });
});

describe("minWriteQuorumFor", () => {
  it("matches the worked example: N=5, R=3 needs W>=3", () => {
    expect(minWriteQuorumFor(5, 3)).toBe(3);
  });

  it("a smaller read quorum needs a larger write quorum to compensate", () => {
    expect(minWriteQuorumFor(5, 1)).toBe(5);
  });

  it("the minimum write quorum it returns always actually guarantees overlap", () => {
    const n = 7;
    const r = 4;
    const w = minWriteQuorumFor(n, r);
    expect(quorumsOverlap(n, r, w)).toBe(true);
    expect(quorumsOverlap(n, r, w - 1)).toBe(false);
  });
});

describe("isValidQuorumSize", () => {
  it("accepts sizes from 1 to N", () => {
    expect(isValidQuorumSize(5, 1)).toBe(true);
    expect(isValidQuorumSize(5, 5)).toBe(true);
  });

  it("rejects 0, negative, non-integer, and above-N sizes", () => {
    expect(isValidQuorumSize(5, 0)).toBe(false);
    expect(isValidQuorumSize(5, -1)).toBe(false);
    expect(isValidQuorumSize(5, 2.5)).toBe(false);
    expect(isValidQuorumSize(5, 6)).toBe(false);
  });
});
