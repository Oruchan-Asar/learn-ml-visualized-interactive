import { describe, it, expect } from "vitest";
import { BOOST_POINTS, BOOST_ROUNDS, MAX_BOOST_ROUNDS, ensembleAccuracy, boostRegions, BOOST_DOMAIN } from "@/lib/math-core/boosting";

describe("round 1's stump, hand-derived", () => {
  it("splits at x=3.5 (predicting A left, B right), the best single threshold for this pattern", () => {
    const { stump } = BOOST_ROUNDS[0];
    expect(stump.threshold).toBeCloseTo(3.5, 10);
    expect(stump.leftLabel).toBe("A");
    expect(stump.rightLabel).toBe("B");
  });

  it("weighted error is exactly 8/20 — the 8 points this stump gets wrong, each starting at weight 1/20", () => {
    expect(BOOST_ROUNDS[0].weightedError).toBeCloseTo(8 / 20, 10);
  });

  it("alpha matches 0.5 * ln(0.6/0.4) by hand", () => {
    const handComputed = 0.5 * Math.log(0.6 / 0.4);
    expect(BOOST_ROUNDS[0].alpha).toBeCloseTo(handComputed, 10);
  });

  it("a single stump alone only reaches 60% — a genuinely weak learner on this pattern", () => {
    expect(ensembleAccuracy(BOOST_ROUNDS, 1, BOOST_POINTS)).toBeCloseTo(0.6, 10);
  });
});

describe("round 1's weight update, hand-derived", () => {
  it("correctly-classified points' weight shrinks to (1/20)*e^-alpha, renormalized", () => {
    const { alpha, weightsAfter } = BOOST_ROUNDS[0];
    const correctFactor = Math.exp(-alpha);
    const wrongFactor = Math.exp(alpha);
    const total = 12 * (1 / 20) * correctFactor + 8 * (1 / 20) * wrongFactor;
    const expectedCorrectWeight = ((1 / 20) * correctFactor) / total;
    // x=0 is correctly classified by round 1's stump (true A, predicted A).
    expect(weightsAfter[0]).toBeCloseTo(expectedCorrectWeight, 10);
  });

  it("misclassified points' weight grows relative to correctly-classified ones", () => {
    const { weightsAfter } = BOOST_ROUNDS[0];
    // x=8 is misclassified by round 1's stump (true A, predicted B); x=0 is correct.
    expect(weightsAfter[8]).toBeGreaterThan(weightsAfter[0]);
  });
});

describe("the ensemble's accuracy across rounds matches direct simulation exactly", () => {
  it("1→0.6, 2→0.6, 3→0.8, 4→0.8, 5→0.95", () => {
    const expected = [0.6, 0.6, 0.8, 0.8, 0.95];
    for (let n = 1; n <= MAX_BOOST_ROUNDS; n++) {
      expect(ensembleAccuracy(BOOST_ROUNDS, n, BOOST_POINTS)).toBeCloseTo(expected[n - 1], 10);
    }
  });

  it("5 rounds together beat every smaller prefix, including round 1 alone", () => {
    const final = ensembleAccuracy(BOOST_ROUNDS, MAX_BOOST_ROUNDS, BOOST_POINTS);
    for (let n = 1; n < MAX_BOOST_ROUNDS; n++) {
      expect(final).toBeGreaterThanOrEqual(ensembleAccuracy(BOOST_ROUNDS, n, BOOST_POINTS));
    }
  });
});

describe("boostRegions covers the whole domain with contiguous, merged bands", () => {
  it("chains start-to-end with no gaps and no two adjacent bands sharing a prediction", () => {
    for (let n = 1; n <= MAX_BOOST_ROUNDS; n++) {
      const regions = boostRegions(BOOST_ROUNDS, n, BOOST_DOMAIN[0], BOOST_DOMAIN[1]);
      expect(regions[0].start).toBe(BOOST_DOMAIN[0]);
      expect(regions[regions.length - 1].end).toBe(BOOST_DOMAIN[1]);
      for (let i = 1; i < regions.length; i++) {
        expect(regions[i].start).toBe(regions[i - 1].end);
        expect(regions[i].prediction).not.toBe(regions[i - 1].prediction);
      }
    }
  });
});
