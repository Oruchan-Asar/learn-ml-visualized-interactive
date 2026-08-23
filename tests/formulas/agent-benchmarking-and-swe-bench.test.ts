import { describe, it, expect } from "vitest";
import { TESTS, PATCHES, testResults, passCount, passRate, resolvesIssue } from "@/lib/math-core/agent-benchmarking-and-swe-bench";

describe("agent-benchmarking-and-swe-bench", () => {
  it("has 5 fixed test cases and 3 candidate patches", () => {
    expect(TESTS).toHaveLength(5);
    expect(PATCHES.map((p) => p.id)).toEqual(["A", "B", "C"]);
  });

  it("Patch A (indexOf, first occurrence) passes exactly 3 of 5 tests", () => {
    expect(testResults("A")).toEqual([false, false, true, true, true]);
    expect(passCount("A")).toBe(3);
    expect(passRate("A")).toBeCloseTo(0.6);
    expect(resolvesIssue("A")).toBe(false);
  });

  it("Patch B (lastIndexOf, the real fix) passes all 5 tests", () => {
    expect(testResults("B")).toEqual([true, true, true, true, true]);
    expect(passCount("B")).toBe(5);
    expect(passRate("B")).toBe(1);
    expect(resolvesIssue("B")).toBe(true);
  });

  it("Patch C (hardcoded to the one visible test) also passes exactly 3 of 5, but a different 3", () => {
    expect(testResults("C")).toEqual([true, false, true, true, false]);
    expect(passCount("C")).toBe(3);
    expect(resolvesIssue("C")).toBe(false);
  });

  it("A and C tie on pass rate despite failing different hidden tests", () => {
    expect(passRate("A")).toBe(passRate("C"));
    expect(testResults("A")).not.toEqual(testResults("C"));
  });

  it("only Patch B resolves the issue", () => {
    const resolving = PATCHES.filter((p) => resolvesIssue(p.id));
    expect(resolving).toHaveLength(1);
    expect(resolving[0].id).toBe("B");
  });
});
