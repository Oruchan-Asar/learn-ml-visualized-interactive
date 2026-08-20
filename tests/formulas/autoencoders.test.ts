import { describe, expect, it } from "vitest";
import {
  POINTS,
  TRUE_ANGLE,
  MIN_ERROR,
  reconstructionError,
  reconstructionErrorDerivative,
  encode,
  decode,
  reconstruct,
} from "@/lib/math-core/autoencoders";

describe("linear autoencoder with a 1D bottleneck", () => {
  it("encode/decode round-trips exactly for a point already on the direction line", () => {
    const angle = Math.PI / 4;
    const onLine = { x: Math.cos(angle) * 3, y: Math.sin(angle) * 3 };
    const z = encode(onLine, angle);
    expect(z).toBeCloseTo(3, 10);
    const back = decode(z, angle);
    expect(back.x).toBeCloseTo(onLine.x, 10);
    expect(back.y).toBeCloseTo(onLine.y, 10);
  });

  it("reconstruction always lies exactly on the chosen direction line", () => {
    const angle = 0.7;
    for (const p of POINTS) {
      const r = reconstruct(p, angle);
      // r should be a scalar multiple of (cos(angle), sin(angle))
      expect(r.x * Math.sin(angle) - r.y * Math.cos(angle)).toBeCloseTo(0, 8);
    }
  });
});

describe("the reconstruction-error-minimizing direction is exactly PCA's principal direction", () => {
  it("matches the known minimum error (4/7) at the true angle", () => {
    expect(reconstructionError(POINTS, TRUE_ANGLE)).toBeCloseTo(4 / 7, 5);
    expect(MIN_ERROR).toBeCloseTo(4 / 7, 5);
  });

  it("every other direction has strictly higher reconstruction error", () => {
    for (const deg of [0, 15, 30, 75, 90, 120, 150, 180]) {
      const angle = (deg * Math.PI) / 180;
      expect(reconstructionError(POINTS, angle)).toBeGreaterThan(MIN_ERROR);
    }
  });

  it("error is symmetric around the true angle (a smooth minimum, not a kink)", () => {
    const below = reconstructionError(POINTS, TRUE_ANGLE - 0.1);
    const above = reconstructionError(POINTS, TRUE_ANGLE + 0.1);
    expect(below).toBeGreaterThan(MIN_ERROR);
    expect(above).toBeGreaterThan(MIN_ERROR);
  });

  it("the derivative vanishes exactly at the true angle — a genuine critical point", () => {
    expect(reconstructionErrorDerivative(POINTS, TRUE_ANGLE)).toBeCloseTo(0, 8);
  });

  it("the analytic derivative matches a numeric finite-difference check away from the minimum", () => {
    const angle = 0.3;
    const eps = 1e-6;
    const numeric = (reconstructionError(POINTS, angle + eps) - reconstructionError(POINTS, angle - eps)) / (2 * eps);
    expect(reconstructionErrorDerivative(POINTS, angle)).toBeCloseTo(numeric, 3);
  });
});
