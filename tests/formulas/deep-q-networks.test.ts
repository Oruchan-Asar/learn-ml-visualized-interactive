import { describe, expect, it } from "vitest";
import {
  hidden,
  qNet,
  dqnUpdate,
  runDqn,
  tableSize,
  INIT_PARAMS,
  NETWORK_PARAM_COUNT,
  TARGET_SYNC_EVERY,
} from "@/lib/math-core/deep-q-networks";

describe("the tiny network", () => {
  it("the hidden ReLU acts as identity for these non-negative state indices", () => {
    expect(hidden(INIT_PARAMS, 0)).toBe(0);
    expect(hidden(INIT_PARAMS, 1)).toBe(1);
    expect(hidden(INIT_PARAMS, 2)).toBe(2);
  });

  it("computes exact Q(s,a) from just 6 numbers", () => {
    expect(qNet(INIT_PARAMS, 0, "right")).toBeCloseTo(-2, 10);
    expect(qNet(INIT_PARAMS, 2, "left")).toBeCloseTo(-1, 10);
    expect(qNet(INIT_PARAMS, 2, "right")).toBeCloseTo(0, 10);
  });
});

describe("a single DQN update", () => {
  it("moves Q(0,right) exactly halfway from -2 toward a target of -1", () => {
    const { newParams, tdError, loss } = dqnUpdate(INIT_PARAMS, 0, "right", 1, -1, INIT_PARAMS);
    expect(tdError).toBeCloseTo(1, 10);
    expect(loss).toBeCloseTo(1, 10);
    expect(qNet(newParams, 0, "right")).toBeCloseTo(-1.9, 10);
  });

  it("only touches the output weights for the action actually taken", () => {
    const { newParams } = dqnUpdate(INIT_PARAMS, 0, "right", 1, -1, INIT_PARAMS);
    expect(newParams.wLeft).toBe(INIT_PARAMS.wLeft);
    expect(newParams.bLeft).toBe(INIT_PARAMS.bLeft);
    expect(newParams.wh).toBe(INIT_PARAMS.wh);
    expect(newParams.bh).toBe(INIT_PARAMS.bh);
  });
});

describe("the fixed 6-step DQN training script", () => {
  const steps = runDqn();

  it("has exactly 6 steps", () => {
    expect(steps.length).toBe(6);
  });

  it("step 1: TD error of exactly 1, loss of exactly 1", () => {
    expect(steps[0].tdError).toBeCloseTo(1, 10);
    expect(steps[0].loss).toBeCloseTo(1, 10);
  });

  it("step 2: a small negative TD error, loss shrinking to 0.01", () => {
    expect(steps[1].tdError).toBeCloseTo(-0.1, 10);
    expect(steps[1].loss).toBeCloseTo(0.01, 10);
  });

  it("step 3 (a 'left' move) leaves the left-branch weights untouched, since the TD error is exactly 0", () => {
    expect(steps[2].tdError).toBeCloseTo(0, 10);
    expect(steps[2].loss).toBeCloseTo(0, 10);
  });

  it("re-syncs the target network to the online network every 3 steps", () => {
    // Step 4's target network should match step 3's online network exactly (post-sync).
    expect(steps[3].targetParams).toEqual(steps[2].params);
    expect(TARGET_SYNC_EVERY).toBe(3);
  });

  it("the target network is stale (unequal to the online network) right after the first update", () => {
    expect(steps[0].targetParams).not.toEqual(steps[0].params);
  });
});

describe("table size vs. network parameter count", () => {
  it("the network's parameter count never changes", () => {
    expect(NETWORK_PARAM_COUNT).toBe(6);
  });

  it("a Q-table's size grows linearly with the number of states, quickly dwarfing the network", () => {
    expect(tableSize(4)).toBe(8);
    expect(tableSize(1000)).toBe(2000);
    expect(tableSize(1000)).toBeGreaterThan(NETWORK_PARAM_COUNT * 300);
  });
});
