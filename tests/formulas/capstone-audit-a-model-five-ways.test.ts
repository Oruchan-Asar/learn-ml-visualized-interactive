import { describe, it, expect } from "vitest";
import { anchorsAudit, treeAudit, shapleyAudit, integratedGradientsAudit, pdpAudit, surrogate } from "@/lib/math-core/capstone-audit-a-model-five-ways";

describe("capstone-audit-a-model-five-ways", () => {
  it("anchors: the conjunction is perfectly precise, the single condition is not", () => {
    const { single, conjunction } = anchorsAudit();
    expect(single.precision).toBeCloseTo(0.42857142857142855, 12);
    expect(conjunction.precision).toBe(1);
  });

  it("tree importance: x1 wins the root by a tie-break, but x2's deeper split ends up MORE important overall", () => {
    const { root, rightSplit, raw } = treeAudit();
    expect(root.feature).toBe("x1");
    expect(rightSplit?.feature).toBe("x2");
    expect(rightSplit?.gain).toBeCloseTo(0.9852281360342515, 10);
    expect(raw.x2).toBeGreaterThan(raw.x1);
    expect(raw.x1).toBeCloseTo(0.26580699380511463, 10);
    expect(raw.x2).toBeCloseTo(0.4222406297289649, 10);
  });

  it("Shapley values: perfectly symmetric, splitting credit exactly 50/50", () => {
    const { shapleyX1, shapleyX2, v_both, v_none } = shapleyAudit();
    expect(shapleyX1).toBe(0.5);
    expect(shapleyX2).toBe(0.5);
    expect(v_both - v_none).toBe(1);
    expect(shapleyX1 + shapleyX2).toBe(v_both - v_none);
  });

  it("integrated gradients: also perfectly symmetric, and nearly reconstructs the true output delta", () => {
    const { ig1, ig2, sum, trueDelta } = integratedGradientsAudit();
    expect(ig1).toBeCloseTo(ig2, 12);
    expect(Math.abs(sum - trueDelta)).toBeLessThan(0.001);
  });

  it("partial dependence: the surrogate model's average prediction rises steadily as x1 sweeps up", () => {
    const pdp = pdpAudit();
    expect(pdp[0].avg).toBeCloseTo(0.0012363115783173872, 12);
    expect(pdp[6].avg).toBeCloseTo(0.49876368842168267, 10);
    expect(pdp[6].avg).toBeGreaterThan(pdp[0].avg);
  });

  it("four different methods can genuinely disagree about which feature matters more", () => {
    const tree = treeAudit();
    const shapley = shapleyAudit();
    // Tree importance favors x2; Shapley says they're exactly equal.
    expect(tree.raw.x2).toBeGreaterThan(tree.raw.x1);
    expect(shapley.shapleyX1).toBe(shapley.shapleyX2);
  });

  it("the smooth surrogate approximates the hard AND-boundary at the instance and baseline", () => {
    expect(surrogate(5, 5)).toBeGreaterThan(0.9);
    expect(surrogate(0, 0)).toBeLessThan(0.001);
  });
});
