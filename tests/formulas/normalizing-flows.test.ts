import { describe, it, expect } from "vitest";
import { flowForward, flowInverse, flowDerivative, transformedDensity, CHECKPOINT_CANDIDATES } from "@/lib/math-core/normalizing-flows";

describe("flowForward / flowInverse", () => {
  it("are exact inverses of each other on (0, 1]", () => {
    for (const z of [0.1, 0.3, 0.5, 0.8, 1]) {
      expect(flowInverse(flowForward(z))).toBeCloseTo(z, 10);
    }
  });

  it("matches z² exactly", () => {
    expect(flowForward(0.5)).toBe(0.25);
    expect(flowForward(0.2)).toBeCloseTo(0.04, 10);
  });
});

describe("flowDerivative", () => {
  it("equals 2z exactly", () => {
    expect(flowDerivative(0.5)).toBe(1);
    expect(flowDerivative(0.2)).toBeCloseTo(0.4, 10);
  });
});

describe("transformedDensity", () => {
  it("matches the hand-computed values at the four checkpoint candidates", () => {
    expect(transformedDensity(0.04)).toBeCloseTo(2.5, 10);
    expect(transformedDensity(0.16)).toBeCloseTo(1.25, 10);
    expect(transformedDensity(0.36)).toBeCloseTo(5 / 6, 10);
    expect(transformedDensity(0.64)).toBeCloseTo(0.625, 10);
  });

  it("matches the hand-computed value at x = 0.25 exactly (the flow is volume-preserving there)", () => {
    expect(transformedDensity(0.25)).toBeCloseTo(1, 10);
  });

  it("is strictly decreasing as x increases from 0 to 1 — density concentrates near 0", () => {
    const sorted = [...CHECKPOINT_CANDIDATES].sort((a, b) => a - b);
    const densities = sorted.map(transformedDensity);
    for (let i = 1; i < densities.length; i++) {
      expect(densities[i]).toBeLessThan(densities[i - 1]);
    }
  });

  it("integrates to (approximately) 1 over (0, 1] — probability mass is conserved by the flow", () => {
    const steps = 200000;
    let total = 0;
    for (let i = 0; i < steps; i++) {
      const x = (i + 0.5) / steps;
      total += transformedDensity(x) / steps;
    }
    expect(total).toBeCloseTo(1, 2);
  });
});
