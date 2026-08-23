import { describe, it, expect } from "vitest";
import { ktoStep, fitKTO, KTO_EXAMPLES, THETA_INIT, simpoStep, fitSimPO, simpoReward, COMPARISONS } from "@/lib/math-core/advanced-preference-kto-simpo";

describe("KTO_EXAMPLES", () => {
  it("relabels DPO's 3 paired comparisons as 6 unpaired desirable/undesirable judgments", () => {
    expect(KTO_EXAMPLES).toHaveLength(6);
    expect(KTO_EXAMPLES[0]).toEqual({ arm: "B", desirable: true });
    expect(KTO_EXAMPLES[1]).toEqual({ arm: "A", desirable: false });
  });
});

describe("ktoStep", () => {
  it("matches the hand-computed first step exactly: at init, z=0 so sigma=0.5, delta = 0.5*0.5*0.5 = 0.125", () => {
    const next = ktoStep(THETA_INIT, "B", true);
    expect(next.B).toBeCloseTo(0.125, 10);
    expect(next.A).toBeCloseTo(0, 10);
    expect(next.C).toBeCloseTo(0, 10);
  });

  it("an undesirable label at init pushes the SAME magnitude in the opposite direction", () => {
    const next = ktoStep(THETA_INIT, "A", false);
    expect(next.A).toBeCloseTo(-0.125, 10);
  });

  it("unlike dpoStep, only the ONE named arm ever moves -- no second arm is touched", () => {
    const next = ktoStep({ A: 0.2, B: -0.1, C: 0.3 }, "B", true);
    expect(next.A).toBe(0.2);
    expect(next.C).toBe(0.3);
  });
});

describe("fitKTO", () => {
  it("matches the hand-computed trace for all 6 examples", () => {
    const trace = fitKTO(6);
    expect(trace).toHaveLength(7);
    expect(trace[1].B).toBeCloseTo(0.125, 8);
    expect(trace[2].A).toBeCloseTo(-0.12364298750588407, 8);
    expect(trace[4].C).toBeCloseTo(-0.12334729390925689, 8);
    expect(trace[6].A).toBeCloseTo(-0.24307073151046926, 8);
    expect(trace[6].B).toBeCloseTo(0.24626982262646624, 8);
    expect(trace[6].C).toBeCloseTo(0.005990293985549983, 8);
  });

  it("final ranking still favors B, matching what DPO found from the same underlying comparisons", () => {
    const final = fitKTO(6)[6];
    expect(final.B).toBeGreaterThan(final.C);
    expect(final.C).toBeGreaterThan(final.A);
  });
});

describe("simpoReward", () => {
  it("at init (uniform policy), every arm's implicit reward is beta * log(1/3) / its own length -- no reference model subtracted", () => {
    const logThird = Math.log(1 / 3);
    expect(simpoReward(THETA_INIT, "A")).toBeCloseTo((0.5 * logThird) / 4, 10);
    expect(simpoReward(THETA_INIT, "B")).toBeCloseTo((0.5 * logThird) / 2, 10);
  });

  it("the same log-probability normalized by a SHORTER length yields a more negative reward", () => {
    // B is shorter than A (length 2 vs 4), so dividing the same negative log-prob by a smaller
    // number makes it more negative.
    expect(simpoReward(THETA_INIT, "B")).toBeLessThan(simpoReward(THETA_INIT, "A"));
  });
});

describe("simpoStep / fitSimPO", () => {
  it("matches the hand-computed trace for all 3 comparisons", () => {
    const trace = fitSimPO(3);
    expect(trace).toHaveLength(4);
    expect(trace[0]).toEqual(THETA_INIT);
    expect(trace[1].B).toBeCloseTo(0.07595272672048767, 8);
    expect(trace[1].A).toBeCloseTo(-0.037976363360243834, 8);
    expect(trace[2].C).toBeCloseTo(-0.04936296364558674, 8);
    expect(trace[3].A).toBeCloseTo(-0.0746445615253977, 8);
    expect(trace[3].B).toBeCloseTo(0.14999717218886777, 8);
    expect(trace[3].C).toBeCloseTo(-0.0004720327587149284, 8);
  });

  it("runs one update per comparison, in COMPARISONS order", () => {
    const trace = fitSimPO(1);
    const [winner] = COMPARISONS[0];
    expect(trace[1][winner]).toBeGreaterThan(0);
  });
});
