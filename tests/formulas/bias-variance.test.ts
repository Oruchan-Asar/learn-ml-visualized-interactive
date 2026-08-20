import { describe, it, expect } from "vitest";
import {
  X_POINTS,
  MAX_DEGREE,
  trueFunction,
  polyFit,
  evalPoly,
  solveLinearSystem,
  biasVarianceAtDegree,
  fitAllDatasets,
} from "@/lib/math-core/bias-variance";

describe("solveLinearSystem", () => {
  it("solves a simple 2x2 system by hand: 2x+y=5, x+3y=10 -> x=1, y=3", () => {
    const [x, y] = solveLinearSystem(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    );
    expect(x).toBeCloseTo(1, 10);
    expect(y).toBeCloseTo(3, 10);
  });
});

describe("polyFit reproduces exact values for simple cases", () => {
  it("degree 0 gives the mean of the ys", () => {
    const ys = [1, 2, 3, 4, 5];
    const [c0] = polyFit(X_POINTS, ys, 0);
    expect(c0).toBeCloseTo(3, 10);
  });

  it("degree 4 (5 points, degree-4 polynomial) interpolates every point exactly", () => {
    const ys = X_POINTS.map((x) => trueFunction(x) + [0.6, -0.4, 0.3, -0.5, 0.4][X_POINTS.indexOf(x)]);
    const coeffs = polyFit(X_POINTS, ys, 4);
    X_POINTS.forEach((x, i) => {
      expect(evalPoly(coeffs, x)).toBeCloseTo(ys[i], 6);
    });
  });
});

describe("bias-variance decomposition across degrees matches direct simulation", () => {
  it("bias² is exactly 3.3 at degree 0 and 2.8 at degree 1 — neither can capture the curvature", () => {
    expect(biasVarianceAtDegree(0).biasSquared).toBeCloseTo(3.3, 10);
    expect(biasVarianceAtDegree(1).biasSquared).toBeCloseTo(2.8, 10);
  });

  it("bias² is ~0 from degree 2 onward — the true function is exactly quadratic", () => {
    expect(biasVarianceAtDegree(2).biasSquared).toBeCloseTo(0, 6);
    expect(biasVarianceAtDegree(3).biasSquared).toBeCloseTo(0, 6);
    expect(biasVarianceAtDegree(4).biasSquared).toBeCloseTo(0, 6);
  });

  it("variance increases monotonically with degree", () => {
    let prevVariance = -Infinity;
    for (let degree = 0; degree <= MAX_DEGREE; degree++) {
      const { variance } = biasVarianceAtDegree(degree);
      expect(variance).toBeGreaterThan(prevVariance);
      prevVariance = variance;
    }
  });

  it("total error is U-shaped, minimized at degree 2 (matching the true function's shape)", () => {
    const totals = Array.from({ length: MAX_DEGREE + 1 }, (_, d) => biasVarianceAtDegree(d).total);
    const minIndex = totals.indexOf(Math.min(...totals));
    expect(minIndex).toBe(2);
    expect(totals[1]).toBeGreaterThan(totals[2]);
    expect(totals[3]).toBeGreaterThan(totals[2]);
  });
});

describe("fitAllDatasets produces 6 fits per degree", () => {
  it("returns one coefficient array per noise realization", () => {
    expect(fitAllDatasets(2)).toHaveLength(6);
    expect(fitAllDatasets(2)[0]).toHaveLength(3);
  });
});
