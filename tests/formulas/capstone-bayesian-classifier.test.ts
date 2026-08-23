import { describe, it, expect } from "vitest";
import {
  NEW_MESSAGE,
  prior,
  likelihoodMLE,
  likelihoodMAP,
  messageLikelihood,
  classify,
} from "@/lib/math-core/capstone-bayesian-classifier";

describe("prior", () => {
  it("3 spam and 3 not-spam messages give equal priors", () => {
    expect(prior("spam")).toBeCloseTo(0.5, 10);
    expect(prior("not spam")).toBeCloseTo(0.5, 10);
  });
});

describe("likelihoodMLE", () => {
  it("matches hand-counted fractions", () => {
    expect(likelihoodMLE("win", "spam")).toBeCloseTo(2 / 3, 10);
    expect(likelihoodMLE("win", "not spam")).toBeCloseTo(1 / 3, 10);
    expect(likelihoodMLE("urgent", "spam")).toBeCloseTo(2 / 3, 10);
    expect(likelihoodMLE("link", "not spam")).toBeCloseTo(2 / 3, 10);
  });

  it("has two true zero-frequency cases", () => {
    expect(likelihoodMLE("urgent", "not spam")).toBe(0);
    expect(likelihoodMLE("link", "spam")).toBe(0);
  });
});

describe("likelihoodMAP", () => {
  it("Laplace-smooths the zero-frequency cases away from exactly zero", () => {
    expect(likelihoodMAP("urgent", "not spam")).toBeCloseTo(0.2, 10);
    expect(likelihoodMAP("link", "spam")).toBeCloseTo(0.2, 10);
  });

  it("matches hand-computed fractions for the non-zero cases", () => {
    expect(likelihoodMAP("win", "spam")).toBeCloseTo(0.6, 10);
    expect(likelihoodMAP("win", "not spam")).toBeCloseTo(0.4, 10);
    expect(likelihoodMAP("urgent", "spam")).toBeCloseTo(0.6, 10);
    expect(likelihoodMAP("link", "not spam")).toBeCloseTo(0.6, 10);
  });
});

describe("messageLikelihood", () => {
  it("MLE gives exactly zero likelihood for both classes on the new message", () => {
    expect(messageLikelihood(NEW_MESSAGE, "spam", "mle")).toBe(0);
    expect(messageLikelihood(NEW_MESSAGE, "not spam", "mle")).toBe(0);
  });

  it("MAP gives 0.048 for spam and 0.072 for not spam", () => {
    expect(messageLikelihood(NEW_MESSAGE, "spam", "map")).toBeCloseTo(0.048, 10);
    expect(messageLikelihood(NEW_MESSAGE, "not spam", "map")).toBeCloseTo(0.072, 10);
  });
});

describe("classify", () => {
  it("MLE breaks down entirely: both posteriors are 0 and there is no prediction", () => {
    const result = classify(NEW_MESSAGE, "mle");
    expect(result.posteriors.spam).toBe(0);
    expect(result.posteriors["not spam"]).toBe(0);
    expect(result.prediction).toBeNull();
  });

  it("MAP resolves to exactly a 0.4 / 0.6 split, predicting not spam", () => {
    const result = classify(NEW_MESSAGE, "map");
    expect(result.posteriors.spam).toBeCloseTo(0.4, 10);
    expect(result.posteriors["not spam"]).toBeCloseTo(0.6, 10);
    expect(result.prediction).toBe("not spam");
  });
});
