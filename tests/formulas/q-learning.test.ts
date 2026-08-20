import { describe, expect, it } from "vitest";
import { initQTable, maxQ, qUpdate, runQLearning, GAMMA, ALPHA } from "@/lib/math-core/q-learning";

describe("Q-table basics", () => {
  it("starts at exactly zero for every state-action pair", () => {
    const table = initQTable();
    for (const s of [0, 1, 2, 3]) {
      expect(table[s].left).toBe(0);
      expect(table[s].right).toBe(0);
    }
  });

  it("maxQ of the terminal state is 0 — no action follows it", () => {
    const table = initQTable();
    expect(maxQ(table, 3)).toBe(0);
  });

  it("alpha is 0.5 and gamma is 0.9, matching the MDP chapter's discount", () => {
    expect(ALPHA).toBe(0.5);
    expect(GAMMA).toBe(0.9);
  });

  it("a single update from all-zero moves exactly halfway to the reward", () => {
    const table = initQTable();
    const updated = qUpdate(table, 0, "right", 1, -1);
    expect(updated).toBeCloseTo(-0.5, 10);
  });
});

describe("the fixed 6-step Q-learning script", () => {
  const steps = runQLearning();

  it("has exactly 6 steps, resetting to state 0 after reaching the goal", () => {
    expect(steps.length).toBe(6);
    expect(steps[4].nextState).toBe(3);
    expect(steps[5].state).toBe(0);
  });

  it("Q(2, right) jumps to exactly 5 the moment it reaches the goal with a fresh table", () => {
    expect(steps[4].qTable[2].right).toBe(5);
  });

  it("the final table shows the goal's value only one step propagated back", () => {
    const final = steps[steps.length - 1].qTable;
    expect(final[2].right).toBeCloseTo(5, 10);
    expect(final[2].left).toBeCloseTo(-0.5, 10);
    expect(final[1].right).toBeCloseTo(-0.75, 10);
    expect(final[0].right).toBeCloseTo(-0.75, 10);
  });

  it("every visited state-action pair only ever gets less negative or jumps positive — never regresses once it reflects real signal", () => {
    // Q(1, right) is updated twice: -0.5 then -0.75 — it gets MORE negative here because
    // its bootstrap target (maxQ of state 2) hadn't yet felt the +10 reward at that point.
    const q1RightHistory = steps.filter((s) => s.state === 1 && s.action === "right").map((s) => s.qTable[1].right);
    expect(q1RightHistory).toEqual([-0.5, -0.75]);
  });
});
