import { describe, expect, it } from "vitest";
import {
  REAL_VALUE,
  INITIAL_STATE,
  TARGET_GAP,
  discriminate,
  trainStep,
  trainEpochs,
  confusionGap,
} from "@/lib/math-core/gans";

describe("initial state: an untrained discriminator and generator", () => {
  it("does not already fool the discriminator (the checkpoint requires real progress)", () => {
    expect(confusionGap(INITIAL_STATE)).toBeGreaterThan(TARGET_GAP);
  });

  it("the discriminator starts out unsure about the real point (w,c chosen near zero)", () => {
    expect(discriminate(INITIAL_STATE, REAL_VALUE)).toBeCloseTo(0.5, 10);
  });
});

describe("adversarial training: generator chases the real value, discriminator chases the generator", () => {
  it("after 50 epochs, the generator has moved away from 0 toward the real value", () => {
    const trained = trainEpochs(INITIAL_STATE, 50);
    expect(trained.g).toBeGreaterThan(0);
    expect(trained.g).toBeLessThan(REAL_VALUE);
  });

  it("matches the hand-traced state after 450 epochs", () => {
    const trained = trainEpochs(INITIAL_STATE, 450);
    expect(trained.g).toBeCloseTo(4.9472, 3);
    expect(trained.w).toBeCloseTo(0.8247, 3);
    expect(trained.c).toBeCloseTo(-4.0837, 3);
  });

  it("at 450 epochs, the discriminator can no longer tell real from fake apart — the confusion gap is tiny", () => {
    const trained = trainEpochs(INITIAL_STATE, 450);
    expect(confusionGap(trained)).toBeLessThan(TARGET_GAP);
    expect(discriminate(trained, REAL_VALUE)).toBeCloseTo(0.51, 2);
    expect(discriminate(trained, trained.g)).toBeCloseTo(0.5, 2);
  });

  it("the generator's output overshoots past the real value later in training — GANs don't settle cleanly", () => {
    const trained = trainEpochs(INITIAL_STATE, 600);
    expect(trained.g).toBeGreaterThan(REAL_VALUE);
  });

  it("a single trainStep is deterministic and composes with trainEpochs", () => {
    let manual = INITIAL_STATE;
    for (let i = 0; i < 10; i++) manual = trainStep(manual);
    const viaEpochs = trainEpochs(INITIAL_STATE, 10);
    expect(manual).toEqual(viaEpochs);
  });
});
