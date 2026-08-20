export const ARMS = ["A", "B", "C"] as const;
export type Arm = (typeof ARMS)[number];

/**
 * Each arm's rewards are a fixed, known sequence (not sampled at runtime) so every outcome in this
 * chapter is exactly reproducible — arm B is genuinely the best (true mean 0.8), A is middling (0.5),
 * C is poor (0.2), but nothing about the interface reveals that up front.
 */
export const ARM_REWARDS: Record<Arm, number[]> = {
  A: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  B: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  C: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
};

export function trueMean(arm: Arm): number {
  const rewards = ARM_REWARDS[arm];
  return rewards.reduce((s, v) => s + v, 0) / rewards.length;
}

/** The reward revealed by the nth pull (0-indexed) of an arm — deterministic, not random. */
export function pullArm(arm: Arm, pullIndex: number): number {
  return ARM_REWARDS[arm][pullIndex];
}

export function estimate(rewards: number[]): number {
  if (rewards.length === 0) return 0;
  return rewards.reduce((s, v) => s + v, 0) / rewards.length;
}

/** Best-estimated arm so far, breaking ties alphabetically — exactly what a greedy policy does. */
export function bestArm(rewardsByArm: Record<Arm, number[]>): Arm {
  return ARMS.reduce((best, arm) =>
    estimate(rewardsByArm[arm]) > estimate(rewardsByArm[best]) ? arm : best,
  );
}

/** A fixed 8-step explore/exploit schedule for the scripted walkthrough — true means "explore this step." */
export const EXPLORE_SCHEDULE: boolean[] = [true, true, true, false, false, true, false, false];

export interface ScriptStep {
  step: number;
  action: "explore" | "exploit";
  arm: Arm;
  reward: number;
  rewardsByArm: Record<Arm, number[]>;
  estimates: Record<Arm, number>;
}

/** Runs the fixed epsilon-greedy script end to end: explore steps cycle A, B, C in order; exploit
 * steps always pull the current best-estimated arm. Every step is deterministic and reproducible. */
export function runScript(): ScriptStep[] {
  const rewardsByArm: Record<Arm, number[]> = { A: [], B: [], C: [] };
  const pullCount: Record<Arm, number> = { A: 0, B: 0, C: 0 };
  let exploreCycleIndex = 0;
  const steps: ScriptStep[] = [];

  EXPLORE_SCHEDULE.forEach((explore, i) => {
    const arm: Arm = explore ? ARMS[exploreCycleIndex % ARMS.length] : bestArm(rewardsByArm);
    if (explore) exploreCycleIndex++;

    const reward = pullArm(arm, pullCount[arm]);
    pullCount[arm]++;
    rewardsByArm[arm] = [...rewardsByArm[arm], reward];

    steps.push({
      step: i + 1,
      action: explore ? "explore" : "exploit",
      arm,
      reward,
      rewardsByArm: { A: [...rewardsByArm.A], B: [...rewardsByArm.B], C: [...rewardsByArm.C] },
      estimates: { A: estimate(rewardsByArm.A), B: estimate(rewardsByArm.B), C: estimate(rewardsByArm.C) },
    });
  });

  return steps;
}
