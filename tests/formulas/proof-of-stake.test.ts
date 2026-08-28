import { describe, it, expect } from "vitest";
import {
  VALIDATORS,
  totalStake,
  selectionProbability,
  stakeRanges,
  selectLeader,
  slashingLoss,
} from "@/lib/math-core/proof-of-stake";

describe("stake totals and probability", () => {
  it("totals to 100 across the 4 fixed validators", () => {
    expect(totalStake()).toBe(100);
  });

  it("gives each validator a selection probability exactly proportional to its stake", () => {
    expect(selectionProbability(VALIDATORS[0])).toBeCloseTo(0.4);
    expect(selectionProbability(VALIDATORS[1])).toBeCloseTo(0.3);
    expect(selectionProbability(VALIDATORS[2])).toBeCloseTo(0.2);
    expect(selectionProbability(VALIDATORS[3])).toBeCloseTo(0.1);
  });
});

describe("stakeRanges", () => {
  it("lays out validators end to end on [0, 100)", () => {
    expect(stakeRanges()).toEqual([
      { id: "A", start: 0, end: 40 },
      { id: "B", start: 40, end: 70 },
      { id: "C", start: 70, end: 90 },
      { id: "D", start: 90, end: 100 },
    ]);
  });
});

describe("selectLeader", () => {
  it("picks a deterministic, varied leader across 6 rounds", () => {
    const leaders = [1, 2, 3, 4, 5, 6].map((round) => selectLeader(round));
    expect(leaders).toEqual(["D", "B", "A", "C", "B", "A"]);
  });

  it("is deterministic for the same round", () => {
    expect(selectLeader(4)).toBe(selectLeader(4));
  });

  it("every leader chosen is one of the 4 known validators", () => {
    const ids = new Set(VALIDATORS.map((v) => v.id));
    for (let round = 1; round <= 6; round++) {
      expect(ids.has(selectLeader(round))).toBe(true);
    }
  });
});

describe("slashingLoss — the nothing-at-stake problem", () => {
  const validatorB = VALIDATORS[1]; // stake 30

  it("costs nothing to support multiple forks when slashing is disabled", () => {
    expect(slashingLoss(validatorB, 1, false)).toBe(0);
    expect(slashingLoss(validatorB, 3, false)).toBe(0);
  });

  it("costs nothing to support a single fork even with slashing enabled", () => {
    expect(slashingLoss(validatorB, 1, true)).toBe(0);
  });

  it("forfeits the entire stake for supporting more than one fork once slashing is enabled", () => {
    expect(slashingLoss(validatorB, 2, true)).toBe(30);
    expect(slashingLoss(validatorB, 3, true)).toBe(30);
  });
});
