import { describe, expect, it } from "vitest";
import { EVENTS, LATEST_TIME, cumulativeBefore, pointInTimeFeature, naiveFeature, LABELS, buildTrainingSet } from "@/lib/math-core/data-pipelines-and-feature-stores";

describe("data-pipelines-and-feature-stores", () => {
  it("has six raw events and a latest-snapshot time after all of them", () => {
    expect(EVENTS).toHaveLength(6);
    expect(LATEST_TIME).toBe(10);
  });

  it("computes cumulative spend strictly before a given time", () => {
    expect(cumulativeBefore(3)).toBe(30);
    expect(cumulativeBefore(6)).toBe(45);
    expect(cumulativeBefore(9)).toBe(100);
    expect(cumulativeBefore(11)).toBe(130);
  });

  it("point-in-time feature matches cumulativeBefore at the label time", () => {
    expect(pointInTimeFeature(3)).toBe(30);
    expect(pointInTimeFeature(6)).toBe(45);
    expect(pointInTimeFeature(9)).toBe(100);
    expect(pointInTimeFeature(7)).toBe(95);
  });

  it("naive feature ignores the label time and always returns the current snapshot total", () => {
    expect(naiveFeature(3)).toBe(130);
    expect(naiveFeature(6)).toBe(130);
    expect(naiveFeature(9)).toBe(130);
  });

  it("builds a training set where every row leaks a different amount of future information", () => {
    const rows = buildTrainingSet();
    expect(rows).toEqual([
      { labelTime: 3, correct: 30, naive: 130, leak: 100 },
      { labelTime: 6, correct: 45, naive: 130, leak: 85 },
      { labelTime: 9, correct: 100, naive: 130, leak: 30 },
    ]);
  });

  it("LABELS has three entries", () => {
    expect(LABELS).toHaveLength(3);
  });
});
