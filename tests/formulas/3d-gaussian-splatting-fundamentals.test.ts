import { describe, it, expect } from "vitest";
import {
  gaussianWeight,
  alphaAt,
  compositePixel,
  GAUSSIAN_A,
  GAUSSIAN_B,
  QUERY_PIXEL,
  CHECKPOINT_TARGET_ALPHA,
} from "@/lib/math-core/3d-gaussian-splatting-fundamentals";

describe("gaussianWeight", () => {
  it("is exactly 1 at the Gaussian's own center", () => {
    expect(gaussianWeight(GAUSSIAN_A.mu.x, GAUSSIAN_A.mu.y, GAUSSIAN_A)).toBeCloseTo(1, 10);
  });

  it("matches e^-0.125 at the query pixel, one sigma-scaled half-unit away", () => {
    expect(gaussianWeight(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A)).toBeCloseTo(Math.exp(-0.125), 10);
    expect(gaussianWeight(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A)).toBeCloseTo(0.8825, 3);
  });

  it("is symmetric: the query pixel is equally far (in sigma units) from both Gaussians' centers", () => {
    const wA = gaussianWeight(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A);
    const wB = gaussianWeight(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_B);
    expect(wA).toBeCloseTo(wB, 10);
  });
});

describe("alphaAt", () => {
  it("scales the falloff weight by the Gaussian's opacity", () => {
    expect(alphaAt(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A)).toBeCloseTo(0.6 * Math.exp(-0.125), 10);
    expect(alphaAt(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A)).toBeCloseTo(0.5295, 3);
  });
});

describe("compositePixel — hand-worked at the query pixel", () => {
  it("blends A (nearer, opacity 0.6) over B (farther, opacity 0.8) into mostly-red-and-blue", () => {
    const { color, contributions, alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, GAUSSIAN_B]);
    expect(contributions[0]).toBeCloseTo(0.5295, 3);
    expect(contributions[1]).toBeCloseTo(0.3322, 3);
    expect(color.r).toBeCloseTo(0.5295, 3);
    expect(color.g).toBeCloseTo(0, 10);
    expect(color.b).toBeCloseTo(0.3322, 3);
    expect(alpha).toBeCloseTo(0.8617, 3);
  });

  it("reversing the compositing order changes the result — depth order matters", () => {
    const forward = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, GAUSSIAN_B]);
    const reversed = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_B, GAUSSIAN_A]);
    expect(forward.color.r).not.toBeCloseTo(reversed.color.r, 3);
  });

  it("a single Gaussian's total alpha equals its own alpha at that point", () => {
    const { alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A]);
    expect(alpha).toBeCloseTo(alphaAt(QUERY_PIXEL.x, QUERY_PIXEL.y, GAUSSIAN_A), 10);
  });
});

describe("checkpoint target is reachable by raising Gaussian B's opacity", () => {
  it("opacity ~0.772 on B drives the composited pixel's total alpha to the checkpoint target", () => {
    const bBoosted = { ...GAUSSIAN_B, opacity: 0.771872 };
    const { alpha } = compositePixel(QUERY_PIXEL.x, QUERY_PIXEL.y, [GAUSSIAN_A, bBoosted]);
    expect(alpha).toBeCloseTo(CHECKPOINT_TARGET_ALPHA, 2);
  });
});
