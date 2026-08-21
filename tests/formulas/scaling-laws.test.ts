import { describe, it, expect } from "vitest";
import { fitScalingLaw, predictLossLogLog, fitRawLinear, predictLossRawLinear, trueLoss, TEST_SIZE } from "@/lib/math-core/scaling-laws";

describe("scaling-laws", () => {
  it("fitting in log-log space recovers the true exponent and coefficient exactly", () => {
    const fit = fitScalingLaw();
    expect(fit.slope).toBeCloseTo(-0.5, 10);
    expect(fit.intercept).toBeCloseTo(Math.log(100), 10);
  });

  it("the log-log fit predicts the untested large size almost perfectly", () => {
    const fit = fitScalingLaw();
    const predicted = predictLossLogLog(fit, TEST_SIZE);
    const trueValue = trueLoss(TEST_SIZE);
    expect(trueValue).toBe(10);
    expect(predicted).toBeCloseTo(10, 8);
  });

  it("fitting a straight line to the raw, untransformed data gives a nonsensical negative prediction", () => {
    const rawFit = fitRawLinear();
    const predicted = predictLossRawLinear(rawFit, TEST_SIZE);
    expect(predicted).toBeLessThan(0);
    expect(predicted).toBeCloseTo(-351.2596899224806, 8);
  });

  it("the log-log prediction is vastly more accurate than the raw-linear one", () => {
    const logFit = fitScalingLaw();
    const rawFit = fitRawLinear();
    const trueValue = trueLoss(TEST_SIZE);
    const logError = Math.abs(predictLossLogLog(logFit, TEST_SIZE) - trueValue);
    const rawError = Math.abs(predictLossRawLinear(rawFit, TEST_SIZE) - trueValue);
    expect(logError).toBeLessThan(0.001);
    expect(rawError).toBeGreaterThan(300);
  });
});
