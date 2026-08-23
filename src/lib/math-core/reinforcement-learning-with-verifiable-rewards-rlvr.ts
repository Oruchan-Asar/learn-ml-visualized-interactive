/**
 * A learned reward model is a proxy: it was fit on human preferences and can be fooled by a
 * fluent-sounding wrong answer. For tasks with a checkable ground truth -- a math problem with one
 * correct number, code that either passes its tests or doesn't -- there's no need for a proxy at
 * all. RLVR's reward is just the verifier's own binary output: 1 if correct, 0 otherwise.
 *
 * The toy set below is four sampled responses to one arithmetic problem, each carrying BOTH its
 * verifiable correctness AND a hand-picked score a hypothetical learned reward model would have
 * assigned it -- so the two can be compared directly on the same responses.
 */

export const PROBLEM = "What is 17 + 26?";
export const CORRECT_ANSWER = "43";

export interface SampledResponse {
  id: string;
  answer: string;
  /** A hypothetical learned reward model's score for this response, 0-1 -- not ground truth, just a fallible guess. */
  learnedRewardGuess: number;
}

export const SAMPLES: SampledResponse[] = [
  { id: "1", answer: "43", learnedRewardGuess: 0.62 },
  { id: "2", answer: "39", learnedRewardGuess: 0.71 },
  { id: "3", answer: "43", learnedRewardGuess: 0.55 },
  { id: "4", answer: "44", learnedRewardGuess: 0.3 },
];

/** The verifier itself: an exact string check against ground truth -- no model, no fuzziness, no way to game it with fluent prose. */
export function verify(answer: string, correctAnswer: string = CORRECT_ANSWER): boolean {
  return answer.trim() === correctAnswer;
}

/** RLVR's reward for one sampled response: 1 if verifiably correct, 0 otherwise. */
export function verifiableReward(sample: { answer: string }, correctAnswer: string = CORRECT_ANSWER): number {
  return verify(sample.answer, correctAnswer) ? 1 : 0;
}

export function meanReward(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function argmaxBy<T>(items: T[], scoreFn: (item: T) => number): T {
  return items.reduce((best, item) => (scoreFn(item) > scoreFn(best) ? item : best), items[0]);
}

/** Which response the ground-truth verifier would rank highest. */
export function bestByVerifier(samples: SampledResponse[] = SAMPLES, correctAnswer: string = CORRECT_ANSWER): SampledResponse {
  return argmaxBy(samples, (s) => verifiableReward(s, correctAnswer));
}

/** Which response the hypothetical LEARNED reward model would rank highest -- watch this disagree with the verifier. */
export function bestByLearnedReward(samples: SampledResponse[] = SAMPLES): SampledResponse {
  return argmaxBy(samples, (s) => s.learnedRewardGuess);
}
