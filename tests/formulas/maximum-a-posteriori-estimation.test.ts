import { describe, it, expect } from "vitest";
import {
  FLIPS,
  PRIOR_ALPHA,
  PRIOR_BETA,
  headsCount,
  mleEstimate,
  priorMean,
  logLikelihood,
  logPrior,
  logPosterior,
  mapEstimate,
} from "@/lib/math-core/maximum-a-posteriori-estimation";

describe("headsCount / mleEstimate", () => {
  it("3 heads out of 4 flips, MLE = 0.75", () => {
    expect(headsCount(FLIPS)).toBe(3);
    expect(mleEstimate(FLIPS)).toBeCloseTo(0.75, 10);
  });
});

describe("priorMean", () => {
  it("Beta(2, 4) has mean 1/3", () => {
    expect(priorMean(PRIOR_ALPHA, PRIOR_BETA)).toBeCloseTo(1 / 3, 10);
  });
});

describe("mapEstimate", () => {
  it("is exactly 0.5, pulled down from the MLE's 0.75 by the tails-favoring prior", () => {
    const map = mapEstimate(FLIPS, PRIOR_ALPHA, PRIOR_BETA);
    expect(map).toBeCloseTo(0.5, 10);
    expect(map).toBeLessThan(mleEstimate(FLIPS));
  });
});

describe("logPosterior", () => {
  it("equals logLikelihood + logPrior at any point", () => {
    for (const p of [0.3, 0.5, 0.7]) {
      expect(logPosterior(p, FLIPS, PRIOR_ALPHA, PRIOR_BETA)).toBeCloseTo(
        logLikelihood(p, FLIPS) + logPrior(p, PRIOR_ALPHA, PRIOR_BETA),
        10,
      );
    }
  });

  it("peaks at p=0.5 on a coarse grid, unlike the likelihood which peaks at 0.75", () => {
    const posteriorCandidates = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const bestPosterior = posteriorCandidates.reduce((a, b) =>
      logPosterior(b, FLIPS, PRIOR_ALPHA, PRIOR_BETA) > logPosterior(a, FLIPS, PRIOR_ALPHA, PRIOR_BETA) ? b : a,
    );
    expect(bestPosterior).toBeCloseTo(0.5, 10);

    const likelihoodCandidates = [0.25, 0.5, 0.75, 0.9];
    const bestLikelihood = likelihoodCandidates.reduce((a, b) =>
      logLikelihood(b, FLIPS) > logLikelihood(a, FLIPS) ? b : a,
    );
    expect(bestLikelihood).toBeCloseTo(0.75, 10);
  });
});
