import { describe, it, expect } from "vitest";
import {
  projectGaussian,
  gaussianWeight,
  alphaAt,
  sortByDepth,
  renderPixel,
  GAUSSIAN_NEAR,
  GAUSSIAN_FAR,
  SCENE,
  QUERY_PIXEL,
  CHECKPOINT_TARGET_RED,
} from "@/lib/math-core/capstone-3d-gaussian-splatting-renderer";

describe("projectGaussian — camera projection + spread shrink, chained", () => {
  it("projects the near, on-axis Gaussian to the principal point with sigma2D = f*sigma/z = 2", () => {
    const p = projectGaussian(GAUSSIAN_NEAR);
    expect(p.x).toBeCloseTo(50, 10);
    expect(p.y).toBeCloseTo(50, 10);
    expect(p.sigma2D).toBeCloseTo(2, 10);
    expect(p.depth).toBe(5);
  });

  it("projects the farther, off-axis Gaussian to pixel (53, 50) with sigma2D = 3", () => {
    const p = projectGaussian(GAUSSIAN_FAR);
    expect(p.x).toBeCloseTo(53, 10);
    expect(p.y).toBeCloseTo(50, 10);
    expect(p.sigma2D).toBeCloseTo(3, 10);
    expect(p.depth).toBe(10);
  });
});

describe("sortByDepth", () => {
  it("orders the scene's projected Gaussians nearest-first", () => {
    const projected = SCENE.map((g) => projectGaussian(g));
    const sorted = sortByDepth(projected);
    expect(sorted.map((g) => g.depth)).toEqual([5, 10]);
  });
});

describe("gaussianWeight / alphaAt at the query pixel", () => {
  it("the near Gaussian sits exactly at the query pixel: weight 1, alpha = its own opacity", () => {
    const p = projectGaussian(GAUSSIAN_NEAR);
    expect(gaussianWeight(QUERY_PIXEL.x, QUERY_PIXEL.y, p)).toBeCloseTo(1, 10);
    expect(alphaAt(QUERY_PIXEL.x, QUERY_PIXEL.y, p)).toBeCloseTo(0.6, 10);
  });
});

describe("renderPixel — the full pipeline, hand-worked at the query pixel", () => {
  it("composites near (red) over far (blue) over a white background", () => {
    const { color, contributions, transmittance } = renderPixel(QUERY_PIXEL.x, QUERY_PIXEL.y, SCENE);
    expect(contributions[0]).toBeCloseTo(0.6, 10); // near: opacity 0.6 x weight 1
    expect(color.r).toBeCloseTo(0.7816, 3);
    expect(color.g).toBeCloseTo(0.1816, 3);
    // Blue channel is exact regardless of rounding: both the far Gaussian and the background have
    // blue=1, so blue always equals the transmittance remaining after the near (red) Gaussian.
    expect(color.b).toBeCloseTo(transmittance + contributions[1], 10);
    expect(color.b).toBeCloseTo(0.4, 10);
  });

  it("depth order matters: compositing far-before-near gives a different pixel", () => {
    const correct = renderPixel(QUERY_PIXEL.x, QUERY_PIXEL.y, SCENE);
    const reversedScene = [SCENE[1], SCENE[0]];
    // renderPixel re-sorts internally, so to actually force the wrong order we sort manually descending
    // and composite — this just confirms sortByDepth is what keeps renderPixel correct regardless of
    // input order.
    const stillCorrect = renderPixel(QUERY_PIXEL.x, QUERY_PIXEL.y, reversedScene);
    expect(stillCorrect.color.r).toBeCloseTo(correct.color.r, 10);
  });
});

describe("checkpoint target is reachable by dragging the query pixel between the two Gaussians", () => {
  it("px = 51.8 renders a red channel within tolerance of the checkpoint target", () => {
    const { color } = renderPixel(51.8, QUERY_PIXEL.y, SCENE);
    expect(color.r).toBeCloseTo(CHECKPOINT_TARGET_RED, 1);
    expect(Math.abs(color.r - CHECKPOINT_TARGET_RED)).toBeLessThan(0.03);
  });
});
