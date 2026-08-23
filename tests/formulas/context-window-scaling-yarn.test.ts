import { describe, it, expect } from "vitest";
import {
  D_MODEL,
  ORIGINAL_LEN,
  TARGET_POS,
  SCALES,
  angleRate,
  wavelength,
  needsInterpolation,
  effectivePosition,
  yarnAngle,
} from "@/lib/math-core/context-window-scaling-yarn";

describe("angleRate", () => {
  it("matches the hand-computed exact rates: 1 for the fast pair, 0.01 for the slow pair", () => {
    expect(angleRate(0, D_MODEL)).toBe(1);
    expect(angleRate(1, D_MODEL)).toBe(0.01);
  });
});

describe("wavelength", () => {
  it("is shorter than the trained context for the fast dimension", () => {
    expect(wavelength(0, D_MODEL)).toBeLessThan(ORIGINAL_LEN);
  });

  it("is far longer than the trained context for the slow dimension", () => {
    expect(wavelength(1, D_MODEL)).toBeGreaterThan(ORIGINAL_LEN);
  });
});

describe("needsInterpolation", () => {
  it("is false for the fast dimension and true for the slow one", () => {
    expect(needsInterpolation(0)).toBe(false);
    expect(needsInterpolation(1)).toBe(true);
  });
});

describe("effectivePosition", () => {
  it("leaves the fast dimension's position unchanged, regardless of scale", () => {
    for (const scale of SCALES) {
      expect(effectivePosition(TARGET_POS, 0, scale)).toBe(TARGET_POS);
    }
  });

  it("divides the slow dimension's position by the scale exactly", () => {
    expect(effectivePosition(TARGET_POS, 1, 1)).toBe(64);
    expect(effectivePosition(TARGET_POS, 1, 2)).toBe(32);
    expect(effectivePosition(TARGET_POS, 1, 4)).toBe(16);
    expect(effectivePosition(TARGET_POS, 1, 8)).toBe(8);
  });

  it("at scale 8, remaps the slow dimension's effective position exactly back to the trained context length", () => {
    expect(effectivePosition(TARGET_POS, 1, 8)).toBe(ORIGINAL_LEN);
  });

  it("shrinks monotonically as scale increases", () => {
    const values = SCALES.map((scale) => effectivePosition(TARGET_POS, 1, scale));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
  });
});

describe("yarnAngle", () => {
  it("matches the hand-computed angle for the slow dimension at scale 8: 8 × 0.01 = 0.08", () => {
    expect(yarnAngle(TARGET_POS, 1, 8)).toBeCloseTo(0.08, 10);
  });

  it("matches the hand-computed naive (scale 1) angle for the slow dimension: 64 × 0.01 = 0.64", () => {
    expect(yarnAngle(TARGET_POS, 1, 1)).toBeCloseTo(0.64, 10);
  });

  it("leaves the fast dimension's angle identical across every scale", () => {
    const angles = SCALES.map((scale) => yarnAngle(TARGET_POS, 0, scale));
    for (const a of angles) expect(a).toBeCloseTo(angles[0], 10);
  });
});
