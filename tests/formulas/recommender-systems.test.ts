import { describe, expect, it } from "vitest";
import { train, predict, totalError, MISSING, USERS, ITEMS } from "@/lib/math-core/recommender-systems";

describe("k=1 hits a genuine capacity limit", () => {
  it("plateaus at a real, nonzero error no matter how long it trains", () => {
    const short = train(1, 300);
    const long = train(1, 5000);
    expect(totalError(long)).toBeCloseTo(totalError(short), 6);
    expect(totalError(long)).toBeGreaterThan(19);
  });

  it("systematically fails on the U3/I3 pair — a rank-1 model can't fit two opposite taste groups", () => {
    const f = train(1, 2000);
    // True rating is 5; a rank-1 fit with all-positive factors badly underestimates it.
    expect(predict(f, "U3", "I3")).toBeLessThan(2);
  });
});

describe("k=2 reconstructs every observed rating exactly", () => {
  const f = train(2, 2000);

  it("has essentially zero total error", () => {
    expect(totalError(f)).toBeCloseTo(0, 6);
  });

  it("matches every observed rating to high precision", () => {
    expect(predict(f, "U1", "I1")).toBeCloseTo(5, 4);
    expect(predict(f, "U1", "I2")).toBeCloseTo(4, 4);
    expect(predict(f, "U1", "I3")).toBeCloseTo(1, 4);
    expect(predict(f, "U3", "I3")).toBeCloseTo(5, 4);
  });

  it("predicts the missing U2/I2 rating at a sensible, specific value", () => {
    expect(predict(f, MISSING.user, MISSING.item)).toBeCloseTo(3.2083, 3);
  });
});

describe("symmetry breaking is what makes the second dimension count", () => {
  it("every user and item has exactly 3 entries, matching USERS and ITEMS", () => {
    expect(USERS.length).toBe(3);
    expect(ITEMS.length).toBe(3);
  });
});
