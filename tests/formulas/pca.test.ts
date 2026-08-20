import { describe, it, expect } from "vitest";
import { PCA_POINTS, TRUE_DIRECTION, MAX_VARIANCE, projectedVariance, projectedPoints } from "@/lib/math-core/pca";

describe("the dataset is pre-centered", () => {
  it("has mean exactly (0,0)", () => {
    const mx = PCA_POINTS.reduce((s, p) => s + p.x, 0) / PCA_POINTS.length;
    const my = PCA_POINTS.reduce((s, p) => s + p.y, 0) / PCA_POINTS.length;
    expect(mx).toBeCloseTo(0, 10);
    expect(my).toBeCloseTo(0, 10);
  });
});

describe("projectedVariance is maximized exactly at the true direction (0.6, 0.8)", () => {
  it("equals 4 along the true direction — the along-axis variance by hand construction", () => {
    expect(MAX_VARIANCE).toBeCloseTo(4, 10);
    expect(projectedVariance(PCA_POINTS, TRUE_DIRECTION.x, TRUE_DIRECTION.y)).toBeCloseTo(4, 10);
  });

  it("equals 4/7 along the perpendicular direction (-0.8, 0.6)", () => {
    expect(projectedVariance(PCA_POINTS, -0.8, 0.6)).toBeCloseTo(4 / 7, 10);
  });

  it("is invariant to the direction vector's length — only its angle matters", () => {
    expect(projectedVariance(PCA_POINTS, 3, 4)).toBeCloseTo(MAX_VARIANCE, 10);
    expect(projectedVariance(PCA_POINTS, 0.06, 0.08)).toBeCloseTo(MAX_VARIANCE, 10);
  });

  it("is the same for the direction and its exact opposite (same line, either pole)", () => {
    expect(projectedVariance(PCA_POINTS, -0.6, -0.8)).toBeCloseTo(MAX_VARIANCE, 10);
  });

  it("no angle in a fine grid search beats the true direction", () => {
    let best = 0;
    for (let deg = 0; deg < 180; deg += 0.5) {
      const rad = (deg * Math.PI) / 180;
      const v = projectedVariance(PCA_POINTS, Math.cos(rad), Math.sin(rad));
      if (v > best) best = v;
    }
    expect(best).toBeCloseTo(MAX_VARIANCE, 2);
  });
});

describe("projectedPoints places each point on the direction's line", () => {
  it("lands every projected point exactly on the line y = (4/3)x when direction is (0.6, 0.8)", () => {
    const projected = projectedPoints(PCA_POINTS, TRUE_DIRECTION.x, TRUE_DIRECTION.y);
    for (const p of projected) {
      if (Math.abs(p.x) > 1e-9) expect(p.y / p.x).toBeCloseTo(0.8 / 0.6, 6);
    }
  });

  it("the signed spread along the line is larger for the true direction than the perpendicular one", () => {
    // Each projected point is t*(ux,uy) for some signed scalar t — recover t by dividing by ux (nonzero for both directions here).
    const signedScalar = (dx: number, dy: number) => {
      const norm = Math.hypot(dx, dy);
      const ux = dx / norm;
      return projectedPoints(PCA_POINTS, dx, dy).map((p) => p.x / ux);
    };
    const spread = (arr: number[]) => Math.max(...arr) - Math.min(...arr);
    expect(spread(signedScalar(0.6, 0.8))).toBeGreaterThan(spread(signedScalar(-0.8, 0.6)));
  });
});
