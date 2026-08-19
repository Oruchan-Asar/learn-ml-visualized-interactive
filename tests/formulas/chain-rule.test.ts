import { describe, it, expect } from "vitest";
import { f, g, h, hPrime, numericalHPrime } from "@/lib/math-core/chain-rule";

describe("chain rule on h(x) = g(f(x)) = (2x + 1)^2", () => {
  it("matches the hand-simplified closed form 8x + 4", () => {
    for (const x of [-2, -1, 0, 1, 2, 3, 4]) {
      expect(hPrime(x)).toBeCloseTo(8 * x + 4, 10);
    }
  });

  it("agrees with central-difference numerical differentiation", () => {
    for (const x of [-1.5, 0, 1, 2.5, 3.8]) {
      expect(hPrime(x)).toBeCloseTo(numericalHPrime(x), 3);
    }
  });

  it("matches the worked example at x = 1", () => {
    const u = f(1);
    expect(u).toBeCloseTo(3);
    expect(h(1)).toBeCloseTo(9);
    expect(hPrime(1)).toBeCloseTo(12);
  });

  it("has dh/dx = 20 exactly at the checkpoint's target, x = 2", () => {
    expect(hPrime(2)).toBeCloseTo(20);
    expect(g(f(2))).toBeCloseTo(25);
  });
});
