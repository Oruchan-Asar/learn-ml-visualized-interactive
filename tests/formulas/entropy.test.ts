import { describe, it, expect } from "vitest";
import { entropy } from "@/lib/math-core/entropy";

describe("entropy", () => {
  it("is exactly 1 bit for a fair coin", () => {
    expect(entropy([0.5, 0.5])).toBeCloseTo(1);
  });

  it("is exactly 0 for a certain outcome", () => {
    expect(entropy([1, 0])).toBeCloseTo(0);
    expect(entropy([0, 0, 1, 0])).toBeCloseTo(0);
  });

  it("is exactly log2(N) for a uniform distribution over N outcomes", () => {
    expect(entropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(2);
    expect(entropy([1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8])).toBeCloseTo(3);
  });

  it("matches the worked example: P=(0.5,0.25,0.125,0.125) → 1.75 bits", () => {
    expect(entropy([0.5, 0.25, 0.125, 0.125])).toBeCloseTo(1.75);
  });

  it("is maximized by the uniform distribution among distributions over the same outcomes", () => {
    const uniform = entropy([0.25, 0.25, 0.25, 0.25]);
    const skewed = entropy([0.7, 0.1, 0.1, 0.1]);
    expect(uniform).toBeGreaterThan(skewed);
  });

  it("is close to 0.5 bits at the checkpoint-adjacent skew (0.11, 0.89)", () => {
    expect(entropy([0.11, 0.89])).toBeCloseTo(0.5, 1);
  });
});
