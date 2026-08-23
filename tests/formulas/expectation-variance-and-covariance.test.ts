import { describe, it, expect } from "vitest";
import {
  OUTCOMES,
  mean,
  variance,
  covariance,
  meanContributions,
  varianceContributions,
  covarianceContributions,
} from "@/lib/math-core/expectation-variance-and-covariance";

describe("mean", () => {
  it("computes E[X] = 3.0", () => {
    expect(mean(OUTCOMES, "x")).toBeCloseTo(3.0, 10);
  });

  it("computes E[Y] = 2.7", () => {
    expect(mean(OUTCOMES, "y")).toBeCloseTo(2.7, 10);
  });
});

describe("variance", () => {
  it("computes Var(X) = 1.4", () => {
    expect(variance(OUTCOMES, "x")).toBeCloseTo(1.4, 10);
  });

  it("computes Var(Y) = 1.81", () => {
    expect(variance(OUTCOMES, "y")).toBeCloseTo(1.81, 10);
  });
});

describe("covariance", () => {
  it("computes Cov(X, Y) = 1.2", () => {
    expect(covariance(OUTCOMES)).toBeCloseTo(1.2, 10);
  });
});

describe("contributions sum back to the parent statistic", () => {
  it("mean contributions sum to E[X]", () => {
    const total = meanContributions(OUTCOMES, "x").reduce((s, c) => s + c.value, 0);
    expect(total).toBeCloseTo(mean(OUTCOMES, "x"), 10);
  });

  it("variance contributions sum to Var(Y)", () => {
    const total = varianceContributions(OUTCOMES, "y").reduce((s, c) => s + c.value, 0);
    expect(total).toBeCloseTo(variance(OUTCOMES, "y"), 10);
  });

  it("covariance contributions sum to Cov(X, Y)", () => {
    const total = covarianceContributions(OUTCOMES).reduce((s, c) => s + c.value, 0);
    expect(total).toBeCloseTo(covariance(OUTCOMES), 10);
  });
});
