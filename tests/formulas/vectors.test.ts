import { describe, it, expect } from "vitest";
import { dot, magnitude, angleBetweenDegrees } from "@/lib/math-core/vectors";

describe("dot product and magnitude", () => {
  it("computes the dot product component-wise", () => {
    expect(dot({ x: 4, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(12);
    expect(dot({ x: 2, y: -3 }, { x: -1, y: 5 })).toBeCloseTo(-17);
  });

  it("is zero for perpendicular vectors", () => {
    expect(dot({ x: 4, y: 0 }, { x: 0, y: 3 })).toBeCloseTo(0);
    expect(dot({ x: 3, y: 4 }, { x: 4, y: -3 })).toBeCloseTo(0);
  });

  it("computes magnitude via the Pythagorean identity", () => {
    expect(magnitude({ x: 3, y: 4 })).toBeCloseTo(5);
    expect(magnitude({ x: 4, y: 0 })).toBeCloseTo(4);
  });
});

describe("angleBetweenDegrees", () => {
  it("is 90° for perpendicular vectors", () => {
    expect(angleBetweenDegrees({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90);
  });

  it("is 45° between a diagonal and an axis", () => {
    expect(angleBetweenDegrees({ x: 1, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(45);
  });

  it("is 0° for parallel vectors and 180° for opposite ones", () => {
    expect(angleBetweenDegrees({ x: 2, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(0);
    expect(angleBetweenDegrees({ x: 2, y: 0 }, { x: -5, y: 0 })).toBeCloseTo(180);
  });

  it("matches the worked example: A=(4,0), B=(3,4) → ~53.13°", () => {
    expect(angleBetweenDegrees({ x: 4, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(53.13, 1);
  });
});
