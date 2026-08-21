import { describe, it, expect } from "vitest";
import { selectionRate, truePositiveRate, precision, baseRate, gap, METRICS, GROUP_A, GROUP_B } from "@/lib/math-core/fairness-metrics-and-bias-auditing";

describe("selectionRate", () => {
  it("matches the hand-computed rate for each group", () => {
    expect(selectionRate(GROUP_A)).toBeCloseTo(0.5, 10);
    expect(selectionRate(GROUP_B)).toBeCloseTo(0.4, 10);
  });
});

describe("truePositiveRate", () => {
  it("matches the hand-computed rate for each group", () => {
    expect(truePositiveRate(GROUP_A)).toBeCloseTo(0.8, 10);
    expect(truePositiveRate(GROUP_B)).toBeCloseTo(1.0, 10);
  });
});

describe("precision", () => {
  it("matches the hand-computed rate for each group", () => {
    expect(precision(GROUP_A)).toBeCloseTo(0.8, 10);
    expect(precision(GROUP_B)).toBeCloseTo(0.5, 10);
  });
});

describe("baseRate", () => {
  it("the two groups have genuinely different base rates — the root cause of the disagreement", () => {
    expect(baseRate(GROUP_A)).toBeCloseTo(0.5, 10);
    expect(baseRate(GROUP_B)).toBeCloseTo(0.2, 10);
    expect(baseRate(GROUP_A)).not.toBeCloseTo(baseRate(GROUP_B), 1);
  });
});

describe("gap", () => {
  it("matches the hand-computed gap for every metric", () => {
    const gaps = METRICS.map((m) => gap(m));
    expect(gaps[0]).toBeCloseTo(0.1, 10); // demographic parity: |0.5 - 0.4|
    expect(gaps[1]).toBeCloseTo(0.2, 10); // equal opportunity: |0.8 - 1.0|
    expect(gaps[2]).toBeCloseTo(0.3, 10); // predictive parity: |0.8 - 0.5|
  });

  it("all three metrics disagree — none of the gaps are zero", () => {
    for (const m of METRICS) {
      expect(gap(m)).toBeGreaterThan(0);
    }
  });

  it("predictive parity shows the largest disparity of the three metrics", () => {
    const gaps = METRICS.map((m) => ({ key: m.key, value: gap(m) }));
    const largest = gaps.reduce((max, g) => (g.value > max.value ? g : max));
    expect(largest.key).toBe("predictive_parity");
  });
});
