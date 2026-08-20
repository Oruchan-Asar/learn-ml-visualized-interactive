import { describe, expect, it } from "vitest";
import { rankByDistance, predict, voteCounts, QUERY, DATA } from "@/lib/math-core/k-nearest-neighbors";

describe("ranking every point by distance to the query", () => {
  it("the nearest point is the noisy A stray, closer than any real B point", () => {
    const ranked = rankByDistance(QUERY);
    expect(ranked[0].point.label).toBe("A");
    expect(ranked[0].point.x).toBeCloseTo(4.2, 10);
    expect(ranked[0].d).toBeCloseTo(0.2828, 3);
  });

  it("the next three nearest are all genuine B points", () => {
    const ranked = rankByDistance(QUERY);
    expect(ranked.slice(1, 4).every((r) => r.point.label === "B")).toBe(true);
  });

  it("ranks exactly 9 points, matching the dataset size", () => {
    expect(rankByDistance(QUERY).length).toBe(DATA.length);
  });
});

describe("k changes the prediction", () => {
  it("k=1 is fooled by the noisy point and predicts A — wrong", () => {
    expect(predict(QUERY, 1)).toBe("A");
    expect(voteCounts(QUERY, 1)).toEqual({ A: 1 });
  });

  it("k=3 outvotes the noisy point 2-to-1 and correctly predicts B", () => {
    expect(predict(QUERY, 3)).toBe("B");
    expect(voteCounts(QUERY, 3)).toEqual({ A: 1, B: 2 });
  });

  it("k=5 is even more confidently correct, 4-to-1", () => {
    expect(predict(QUERY, 5)).toBe("B");
    expect(voteCounts(QUERY, 5)).toEqual({ A: 1, B: 4 });
  });
});
