import { describe, it, expect } from "vitest";
import { dpoStep, fitDPO, policy, THETA_INIT } from "@/lib/math-core/direct-preference-optimization";

describe("dpoStep", () => {
  it("matches the hand-computed first step exactly (h=0 since theta starts at the reference policy)", () => {
    const next = dpoStep(THETA_INIT, "B", "A");
    expect(next.A).toBeCloseTo(-0.125, 10);
    expect(next.B).toBeCloseTo(0.125, 10);
    expect(next.C).toBeCloseTo(0, 10);
  });
});

describe("fitDPO", () => {
  it("matches the hand-computed trace for all 3 comparisons", () => {
    const trace = fitDPO(3);
    expect(trace).toHaveLength(4);
    expect(trace[0]).toEqual(THETA_INIT);
    expect(trace[1].B).toBeCloseTo(0.125, 8);
    expect(trace[2].B).toBeCloseTo(0.2460950211, 6);
    expect(trace[2].C).toBeCloseTo(-0.1210950211, 6);
    expect(trace[3].A).toBeCloseTo(-0.2498779694, 6);
    expect(trace[3].C).toBeCloseTo(0.0037829484, 6);
  });

  it("the final policy ranks B highest, then C, then A — matching the preference data B>A, B>C, C>A", () => {
    const trace = fitDPO(3);
    const finalPolicy = policy(trace[trace.length - 1]);
    expect(finalPolicy.B).toBeGreaterThan(finalPolicy.C);
    expect(finalPolicy.C).toBeGreaterThan(finalPolicy.A);
  });

  it("A ends up with the lowest final theta of the three arms", () => {
    const trace = fitDPO(3);
    const final = trace[trace.length - 1];
    expect(final.A).toBeLessThan(final.B);
    expect(final.A).toBeLessThan(final.C);
  });
});
