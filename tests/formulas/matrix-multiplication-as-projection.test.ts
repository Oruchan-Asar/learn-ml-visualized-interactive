import { describe, it, expect } from "vitest";
import {
  COLUMN_A,
  WORKED_B,
  ON_LINE_B,
  CHECKPOINT_TARGET_P,
  scalarProjectionCoefficient,
  projectOnto,
  residual,
  isSolvable,
} from "@/lib/math-core/matrix-multiplication-as-projection";

describe("scalarProjectionCoefficient", () => {
  it("matches the hand-derived t = (a.b)/(a.a) for the worked example", () => {
    // a.b = 2*3 + 1*4 = 10, a.a = 4 + 1 = 5, t = 2
    expect(scalarProjectionCoefficient(COLUMN_A, WORKED_B)).toBe(2);
  });
});

describe("projectOnto", () => {
  it("lands at t*a = (4, 2) for the worked example", () => {
    expect(projectOnto(COLUMN_A, WORKED_B)).toEqual({ x: 4, y: 2 });
  });

  it("projecting a point already on the line returns that point exactly", () => {
    expect(projectOnto(COLUMN_A, ON_LINE_B)).toEqual({ x: 4, y: 2 });
  });
});

describe("residual", () => {
  it("is (-1, 2) for the worked example", () => {
    expect(residual(COLUMN_A, WORKED_B)).toEqual({ x: -1, y: 2 });
  });

  it("is always perpendicular to a — the defining property of the projection", () => {
    const r = residual(COLUMN_A, WORKED_B);
    expect(COLUMN_A.x * r.x + COLUMN_A.y * r.y).toBeCloseTo(0, 10);
  });

  it("is zero when b is already on the line", () => {
    expect(residual(COLUMN_A, ON_LINE_B)).toEqual({ x: 0, y: 0 });
  });
});

describe("isSolvable", () => {
  it("is false for a b off the line", () => {
    expect(isSolvable(COLUMN_A, WORKED_B)).toBe(false);
  });

  it("is true for a b exactly on the line", () => {
    expect(isSolvable(COLUMN_A, ON_LINE_B)).toBe(true);
  });
});

describe("CHECKPOINT_TARGET_P", () => {
  it("equals the worked example's projection, (4, 2)", () => {
    expect(CHECKPOINT_TARGET_P).toEqual({ x: 4, y: 2 });
  });
});
