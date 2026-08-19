import { describe, it, expect } from "vitest";
import { apply, ROTATE_90, SCALE, FLIP_X, SHEAR } from "@/lib/math-core/matrices";

describe("apply (matrix-vector multiplication)", () => {
  it("rotates (1,0) to (0,1) with a 90° rotation matrix", () => {
    const result = apply(ROTATE_90, { x: 1, y: 0 });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
  });

  it("matches the worked example: SCALE applied to (3,4) = (6,2)", () => {
    const result = apply(SCALE, { x: 3, y: 4 });
    expect(result.x).toBeCloseTo(6);
    expect(result.y).toBeCloseTo(2);
  });

  it("flips the x-component and leaves y untouched", () => {
    const result = apply(FLIP_X, { x: 2, y: 5 });
    expect(result.x).toBeCloseTo(-2);
    expect(result.y).toBeCloseTo(5);
  });

  it("shears (1,1) to (2,1)", () => {
    const result = apply(SHEAR, { x: 1, y: 1 });
    expect(result.x).toBeCloseTo(2);
    expect(result.y).toBeCloseTo(1);
  });

  it("hits the checkpoint's target: ROTATE_90 applied to (3,-4) = (4,3)", () => {
    const result = apply(ROTATE_90, { x: 3, y: -4 });
    expect(result.x).toBeCloseTo(4);
    expect(result.y).toBeCloseTo(3);
  });

  it("is linear: M(a+b) = Ma + Mb, for every preset matrix", () => {
    const a = { x: 2, y: -3 };
    const b = { x: -1, y: 5 };
    const sum = { x: a.x + b.x, y: a.y + b.y };
    for (const m of [ROTATE_90, SCALE, FLIP_X, SHEAR]) {
      const combined = apply(m, sum);
      const separate = apply(m, a);
      const other = apply(m, b);
      expect(combined.x).toBeCloseTo(separate.x + other.x);
      expect(combined.y).toBeCloseTo(separate.y + other.y);
    }
  });
});
