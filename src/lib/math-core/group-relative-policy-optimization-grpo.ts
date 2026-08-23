/**
 * PPO's advantage estimate needs a learned critic (a value network) predicting how good a state
 * "should" be, so the policy only gets credit for beating that baseline. GRPO throws the critic
 * away: sample a GROUP of responses to the same prompt, and use the group's own mean and standard
 * deviation as the baseline. A response's advantage is just how many standard deviations above or
 * below its own group it landed -- entirely computable from the samples already drawn, no extra
 * network trained at all.
 *
 * Two toy groups of 5 sampled responses to two different (unseen) math problems below, using the
 * exact binary verifiable rewards RLVR's chapter introduced: 1 if correct, 0 if not.
 */

export interface Sample {
  id: string;
  reward: number;
}

/** An "easy" problem: most sampled responses get it right. */
export const GROUP_A: Sample[] = [
  { id: "1", reward: 1 },
  { id: "2", reward: 1 },
  { id: "3", reward: 1 },
  { id: "4", reward: 1 },
  { id: "5", reward: 0 },
];

/** A "hard" problem: only one sampled response gets it right. */
export const GROUP_B: Sample[] = [
  { id: "1", reward: 1 },
  { id: "2", reward: 0 },
  { id: "3", reward: 0 },
  { id: "4", reward: 0 },
  { id: "5", reward: 0 },
];

export function rewardsOf(group: Sample[]): number[] {
  return group.map((s) => s.reward);
}

export function groupMean(rewards: number[]): number {
  if (rewards.length === 0) return NaN;
  return rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
}

/** Population standard deviation of the group's rewards -- the baseline's spread, not just its center. */
export function groupStd(rewards: number[]): number {
  const mean = groupMean(rewards);
  const variance = rewards.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rewards.length;
  return Math.sqrt(variance);
}

/**
 * GRPO's entire innovation, in one line: normalize each response's reward against the group it
 * was sampled with, instead of a trained value function. Same shape as a z-score.
 */
export function groupAdvantage(rewards: number[]): number[] {
  const mean = groupMean(rewards);
  const std = groupStd(rewards);
  return rewards.map((r) => (r - mean) / std);
}
