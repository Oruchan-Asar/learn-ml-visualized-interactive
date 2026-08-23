import { verify, verifiableReward } from "./reinforcement-learning-with-verifiable-rewards-rlvr";
import { groupMean, groupStd, groupAdvantage, rewardsOf, type Sample } from "./group-relative-policy-optimization-grpo";

export { verify, verifiableReward, groupMean, groupStd, groupAdvantage, rewardsOf };
export type { Sample };

/**
 * The capstone: no new machinery at all. Take a fresh group of sampled responses to a fresh math
 * problem, verify each one exactly the way RLVR's chapter did (an exact-match check, no learned
 * reward model), then normalize those verifiable rewards against the group's own mean and std
 * exactly the way GRPO's chapter did (no critic network). Two chapters' math-core functions,
 * called back to back on one small set of samples.
 */

export const CAPSTONE_PROBLEM = "What is 12 x 7?";
export const CAPSTONE_ANSWER = "84";

export interface CapstoneResponse {
  id: string;
  answer: string;
}

export const CAPSTONE_GROUP: CapstoneResponse[] = [
  { id: "1", answer: "84" },
  { id: "2", answer: "84" },
  { id: "3", answer: "84" },
  { id: "4", answer: "84" },
  { id: "5", answer: "91" },
];

/** Step 1 (RLVR): verify every sampled response against ground truth. */
export function verifyGroup(group: CapstoneResponse[] = CAPSTONE_GROUP, correctAnswer: string = CAPSTONE_ANSWER): number[] {
  return group.map((response) => verifiableReward(response, correctAnswer));
}

export interface TrainStepResult {
  rewards: number[];
  mean: number;
  std: number;
  advantages: number[];
}

/** Step 2 (GRPO): turn those verifiable rewards into group-relative advantages -- the whole training signal. */
export function trainStep(group: CapstoneResponse[] = CAPSTONE_GROUP, correctAnswer: string = CAPSTONE_ANSWER): TrainStepResult {
  const rewards = verifyGroup(group, correctAnswer);
  return {
    rewards,
    mean: groupMean(rewards),
    std: groupStd(rewards),
    advantages: groupAdvantage(rewards),
  };
}
