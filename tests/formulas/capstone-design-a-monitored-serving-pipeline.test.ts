import { describe, expect, it } from "vitest";
import {
  runStaticIngestionTests,
  weightedAccuracy,
  driftScore,
  DRIFT_ALERT_THRESHOLD,
  isDrifting,
  runPipeline,
  DAILY_DISTRIBUTIONS,
  TRAIN_DIST,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/capstone-design-a-monitored-serving-pipeline";

describe("capstone-design-a-monitored-serving-pipeline", () => {
  it("the static ingestion test suite passes on all three historical labels", () => {
    const results = runStaticIngestionTests();
    expect(results).toEqual([
      { labelTime: 3, expected: 30, actual: 30, passed: true },
      { labelTime: 6, expected: 45, actual: 45, passed: true },
      { labelTime: 9, expected: 100, actual: 100, passed: true },
    ]);
  });

  it("training distribution has a weighted accuracy of 0.80", () => {
    expect(weightedAccuracy(TRAIN_DIST)).toBeCloseTo(0.8, 10);
  });

  it("runs a three-day pipeline: stable, mild wobble, silent incident", () => {
    const report = runPipeline(DAILY_DISTRIBUTIONS);
    expect(report).toHaveLength(3);

    expect(report[0].accuracy).toBeCloseTo(0.8, 10);
    expect(report[0].drift).toBeCloseTo(0, 10);
    expect(report[0].alarm).toBe(false);
    expect(report[0].staticTestsPassed).toBe(true);

    expect(report[1].alarm).toBe(false);

    expect(report[2].accuracy).toBeCloseTo(0.8, 10);
    expect(report[2].drift).toBeGreaterThan(DRIFT_ALERT_THRESHOLD);
    expect(report[2].alarm).toBe(true);
    expect(report[2].staticTestsPassed).toBe(true);
  });

  it("day 3's incident is invisible to accuracy but caught by drift, while static ingestion tests keep passing", () => {
    const report = runPipeline(DAILY_DISTRIBUTIONS);
    const day3 = report[2];
    expect(day3.accuracy).toBeCloseTo(report[0].accuracy, 10);
    expect(day3.alarm).toBe(true);
    expect(day3.staticTestsPassed).toBe(true);
  });

  it("checkpoint candidates: fine, loud, and silent", () => {
    const [fine, loud, silent] = CHECKPOINT_CANDIDATES;
    expect(isDrifting(fine.dist)).toBe(false);

    expect(weightedAccuracy(loud.dist)).toBeCloseTo(0.83, 10);
    expect(isDrifting(loud.dist)).toBe(true);

    expect(weightedAccuracy(silent.dist)).toBeCloseTo(0.8, 10);
    expect(driftScore(silent.dist)).toBeCloseTo(0.5509775004326936, 10);
    expect(isDrifting(silent.dist)).toBe(true);
  });
});
