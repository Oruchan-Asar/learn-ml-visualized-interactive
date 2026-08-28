import { describe, it, expect } from "vitest";
import {
  DEPTH,
  FAN_IN,
  SAMPLE_LAYERS,
  LOSS_SCALE,
  HEALTHY_FLOOR,
  UNSAFE_UPDATE_THRESHOLD,
  WEIGHT_BOUND,
  WEIGHT_GROWTH_PER_STEP,
  DECAY_LAMBDA,
  TRAINING_STEPS,
  W0,
  gradientMagnitudes,
  sampledGradientMagnitudes,
  step0UpdateSize,
  weightAfterSteps,
  isHealthy,
  type Toggles,
} from "@/lib/math-core/capstone-stabilize-deep-network";
import { warmupCosineLR, constantLR, BASE_LR } from "@/lib/math-core/learning-rate-schedules";

const ALL_ON: Toggles = { normalize: true, lossScaling: true, warmup: true, weightDecay: true };

describe("sanity: the network shape and sampling grid match what the demo shows", () => {
  it("20 layers, 4-wide, sampled at layers 0, 5, 10, 15, 20", () => {
    expect(DEPTH).toBe(20);
    expect(FAN_IN).toBe(4);
    expect(SAMPLE_LAYERS).toEqual([0, 5, 10, 15, 20]);
  });

  it("the incoming loss gradient is fixed at RMS 1 by construction, with or without normalization", () => {
    expect(gradientMagnitudes(false)[DEPTH]).toBe(1);
    expect(gradientMagnitudes(true)[DEPTH]).toBe(1);
  });
});

describe("without normalization, the gradient reaching the input has truly vanished", () => {
  it("gradientMagnitudes(false)[0] is many orders of magnitude below the healthy floor", () => {
    // Confirms the fix: this must be computed with no epsilon floor, or it would never be
    // able to read below sqrt(rmsnorm's EPS) ~ 0.00316, masking the vanishing behavior entirely.
    expect(gradientMagnitudes(false)[0]).toBeGreaterThan(0);
    expect(gradientMagnitudes(false)[0]).toBeLessThan(1e-5);
    expect(gradientMagnitudes(false)[0]).toBeLessThan(HEALTHY_FLOOR);
  });

  it("hand-computed: it is close to 1.0494e-7", () => {
    expect(gradientMagnitudes(false)[0]).toBeCloseTo(1.0493548425224e-7, 18);
  });
});

describe("normalization keeps the gradient at a healthy scale all the way back to the input", () => {
  it("gradientMagnitudes(true)[0] clears the healthy floor by a wide margin", () => {
    expect(gradientMagnitudes(true)[0]).toBeGreaterThan(HEALTHY_FLOOR);
    expect(gradientMagnitudes(true)[0]).toBeCloseTo(0.7380345409162, 10);
  });

  it("normalization alone is a roughly six-order-of-magnitude rescue at the input layer", () => {
    expect(gradientMagnitudes(true)[0] / gradientMagnitudes(false)[0]).toBeGreaterThan(1e6);
  });
});

describe("fp16 storage: loss scaling rescues a gradient from total underflow, but can't fix vanishing on its own", () => {
  it("without loss scaling, the already-vanished input gradient stores as exactly 0 in the toy fp16 format", () => {
    expect(sampledGradientMagnitudes(false, false)[0]).toBe(0);
  });

  it("with loss scaling, that same gradient survives storage as a tiny but nonzero value", () => {
    const rescued = sampledGradientMagnitudes(false, true)[0];
    expect(rescued).toBeGreaterThan(0);
    expect(rescued).toBeCloseTo(gradientMagnitudes(false)[0], 6);
  });

  it("rescuing it from zero still leaves it far below the healthy floor -- loss scaling isn't a fix by itself", () => {
    expect(sampledGradientMagnitudes(false, true)[0]).toBeLessThan(HEALTHY_FLOOR);
  });

  it("once normalization already keeps the gradient large, loss scaling changes almost nothing", () => {
    const withoutScaling = sampledGradientMagnitudes(true, false)[0];
    const withScaling = sampledGradientMagnitudes(true, true)[0];
    expect(withoutScaling).toBeGreaterThan(HEALTHY_FLOOR);
    expect(withScaling).toBeGreaterThan(HEALTHY_FLOOR);
    expect(withScaling).toBeCloseTo(withoutScaling, 2);
  });

  it("LOSS_SCALE is large enough to lift the vanished gradient above the toy format's underflow floor", () => {
    expect(gradientMagnitudes(false)[0] * LOSS_SCALE).toBeGreaterThan(1e-4);
  });
});

describe("LR warmup keeps the very first update at exactly zero, regardless of gradient size", () => {
  it("warmupCosineLR(0) is 0, so step0UpdateSize(true, ...) is 0 for any gradient magnitude", () => {
    expect(warmupCosineLR(0)).toBe(0);
    expect(step0UpdateSize(true, 123.45)).toBe(0);
    expect(step0UpdateSize(true, gradientMagnitudes(true)[0])).toBe(0);
  });

  it("without warmup, step 0 uses the full base LR and blows past the unsafe-update threshold on a healthy gradient", () => {
    expect(constantLR(0)).toBe(BASE_LR);
    const update = step0UpdateSize(false, gradientMagnitudes(true)[0]);
    expect(update).toBeCloseTo(1.2 * gradientMagnitudes(true)[0], 10);
    expect(update).toBeGreaterThan(UNSAFE_UPDATE_THRESHOLD);
  });

  it("hand computation: step0UpdateSize(false, 0.5) is exactly 0.6", () => {
    expect(step0UpdateSize(false, 0.5)).toBeCloseTo(0.6, 10);
  });
});

describe("decoupled weight decay keeps the weight bounded over training; without it, growth is unchecked", () => {
  it("each step without decay grows the weight by exactly WEIGHT_GROWTH_PER_STEP", () => {
    expect(weightAfterSteps(false)).toBeCloseTo(W0 * Math.pow(1 + WEIGHT_GROWTH_PER_STEP, TRAINING_STEPS), 8);
  });

  it("with decay, growth is (1.05) followed by a shrink of (1 - LR*lambda) = 0.95 every step", () => {
    const perStepFactor = (1 + WEIGHT_GROWTH_PER_STEP) * (1 - 0.1 * DECAY_LAMBDA);
    expect(weightAfterSteps(true)).toBeCloseTo(W0 * Math.pow(perStepFactor, TRAINING_STEPS), 8);
  });

  it("after 50 steps, unchecked growth blows past the weight bound; decoupled decay keeps it comfortably under", () => {
    expect(weightAfterSteps(false)).toBeGreaterThan(WEIGHT_BOUND);
    expect(weightAfterSteps(true)).toBeLessThan(WEIGHT_BOUND);
  });
});

describe("isHealthy requires normalization, warmup, and weight decay together", () => {
  it("all four fixes on: healthy", () => {
    expect(isHealthy(ALL_ON)).toBe(true);
  });

  it("loss scaling toggled off alone doesn't break health, because normalization already keeps the gradient large", () => {
    expect(isHealthy({ ...ALL_ON, lossScaling: false })).toBe(true);
  });

  it("dropping normalization, warmup, or weight decay alone breaks health", () => {
    expect(isHealthy({ ...ALL_ON, normalize: false })).toBe(false);
    expect(isHealthy({ ...ALL_ON, warmup: false })).toBe(false);
    expect(isHealthy({ ...ALL_ON, weightDecay: false })).toBe(false);
  });

  it("every fix off: unhealthy", () => {
    expect(isHealthy({ normalize: false, lossScaling: false, warmup: false, weightDecay: false })).toBe(false);
  });
});
