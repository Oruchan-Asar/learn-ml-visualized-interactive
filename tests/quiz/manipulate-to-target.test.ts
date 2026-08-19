import { describe, it, expect } from "vitest";
import { withinTolerance, withinDistance } from "@/lib/quiz/manipulate-to-target";

describe("withinTolerance", () => {
  it("passes just inside the boundary", () => {
    expect(withinTolerance(1.14, 1, 0.15)).toBe(true);
    expect(withinTolerance(0.86, 1, 0.15)).toBe(true);
  });

  it("fails just outside the boundary", () => {
    expect(withinTolerance(1.16, 1, 0.15)).toBe(false);
    expect(withinTolerance(0.84, 1, 0.15)).toBe(false);
  });
});

describe("withinDistance", () => {
  it("passes when the point is within the tolerance radius (3-4-5 triangle)", () => {
    expect(withinDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, 5)).toBe(true);
    expect(withinDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, 4.99)).toBe(false);
  });

  it("passes exactly at the target and fails far away", () => {
    expect(withinDistance({ x: 1, y: 1 }, { x: 1, y: 1 }, 0.01)).toBe(true);
    expect(withinDistance({ x: 10, y: 10 }, { x: 0, y: 0 }, 1)).toBe(false);
  });
});
