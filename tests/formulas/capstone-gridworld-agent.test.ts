import { describe, expect, it } from "vitest";
import { trainAgent, greedyPolicy, NUM_EPISODES } from "@/lib/math-core/capstone-gridworld-agent";

describe("training the agent from scratch across 5 episodes", () => {
  const steps = trainAgent();

  it("runs across exactly 5 episodes, numbered 0-4", () => {
    const episodes = new Set(steps.map((s) => s.episode));
    expect(episodes.size).toBe(NUM_EPISODES);
    expect(Math.max(...episodes)).toBe(NUM_EPISODES - 1);
  });

  it("reaches the goal for the first time partway through training, at episode 3", () => {
    const firstGoalStep = steps.find((s) => s.nextState === 3);
    expect(firstGoalStep?.episode).toBe(3);
    expect(firstGoalStep?.qTable[2].right).toBe(5);
  });

  it("reaches the goal a second time in the final episode, reinforcing Q(2, right) further", () => {
    const goalSteps = steps.filter((s) => s.nextState === 3);
    expect(goalSteps.length).toBe(2);
    expect(goalSteps[1].episode).toBe(4);
    expect(goalSteps[1].qTable[2].right).toBe(7.5);
  });

  it("the final Q-table prefers 'right' over 'left' at every non-terminal state", () => {
    const final = steps[steps.length - 1].qTable;
    for (const s of [0, 1, 2]) {
      expect(final[s].right).toBeGreaterThan(final[s].left);
    }
  });

  it("the greedy policy read off the final table is 'right' everywhere — the actual optimal policy", () => {
    const final = steps[steps.length - 1].qTable;
    const policy = greedyPolicy(final);
    expect(policy).toEqual({ 0: "right", 1: "right", 2: "right" });
  });
});
