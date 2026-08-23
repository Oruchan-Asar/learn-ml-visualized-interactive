import { describe, expect, it } from "vitest";
import { train, predict, totalError, MISSING, RATINGS } from "@/lib/math-core/collaborative-filtering-and-matrix-factorization";

describe("k=1 hits a genuine capacity limit", () => {
  it("plateaus at a real, nonzero error no matter how long it trains", () => {
    const short = train(RATINGS, 1, 300);
    const long = train(RATINGS, 1, 5000);
    expect(totalError(long, RATINGS)).toBeCloseTo(totalError(short, RATINGS), 6);
    expect(totalError(long, RATINGS)).toBeGreaterThan(19);
  });

  it("systematically fails on the U3/I3 pair — a rank-1 model can't fit two opposite taste groups", () => {
    const f = train(RATINGS, 1, 2000);
    // True rating is 5; a rank-1 fit with all-positive factors badly underestimates it.
    expect(predict(f, 2, 2)).toBeLessThan(2);
  });
});

describe("k=2 reconstructs every observed rating exactly", () => {
  const f = train(RATINGS, 2, 2000);

  it("has essentially zero total error", () => {
    expect(totalError(f, RATINGS)).toBeCloseTo(0, 6);
  });

  it("matches every observed rating to high precision", () => {
    expect(predict(f, 0, 0)).toBeCloseTo(5, 4);
    expect(predict(f, 0, 1)).toBeCloseTo(4, 4);
    expect(predict(f, 0, 2)).toBeCloseTo(1, 4);
    expect(predict(f, 2, 2)).toBeCloseTo(5, 4);
  });

  it("predicts the missing U2/I2 rating at a sensible, specific value", () => {
    expect(predict(f, MISSING.user, MISSING.item)).toBeCloseTo(3.2083, 3);
  });
});

describe("shape sanity", () => {
  it("has 3 users and 3 items, with exactly one missing rating", () => {
    expect(RATINGS.length).toBe(3);
    expect(RATINGS[0].length).toBe(3);
    const missingCount = RATINGS.flat().filter((r) => r === null).length;
    expect(missingCount).toBe(1);
  });
});
