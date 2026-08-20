import { describe, expect, it } from "vitest";
import { X0, FORWARD, X_T, TARGET_ERROR, reverseProcess, reconstructedX0 } from "@/lib/math-core/diffusion-models";

describe("forward process gradually mixes in noise", () => {
  it("starts exactly at x0 and matches the hand-derived trajectory", () => {
    expect(FORWARD[0].value).toBe(X0);
    expect(FORWARD[1].value).toBeCloseTo(5.0596, 3);
    expect(FORWARD[2].value).toBeCloseTo(4.3019, 3);
    expect(FORWARD[3].value).toBeCloseTo(4.0374, 3);
    expect(FORWARD[4].value).toBeCloseTo(2.3684, 3);
  });

  it("X_T is the final forward value", () => {
    expect(X_T).toBeCloseTo(2.3684, 3);
  });
});

describe("reverse process with a perfect denoiser exactly undoes the forward process", () => {
  it("quality=1 recovers x0 exactly", () => {
    expect(reconstructedX0(1)).toBeCloseTo(X0, 6);
  });

  it("the full reverse trace at quality=1 exactly mirrors the forward trace", () => {
    const reverse = reverseProcess(1);
    const forwardValues = FORWARD.map((s) => s.value);
    const reverseValues = reverse.map((s) => s.value).reverse();
    forwardValues.forEach((v, i) => expect(reverseValues[i]).toBeCloseTo(v, 6));
  });
});

describe("reverse process with an imperfect denoiser only partially recovers x0", () => {
  it("quality=0 (a denoiser that always predicts zero noise) does not recover x0", () => {
    const reconstructed = reconstructedX0(0);
    expect(Math.abs(reconstructed - X0)).toBeGreaterThan(TARGET_ERROR);
  });

  it("reconstruction error shrinks monotonically as quality increases", () => {
    const errors = [0, 0.25, 0.5, 0.75, 1].map((q) => Math.abs(reconstructedX0(q) - X0));
    for (let i = 1; i < errors.length; i++) {
      expect(errors[i]).toBeLessThan(errors[i - 1]);
    }
  });

  it("crosses the target error threshold somewhere around quality ~0.86, not before", () => {
    expect(Math.abs(reconstructedX0(0.8) - X0)).toBeGreaterThan(TARGET_ERROR);
    expect(Math.abs(reconstructedX0(0.9) - X0)).toBeLessThan(TARGET_ERROR);
  });
});
