import { describe, expect, it } from "vitest";
import { prior, likelihoodRaw, likelihoodSmoothed, classify, NEW_MESSAGE } from "@/lib/math-core/naive-bayes-classifier";

describe("priors and raw (unsmoothed) likelihoods", () => {
  it("priors are 0.5 each — 3 spam, 3 not-spam messages", () => {
    expect(prior("spam")).toBeCloseTo(0.5, 10);
    expect(prior("not spam")).toBeCloseTo(0.5, 10);
  });

  it("'free' never appears in a not-spam message — exactly zero raw likelihood", () => {
    expect(likelihoodRaw("free", "not spam")).toBe(0);
  });

  it("raw likelihoods for spam: free=2/3, money=2/3, meeting=0", () => {
    expect(likelihoodRaw("free", "spam")).toBeCloseTo(2 / 3, 10);
    expect(likelihoodRaw("money", "spam")).toBeCloseTo(2 / 3, 10);
    expect(likelihoodRaw("meeting", "spam")).toBe(0);
  });
});

describe("Laplace smoothing fixes the zero-frequency problem", () => {
  it("smoothed likelihood for 'free' given not-spam is nonzero, exactly 0.2", () => {
    expect(likelihoodSmoothed("free", "not spam")).toBeCloseTo(0.2, 10);
  });

  it("smoothed spam likelihoods: free=0.6, money=0.6, meeting=0.2", () => {
    expect(likelihoodSmoothed("free", "spam")).toBeCloseTo(0.6, 10);
    expect(likelihoodSmoothed("money", "spam")).toBeCloseTo(0.6, 10);
    expect(likelihoodSmoothed("meeting", "spam")).toBeCloseTo(0.2, 10);
  });
});

describe("classifying a message containing 'free' and 'money'", () => {
  it("without smoothing: correct prediction, but absolute (100%/0%) overconfidence", () => {
    const result = classify(NEW_MESSAGE, false);
    expect(result.prediction).toBe("spam");
    expect(result.posteriors.spam).toBeCloseTo(1, 10);
    expect(result.posteriors["not spam"]).toBeCloseTo(0, 10);
  });

  it("with smoothing: same correct prediction, honest 90%/10% confidence instead", () => {
    const result = classify(NEW_MESSAGE, true);
    expect(result.prediction).toBe("spam");
    expect(result.posteriors.spam).toBeCloseTo(0.9, 6);
    expect(result.posteriors["not spam"]).toBeCloseTo(0.1, 6);
  });
});
