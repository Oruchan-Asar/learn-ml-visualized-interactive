import { describe, it, expect } from "vitest";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";

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
