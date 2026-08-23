import { describe, it, expect } from "vitest";
import { softmax, softmaxWithTemperature, argmax, BASE_LOGITS, CHECKPOINT_LOGITS } from "@/lib/math-core/multinomial-logistic-regression-and-softmax";

describe("softmax always produces a valid probability distribution", () => {
  it("sums to exactly 1 (within floating point)", () => {
    const probs = softmax(BASE_LOGITS);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("matches the hand-computed values for logits [2, 0, -1]", () => {
    const probs = softmax(BASE_LOGITS);
    expect(probs[0]).toBeCloseTo(0.8437947344813395, 8);
    expect(probs[1]).toBeCloseTo(0.11419519938459449, 8);
    expect(probs[2]).toBeCloseTo(0.04201006613406605, 8);
  });

  it("is invariant to adding a constant to every logit", () => {
    const shifted = BASE_LOGITS.map((z) => z + 100);
    const probs = softmax(shifted);
    const original = softmax(BASE_LOGITS);
    probs.forEach((p, i) => expect(p).toBeCloseTo(original[i], 8));
  });
});

describe("a two-way tie in logits produces an exact tie in probability", () => {
  it("[1, 1, 2] gives equal probability to the first two classes", () => {
    const probs = softmax(CHECKPOINT_LOGITS);
    expect(probs[0]).toBeCloseTo(probs[1], 10);
    expect(probs[2]).toBeCloseTo(0.5761168847658291, 8);
    expect(argmax(CHECKPOINT_LOGITS)).toBe(2);
  });
});

describe("temperature reshapes confidence without changing the ranking", () => {
  it("a low temperature sharpens the distribution toward one-hot", () => {
    const sharp = softmaxWithTemperature(BASE_LOGITS, 0.5);
    expect(sharp[0]).toBeGreaterThan(0.97);
  });

  it("a high temperature flattens the distribution toward uniform", () => {
    const flat = softmaxWithTemperature(BASE_LOGITS, 2);
    expect(flat[0]).toBeLessThan(softmax(BASE_LOGITS)[0]);
    expect(flat[2]).toBeGreaterThan(softmax(BASE_LOGITS)[2]);
  });

  it("temperature=1 leaves softmax unchanged", () => {
    const t1 = softmaxWithTemperature(BASE_LOGITS, 1);
    const plain = softmax(BASE_LOGITS);
    t1.forEach((p, i) => expect(p).toBeCloseTo(plain[i], 10));
  });
});
