import { describe, it, expect } from "vitest";
import {
  projectedSigma,
  gaussianWeight,
  alphaAt,
  sortByDepth,
  rasterizePixel,
  blendOverBackground,
  squaredErrorLoss,
  opacityGradient,
  gradientDescentStep,
  NEAR_GAUSSIAN,
  FAR_GAUSSIAN,
  TRAIN_COLOR,
  TRAIN_TARGET,
  TRAIN_INITIAL_OPACITY,
  CHECKPOINT_TARGET_OPACITY,
} from "@/lib/math-core/rasterization-and-optimization-in-3dgs";

describe("projectedSigma", () => {
  it("halves when depth doubles — farther Gaussians shrink on screen", () => {
    expect(projectedSigma(0.5, 100, 10)).toBeCloseTo(5, 10);
    expect(projectedSigma(0.5, 100, 20)).toBeCloseTo(2.5, 10);
  });
});

describe("depth-sorted compositing — near occludes far", () => {
  it("sorts nearest-first by depth", () => {
    const sorted = sortByDepth([FAR_GAUSSIAN, NEAR_GAUSSIAN]);
    expect(sorted.map((g) => g.depth)).toEqual([5, 10]);
  });

  it("compositing near-to-far makes the composited pixel mostly red", () => {
    const sorted = sortByDepth([FAR_GAUSSIAN, NEAR_GAUSSIAN]);
    const { color, contributions } = rasterizePixel(0, 0, sorted);
    // both Gaussians sit exactly at the query pixel, so weight = 1 for each
    expect(contributions[0]).toBeCloseTo(0.5, 10); // near: opacity 0.5 * weight 1
    expect(contributions[1]).toBeCloseTo(0.45, 10); // far: (1-0.5) * 0.9 * weight 1
    expect(color.r).toBeCloseTo(0.5, 10);
    expect(color.b).toBeCloseTo(0.45, 10);
  });

  it("compositing in the wrong (far-to-near) order gives a completely different pixel", () => {
    const wrongOrder = rasterizePixel(0, 0, [FAR_GAUSSIAN, NEAR_GAUSSIAN]);
    const rightOrder = rasterizePixel(0, 0, sortByDepth([FAR_GAUSSIAN, NEAR_GAUSSIAN]));
    expect(wrongOrder.color.r).not.toBeCloseTo(rightOrder.color.r, 3);
    expect(wrongOrder.color.b).not.toBeCloseTo(rightOrder.color.b, 3);
  });
});

describe("gaussianWeight / alphaAt", () => {
  it("weight is 1 exactly at the projected center regardless of sigma", () => {
    expect(gaussianWeight(0, 0, NEAR_GAUSSIAN)).toBeCloseTo(1, 10);
  });

  it("alpha is opacity times weight", () => {
    expect(alphaAt(0, 0, NEAR_GAUSSIAN)).toBeCloseTo(0.5, 10);
  });
});

describe("gradient-descent step on opacity — hand-worked", () => {
  it("loss at the initial opacity 0.5 is 0.18", () => {
    const rendered = blendOverBackground(TRAIN_INITIAL_OPACITY, TRAIN_COLOR);
    expect(rendered).toEqual({ r: 1, g: 0.5, b: 0.5 });
    expect(squaredErrorLoss(rendered, TRAIN_TARGET)).toBeCloseTo(0.18, 10);
  });

  it("the gradient at opacity 0.5 is exactly -1.2", () => {
    const grad = opacityGradient(TRAIN_INITIAL_OPACITY, TRAIN_COLOR, TRAIN_TARGET);
    expect(grad).toBeCloseTo(-1.2, 10);
  });

  it("one step with lr=0.1 moves opacity from 0.5 to 0.62 and lowers the loss", () => {
    const grad = opacityGradient(TRAIN_INITIAL_OPACITY, TRAIN_COLOR, TRAIN_TARGET);
    const next = gradientDescentStep(TRAIN_INITIAL_OPACITY, grad, 0.1);
    expect(next).toBeCloseTo(0.62, 10);

    const newLoss = squaredErrorLoss(blendOverBackground(next, TRAIN_COLOR), TRAIN_TARGET);
    const oldLoss = squaredErrorLoss(blendOverBackground(TRAIN_INITIAL_OPACITY, TRAIN_COLOR), TRAIN_TARGET);
    expect(newLoss).toBeLessThan(oldLoss);
  });

  it("checkpoint: lr=0.25 drives one step to the checkpoint target opacity 0.8", () => {
    const grad = opacityGradient(TRAIN_INITIAL_OPACITY, TRAIN_COLOR, TRAIN_TARGET);
    const next = gradientDescentStep(TRAIN_INITIAL_OPACITY, grad, 0.25);
    expect(next).toBeCloseTo(CHECKPOINT_TARGET_OPACITY, 10);
  });
});
