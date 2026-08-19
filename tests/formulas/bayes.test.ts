import { describe, it, expect } from "vitest";
import { positiveRate, posterior } from "@/lib/math-core/bayes";

const SENSITIVITY = 0.9;
const FALSE_POSITIVE_RATE = 0.1;

describe("Bayes' rule", () => {
  it("matches the worked example: 1% base rate → ~8.33% posterior", () => {
    const p = posterior({ prior: 0.01, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(p).toBeCloseTo(0.0833, 3);
  });

  it("hits exactly 50% at the checkpoint's target base rate of 10%", () => {
    const p = posterior({ prior: 0.1, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(p).toBeCloseTo(0.5);
  });

  it("approaches the sensitivity as the base rate approaches 1", () => {
    const p = posterior({ prior: 0.999, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(p).toBeGreaterThan(0.98);
  });

  it("approaches the false positive rate as the base rate approaches 0", () => {
    const p = posterior({ prior: 0.0001, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(p).toBeLessThan(0.01);
  });

  it("positiveRate is a weighted mix of sensitivity and false positive rate", () => {
    const rate = positiveRate({ prior: 0.5, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(rate).toBeCloseTo((SENSITIVITY + FALSE_POSITIVE_RATE) / 2);
  });

  it("posterior increases monotonically with the base rate", () => {
    const low = posterior({ prior: 0.05, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    const high = posterior({ prior: 0.3, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
    expect(high).toBeGreaterThan(low);
  });
});
