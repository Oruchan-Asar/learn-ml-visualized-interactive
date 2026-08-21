import { describe, it, expect } from "vitest";
import {
  evaluateAnchor,
  ANCHOR_SINGLE,
  ANCHOR_CONJUNCTION,
  ANCHOR_LOOSE_SINGLE,
  ANCHOR_LOOSE_CONJUNCTION,
  ANCHOR_TIGHT_CONJUNCTION,
  PRECISION_THRESHOLD,
} from "@/lib/math-core/anchors-rule-based-explanations";

describe("anchors-rule-based-explanations", () => {
  it("the single-condition rule has broad coverage but unreliable precision", () => {
    const stats = evaluateAnchor(ANCHOR_SINGLE);
    expect(stats.nSatisfying).toBe(21);
    expect(stats.nMatching).toBe(9);
    expect(stats.precision).toBeCloseTo(0.42857142857142855, 12);
    expect(stats.coverage).toBeCloseTo(0.42857142857142855, 12);
    expect(stats.precision).toBeLessThan(PRECISION_THRESHOLD);
  });

  it("the conjunction rule is perfectly precise but covers a smaller slice of the space", () => {
    const stats = evaluateAnchor(ANCHOR_CONJUNCTION);
    expect(stats.nSatisfying).toBe(9);
    expect(stats.nMatching).toBe(9);
    expect(stats.precision).toBe(1);
    expect(stats.coverage).toBeCloseTo(0.1836734693877551, 12);
    expect(stats.precision).toBeGreaterThanOrEqual(PRECISION_THRESHOLD);
  });

  it("the conjunction trades coverage for precision relative to the single-condition rule", () => {
    const single = evaluateAnchor(ANCHOR_SINGLE);
    const conjunction = evaluateAnchor(ANCHOR_CONJUNCTION);
    expect(conjunction.precision).toBeGreaterThan(single.precision);
    expect(conjunction.coverage).toBeLessThan(single.coverage);
  });

  describe("the checkpoint's three unseen candidates", () => {
    it("a looser single condition (x2 > 0) is even less precise than x1 > 3", () => {
      const stats = evaluateAnchor(ANCHOR_LOOSE_SINGLE);
      expect(stats.nSatisfying).toBe(42);
      expect(stats.nMatching).toBe(9);
      expect(stats.precision).toBeCloseTo(0.21428571428571427, 12);
      expect(stats.precision).toBeLessThan(PRECISION_THRESHOLD);
    });

    it("a conjunction with a loose second threshold (x2 > 2) still falls short of 0.95", () => {
      const stats = evaluateAnchor(ANCHOR_LOOSE_CONJUNCTION);
      expect(stats.nSatisfying).toBe(12);
      expect(stats.nMatching).toBe(9);
      expect(stats.precision).toBe(0.75);
      expect(stats.precision).toBeLessThan(PRECISION_THRESHOLD);
    });

    it("a tighter conjunction (x1 > 4 AND x2 > 4) is also a valid anchor — precision isn't unique to one rule", () => {
      const stats = evaluateAnchor(ANCHOR_TIGHT_CONJUNCTION);
      expect(stats.nSatisfying).toBe(4);
      expect(stats.nMatching).toBe(4);
      expect(stats.precision).toBe(1);
      expect(stats.precision).toBeGreaterThanOrEqual(PRECISION_THRESHOLD);
      expect(stats.coverage).toBeLessThan(evaluateAnchor(ANCHOR_CONJUNCTION).coverage);
    });
  });
});
