import { describe, expect, it } from "vitest";
import { policyAt, initActor, runActorCritic } from "@/lib/math-core/actor-critic-architectures";

describe("the actor's softmax policy", () => {
  it("is exactly uniform when all preferences start at zero", () => {
    const theta = initActor();
    const pi = policyAt(theta, 0);
    expect(pi.left).toBeCloseTo(0.5, 10);
    expect(pi.right).toBeCloseTo(0.5, 10);
  });
});

describe("the fixed 6-step actor-critic script", () => {
  const steps = runActorCritic();

  it("has exactly 6 steps, resetting to state 0 after reaching the goal", () => {
    expect(steps.length).toBe(6);
    expect(steps[4].nextState).toBe(3);
    expect(steps[5].state).toBe(0);
  });

  it("step 1: critic's TD error is -1 (no useful bootstrap yet), V(0) becomes -0.5", () => {
    expect(steps[0].tdError).toBeCloseTo(-1, 10);
    expect(steps[0].critic[0]).toBeCloseTo(-0.5, 10);
    expect(steps[0].actor[0].right).toBeCloseTo(-0.25, 10);
    expect(steps[0].actor[0].left).toBeCloseTo(0.25, 10);
  });

  it("step 3 (the 'left' mistake): a larger negative advantage, since it compounds an already-bad V(1)", () => {
    expect(steps[2].tdError).toBeCloseTo(-1.45, 10);
    expect(steps[2].critic[2]).toBeCloseTo(-0.725, 10);
    // Even though "left" was the action taken, its own preference drops — the critic said it was bad.
    expect(steps[2].actor[2].left).toBeCloseTo(-0.3625, 10);
    expect(steps[2].actor[2].right).toBeCloseTo(0.3625, 10);
  });

  it("after step 3, the actor already favors 'right' at state 2 with more than half the probability", () => {
    const pi = policyAt(steps[2].actor, 2);
    expect(pi.right).toBeGreaterThan(0.5);
  });

  it("step 5 (reaching the goal): a large positive advantage spikes the critic and actor together", () => {
    expect(steps[4].reward).toBe(10);
    expect(steps[4].tdError).toBeCloseTo(10.725, 10);
    expect(steps[4].critic[2]).toBeCloseTo(4.6375, 10);
  });

  it("a negative advantage lowers the taken action's own preference below zero", () => {
    expect(steps[0].actor[0].right).toBeLessThan(0);
  });

  it("the goal's large positive advantage pushes state 2's 'right' preference far above where it stood after step 3", () => {
    expect(steps[4].actor[2].right).toBeGreaterThan(steps[2].actor[2].right);
  });
});
