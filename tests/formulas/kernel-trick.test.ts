import { describe, it, expect } from "vitest";
import {
  KERNEL_POINTS,
  KERNEL_DOMAIN,
  LIFTED_POINTS,
  liftedFeature,
  classificationAccuracy,
  liftedAccuracy,
} from "@/lib/math-core/kernel-trick";

describe("the raw 2D data is not linearly separable", () => {
  it("no line (in the yLeft/yRight family, searched on a fine grid) exceeds 68.75% accuracy", () => {
    let best = 0;
    for (let yl = -6; yl <= 6; yl += 0.25) {
      for (let yr = -6; yr <= 6; yr += 0.25) {
        const acc = classificationAccuracy(KERNEL_POINTS, yl, yr, KERNEL_DOMAIN);
        if (acc > best) best = acc;
      }
    }
    expect(best).toBeCloseTo(11 / 16, 6);
  });

  it("the steep line from (xMin,-6) to (xMax,0.8) achieves that ceiling — 11 of 16 points, confirmed by direct search", () => {
    expect(classificationAccuracy(KERNEL_POINTS, -6, 0.8, KERNEL_DOMAIN)).toBeCloseTo(11 / 16, 10);
  });
});

describe("liftedFeature is exactly the squared radius, r^2 = x^2 + y^2", () => {
  it("every inner-ring point has z equal to 1.8^2 or 2.2^2 (3.24 or 4.84), regardless of angle", () => {
    const innerZs = KERNEL_POINTS.filter((p) => p.label === "A").map(liftedFeature);
    expect(new Set(innerZs.map((z) => Math.round(z * 100) / 100))).toEqual(new Set([3.24, 4.84]));
  });

  it("every outer-ring point has z equal to 4.7^2 or 5.3^2 (22.09 or 28.09)", () => {
    const outerZs = KERNEL_POINTS.filter((p) => p.label === "B").map(liftedFeature);
    expect(new Set(outerZs.map((z) => Math.round(z * 100) / 100))).toEqual(new Set([22.09, 28.09]));
  });

  it("the largest inner z is still far below the smallest outer z — a clean gap for a threshold", () => {
    const maxInner = Math.max(...KERNEL_POINTS.filter((p) => p.label === "A").map(liftedFeature));
    const minOuter = Math.min(...KERNEL_POINTS.filter((p) => p.label === "B").map(liftedFeature));
    expect(maxInner).toBeLessThan(minOuter);
    expect(maxInner).toBeCloseTo(4.84, 4);
    expect(minOuter).toBeCloseTo(22.09, 4);
  });
});

describe("in the lifted 1D space, a single threshold separates perfectly", () => {
  it("any threshold between 4.84 and 22.09 reaches 100% accuracy", () => {
    for (const threshold of [5, 10, 13.465, 20, 22]) {
      expect(liftedAccuracy(LIFTED_POINTS, threshold)).toBeCloseTo(1, 10);
    }
  });

  it("a threshold placed inside the inner cluster (e.g. 4) fails to separate", () => {
    expect(liftedAccuracy(LIFTED_POINTS, 4)).toBeLessThan(1);
  });
});
