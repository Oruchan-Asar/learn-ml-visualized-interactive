import { describe, it, expect } from "vitest";
import { pairVelocity, trainVelocityField, generate, TRAINING_PAIRS, TEST_NOISE_POINTS, TARGET_VALUE } from "@/lib/math-core/capstone-build-a-flow-matching-sampler";

describe("pairVelocity", () => {
  it("matches the hand-computed velocity for every training pair", () => {
    expect(TRAINING_PAIRS.map(pairVelocity)).toEqual([9, 5, 12, 7]);
  });
});

describe("trainVelocityField", () => {
  it("equals the mean of the four training velocities exactly", () => {
    expect(trainVelocityField()).toBeCloseTo(8.25, 10);
  });
});

describe("generate", () => {
  const v = trainVelocityField();

  it("matches the hand-computed generated values for every test noise point", () => {
    expect(generate(TEST_NOISE_POINTS[0], v, 10)).toBeCloseTo(3.25, 8);
    expect(generate(TEST_NOISE_POINTS[1], v, 10)).toBeCloseTo(6.25, 8);
    expect(generate(TEST_NOISE_POINTS[2], v, 10)).toBeCloseTo(8.25, 8);
    expect(generate(TEST_NOISE_POINTS[3], v, 10)).toBeCloseTo(11.25, 8);
  });

  it("gives the identical result regardless of step count, since the field is constant", () => {
    for (const x0 of TEST_NOISE_POINTS) {
      const oneStep = generate(x0, v, 1);
      const manySteps = generate(x0, v, 200);
      expect(oneStep).toBeCloseTo(manySteps, 6);
    }
  });

  it("the noise point -2 generates the sample closest to the target value of 7", () => {
    const distances = TEST_NOISE_POINTS.map((x0) => Math.abs(generate(x0, v, 10) - TARGET_VALUE));
    const minIndex = distances.indexOf(Math.min(...distances));
    expect(TEST_NOISE_POINTS[minIndex]).toBe(-2);
    expect(distances[minIndex]).toBeCloseTo(0.75, 8);
  });
});
