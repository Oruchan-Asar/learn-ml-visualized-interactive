import { describe, it, expect } from "vitest";
import { evaluateAnchor, ANCHOR_SINGLE, ANCHOR_CONJUNCTION, PRECISION_THRESHOLD } from "@/lib/math-core/anchors-rule-based-explanations";

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
});
